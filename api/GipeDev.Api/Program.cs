using System.Threading.RateLimiting;
using GipeDev.Api.Data;
using GipeDev.Api.Services;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddDatabaseProvider(builder.Configuration);
builder.Services.AddHealthChecks();
builder.Services.AddOptions<TriageOptions>().Bind(builder.Configuration.GetSection("OpenAI"))
    .ValidateDataAnnotations().ValidateOnStart();
builder.Services.AddSingleton<TriageCapacity>();
builder.Services.AddHttpClient<ITriageService, OpenAiTriageService>(client => client.Timeout = Timeout.InfiniteTimeSpan);

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, token) =>
    {
        if (context.HttpContext.GetEndpoint()?.Metadata.GetMetadata<Microsoft.AspNetCore.RateLimiting.EnableRateLimitingAttribute>()?.PolicyName == "triage")
        {
            context.HttpContext.Response.Headers.RetryAfter = "600";
            await context.HttpContext.Response.WriteAsJsonAsync(new
            {
                status = 429, title = "Triage request limit", code = "triage_ip_limit",
                detail = "This connection has reached the limit of six triage requests per ten minutes."
            }, token);
        }
    };
    options.AddPolicy("triage", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = 6, Window = TimeSpan.FromMinutes(10), QueueLimit = 0 }));
    options.AddPolicy("contact", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(10),
                QueueLimit = 0
            }));
    options.AddPolicy("asteroids-write", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 30,
                Window = TimeSpan.FromMinutes(10),
                QueueLimit = 0
            }));
});

var frontendOrigins = builder.Configuration.GetSection("FrontendOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(frontendOrigins).AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

app.UseForwardedHeaders();
app.UseHttpsRedirection();
app.UseCors();
app.UseRateLimiter();

app.MapGet("/", () => Results.Ok(new
{
    service = "GipeDev API",
    status = "running"
}));

app.MapHealthChecks("/health");
app.MapControllers();

await using (var scope = app.Services.CreateAsyncScope())
{
    var db = scope.ServiceProvider.GetRequiredService<GipeDevDbContext>();
    await db.Database.MigrateAsync();
}

app.Run();

public partial class Program;
