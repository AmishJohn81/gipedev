FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY api/GipeDev.Api/GipeDev.Api.csproj api/GipeDev.Api/
COPY api/GipeDev.DataTransfer/GipeDev.DataTransfer.csproj api/GipeDev.DataTransfer/
RUN dotnet restore api/GipeDev.Api/GipeDev.Api.csproj
RUN dotnet restore api/GipeDev.DataTransfer/GipeDev.DataTransfer.csproj

COPY api/GipeDev.Api/ api/GipeDev.Api/
COPY api/GipeDev.DataTransfer/ api/GipeDev.DataTransfer/
RUN dotnet publish api/GipeDev.Api/GipeDev.Api.csproj \
    --configuration Release \
    --output /app/publish \
    --no-restore
RUN dotnet publish api/GipeDev.DataTransfer/GipeDev.DataTransfer.csproj \
    --configuration Release \
    --output /app/transfer \
    --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:10000
EXPOSE 10000

COPY --from=build /app/publish .
COPY --from=build /app/transfer /app/transfer
RUN mkdir -p /app/data && chown "$APP_UID:$APP_UID" /app/data

USER $APP_UID
ENTRYPOINT ["dotnet", "GipeDev.Api.dll"]
