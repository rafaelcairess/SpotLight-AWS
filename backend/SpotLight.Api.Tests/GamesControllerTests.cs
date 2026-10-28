using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;

namespace SpotLight.Api.Tests;

public sealed class GamesControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _application;

    public GamesControllerTests(WebApplicationFactory<Program> application)
    {
        _application = application;
    }

    [Fact]
    public async Task Get_WhenDatabaseIsNotConfigured_ReturnsSafeServiceUnavailableProblem()
    {
        using var client = _application.CreateClient();

        using var response = await client.GetAsync("/api/games/730");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(problem);
        Assert.Equal("Banco de dados indisponível", problem.Title);
        Assert.DoesNotContain("ConnectionStrings", problem.Detail, StringComparison.OrdinalIgnoreCase);
    }
}
