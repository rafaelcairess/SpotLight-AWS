namespace SpotLight.Api.Contracts;

public sealed record GameResponse(
    int AppId,
    string Title,
    string? Image,
    string? Genre,
    int? ActivePlayers,
    int? CommunityRating);
