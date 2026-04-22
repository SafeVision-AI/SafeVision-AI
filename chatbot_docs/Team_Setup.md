# Chatbot Team — Setup & Workflow Guide

Welcome to the SafeVixAI Chatbot development team. To ensure a smooth collaboration and protect the stability of the `SafeVixAI` platform, please follow these standardized workflow rules.

## 1. Local Environment Setup
Before writing any code, prepare your local environment in the `chatbot_service/` folder.
- **Python**: Ensure you have Python 3.11+ installed.
- **Install Dependencies**:
  ```bash
  pip install -r requirements.txt
  ```
- **Environment Variables**:
  - Copy `.env.example` to `.env`
  - Add your API keys for the LLM providers (Groq, Gemini, etc.). **NEVER commit the `.env` file.**

## 2. GitHub Workflow (Branching)
**CRITICAL RULE**: Do not push directly to the `main` or `develop` branches.

### Step-by-Step Contribution:
1. **Pull the latest changes** from the upstream repository.
   ```bash
   git checkout develop
   git pull origin develop
   ```
2. **Create a feature branch** using the `chatbot/` prefix.
   ```bash
   git checkout -b chatbot/your-feature-name
   ```
3. **Commit your changes** with descriptive messages.
   ```bash
   git add .
   git commit -m "feat: add vectorstore rebuild endpoint"
   ```
4. **Push your branch** to GitHub (not `main`).
   - If it's the first time pushing this branch:
     ```bash
     git push -u origin chatbot/your-feature-name
     ```
   - For subsequent pushes:
     ```bash
     git push
     ```
5. **Create a Pull Request (PR)** on GitHub, targeting the `develop` branch.
6. **Request Review**: Assign a teammate to review your PR before merging.

## 3. AI Agent Tools (agent-tools)
We use the [inference.sh](https://inference.sh) toolset to power our agent's advanced capabilities (image generation, web search, etc.).

### Installation
To use these tools locally for testing or development, install the `infsh` CLI:
```bash
# Install CLI
curl -fsSL https://cli.inference.sh | sh

# Login (opens a browser window)
infsh login
```

### Adding Skills to the Project
To add the AI Agent capability to our repository, use the following `npx skills` command:
```bash
npx skills add https://github.com/inferen-sh/skills --skill agent-tools
```

### Additional Specialized Skills
You can also add more specific AI capabilities using:
```bash
# Add LLM models (Claude, Gemini, etc.)
npx skills add inference-sh/skills@llm-models

# Add Web Search (Tavily, Exa)
npx skills add inference-sh/skills@web-search

# Add Image Generation (FLUX, Gemini)
npx skills add inference-sh/skills@ai-image-generation
```

### Usage Examples
You can run these tools directly from your terminal to test agent behavior:
```bash
# Test a web search query
infsh app run tavily/search-assistant --input '{"query": "latest traffic laws in India 2024"}'

# Test image generation for reports
infsh app run falai/flux-dev --input '{"prompt": "a realistic pothole on a rainy road"}'
```

## 4. Module Ownership
To avoid merge conflicts, ensure you are working on the module assigned to you in the [Contributing.md](file:///C:/Hackathons/IITM/SafeVixAI/chatbot_docs/Contributing.md) file.
- **Member A**: Providers, Memory, API endpoints.
- **Member B**: RAG, Agent (ChatEngine), Tools.
- **Member C**: Frontend UI/Voice and Multi-language.

## 4. Testing
Run the existing tests in the `/tests` folder before pushing to ensure you haven't introduced any regressions.
```bash
pytest tests/
```

## 5. Documentation
If you add a new feature or change an API, update the corresponding file in the `chatbot_docs/` folder to keep the documentation current.
