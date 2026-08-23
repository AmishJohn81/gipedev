using System.ComponentModel.DataAnnotations;

namespace GipeDev.Api.Contracts;

public sealed class CreateContactRequest
{
    [Required, StringLength(100)]
    public required string Name { get; init; }

    [Required, EmailAddress, StringLength(254)]
    public required string Email { get; init; }

    [Required, StringLength(150)]
    public required string Subject { get; init; }

    [Required, StringLength(5000, MinimumLength = 10)]
    public required string Message { get; init; }

    [StringLength(100)]
    public string? Company { get; init; }
}
