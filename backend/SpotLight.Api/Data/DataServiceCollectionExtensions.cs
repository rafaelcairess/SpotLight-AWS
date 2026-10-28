using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SpotLight.Api.Configuration;
using SpotLight.Api.Repositories;

namespace SpotLight.Api.Data;

public static class DataServiceCollectionExtensions
{
    public static IServiceCollection AddSpotLightData(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services
            .AddOptions<DatabaseSettings>()
            .Bind(configuration.GetSection(DatabaseSettings.SectionName))
            .Validate(
                settings => settings.CommandTimeoutSeconds is >= 1 and <= 300,
                "Database:CommandTimeoutSeconds deve estar entre 1 e 300 segundos.")
            .ValidateOnStart();

        var settings = configuration
            .GetSection(DatabaseSettings.SectionName)
            .Get<DatabaseSettings>() ?? new DatabaseSettings();
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        var hasConnectionString = !string.IsNullOrWhiteSpace(connectionString);

        if (settings.Required && !hasConnectionString)
        {
            throw new OptionsValidationException(
                DatabaseSettings.SectionName,
                typeof(DatabaseSettings),
                ["ConnectionStrings:DefaultConnection é obrigatória neste ambiente."]);
        }

        if (hasConnectionString)
        {
            services.AddDbContext<SpotLightDbContext>(options =>
                options.UseNpgsql(
                    connectionString,
                    npgsql => npgsql.CommandTimeout(settings.CommandTimeoutSeconds)));
            services.AddScoped<IGameRepository, PostgresGameRepository>();
            services
                .AddHealthChecks()
                .AddCheck<PostgresReadinessHealthCheck>(
                    "postgresql",
                    tags: ["ready"]);
        }
        else
        {
            services.AddSingleton<IGameRepository, UnavailableGameRepository>();
        }

        return services;
    }
}
