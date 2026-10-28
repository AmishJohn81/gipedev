using System.Threading.RateLimiting;
using Microsoft.Extensions.Options;

namespace GipeDev.Api.Services;

// Shared across all visitors in this API instance, in addition to per-IP endpoint limits.
public sealed class TriageCapacity(IOptions<TriageOptions> options) : IDisposable
{
    private readonly FixedWindowRateLimiter hourly = new(new()
    {
        PermitLimit = options.Value.HourlyRequestLimit, Window = TimeSpan.FromHours(1), QueueLimit = 0
    });
    private readonly ConcurrencyLimiter concurrent = new(new() { PermitLimit = 3, QueueLimit = 0 });
    public RateLimitLease AcquireConcurrent() => concurrent.AttemptAcquire();
    public RateLimitLease AcquireHourly() => hourly.AttemptAcquire();
    public void Dispose() { hourly.Dispose(); concurrent.Dispose(); }
}
