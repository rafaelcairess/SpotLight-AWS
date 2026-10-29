using SpotLight.Api.Entities;

namespace SpotLight.Api.Repositories;

public interface IGameRepository
{
    Task<Game?> FindByAppIdAsync(int appId, CancellationToken cancellationToken);

    Task<IReadOnlyList<Game>> FindPopularAsync(int limit, CancellationToken cancellationToken);

    Task<IReadOnlyList<Game>> FindRecentAsync(int limit, CancellationToken cancellationToken);

    Task<(IReadOnlyList<Game> Games, int Total)> FindDiscountedAsync(
        int page,
        int limit,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<Game>> FindByAppIdsAsync(
        IReadOnlyCollection<int> appIds,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<Game>> SearchAsync(
        string query,
        int limit,
        CancellationToken cancellationToken);

    Task<Game?> FindDailyFeaturedAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<GameLocalization>> FindLocalizationsAsync(
        IReadOnlyCollection<int> appIds,
        string locale,
        CancellationToken cancellationToken);
}
