# Railway Deployment Guide

This guide covers deploying the Evaluation Planner on Railway.

## Simplified Architecture

The application has been streamlined for easy deployment:

- **Single service** handles both API and background job processing
- **Prompts stored as files** (no database needed for prompt management)
- **No email functionality** (users download reports directly)
- **Minimal database** (PostgreSQL for job queue only)

## Quick Start

### 1. Create Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and initialize
railway login
railway init
```

### 2. Add PostgreSQL

```bash
railway add -d postgres
```

### 3. Set Environment Variables

In the Railway dashboard, set these variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | `${{Postgres.DATABASE_URL}}` (auto-reference) |
| `OPENROUTER_API_KEY` | Yes | Your OpenRouter API key |
| `PROMPT1_MODEL` | No | Default: `openai/gpt-5.1` |
| `PROMPT1_TEMPERATURE` | No | Default: `0.7` |
| `PROMPT2_MODEL` | No | Default: `openai/gpt-5.1` |
| `PROMPT2_TEMPERATURE` | No | Default: `0.7` |
| `REPORT_TEMPLATE_MODEL` | No | Default: `openai/gpt-5.1` |
| `REPORT_TEMPLATE_TEMPERATURE` | No | Default: `0.7` |

### 4. Deploy

```bash
railway up
```

The `railway.json` file configures Railway to use the Dockerfile.

### 5. Initialize Database

Run the schema migration (creates the `jobs` table):

```bash
railway run npm run db:migrate
```

Or set `RUN_DB_MIGRATIONS=true` to run automatically on startup.

## Architecture Details

### Single Service Mode (Recommended)

The default configuration runs everything in one service:
- HTTP server on port 5000
- Serves React SPA from `/project/dist`
- API endpoints at `/api/*`
- Background job processor (every 5 seconds)

### Optional: Separate Worker

For high-traffic deployments, you can run a separate worker:

**API Service:**
```
ENABLE_JOB_PROCESSOR=false
```

**Worker Service:**
```
WORKER_ONLY=true
ENABLE_JOB_PROCESSOR=true
```

Both services share the same PostgreSQL database.

## Health Check

The application exposes `/health` endpoint:

```bash
curl https://your-app.railway.app/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## File Structure

```
.
├── server.js              # Main Express application
├── worker.js              # Worker-only entrypoint
├── start-production.js    # Production launcher
├── prompts/               # AI prompt templates (editable)
│   ├── prompt1.md         # Program analysis prompt
│   ├── prompt2.md         # Evaluation framework prompt
│   └── report_template.md # Final report template
├── db/
│   └── schema.sql         # Database schema (jobs table)
├── project/               # React frontend
│   └── dist/              # Built static files
├── Dockerfile
└── railway.json
```

## Modifying Prompts

Prompts are stored as markdown files in the `prompts/` directory:

1. Edit the `.md` files directly
2. Commit and push to trigger a new deployment
3. The new prompts will be loaded automatically

Variables available in prompts:
- `{{organizationName}}`
- `{{programName}}`
- `{{aboutProgram}}`
- `{{scrapedContent}}`
- `{{programAnalysis}}` (in prompt2 and report_template)
- `{{evaluationFramework}}` (in report_template only)
- `{{programTypePlural}}` (in report_template only)
- `{{targetPopulation}}` (in report_template only)
- `{{currentDate}}` (in report_template only)

## Database Schema

Only one table is required:

```sql
CREATE TABLE jobs (
  id SERIAL PRIMARY KEY,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL,
  input_data JSONB NOT NULL,
  result_data TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

Jobs are automatically cleaned up after 6 hours.

## Local Development

```bash
# Install dependencies
npm install

# Start development server (frontend + backend)
npm run dev

# Set environment variables in .env file:
DATABASE_URL=postgresql://user:pass@localhost:5432/evalplanner
OPENROUTER_API_KEY=sk-or-...
```

## Troubleshooting

### Database Connection Issues

If you see `ECONNREFUSED`:
- Check that `DATABASE_URL` is set correctly
- Internal Railway hostnames (`*.railway.internal`) only work within Railway
- Use `railway connect` to test from local machine

### Build Failures

Check that:
- Node.js 18+ is being used
- Frontend build succeeds: `npm run build`
- All dependencies are installed

### Job Processing Issues

Check the Railway logs for:
- OpenRouter API errors
- Job timeout messages (5 minute limit per job)
- Database connection errors

### Health Check Failures

The `/health` endpoint requires database connectivity. If failing:
- Verify PostgreSQL is running
- Check `DATABASE_URL` configuration
- Review database connection pool errors in logs
