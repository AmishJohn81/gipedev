var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHealthChecks();

var app = builder.Build();

app.MapGet("/", () => Results.Ok(new
{
    service = "GipeDev API",
    status = "running"
}));

app.MapHealthChecks("/health");

app.Run();

public partial class Program;
