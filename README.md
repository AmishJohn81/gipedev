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

The initial endpoints are:

- `GET /` — service information
- `GET /health` — health check for hosting and monitoring

### Docker and Render

Build the image from the repository root so the Dockerfile can access the API project:

```bash
docker build -f api/GipeDev.Api/Dockerfile -t gipedev-api .
docker run --rm -p 10000:10000 gipedev-api
```

For a Render Web Service, select the Docker runtime and set the Dockerfile path to
`api/GipeDev.Api/Dockerfile`. The container listens on port `10000`; use `/health`
as Render's health-check path.
