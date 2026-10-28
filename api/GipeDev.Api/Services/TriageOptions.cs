using System.ComponentModel.DataAnnotations;

namespace GipeDev.Api.Services;

public sealed class TriageOptions
{
    public string ApiKey { get; init; } = "";
    public string Model { get; init; } = "";
    [Range(5, 60)] public int TimeoutSeconds { get; init; } = 40;
    [Range(512, 4096)] public int MaxOutputTokens { get; init; } = 3000;
    [Range(1, 1000)] public int HourlyRequestLimit { get; init; } = 100;
}
