using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.RateLimiting;
using GipeDev.Api.Contracts;
using GipeDev.Api.Controllers;
using GipeDev.Api.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

if (args.Contains("--live")) { await LiveDiagnostic.RunAsync(args.Contains("--printer")); return; }
var count = 0;
void Check(bool condition, string label)
{
    if (!condition) throw new Exception("FAILED: " + label);
    count++;
}
var jsonOptions = new JsonSerializerOptions(JsonSerializerDefaults.Web);
var request = new AnalyzeTriageRequest { Title = "Portal unavailable", Description = "Two offices report a 502 error." };
var good = new TriageRecommendation
{
    Team = "Infrastructure & Network", Reason = "Availability investigation belongs to this team.", Uncertain = true,
    Alternatives = [], Questions = "Which URL and when did it start?", Assessment = "Verify the scope and cause.",
    Handoff = new() { Category = "Service availability", Priority = "High", PriorityReason = "Two offices report interruption.",
        Summary = "Two offices report a 502 error.", Incident = "External outage connection is unconfirmed.", Remaining = "URL and start time.", NextAction = "Check service availability and dependencies." }
};
HttpResponseMessage Envelope(object output, string status = "completed") => new(HttpStatusCode.OK)
{
    Content = JsonContent.Create(new { status, output = new[] { new { type = "message", content = new[] { new { type = "output_text", text = JsonSerializer.Serialize(output, jsonOptions) } } } }, usage = new { input_tokens = 100, output_tokens = 200 } })
};
TriageOptions Settings(int hourly = 100, int seconds = 5) => new() { ApiKey = "test-only-not-a-real-key", Model = "test-model", HourlyRequestLimit = hourly, TimeoutSeconds = seconds };
OpenAiTriageService Service(FakeHandler handler, TriageOptions settings, TriageCapacity capacity) => new(new HttpClient(handler), Options.Create(settings), capacity, NullLogger<OpenAiTriageService>.Instance);
async Task ExpectFailure(Func<Task> action, int code, string label, string? expectedCode = null)
{
    try { await action(); throw new Exception("Expected failure: " + label); }
    catch (TriageException error)
    {
        Check(error.StatusCode == code, label);
        if (expectedCode is not null) Check(error.Code == expectedCode, label + " classification");
    }
}

var inspected = false;
using var successHandler = new FakeHandler(async (message, token) =>
{
    using var document = JsonDocument.Parse(await message.Content!.ReadAsStringAsync(token));
    var root = document.RootElement;
    Check(message.RequestUri!.ToString() == "https://api.openai.com/v1/responses", "fixed provider endpoint");
    Check(message.Headers.Authorization?.Scheme == "Bearer", "server-side authentication");
    Check(!root.GetProperty("store").GetBoolean(), "provider response storage disabled");
    Check(root.GetProperty("max_output_tokens").GetInt32() == 3000, "bounded model output");
    Check(root.GetProperty("text").GetProperty("format").GetProperty("strict").GetBoolean(), "strict response schema");
    Check(root.GetProperty("instructions").GetString()!.Contains("untrusted data"), "ticket separated from trusted policy");
    using var input = JsonDocument.Parse(root.GetProperty("input").GetString()!);
    Check(input.RootElement.GetProperty("approvedFollowUp").GetString() == "Which URL?", "approved follow-up sent with clarification");
    Check(input.RootElement.GetProperty("reply").GetString() == "portal.example.com", "actual reply sent");
    inspected = true;
    return Envelope(good);
});
using var successCapacity = new TriageCapacity(Options.Create(Settings()));
var service = Service(successHandler, Settings(), successCapacity);
var clarified = new AnalyzeTriageRequest { Title = request.Title, Description = request.Description, FollowUp = "Which URL?", Reply = "portal.example.com" };
Check((await service.AnalyzeAsync(clarified, default)).Team == good.Team && inspected, "valid response parsed");

using var neverHandler = new FakeHandler((_, _) => throw new Exception("Provider must not be called"));
using var missingCapacity = new TriageCapacity(Options.Create(new TriageOptions()));
await ExpectFailure(() => Service(neverHandler, new(), missingCapacity).AnalyzeAsync(request, default), 503, "missing credentials fail closed");

async Task ProviderCase(Func<HttpResponseMessage> response, int expected, string label, string? expectedCode = null)
{
    using var handler = new FakeHandler((_, _) => Task.FromResult(response()));
    using var capacity = new TriageCapacity(Options.Create(Settings()));
    await ExpectFailure(() => Service(handler, Settings(), capacity).AnalyzeAsync(request, default), expected, label, expectedCode);
}
await ProviderCase(() => new(HttpStatusCode.TooManyRequests), 429, "upstream throttle");
foreach (var (providerCode, mappedCode) in new[]
{
    ("insufficient_quota", "triage_quota"), ("credit_balance_exhausted", "triage_credits_exhausted"),
    ("project_spend_limit_exceeded", "triage_spend_limit"), ("organization_spend_limit_exceeded", "triage_spend_limit"),
    ("organization_usage_limit_exceeded", "triage_quota")
})
{
    await ProviderCase(() => new(HttpStatusCode.TooManyRequests)
    { Content = JsonContent.Create(new { error = new { code = providerCode, type = "insufficient_quota", message = "Never expose this upstream message" } }) },
        503, providerCode, mappedCode);
}
await ProviderCase(() => new(HttpStatusCode.TooManyRequests)
{ Content = JsonContent.Create(new { error = new { code = "rate_limit_exceeded", type = "rate_limit_error" } }) },
    429, "provider rate limit distinguished", "triage_provider_rate_limit");
await ProviderCase(() => new(HttpStatusCode.TooManyRequests) { Content = new StringContent("not JSON") },
    429, "malformed throttle response safe", "triage_provider_rate_limit");
await ProviderCase(() => new(HttpStatusCode.Unauthorized), 503, "upstream credential errors do not leak");
await ProviderCase(() => Envelope(good, "incomplete"), 502, "incomplete output rejected");
await ProviderCase(() => new(HttpStatusCode.OK) { Content = JsonContent.Create(new { status = "incomplete", incomplete_details = new { reason = "max_output_tokens" }, output = Array.Empty<object>() }) },
    502, "token-limited output distinguished", "triage_output_limit");
var schema = TriagePolicy.Schema();
Check(schema["properties"]!["reason"]!["minLength"]!.GetValue<int>() == 1, "schema rejects empty explanation");
Check(schema["properties"]!["handoff"]!["properties"]!["summary"]!["maxLength"]!.GetValue<int>() == 3000, "schema matches summary length validation");
Check(schema["properties"]!["handoff"]!["properties"]!["priorityReason"]!["maxLength"]!.GetValue<int>() == 800, "schema matches priority reason length validation");
await ProviderCase(() => new(HttpStatusCode.OK) { Content = new StringContent("not json") }, 502, "malformed envelope rejected");
await ProviderCase(() => Envelope(new { team = "Invented team" }), 502, "incomplete structured response rejected");
var invalid = JsonSerializer.SerializeToNode(good, jsonOptions)!;
invalid["team"] = "Invented team";
await ProviderCase(() => Envelope(invalid), 502, "unrecognized destination rejected");
invalid = JsonSerializer.SerializeToNode(good, jsonOptions)!;
invalid["team"] = ""; invalid["uncertain"] = false;
await ProviderCase(() => Envelope(invalid), 502, "unknown ownership must be uncertain");
await ProviderCase(() => new(HttpStatusCode.OK) { Content = JsonContent.Create(new { status = "completed", output = new[] { new { type = "message", content = new[] { new { type = "refusal", refusal = "test" } } } } }) }, 422, "model refusal handled");
await ProviderCase(() => new(HttpStatusCode.OK) { Content = new StringContent(new string('x', 129 * 1024)) }, 502, "oversized upstream body rejected");

using var slowHandler = new FakeHandler(async (_, token) => { await Task.Delay(5000, token); return Envelope(good); });
using var slowCapacity = new TriageCapacity(Options.Create(Settings()));
await ExpectFailure(() => Service(slowHandler, Settings(seconds: 1), slowCapacity).AnalyzeAsync(request, default), 504, "provider timeout");
using var cancellation = new CancellationTokenSource(); cancellation.Cancel();
try { await Service(slowHandler, Settings(), slowCapacity).AnalyzeAsync(request, cancellation.Token); throw new Exception("Expected cancellation"); }
catch (OperationCanceledException) { Check(true, "caller cancellation propagates"); }

using var budgetHandler = new FakeHandler((_, _) => Task.FromResult(Envelope(good)));
using var budgetCapacity = new TriageCapacity(Options.Create(Settings(hourly: 1)));
var budgetService = Service(budgetHandler, Settings(hourly: 1), budgetCapacity);
await budgetService.AnalyzeAsync(request, default);
await ExpectFailure(() => budgetService.AnalyzeAsync(request, default), 429, "instance-wide hourly limit");
Check(budgetHandler.Calls == 1, "budget blocks before provider invocation");
using var concurrencyCapacity = new TriageCapacity(Options.Create(Settings()));
using var lease1 = concurrencyCapacity.AcquireConcurrent(); using var lease2 = concurrencyCapacity.AcquireConcurrent(); using var lease3 = concurrencyCapacity.AcquireConcurrent();
await ExpectFailure(() => Service(budgetHandler, Settings(), concurrencyCapacity).AnalyzeAsync(request, default), 429, "concurrency bounded");

// Exercise real MVC binding, validation, response mapping, and endpoint rate limiting without external APIs.
var builder = WebApplication.CreateBuilder();
builder.WebHost.UseUrls("http://127.0.0.1:0");
builder.Logging.ClearProviders();
builder.Services.AddControllers().AddApplicationPart(typeof(TriageController).Assembly);
var stub = new StubTriage(good);
builder.Services.AddSingleton<ITriageService>(stub);
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = 429;
    options.AddPolicy("triage", context => RateLimitPartition.GetFixedWindowLimiter(context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new() { PermitLimit = 6, Window = TimeSpan.FromMinutes(10), QueueLimit = 0 }));
});
await using var app = builder.Build();
app.UseRateLimiter(); app.MapControllers(); await app.StartAsync();
var address = app.Services.GetRequiredService<IServer>().Features.Get<IServerAddressesFeature>()!.Addresses.Single();
using var http = new HttpClient { BaseAddress = new(address) };
using var validResponse = await http.PostAsJsonAsync("/api/triage/analyze", clarified);
Check(validResponse.StatusCode == HttpStatusCode.OK, "HTTP analysis endpoint");
Check(validResponse.Headers.CacheControl?.NoStore == true, "HTTP response not cached");
using var invalidResponse = await http.PostAsJsonAsync("/api/triage/analyze", new { title = " ", description = " ", reply = "answer" });
Check(invalidResponse.StatusCode == HttpStatusCode.BadRequest, "HTTP required fields and conversation validation");
using var longResponse = await http.PostAsJsonAsync("/api/triage/analyze", new { title = new string('x', 121), description = "test" });
Check(longResponse.StatusCode == HttpStatusCode.BadRequest, "HTTP field limits");
Check(stub.Calls == 1, "invalid input rejected before service call");
stub.Failure = new(503, "triage_not_configured", "Not configured");
using var unavailable = await http.PostAsJsonAsync("/api/triage/analyze", request);
Check(unavailable.StatusCode == HttpStatusCode.ServiceUnavailable, "HTTP missing-configuration mapping");
Check((await unavailable.Content.ReadAsStringAsync()).Contains("triage_not_configured"), "machine-readable error code");
for (var i = 0; i < 2; i++) { using var ignored = await http.PostAsJsonAsync("/api/triage/analyze", request); }
using var limited = await http.PostAsJsonAsync("/api/triage/analyze", request);
Check(limited.StatusCode == HttpStatusCode.TooManyRequests, "HTTP per-IP endpoint limit");
await app.StopAsync();
Console.WriteLine($"Passed {count} triage checks. No live AI calls or credentials used.");

sealed class FakeHandler(Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> send) : HttpMessageHandler
{
    public int Calls { get; private set; }
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) { Calls++; return send(request, cancellationToken); }
}
sealed class StubTriage(TriageRecommendation recommendation) : ITriageService
{
    public int Calls { get; private set; }
    public TriageException? Failure { get; set; }
    public Task<TriageRecommendation> AnalyzeAsync(AnalyzeTriageRequest request, CancellationToken cancellationToken)
    {
        Calls++;
        if (Failure is not null) throw Failure;
        return Task.FromResult(recommendation);
    }
}
