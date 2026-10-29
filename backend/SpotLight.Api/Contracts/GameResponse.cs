namespace SpotLight.Api.Contracts;

public sealed record GameResponse(
    int AppId,
    string Title,
    string? Image,
    string? ShortDescription,
    string? Genre,
    string[]? Tags,
    int? ActivePlayers,
    int? CommunityRating,
    string? Price,
    string? PriceOriginal,
    int? DiscountPercent,
    string? ReleaseDate,
    string? Developer,
    string? Publisher,
    string[]? Platforms,
    string? BackgroundImage,
    string? TrailerUrl,
    string? TrailerThumbnail,
    string[] ScreenshotUrls,
    DateTimeOffset? MediaSyncedAt,
    DateTimeOffset LastSynced);
