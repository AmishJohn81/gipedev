using System.ComponentModel.DataAnnotations;

namespace GipeDev.Api.Contracts;

public sealed class AnalyzeTriageRequest : IValidatableObject
{
    [Required, StringLength(120)] public string Title { get; init; } = "";
    [Required, StringLength(3000)] public string Description { get; init; } = "";
    [StringLength(1500)] public string? FollowUp { get; init; }
    [StringLength(1500)] public string? Reply { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext context)
    {
        if (!string.IsNullOrWhiteSpace(Reply) && string.IsNullOrWhiteSpace(FollowUp))
            yield return new ValidationResult("An approved follow-up is required with a reply.", [nameof(FollowUp)]);
    }
}

public sealed class TriageRecommendation
{
    [StringLength(80)] public required string Team { get; init; }
    [Required, StringLength(1500)] public required string Reason { get; init; }
    public required bool Uncertain { get; init; }
    public required string[] Alternatives { get; init; }
    [Required, StringLength(1500)] public required string Questions { get; init; }
    [Required, StringLength(1500)] public required string Assessment { get; init; }
    [Required] public required TriageHandoff Handoff { get; init; }
}

public sealed class TriageHandoff
{
    [Required, StringLength(80)] public required string Category { get; init; }
    [Required, StringLength(20)] public required string Priority { get; init; }
    [Required, StringLength(800)] public required string PriorityReason { get; init; }
    [Required, StringLength(3000)] public required string Summary { get; init; }
    [Required, StringLength(1500)] public required string Incident { get; init; }
    [Required, StringLength(1500)] public required string Remaining { get; init; }
    [Required, StringLength(1500)] public required string NextAction { get; init; }
}
