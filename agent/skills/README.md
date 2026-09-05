# Skills (`agent/skills/`)

This directory contains reusable capabilities, execution tools, and specialized domain skills that autonomous agents can discover and invoke.

## Installed Skills
1. [financial-product-manager](financial-product-manager/SKILL.md): Capital markets expertise, stock watchlist UX/UI design, PRD generation, market depth, and trader workflow specifications.
2. [fintech-senior-developer](fintech-senior-developer/SKILL.md): 10+ years engineering guidelines for 60 FPS virtualized stock market UI, real-time WebSocket pipelines, canvas sparklines, and low-latency backend architectures.

## Structure
- Each skill is organized in its own subdirectory (`skills/<skill-name>/`):
  - `SKILL.md`: Detailed domain instructions, schemas, and architectural patterns.
  - `scripts/`: Execution scripts or helper utilities.
  - `references/`: API specifications or domain reference documentation.
