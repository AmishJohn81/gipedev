# GipeDev

The React website for [gipedev.com](https://gipedev.com), built with Vite.

## Local development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` for local development. The frontend uses
`VITE_API_BASE_URL` to locate the API. In the Render Static Site, set this variable
to the public URL of the deployed API before building the frontend.

Create a production build with `npm run build`.

The Asteroids Home League is available during local development at:

```text
http://localhost:5173/asteroids/
http://localhost:5173/asteroids/scores/
```

## Helpdesk triage walkthrough

The four-chapter portfolio project starts at `/perfect-storm/`. Chapters two and
three are local, predefined exercises. Chapter four (`/perfect-storm/live/`) calls
`POST /api/triage/analyze` on the existing API for initial analysis and clarification
reassessment. It includes a progress guide and editable handoff fields. Assignment
confirmation stays in the walkthrough; it does not write to a real ticketing system.
Manual choices in chapter two use tab-scoped session storage for comparison in
chapter three. Chapter-four text stays in page memory and clears on reload, but is
sent through the API to OpenAI when analysis is requested. Use fictional details.

The API uses the OpenAI Responses API with a strict JSON schema, server-owned
company context, and response validation. Missing credentials/model configuration
produce a safe `503` without calling OpenAI. There is no silent rules-based or mock
fallback in production. Tickets and replies are not saved in the application database
or written to application logs. Requests use `store: false` for generated Responses;
this does not independently establish zero data retention at the provider.

### Configure live triage

Both the server API key and a Structured Outputs-compatible model ID must be configured.
Model access and provider billing must be available in your OpenAI API project.

- For a direct `dotnet run`, set server environment variables `OpenAI__ApiKey` and
  `OpenAI__Model` before starting the API.
- For Docker development, fill `OPENAI_API_KEY` and `OPENAI_MODEL` in the ignored
  `.env.local` file, then run `docker compose --env-file .env.local up --build`.
- For Render, add `OpenAI__ApiKey` as a secret environment variable and
  `OpenAI__Model` as an environment variable on the existing API service. The
  frontend still uses only `VITE_API_BASE_URL`; never use a `VITE_` name for a secret.

No key is needed to build or run the mocked checks. Do not commit credentials.
No default model is selected; configure the exact model ID you intend to evaluate.

Default controls: six requests per IP every ten minutes, three concurrent provider
calls, and 100 provider attempts per hour across this API instance. The latter limit
is configurable via `OpenAI__HourlyRequestLimit`; it resets on restart and is not a
durable spending cap across multiple instances. Also configure provider billing
controls before public use. The provider timeout defaults to 40 seconds and output
to 3,000 tokens (`OpenAI__TimeoutSeconds`, `OpenAI__MaxOutputTokens`). Input has a
24 KiB body limit plus subject/description/follow-up/reply character limits.
No automatic provider retries are performed. Metadata logging records HTTP status,
elapsed time, and token counts, not ticket text, model output, or credentials.

### Verify triage without a key

```bash
node --test src/perfect-storm/triage-api.test.js
dotnet run --project api/GipeDev.TriageChecks
```

The .NET checks use a fake HTTP provider and a local MVC host to verify payloads,
validation, missing configuration, refusals, malformed responses, timeouts, and
rate limits. They make no live AI calls. Real model quality, latency, usage cost,
and browser end-to-end behavior still need evaluation once credentials are set.

For an optional real-provider smoke test after configuring `.env.local`, run
`dotnet run --project api/GipeDev.TriageChecks -- --live` (or add `--printer` for the
printer example). This makes one billable synthetic request and prints only status,
usage, and safe validation diagnostics. It does not print credentials or response
content. Validation diagnostics identify field names or response stages, not values.

`POST /api/triage/analyze` accepts `title` (120 characters), `description` (3,000),
and optional `followUp`/`reply` (1,500 each). A reply requires its approved follow-up.
Its response contains `team`, `reason`, `uncertain`, `alternatives`, `questions`,
`assessment`, and `handoff`. Unknown ownership uses an empty team and requires
analyst selection before routing. The same endpoint incorporates the actual
clarification conversation on reassessment; no model conversation ID or database
record is required.

## API service

The general GipeDev API is an ASP.NET Core application in `api/GipeDev.Api`.

Run it locally with:

```bash
dotnet run --project api/GipeDev.Api
```

The API endpoints are:

- `GET /` — service information
- `GET /health` — health check for hosting and monitoring
- `POST /api/contact` — validate and store a contact submission
- `GET /api/asteroids/pilots` — list registered pilot names
- `POST /api/asteroids/pilots` — register a pilot name
- `GET /api/asteroids/scores?limit=10` — return the highest scores
- `GET /api/asteroids/scores/archive` — search, filter, sort, and page through every score
- `POST /api/asteroids/scores` — record a score for an existing pilot

A contact request has this shape:

```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "subject": "Project inquiry",
  "message": "I would like to discuss a project."
}
```

The optional `company` field is a honeypot and should remain hidden and empty in
the user-facing form. Contact submissions are limited to five attempts per IP
address every ten minutes.

Asteroids pilots contain only an ID and three-character initials; there are no
accounts, passwords, email addresses, or other identifying fields. Pilot initials
may contain letters and spaces, must include at least one letter, and are unique
without regard to case. Scores must be divisible by 10 and fall between 10 and
999,990. A score request has this shape:

```json
{
  "pilotId": "00000000-0000-0000-0000-000000000000",
  "score": 48290
}
```

Pilot and score writes share a limit of 30 attempts per IP address every ten
minutes. Contact submissions, pilots, and scores use the configured EF Core
database provider.

### Database provider

The API supports SQLite and PostgreSQL through `DatabaseProviderFactory`. Set
the provider and connection string in `appsettings.json` or with environment
variables:

```text
# SQLite (default/local and the intended Render configuration)
DatabaseProvider=Sqlite
ConnectionStrings__GipeDev=Data Source=/app/data/gipedev.db;Default Timeout=30

# PostgreSQL (for rollback or a staged migration)
DatabaseProvider=PostgreSql
ConnectionStrings__GipeDev=Host=...;Database=...;Username=...;Password=...;SSL Mode=Require
```

`Postgres` is also accepted as a provider name. The API applies only the
migrations for the active provider, so an existing PostgreSQL database and a
new SQLite file can safely use the same application build.

PostgreSQL and SQLite use separate EF Core context types and model snapshots.
When the shared entity model changes, generate and review one migration for
each provider:

```bash
dotnet ef migrations add MigrationName \
  --project api/GipeDev.Api \
  --context PostgresGipeDevDbContext \
  --output-dir Data/Migrations

dotnet ef migrations add MigrationName \
  --project api/GipeDev.Api \
  --context SqliteGipeDevDbContext \
  --output-dir Data/SqliteMigrations
```

Set `DatabaseProvider` and `ConnectionStrings__GipeDev` for the provider being
generated. Keeping both migrations in the same change ensures either database
can be selected later without schema drift.

### Docker and Render

Build the image from the repository root so the Dockerfile can access the API project:

```bash
docker build -f api/GipeDev.Api/Dockerfile -t gipedev-api .
docker run --rm -p 10000:10000 gipedev-api
```

To run the API with a persistent local SQLite Docker volume:

```bash
docker compose up --build
```

### Stopping local development

Stop the React development server in its terminal with `Ctrl+C`, then stop the
API container from the repository root:

```bash
docker compose down
```

This removes the container and local Docker network while preserving SQLite
data. Confirm that all services are stopped with:

```bash
docker compose ps
```

To also permanently delete the local database and its submissions, run:

```bash
docker compose down --volumes
```

For a Render Web Service, select the Docker runtime and set the Dockerfile path to
`api/GipeDev.Api/Dockerfile`. The container listens on port `10000`; use `/health`
as Render's health-check path. Use a paid service, attach a persistent disk at
`/app/data`, and configure the SQLite environment variables shown above. Only
files under the disk mount survive deploys.

### One-time Render PostgreSQL transfer

The image includes a purpose-built transfer tool. It reads all three PostgreSQL
tables in one repeatable-read snapshot, creates and migrates a temporary SQLite
database, copies IDs and timestamps unchanged, verifies row counts and foreign
keys, then atomically installs the finished file. A failure leaves the existing
SQLite destination untouched.

Use this cutover sequence before the Render PostgreSQL database expires:

1. Take and retain a final PostgreSQL backup (`pg_dump` in custom format).
2. Deploy this build with `DatabaseProvider=PostgreSql` first and confirm the API
   still reads and writes the existing database.
3. Upgrade the web service and attach its persistent disk at `/app/data`. Keep
   the API on PostgreSQL during this deploy.
4. Add the old database's internal connection string as the secret environment
   variable `SOURCE_POSTGRES_CONNECTION_STRING`.
5. Enable Render maintenance mode. This keeps the service running for its Shell
   while preventing new public contact, pilot, or score writes.
6. In the Render Shell, run:

   ```bash
   dotnet /app/transfer/GipeDev.DataTransfer.dll --destination /app/data/gipedev.db
   ```

   If a previous empty/test SQLite file exists, inspect or download it first,
   then rerun with the explicit `--replace` flag. The tool prints the copied
   count for contacts, pilots, and scores.
7. Set `DatabaseProvider=Sqlite` and
   `ConnectionStrings__GipeDev=Data Source=/app/data/gipedev.db;Default Timeout=30`,
   then deploy. Verify `/health`, the pilot list, and the high-score list before
   disabling maintenance mode.
8. Submit one controlled contact and score, confirm they persist through a
   manual redeploy, remove `SOURCE_POSTGRES_CONNECTION_STRING`, and retain the
   PostgreSQL backup until the rollback window closes.

For rollback during that window, restore `DatabaseProvider=PostgreSql` and its
old connection string. Do not accept writes on both databases at once: the
transfer is a snapshot, not continuous replication.

### Resetting production Asteroids data

The transfer utility also provides a narrowly scoped SQLite reset mode. It
creates a SQLite-native timestamped backup, deletes scores and pilots in one
transaction, preserves contact submissions and migrations, and verifies the
result. Enable Render maintenance mode first, then run this in the API service
Shell:

```bash
dotnet /app/transfer/GipeDev.DataTransfer.dll \
  --clear-asteroids \
  --destination /app/data/gipedev.db \
  --confirm-clear
```

The command prints the deleted row counts and backup path. Disable maintenance
mode only after verifying that both Asteroids pages show an empty score list.
