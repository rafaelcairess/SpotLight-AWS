namespace SpotLight.Api.Authentication;

public interface ICurrentUser
{
    bool IsAuthenticated { get; }

    Guid? UserId { get; }

    string? Email { get; }

    string Role { get; }

    bool IsAdmin { get; }

    string? AuthenticationLevel { get; }

    bool IsAnonymous { get; }
}
