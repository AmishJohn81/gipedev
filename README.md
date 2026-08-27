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

The Asteroids Home League visual prototype is available during local development at:

```text
http://localhost:5173/asteroids/
```

## API

The general GipeDev API is an ASP.NET Core application in `api/GipeDev.Api`.

Run it locally with:

```bash
dotnet run --project api/GipeDev.Api
```

The API endpoints are:

- `GET /` — service information
- `GET /health` — health check for hosting and monitoring
- `POST /api/contact` — validate and store a contact submission

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

### Docker and Render

Build the image from the repository root so the Dockerfile can access the API project:

```bash
docker build -f api/GipeDev.Api/Dockerfile -t gipedev-api .
docker run --rm -p 10000:10000 gipedev-api
```

To run the API and a local PostgreSQL database together:

```bash
docker compose up --build
```

### Stopping local development

Stop the React development server in its terminal with `Ctrl+C`, then stop the
API and PostgreSQL containers from the repository root:

```bash
docker compose down
```

This removes the containers and local Docker network while preserving PostgreSQL
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
as Render's health-check path. Attach a Render PostgreSQL database and set
`ConnectionStrings__GipeDev` to its internal connection string expressed as an
Npgsql connection string.
