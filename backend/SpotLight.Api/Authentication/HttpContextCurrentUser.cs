using System.Security.Claims;

namespace SpotLight.Api.Authentication;

public sealed class HttpContextCurrentUser(IHttpContextAccessor httpContextAccessor) : ICurrentUser
{
    private ClaimsPrincipal? Principal => httpContextAccessor.HttpContext?.User;

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated is true;

    public Guid? UserId => Guid.TryParse(Principal?.FindFirstValue("sub"), out var userId)
        ? userId
        : null;

    public string? Email => Principal?.FindFirstValue("email");

    public string Role => Principal?.FindFirstValue("role") ?? "authenticated";

    public string? AuthenticationLevel => Principal?.FindFirstValue("aal");

    public bool IsAnonymous => bool.TryParse(
        Principal?.FindFirstValue("is_anonymous"),
        out var isAnonymous) && isAnonymous;
}
