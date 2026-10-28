using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SpotLight.Api.Authentication;
using SpotLight.Api.Contracts;

namespace SpotLight.Api.Controllers;

[ApiController]
[Route("api/me")]
[Authorize(Policy = AuthorizationPolicies.AuthenticatedUser)]
public sealed class MeController(ICurrentUser currentUser) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<CurrentUserResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    public ActionResult<CurrentUserResponse> Get()
    {
        if (currentUser.UserId is not { } userId)
        {
            return Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Identidade inválida",
                detail: "O token não possui um identificador de usuário válido.");
        }

        return Ok(new CurrentUserResponse(
            UserId: userId,
            Email: currentUser.Email,
            Role: currentUser.Role,
            AuthenticationLevel: currentUser.AuthenticationLevel,
            IsAnonymous: currentUser.IsAnonymous));
    }
}
