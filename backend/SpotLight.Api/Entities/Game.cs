namespace SpotLight.Api.Entities;

public sealed class Game
{
    public int AppId { get; init; }

    public required string Title { get; init; }

    public string? Image { get; init; }

    public string? ShortDescription { get; init; }

    public string? Genre { get; init; }

    public string[]? Tags { get; init; }

    public int? ActivePlayers { get; init; }

    public int? CommunityRating { get; init; }

    public string? Price { get; init; }

    public string? PriceOriginal { get; init; }

    public int? DiscountPercent { get; init; }

    public string? ReleaseDate { get; init; }

    public string? Developer { get; init; }

    public string? Publisher { get; init; }

    public string[]? Platforms { get; init; }

    public string? BackgroundImage { get; init; }

    public string? TrailerUrl { get; init; }

    public string? TrailerThumbnail { get; init; }

    public string[] ScreenshotUrls { get; init; } = [];

    public DateTimeOffset? MediaSyncedAt { get; init; }

    public DateTimeOffset LastSynced { get; init; }
}
