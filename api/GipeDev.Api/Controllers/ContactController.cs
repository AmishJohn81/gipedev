using GipeDev.Api.Contracts;
using GipeDev.Api.Data;
using GipeDev.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GipeDev.Api.Controllers;

[ApiController]
[Route("api/contact")]
public sealed class ContactController(GipeDevDbContext dbContext) : ControllerBase
{
    [HttpPost]
    [EnableRateLimiting("contact")]
    [ProducesResponseType<ContactCreatedResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<ContactCreatedResponse>> Create(
        CreateContactRequest request,
        CancellationToken cancellationToken)
    {
        // Silently accept honeypot submissions without storing them.
        if (!string.IsNullOrWhiteSpace(request.Company))
        {
            return StatusCode(StatusCodes.Status201Created,
                new ContactCreatedResponse(Guid.NewGuid(), "Your message was received."));
        }

        var submission = new ContactSubmission
        {
            Name = request.Name.Trim(),
            Email = request.Email.Trim(),
            Subject = request.Subject.Trim(),
            Message = request.Message.Trim()
        };

        dbContext.ContactSubmissions.Add(submission);
        await dbContext.SaveChangesAsync(cancellationToken);

        return StatusCode(StatusCodes.Status201Created,
            new ContactCreatedResponse(submission.Id, "Your message was received."));
    }
}

public sealed record ContactCreatedResponse(Guid Id, string Message);
