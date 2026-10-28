using GipeDev.Api.Contracts;
using GipeDev.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GipeDev.Api.Controllers;

[ApiController]
[Route("api/triage")]
public sealed class TriageController(ITriageService triage) : ControllerBase
{
    [HttpPost("analyze")]
    [EnableRateLimiting("triage")]
    [RequestSizeLimit(24 * 1024)]
    [ProducesResponseType<TriageRecommendation>(200)]
    [ProducesResponseType<ValidationProblemDetails>(400)]
    [ProducesResponseType<ProblemDetails>(422)]
    [ProducesResponseType<ProblemDetails>(429)]
    [ProducesResponseType<ProblemDetails>(502)]
    [ProducesResponseType<ProblemDetails>(503)]
    [ProducesResponseType<ProblemDetails>(504)]
    public async Task<ActionResult<TriageRecommendation>> Analyze(AnalyzeTriageRequest request, CancellationToken cancellationToken)
    {
        Response.Headers.CacheControl = "no-store";
        try { return Ok(await triage.AnalyzeAsync(request, cancellationToken)); }
        catch (TriageException error)
        {
            if (error.StatusCode == 429) Response.Headers.RetryAfter = "60";
            var problem = new ProblemDetails { Status = error.StatusCode, Title = "Triage unavailable", Detail = error.Message };
            problem.Extensions["code"] = error.Code;
            return StatusCode(error.StatusCode, problem);
        }
    }
}
