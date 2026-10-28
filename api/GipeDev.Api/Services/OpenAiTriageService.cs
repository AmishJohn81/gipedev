using System.Diagnostics;
using System.Net.Http.Headers;
using System.Text.Json;
using GipeDev.Api.Contracts;
using Microsoft.Extensions.Options;

namespace GipeDev.Api.Services;

public interface ITriageService
{
    Task<TriageRecommendation> AnalyzeAsync(AnalyzeTriageRequest request, CancellationToken cancellationToken);
}

public sealed class TriageException(int statusCode, string code, string message) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
    public string Code { get; } = code;
}

public sealed class OpenAiTriageService(HttpClient client, IOptions<TriageOptions> options,
    TriageCapacity capacity, ILogger<OpenAiTriageService> logger) : ITriageService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<TriageRecommendation> AnalyzeAsync(AnalyzeTriageRequest request, CancellationToken cancellationToken)
    {
        var settings = options.Value;
        if (string.IsNullOrWhiteSpace(settings.ApiKey) || string.IsNullOrWhiteSpace(settings.Model))
            throw new TriageException(503, "triage_not_configured", "Live triage is not configured yet. Please try the guided examples in chapter three.");
        using var concurrent = capacity.AcquireConcurrent();
        if (!concurrent.IsAcquired) throw new TriageException(429, "triage_busy", "Triage is busy. Please wait a moment and try again.");
        using var hourly = capacity.AcquireHourly();
        if (!hourly.IsAcquired) throw new TriageException(429, "triage_capacity", "The demo has reached its hourly capacity. Please try again later.");
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(TimeSpan.FromSeconds(settings.TimeoutSeconds));
        var elapsed = Stopwatch.StartNew();
        try
        {
            using var message = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/responses");
            message.Headers.Authorization = new AuthenticationHeaderValue("Bearer", settings.ApiKey);
            message.Content = JsonContent.Create(new
            {
                model = settings.Model, store = false, max_output_tokens = settings.MaxOutputTokens,
                instructions = TriagePolicy.Instructions,
                input = JsonSerializer.Serialize(new { title = request.Title.Trim(), description = request.Description.Trim(), approvedFollowUp = request.FollowUp?.Trim(), reply = request.Reply?.Trim() }),
                text = new { format = new { type = "json_schema", name = "helpdesk_triage", strict = true, schema = TriagePolicy.Schema() } }
            });
            using var response = await client.SendAsync(message, HttpCompletionOption.ResponseHeadersRead, timeout.Token);
            logger.LogInformation("Triage provider HTTP {StatusCode} after {ElapsedMs} ms", (int)response.StatusCode, elapsed.ElapsedMilliseconds);
            if (!response.IsSuccessStatusCode)
            {
                var failure = await ProviderFailure(response, timeout.Token);
                logger.LogWarning("Triage provider error category {Category}", failure.Code);
                throw failure;
            }
            // Bound upstream content as well as requested output tokens. Never log request/response bodies.
            using var stream = await response.Content.ReadAsStreamAsync(timeout.Token);
            using var body = new MemoryStream();
            var buffer = new byte[8192];
            int read;
            while ((read = await stream.ReadAsync(buffer, timeout.Token)) > 0)
            {
                if (body.Length + read > 128 * 1024) throw InvalidResponse();
                body.Write(buffer, 0, read);
            }
            using var document = JsonDocument.Parse(body.ToArray());
            var root = document.RootElement;
            if (root.TryGetProperty("usage", out var usage))
                logger.LogInformation("Triage usage: input {InputTokens}, output {OutputTokens}",
                    usage.TryGetProperty("input_tokens", out var input) && input.TryGetInt32(out var it) ? it : 0,
                    usage.TryGetProperty("output_tokens", out var output) && output.TryGetInt32(out var ot) ? ot : 0);
            if (!root.TryGetProperty("status", out var status) || status.GetString() != "completed")
            {
                var tokenLimit = root.TryGetProperty("incomplete_details", out var details) && details.ValueKind == JsonValueKind.Object
                    && details.TryGetProperty("reason", out var reason) && reason.ValueKind == JsonValueKind.String && reason.GetString() == "max_output_tokens";
                logger.LogWarning("Triage validation failed: {Stage}", tokenLimit ? "output_token_limit" : "response_not_completed");
                if (tokenLimit) throw new TriageException(502, "triage_output_limit", "The AI response ended before the assessment was complete. Please try a shorter request.");
                throw InvalidResponse();
            }
            string? text = null;
            foreach (var item in root.GetProperty("output").EnumerateArray())
            {
                if (!item.TryGetProperty("type", out var type) || type.GetString() != "message") continue;
                foreach (var content in item.GetProperty("content").EnumerateArray())
                {
                    if (content.GetProperty("type").GetString() == "refusal")
                        throw new TriageException(422, "triage_unable_to_assess", "The service could not assess this request. Please use a fictional helpdesk work order.");
                    if (content.GetProperty("type").GetString() == "output_text") text = content.GetProperty("text").GetString();
                }
            }
            var recommendation = text is null ? null : JsonSerializer.Deserialize<TriageRecommendation>(text, JsonOptions);
            var validationFailure = TriagePolicy.ValidationFailure(recommendation);
            if (validationFailure is not null)
            {
                logger.LogWarning("Triage validation failed: {Stage}", validationFailure);
                throw InvalidResponse();
            }
            return recommendation!;
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        { throw new TriageException(504, "triage_timeout", "The analysis took too long. Your text is still here; please try again."); }
        catch (HttpRequestException)
        { throw new TriageException(503, "triage_provider_unavailable", "The AI service could not be reached. Your text is still here; please try again later."); }
        catch (IOException)
        { throw new TriageException(503, "triage_provider_unavailable", "The AI response was interrupted. Your text is still here; please try again later."); }
        catch (Exception error) when (error is JsonException or InvalidOperationException or KeyNotFoundException)
        {
            logger.LogWarning("Triage validation failed: invalid_envelope_or_json ({ErrorType})", error.GetType().Name);
            throw InvalidResponse();
        }
    }

    private static TriageException InvalidResponse() => new(502, "triage_invalid_response", "The AI response could not be verified. Your text is still here; please try again.");

    private static async Task<TriageException> ProviderFailure(HttpResponseMessage response, CancellationToken token)
    {
        if (response.StatusCode != System.Net.HttpStatusCode.TooManyRequests)
            return new(503, "triage_provider_unavailable", "The AI service is temporarily unavailable. Your text is still here; please try again later.");
        string? code = null;
        string? type = null;
        // Read bounded error JSON, but never surface or log upstream error messages or arbitrary codes.
        using var stream = await response.Content.ReadAsStreamAsync(token);
        using var body = new MemoryStream();
        var buffer = new byte[2048];
        while (body.Length <= 16384)
        {
            var count = await stream.ReadAsync(buffer, token);
            if (count == 0) break;
            body.Write(buffer, 0, count);
        }
        if (body.Length <= 16384)
        {
            try
            {
                using var json = JsonDocument.Parse(body.ToArray());
                if (json.RootElement.TryGetProperty("error", out var error) && error.ValueKind == JsonValueKind.Object)
                {
                    if (error.TryGetProperty("code", out var c) && c.ValueKind == JsonValueKind.String) code = c.GetString();
                    if (error.TryGetProperty("type", out var t) && t.ValueKind == JsonValueKind.String) type = t.GetString();
                }
            }
            catch (JsonException) { /* Non-JSON provider/proxy errors receive the generic throttle message. */ }
        }
        return code switch
        {
            "credit_balance_exhausted" => new(503, "triage_credits_exhausted", "The AI service has no available API credits. The demo owner needs to review OpenAI API billing."),
            "project_spend_limit_exceeded" or "organization_spend_limit_exceeded" => new(503, "triage_spend_limit", "The AI service has reached a configured spending limit. The demo owner needs to review the API project or organization limits."),
            "organization_usage_limit_exceeded" or "insufficient_quota" => new(503, "triage_quota", "The AI service has no available API quota. The demo owner needs to review API billing, credits, and usage limits."),
            _ when type == "insufficient_quota" => new(503, "triage_quota", "The AI service has no available API quota. The demo owner needs to review API billing, credits, and usage limits."),
            _ => new(429, "triage_provider_rate_limit", "OpenAI temporarily limited requests for this API project. Please wait and try again.")
        };
    }
}
