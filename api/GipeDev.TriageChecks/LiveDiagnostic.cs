using GipeDev.Api.Contracts;
using GipeDev.Api.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

internal static class LiveDiagnostic
{
    // Opt-in synthetic smoke test. Never print credentials, ticket text, or model output.
    public static async Task RunAsync(bool printer = false)
    {
        var configuration = new Dictionary<string, string>();
        foreach (var line in await File.ReadAllLinesAsync(".env.local"))
        {
            var separator = line.IndexOf('=');
            if (separator < 0) continue;
            var name = line[..separator].Trim();
            if (name is "OPENAI_API_KEY" or "OPENAI_MODEL") configuration[name] = line[(separator + 1)..].Trim().Trim('"', '\'');
        }
        var settings = Options.Create(new TriageOptions
        {
            ApiKey = configuration.GetValueOrDefault("OPENAI_API_KEY", ""),
            Model = configuration.GetValueOrDefault("OPENAI_MODEL", "")
        });
        using var capacity = new TriageCapacity(settings);
        using var logging = LoggerFactory.Create(builder => builder.AddSimpleConsole());
        using var client = new HttpClient { Timeout = Timeout.InfiniteTimeSpan };
        var service = new OpenAiTriageService(client, settings, capacity, logging.CreateLogger<OpenAiTriageService>());
        try
        {
            await service.AnalyzeAsync(new AnalyzeTriageRequest
            {
                Title = printer ? "printer not printing" : "Mobile payment crash",
                Description = printer ? "low toner error" : "The mobile app closes when submitting a test payment after today's release. Three test users are affected."
            }, default);
            Console.WriteLine("Live synthetic triage passed validation. Output content was not printed or saved.");
        }
        catch (TriageException error)
        { Console.WriteLine($"Live synthetic triage failed: HTTP {error.StatusCode}, category {error.Code}."); Environment.ExitCode = 1; }
    }
}
