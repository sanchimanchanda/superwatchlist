# Agent & Skills (`agent/`)

This directory houses autonomous agent definitions, prompt templates, system instructions, memory configurations, agent orchestration logic, and specialized skills/tools.

## Active Skills
- [financial-product-manager](skills/financial-product-manager/SKILL.md): Capital markets domain knowledge, stock watchlist UX/UI specifications, PRDs, and market microstructure.
- [fintech-senior-developer](skills/fintech-senior-developer/SKILL.md): 10+ years senior engineering architecture for real-time stock market frontends (virtualization, WebSocket streams, canvas sparklines) and low-latency backends.

## Structure
- `skills/`: Reusable agent capabilities, execution scripts, tool definitions, and skill manuals (`SKILL.md`).
- `prompts/`: System instructions, persona guidelines, and few-shot examples.
- `workflows/`: Orchestration pipelines (e.g., multi-agent coordination, task dispatchers).
- `configs/`: Agent model parameters, tool bindings, and environment configurations.
