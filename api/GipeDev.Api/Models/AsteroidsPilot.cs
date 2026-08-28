namespace GipeDev.Api.Models;

public sealed class AsteroidsPilot
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Name { get; init; }
    public required string NormalizedName { get; init; }
    public DateTimeOffset CreatedAtUtc { get; init; } = DateTimeOffset.UtcNow;
    public ICollection<AsteroidsScore> Scores { get; init; } = [];
}
