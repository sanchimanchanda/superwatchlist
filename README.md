# Ronadhona

A structured repository organized for multi-agent workflows, API-first architecture, backend services, and interactive frontend applications.

## 📁 Repository Structure

```
├── api/             # API specifications, schemas, route contracts, and shared types
├── agent/           # Agent definitions, orchestration workflows, prompts, configs, and skills
│   └── skills/      # Agent skills, tool definitions, and reusable actions
├── backend/         # Server-side application logic, services, and database models
├── docs/            # Documentation and progress tracking
│   └── progress.md  # Project roadmap, task checklists, and activity log
└── frontend/        # Client-side web application and UI components
```

## 🚀 Getting Started & Docker Execution

### 1-Command Startup (Production Build via Docker)
```bash
docker compose up --build
```
- **Web Application UI:** `http://localhost:3000`
- **REST API Endpoints:** `http://localhost:4000/api/v1`
- **WebSocket Ticker Feed:** `ws://localhost:4000/ws`
- **Healthcheck:** `http://localhost:4000/health`

---

## 📑 Documentation
- **Requirements & PRD:** [`docs/requirement.md`](docs/requirement.md)
- **Technical & Architecture Guidelines:** [`docs/techguidelines.md`](docs/techguidelines.md)
- **72-Hour Product Execution Plan:** [`docs/executionplan.md`](docs/executionplan.md)
- **Roadmap & Progress:** [`docs/progress.md`](docs/progress.md)
- **Agent Personas & Directives:** [`AGENTS.md`](AGENTS.md)
# superwatchlist
