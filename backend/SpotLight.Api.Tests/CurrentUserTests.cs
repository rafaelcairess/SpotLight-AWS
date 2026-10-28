using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using SpotLight.Api.Authentication;

namespace SpotLight.Api.Tests;

public sealed class CurrentUserTests
{
    [Fact]
    public void ReadsIdentityFromProviderNeutralClaimsPrincipal()
    {
        var userId = Guid.Parse("d853dbb3-bcfe-4493-a893-ba084a722ea5");
        var claims = new[]
        {
            new Claim("sub", userId.ToString()),
            new Claim("email", "usuario@spotlight.local"),
            new Claim("role", "authenticated"),
            new Claim("aal", "aal2"),
            new Claim("is_anonymous", "true"),
        };
        var accessor = new HttpContextAccessor
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(claims, "Test")),
            },
        };

        var currentUser = new HttpContextCurrentUser(accessor);

        Assert.True(currentUser.IsAuthenticated);
        Assert.Equal(userId, currentUser.UserId);
        Assert.Equal("usuario@spotlight.local", currentUser.Email);
        Assert.Equal("authenticated", currentUser.Role);
        Assert.Equal("aal2", currentUser.AuthenticationLevel);
        Assert.True(currentUser.IsAnonymous);
    }

    [Fact]
    public void InvalidSubjectDoesNotBecomeAUserId()
    {
        var accessor = new HttpContextAccessor
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    [new Claim("sub", "not-a-guid")],
                    "Test")),
            },
        };

        var currentUser = new HttpContextCurrentUser(accessor);

        Assert.Null(currentUser.UserId);
    }
}
