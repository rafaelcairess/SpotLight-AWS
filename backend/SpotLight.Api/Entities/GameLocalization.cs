namespace SpotLight.Api.Entities;

public sealed class GameLocalization
{
    public int AppId { get; init; }

    public required string Locale { get; init; }

    public string? Title { get; init; }

    public string? ShortDescription { get; init; }

    public string? Genre { get; init; }

    public string[]? Tags { get; init; }

    public DateTimeOffset UpdatedAt { get; init; }
}
