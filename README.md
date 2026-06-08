# Siesa Agents

## Dev Server Startup

### Prerequisites
- Node.js 20+
- .NET 10 SDK
- pnpm (`npm install -g pnpm`)
- PostgreSQL 18+

### Frontend

```bash
cd frontend
pnpm install
pnpm run dev
# Starts on http://localhost:5173
```

### Backend

```bash
cd backend
dotnet run --project src/SiesaAgents.API
# Starts on http://localhost:5000
# Scalar API reference: http://localhost:5000/scalar
```

### Health Check

```bash
curl http://localhost:5000/api/v1/health
# {"status":"healthy"}
```
