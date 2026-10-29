namespace SpotLight.Api.Entities;

public sealed class DailyFeatured
{
    public Guid Id { get; init; }

    public int AppId { get; init; }

    public DateOnly FeaturedDate { get; init; }

    public DateTimeOffset CreatedAt { get; init; }
}
