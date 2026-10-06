using System.ComponentModel.DataAnnotations;

namespace GipeDev.Api.Contracts;

public sealed class CreateAsteroidsScoreRequest : IValidatableObject
{
    public Guid PilotId { get; init; }

    [Range(10, 999_990)]
    public int Score { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Score % 10 != 0)
        {
            yield return new ValidationResult(
                "Score must be divisible by 10.",
                [nameof(Score)]);
        }
    }
}
