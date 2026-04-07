/**
 * Edge AI Engine — simulates an on-device Large Language Model (Phi-3 or Gemma-2B).
 * In production, it loads via WebLLM when the browser is idle.
 */

const OFFLINE_KNOWLEDGE: { [key: string]: string } = {
  "pothole": "According to Motor Vehicles Act Section 188, driver must maintain caution. You can report this through the 'Road Reporter' module for official verification.",
  "accident": "Immediately trigger the SOS button. Section 134 duty of driver in case of accident: secure the area and provide first aid if possible.",
  "default": "Protocol Sentinel: AI Emergency Navigator active. I can assist with law citation, emergency protocols, and offline navigation."
};

/**
 * Generate a response using local logic (offline) or an API (online).
 */
export async function generateEdgeResponse(prompt: string, isOnline: boolean): Promise<string> {
  // Simulate heavy model loading or API latency
  await new Promise(r => setTimeout(r, 1200));

  if (!isOnline) {
    const p = prompt.toLowerCase();
    if (p.includes('pothole')) return OFFLINE_KNOWLEDGE.pothole;
    if (p.includes('accident')) return OFFLINE_KNOWLEDGE.accident;
    return OFFLINE_KNOWLEDGE.default;
  }

  // Functional online response simulation (calling remote LLM API in real apps)
  return `[Cloud AI Response]: Assisted analysis for '${prompt}'. Ensure compliance with MV Act Section 138. Do you need the nearest hospital coordinates?`;
}
