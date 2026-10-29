namespace SpotLight.Api.Configuration;

public enum DatabaseProvider
{
    PostgreSql,
    AuroraDsql,
}

public sealed class DatabaseSettings
{
    public const string SectionName = "Database";

    public DatabaseProvider Provider { get; init; } = DatabaseProvider.PostgreSql;

    public bool Required { get; init; }

    public int CommandTimeoutSeconds { get; init; } = 30;

    public string? AuroraDsqlEndpoint { get; init; }

    public string AuroraDsqlUser { get; init; } = "admin";

    public int AuroraDsqlOccMaxRetries { get; init; } = 3;
}
