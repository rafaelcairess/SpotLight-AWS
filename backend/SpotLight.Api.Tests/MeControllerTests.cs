using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using SpotLight.Api.Authentication;
using SpotLight.Api.Contracts;
using SpotLight.Api.Controllers;

namespace SpotLight.Api.Tests;

public sealed class MeControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _application;

    public MeControllerTests(WebApplicationFactory<Program> application)
    {
        _application = application;
    }

    [Fact]
    public void Get_WithTrustedClaims_ReturnsCurrentUser()
    {
        var expectedUserId = Guid.Parse("d853dbb3-bcfe-4493-a893-ba084a722ea5");
        var currentUser = new FakeCurrentUser
        {
            IsAuthenticated = true,
            UserId = expectedUserId,
            Email = "usuario@spotlight.local",
            Role = "authenticated",
            AuthenticationLevel = "aal1",
        };
        var controller = new MeController(currentUser);

        var result = controller.Get();
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<CurrentUserResponse>(ok.Value);

        Assert.Equal(expectedUserId, response.UserId);
        Assert.Equal("usuario@spotlight.local", response.Email);
        Assert.Equal("authenticated", response.Role);
        Assert.Equal("aal1", response.AuthenticationLevel);
        Assert.False(response.IsAnonymous);
    }

    [Fact]
    public void Get_WithoutValidUserId_ReturnsUnauthorizedProblem()
    {
        var controller = new MeController(new FakeCurrentUser
        {
            IsAuthenticated = true,
            UserId = null,
        });

        var result = controller.Get();
        var problem = Assert.IsType<ObjectResult>(result.Result);

        Assert.Equal(StatusCodes.Status401Unauthorized, problem.StatusCode);
    }

    [Fact]
    public async Task Get_WithoutBearerToken_ReturnsStandardUnauthorizedProblem()
    {
        using var client = _application.CreateClient();
        using var response = await client.GetAsync("/api/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(problem);
        Assert.Equal(StatusCodes.Status401Unauthorized, problem.Status);
        Assert.Equal("Autenticação necessária", problem.Title);
    }

    private sealed class FakeCurrentUser : ICurrentUser
    {
        public bool IsAuthenticated { get; init; }

        public Guid? UserId { get; init; }

        public string? Email { get; init; }

        public string Role { get; init; } = "authenticated";

        public string? AuthenticationLevel { get; init; }

        public bool IsAnonymous { get; init; }
    }
}
