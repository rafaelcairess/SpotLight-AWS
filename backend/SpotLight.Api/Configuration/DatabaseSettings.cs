namespace SpotLight.Api.Configuration;

public sealed class DatabaseSettings
{
    public const string SectionName = "Database";

    public bool Required { get; init; }

    public int CommandTimeoutSeconds { get; init; } = 30;
}
