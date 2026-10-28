using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using SpotLight.Api.Contracts;
using SpotLight.Api.Controllers;
namespace SpotLight.Api.Tests;

public sealed class HealthControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _application;

    public HealthControllerTests(WebApplicationFactory<Program> application)
    {
        _application = application;
    }

    [Fact]
    public void Get_ReturnsHealthyServiceWithCurrentTime()
    {
        var expectedTime = new DateTimeOffset(2026, 7, 23, 12, 0, 0, TimeSpan.Zero);
        var controller = new HealthController(new FixedTimeProvider(expectedTime));
        var result = controller.Get();
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<HealthResponse>(ok.Value);
        Assert.Equal("SpotLight.Api", response.Service);
        Assert.Equal("healthy", response.Status);
        Assert.Equal(expectedTime, response.Timestamp);
    }

    [Theory]
    [InlineData("/health/live")]
    [InlineData("/health/ready")]
    [InlineData("/health")]
    public async Task InfrastructureHealthEndpointsReturnOnlySafeStatus(string path)
    {
        using var client = _application.CreateClient();

        using var response = await client.GetAsync(path);
        var body = await response.Content.ReadAsStringAsync();

        response.EnsureSuccessStatusCode();
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
        Assert.Contains("healthy", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("connection", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("exception", body, StringComparison.OrdinalIgnoreCase);
    }

    private sealed class FixedTimeProvider(DateTimeOffset value) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => value;
    }
}
