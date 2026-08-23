namespace GipeDev.Api.Models;

public sealed class ContactSubmission
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Name { get; init; }
    public required string Email { get; init; }
    public required string Subject { get; init; }
    public required string Message { get; init; }
    public DateTimeOffset CreatedAtUtc { get; init; } = DateTimeOffset.UtcNow;
}
