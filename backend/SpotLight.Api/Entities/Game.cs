namespace SpotLight.Api.Entities;

public sealed class Game
{
    public int AppId { get; init; }

    public required string Title { get; init; }

    public string? Image { get; init; }

    public string? Genre { get; init; }

    public int? ActivePlayers { get; init; }

    public int? CommunityRating { get; init; }
}
