using System.ComponentModel.DataAnnotations;
using GipeDev.Api.Contracts;
using GipeDev.Api.Data;
using GipeDev.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace GipeDev.Api.Controllers;

[ApiController]
[Route("api/asteroids")]
public sealed class AsteroidsController(GipeDevDbContext dbContext) : ControllerBase
{
    [HttpGet("pilots")]
    [ProducesResponseType<IReadOnlyList<AsteroidsPilotResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<AsteroidsPilotResponse>>> GetPilots(
        CancellationToken cancellationToken)
    {
        var pilots = await dbContext.AsteroidsPilots
            .AsNoTracking()
            .OrderBy(pilot => pilot.Name)
            .Select(pilot => new AsteroidsPilotResponse(pilot.Id, pilot.Name))
            .ToListAsync(cancellationToken);

        return Ok(pilots);
    }

    [HttpPost("pilots")]
    [EnableRateLimiting("asteroids-write")]
    [ProducesResponseType<AsteroidsPilotResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<AsteroidsPilotResponse>> CreatePilot(
        CreateAsteroidsPilotRequest request,
        CancellationToken cancellationToken)
    {
        var name = request.Name.Trim().ToUpperInvariant();

        if (await dbContext.AsteroidsPilots.AnyAsync(
                pilot => pilot.NormalizedName == name, cancellationToken))
        {
            return Conflict(new ProblemDetails
            {
                Title = "Pilot already exists",
                Detail = $"A pilot named {name} is already registered."
            });
        }

        var pilot = new AsteroidsPilot { Name = name, NormalizedName = name };
        dbContext.AsteroidsPilots.Add(pilot);

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Pilot already exists",
                Detail = $"A pilot named {name} is already registered."
            });
        }

        var response = new AsteroidsPilotResponse(pilot.Id, pilot.Name);
        return Created($"/api/asteroids/pilots/{pilot.Id}", response);
    }

    [HttpGet("scores")]
    [ProducesResponseType<IReadOnlyList<AsteroidsScoreResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<AsteroidsScoreResponse>>> GetScores(
        [FromQuery, Range(1, 100)] int limit = 10,
        CancellationToken cancellationToken = default)
    {
        var scores = await dbContext.AsteroidsScores
            .AsNoTracking()
            .OrderByDescending(entry => entry.Score)
            .ThenBy(entry => entry.CreatedAtUtc)
            .Take(limit)
            .Select(entry => new AsteroidsScoreResponse(
                entry.Id,
                entry.PilotId,
                entry.Pilot.Name,
                entry.Score,
                entry.CreatedAtUtc))
            .ToListAsync(cancellationToken);

        return Ok(scores);
    }

    [HttpPost("scores")]
    [EnableRateLimiting("asteroids-write")]
    [ProducesResponseType<AsteroidsScoreResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<AsteroidsScoreResponse>> CreateScore(
        CreateAsteroidsScoreRequest request,
        CancellationToken cancellationToken)
    {
        if (request.PilotId == Guid.Empty)
        {
            ModelState.AddModelError(nameof(request.PilotId), "A pilot is required.");
            return ValidationProblem(ModelState);
        }

        var pilot = await dbContext.AsteroidsPilots
            .SingleOrDefaultAsync(entry => entry.Id == request.PilotId, cancellationToken);

        if (pilot is null)
        {
            ModelState.AddModelError(nameof(request.PilotId), "The selected pilot does not exist.");
            return ValidationProblem(ModelState);
        }

        var score = new AsteroidsScore
        {
            PilotId = pilot.Id,
            Pilot = pilot,
            Score = request.Score
        };

        dbContext.AsteroidsScores.Add(score);
        await dbContext.SaveChangesAsync(cancellationToken);

        var response = new AsteroidsScoreResponse(
            score.Id, pilot.Id, pilot.Name, score.Score, score.CreatedAtUtc);
        return Created($"/api/asteroids/scores/{score.Id}", response);
    }
}

public sealed record AsteroidsPilotResponse(Guid Id, string Name);

public sealed record AsteroidsScoreResponse(
    Guid Id,
    Guid PilotId,
    string PilotName,
    int Score,
    DateTimeOffset CreatedAtUtc);
