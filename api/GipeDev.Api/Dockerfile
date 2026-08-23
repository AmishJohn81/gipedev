FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY api/GipeDev.Api/GipeDev.Api.csproj api/GipeDev.Api/
RUN dotnet restore api/GipeDev.Api/GipeDev.Api.csproj

COPY api/GipeDev.Api/ api/GipeDev.Api/
RUN dotnet publish api/GipeDev.Api/GipeDev.Api.csproj \
    --configuration Release \
    --output /app/publish \
    --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:10000
EXPOSE 10000

COPY --from=build /app/publish .

USER $APP_UID
ENTRYPOINT ["dotnet", "GipeDev.Api.dll"]
