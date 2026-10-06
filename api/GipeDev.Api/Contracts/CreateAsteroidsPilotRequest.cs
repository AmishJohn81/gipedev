using System.ComponentModel.DataAnnotations;

namespace GipeDev.Api.Contracts;

public sealed class CreateAsteroidsPilotRequest
{
    [Required, StringLength(3, MinimumLength = 3, ErrorMessage = "Pilot initials must be exactly three characters.")]
    [RegularExpression("^(?=.*[A-Za-z])[A-Za-z ]{3}$", ErrorMessage = "Pilot initials must contain letters or spaces, including at least one letter.")]
    public required string Name { get; init; }
}
