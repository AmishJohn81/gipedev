namespace GipeDev.Api.Models;

public sealed class AsteroidsScore
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid PilotId { get; init; }
    public required AsteroidsPilot Pilot { get; init; }
    public int Score { get; init; }
    public DateTimeOffset CreatedAtUtc { get; init; } = DateTimeOffset.UtcNow;
}
