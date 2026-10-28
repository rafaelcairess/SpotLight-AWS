using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using SpotLight.Api.Configuration;
using SpotLight.Api.Data;
using SpotLight.Api.Entities;

namespace SpotLight.Api.Tests;

public sealed class DataConfigurationTests
{
    [Fact]
    public void GameMappingMatchesExistingPostgresTable()
    {
        var options = new DbContextOptionsBuilder<SpotLightDbContext>()
            .UseNpgsql("Host=localhost;Database=spotlight_model_test")
            .Options;
        using var dbContext = new SpotLightDbContext(options);
        var entity = dbContext.Model.FindEntityType(typeof(Game));
        var table = StoreObjectIdentifier.Table("games", "public");

        Assert.NotNull(entity);
        Assert.Equal("games", entity.GetTableName());
        Assert.Equal("public", entity.GetSchema());
        Assert.Equal("app_id", entity.FindProperty(nameof(Game.AppId))?.GetColumnName(table));
        Assert.Equal("title", entity.FindProperty(nameof(Game.Title))?.GetColumnName(table));
    }

    [Fact]
    public void RequiredDatabaseWithoutConnectionStringFailsClearly()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Database:Required"] = "true",
            })
            .Build();
        var services = new ServiceCollection();

        var exception = Assert.Throws<OptionsValidationException>(() =>
            services.AddSpotLightData(configuration));

        Assert.Contains("ConnectionStrings:DefaultConnection", exception.Message);
    }

    [Theory]
    [InlineData("https://spotlight.rafaelcpires.abrdns.com", true)]
    [InlineData("http://localhost:5173", true)]
    [InlineData("http://spotlight.example.com", false)]
    [InlineData("https://spotlight.example.com/path", false)]
    [InlineData("https://spotlight.example.com/", false)]
    [InlineData("*", false)]
    public void CorsOriginsRequireExactSecureOriginsOrLoopback(string origin, bool expected)
    {
        var settings = new CorsSettings { AllowedOrigins = [origin] };

        Assert.Equal(expected, CorsSettings.HasValidOrigins(settings));
    }
}
