using Amazon.AuroraDsql.Npgsql;
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
            .Validate(
                settings => settings.AuroraDsqlOccMaxRetries is >= 0 and <= 10,
                "Database:AuroraDsqlOccMaxRetries deve estar entre 0 e 10.")
            .ValidateOnStart();

        var settings = configuration
            .GetSection(DatabaseSettings.SectionName)
            .Get<DatabaseSettings>() ?? new DatabaseSettings();
        if (settings.Provider == DatabaseProvider.AuroraDsql)
        {
            ConfigureAuroraDsql(services, settings);
        }
        else
        {
            ConfigurePostgreSql(
                services,
                settings,
                configuration.GetConnectionString("DefaultConnection"));
        }

        return services;
    }

    private static void ConfigureAuroraDsql(
        IServiceCollection services,
        DatabaseSettings settings)
    {
        if (string.IsNullOrWhiteSpace(settings.AuroraDsqlEndpoint))
        {
            HandleUnavailableDatabase(
                services,
                settings,
                "Database:AuroraDsqlEndpoint é obrigatório quando o provedor é AuroraDsql.");
            return;
        }

        services.AddSingleton(_ =>
            DsqlDataSource.CreateAsync(new DsqlConfig
            {
                Host = settings.AuroraDsqlEndpoint,
                User = settings.AuroraDsqlUser,
                OccMaxRetries = settings.AuroraDsqlOccMaxRetries,
                ConfigureConnectionString = connection =>
                    connection.CommandTimeout = settings.CommandTimeoutSeconds,
            }).GetAwaiter().GetResult());
        services.AddDbContext<SpotLightDbContext>(
            (provider, options) => options.UseNpgsql(
                provider.GetRequiredService<DsqlDataSource>().DataSource,
                npgsql => npgsql.CommandTimeout(settings.CommandTimeoutSeconds)));
        AddConfiguredDatabaseServices(services, "aurora-dsql");
    }

    private static void ConfigurePostgreSql(
        IServiceCollection services,
        DatabaseSettings settings,
        string? connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            HandleUnavailableDatabase(
                services,
                settings,
                "ConnectionStrings:DefaultConnection é obrigatória neste ambiente.");
            return;
        }

        services.AddDbContext<SpotLightDbContext>(options =>
            options.UseNpgsql(
                connectionString,
                npgsql => npgsql.CommandTimeout(settings.CommandTimeoutSeconds)));
        AddConfiguredDatabaseServices(services, "postgresql");
    }

    private static void AddConfiguredDatabaseServices(
        IServiceCollection services,
        string healthCheckName)
    {
        services.AddScoped<IGameRepository, PostgresGameRepository>();
        services
            .AddHealthChecks()
            .AddCheck<DatabaseReadinessHealthCheck>(
                healthCheckName,
                tags: ["ready"]);
    }

    private static void HandleUnavailableDatabase(
        IServiceCollection services,
        DatabaseSettings settings,
        string errorMessage)
    {
        if (settings.Required)
        {
            throw new OptionsValidationException(
                DatabaseSettings.SectionName,
                typeof(DatabaseSettings),
                [errorMessage]);
        }

        services.AddSingleton<IGameRepository, UnavailableGameRepository>();
    }
}
