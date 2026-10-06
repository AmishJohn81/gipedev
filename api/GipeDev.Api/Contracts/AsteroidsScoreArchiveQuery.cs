using System.ComponentModel.DataAnnotations;

namespace GipeDev.Api.Contracts;

public sealed class AsteroidsScoreArchiveQuery : IValidatableObject
{
    [Range(1, int.MaxValue)]
    public int Page { get; init; } = 1;

    [Range(10, 100)]
    public int PageSize { get; init; } = 25;

    [StringLength(3)]
    public string? Search { get; init; }

    public Guid? PilotId { get; init; }

    [Range(0, 999_999)]
    public int? MinimumScore { get; init; }

    [Range(0, 999_999)]
    public int? MaximumScore { get; init; }

    public string SortBy { get; init; } = "date";

    public string SortDirection { get; init; } = "desc";

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (MinimumScore.HasValue && MaximumScore.HasValue && MinimumScore > MaximumScore)
        {
            yield return new ValidationResult(
                "Minimum score cannot exceed maximum score.",
                [nameof(MinimumScore), nameof(MaximumScore)]);
        }

        if (SortBy is not ("rank" or "pilot" or "score" or "date"))
        {
            yield return new ValidationResult(
                "SortBy must be rank, pilot, score, or date.",
                [nameof(SortBy)]);
        }

        if (SortDirection is not ("asc" or "desc"))
        {
            yield return new ValidationResult(
                "SortDirection must be asc or desc.",
                [nameof(SortDirection)]);
        }
    }
}
