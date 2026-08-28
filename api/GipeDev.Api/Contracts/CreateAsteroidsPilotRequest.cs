using System.ComponentModel.DataAnnotations;

namespace GipeDev.Api.Contracts;

public sealed class CreateAsteroidsPilotRequest
{
    [Required, StringLength(10, MinimumLength = 1)]
    [RegularExpression("^[A-Za-z0-9]+$", ErrorMessage = "Pilot names may contain only letters and numbers.")]
    public required string Name { get; init; }
}
