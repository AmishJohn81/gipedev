# GipeDev

The React website for [gipedev.com](https://gipedev.com), built with Vite.

## Local development

```bash
npm install
npm run dev
```

Create a production build with `npm run build`.

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

For a Render Web Service, select the Docker runtime and set the Dockerfile path to
`api/GipeDev.Api/Dockerfile`. The container listens on port `10000`; use `/health`
as Render's health-check path. Attach a Render PostgreSQL database and set
`ConnectionStrings__GipeDev` to its internal connection string expressed as an
Npgsql connection string.
