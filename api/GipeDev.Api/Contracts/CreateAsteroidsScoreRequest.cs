using System.ComponentModel.DataAnnotations;

namespace GipeDev.Api.Contracts;

public sealed class CreateAsteroidsScoreRequest
{
    public Guid PilotId { get; init; }

    [Range(1, 99_999_999)]
    public int Score { get; init; }
}
