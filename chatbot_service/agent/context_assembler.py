from __future__ import annotations

from agent.state import ConversationContext, RetrievedContext, ToolContext
from rag.retriever import Retriever
from tools.challan_tool import ChallanTool
from tools.first_aid_tool import FirstAidTool
from tools.legal_search_tool import LegalSearchTool
from tools.road_infra_tool import RoadInfrastructureTool
from tools.road_issues_tool import RoadIssuesTool
from tools.sos_tool import SosTool
from tools.submit_report_tool import SubmitReportTool
from tools.weather_tool import WeatherTool

from tools.drug_info import DrugInfoTool


class ContextAssembler:
    def __init__(
        self,
        *,
        retriever: Retriever,
        sos_tool: SosTool,
        challan_tool: ChallanTool,
        legal_search_tool: LegalSearchTool,
        first_aid_tool: FirstAidTool,
        road_infra_tool: RoadInfrastructureTool,
        road_issues_tool: RoadIssuesTool,
        submit_report_tool: SubmitReportTool,
        weather_tool: WeatherTool,
        drug_info_tool: DrugInfoTool,
    ) -> None:
        self.retriever = retriever
        self.sos_tool = sos_tool
        self.challan_tool = challan_tool
        self.legal_search_tool = legal_search_tool
        self.first_aid_tool = first_aid_tool
        self.road_infra_tool = road_infra_tool
        self.road_issues_tool = road_issues_tool
        self.submit_report_tool = submit_report_tool
        self.weather_tool = weather_tool
        self.drug_info_tool = drug_info_tool

    async def assemble(
        self,
        *,
        session_id: str,
        message: str,
        intent: str,
        lat: float | None,
        lon: float | None,
        client_ip: str | None = None,
        history: list[dict],
    ) -> ConversationContext:
        context = ConversationContext(
            session_id=session_id,
            message=message,
            intent=intent,
            lat=lat,
            lon=lon,
            client_ip=client_ip,
            history=history,
        )

        if intent == 'emergency':
            await self._add_emergency_context(context)
            self._add_retrieved(context, self.retriever.retrieve(message, scopes={'medical', 'emergency', 'hospitals'}))
        elif intent == 'first_aid':
            await self._add_first_aid_context(context)
            self._add_retrieved(context, self.retriever.retrieve(message, scopes={'medical'}))
        elif intent == 'challan':
            await self._add_challan_context(context)
            self._add_retrieved(context, self.legal_search_tool.search(message))
        elif intent == 'legal':
            self._add_retrieved(context, self.legal_search_tool.search(message))
        elif intent == 'road_issue':
            await self._add_road_context(context)
            self._add_retrieved(context, self.retriever.retrieve(message, scopes={'roads', 'accidents'}))
        else:
            self._add_retrieved(context, self.retriever.retrieve(message))

        return context

    async def _add_emergency_context(self, context: ConversationContext) -> None:
        if context.lat is not None and context.lon is not None:
            sos_payload = await self.sos_tool.get_payload(lat=context.lat, lon=context.lon)
            if sos_payload:
                numbers = sos_payload.get('numbers') or {}
                services = sos_payload.get('services') or []
                nearest_names = ', '.join(item.get('name', 'Unknown') for item in services[:3]) or 'No nearby services listed'
                number_text = ', '.join(f'{key}:{value.get("service")}' for key, value in numbers.items())
                
                # Format What3Words if present
                w3w_text = ""
                if 'what3words' in sos_payload:
                    w3w_text = f" What3Words: {sos_payload['what3words'].get('formatted')}."
                    
                context.tools.append(
                    ToolContext(
                        name='sos',
                        summary=f'Nearby emergency services: {nearest_names}. Emergency numbers: {number_text}.{w3w_text}',
                        payload=sos_payload,
                        sources=['tool:sos', 'backend:/api/v1/emergency/sos'],
                    )
                )
            weather = await self.weather_tool.lookup(lat=context.lat, lon=context.lon)
            if weather:
                context.tools.append(
                    ToolContext(
                        name='weather',
                        summary=f'Local weather: {weather.get("summary")} at {weather.get("temperature")} degrees.',
                        payload=weather,
                        sources=['tool:weather'],
                    )
                )

    async def _add_first_aid_context(self, context: ConversationContext) -> None:
        guide = self.first_aid_tool.lookup(context.message)
        if guide:
            steps = guide.get('steps') or []
            context.tools.append(
                ToolContext(
                    name='first_aid',
                    summary=f'{guide.get("title")}: ' + ' '.join(f'{index + 1}. {step}' for index, step in enumerate(steps[:4])),
                    payload=guide,
                    sources=['tool:first_aid'],
                )
            )
            
        # Extract potential drug name from message for OpenFDA
        words = context.message.lower().replace('?', '').replace(',', '').split()
        potential_drugs = [w for w in words if len(w) > 4 and w not in {'please', 'about', 'effects', 'dosage', 'should', 'take'}]
        for drug in potential_drugs[:2]:  # Try up to 2 words
            drug_info = await self.drug_info_tool.lookup(drug)
            if drug_info:
                context.tools.append(
                    ToolContext(
                        name='drug_info',
                        summary=f'FDA Info for {drug}: Indications: {drug_info.get("indications", "N/A")[:100]}...',
                        payload=drug_info,
                        sources=['tool:drug_info', 'openfda'],
                    )
                )
                break

    async def _add_challan_context(self, context: ConversationContext) -> None:
        challan = await self.challan_tool.infer_and_calculate(context.message, client_ip=context.client_ip)
        if challan:
            context.tools.append(
                ToolContext(
                    name='challan',
                    summary=(
                        f'Applicable section: {challan.get("section")}. '
                        f'Base fine: INR {challan.get("base_fine")}. '
                        f'Repeat fine: {challan.get("repeat_fine")}. '
                        f'Amount due in this scenario: INR {challan.get("amount_due")}.'
                    ),
                    payload=challan,
                    sources=['tool:challan', 'backend:/api/v1/challan/calculate'],
                )
            )

    async def _add_road_context(self, context: ConversationContext) -> None:
        if context.lat is not None and context.lon is not None:
            infrastructure = await self.road_infra_tool.lookup(lat=context.lat, lon=context.lon)
            if infrastructure:
                context.tools.append(
                    ToolContext(
                        name='road_infrastructure',
                        summary=(
                            f'Road authority: {infrastructure.get("exec_engineer") or infrastructure.get("contractor_name") or infrastructure.get("road_type")}. '
                            f'Road type: {infrastructure.get("road_type")} ({infrastructure.get("road_type_code")}).'
                        ),
                        payload=infrastructure,
                        sources=['tool:road_infrastructure', 'backend:/api/v1/roads/infrastructure'],
                    )
                )
            issues = await self.road_issues_tool.lookup(lat=context.lat, lon=context.lon)
            if issues and (issues.get('issues') or []):
                count = issues.get('count') or len(issues.get('issues') or [])
                context.tools.append(
                    ToolContext(
                        name='road_issues',
                        summary=f'{count} nearby road issues are already reported in the selected radius.',
                        payload=issues,
                        sources=['tool:road_issues', 'backend:/api/v1/roads/issues'],
                    )
                )
        if 'report' in context.message.lower():
            guidance = self.submit_report_tool.build_guidance(
                issue_type='road hazard',
                lat=context.lat,
                lon=context.lon,
            )
            context.tools.append(
                ToolContext(
                    name='submit_report',
                    summary=guidance['summary'],
                    payload=guidance,
                    sources=['tool:submit_report'],
                )
            )

    @staticmethod
    def _add_retrieved(context: ConversationContext, results) -> None:
        for item in results[:5]:
            context.retrieved.append(
                RetrievedContext(
                    source=item.source,
                    title=item.title,
                    snippet=item.content[:320],
                    score=item.score,
                    category=item.category,
                )
            )
