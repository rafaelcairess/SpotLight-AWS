using SpotLight.Api.Data;
using SpotLight.Api.Entities;

namespace SpotLight.Api.Repositories;

public sealed class UnavailableGameRepository : IGameRepository
{
    public Task<Game?> FindByAppIdAsync(int appId, CancellationToken cancellationToken)
    {
        return Task.FromException<Game?>(new DatabaseNotConfiguredException());
    }

    public Task<IReadOnlyList<Game>> FindPopularAsync(int limit, CancellationToken cancellationToken) =>
        Unavailable<IReadOnlyList<Game>>();

    public Task<IReadOnlyList<Game>> FindRecentAsync(int limit, CancellationToken cancellationToken) =>
        Unavailable<IReadOnlyList<Game>>();

    public Task<(IReadOnlyList<Game> Games, int Total)> FindDiscountedAsync(
        int page,
        int limit,
        CancellationToken cancellationToken) =>
        Unavailable<(IReadOnlyList<Game>, int)>();

    public Task<IReadOnlyList<Game>> FindByAppIdsAsync(
        IReadOnlyCollection<int> appIds,
        CancellationToken cancellationToken) =>
        Unavailable<IReadOnlyList<Game>>();

    public Task<IReadOnlyList<Game>> SearchAsync(
        string query,
        int limit,
        CancellationToken cancellationToken) =>
        Unavailable<IReadOnlyList<Game>>();

    public Task<Game?> FindDailyFeaturedAsync(CancellationToken cancellationToken) =>
        Unavailable<Game?>();

    public Task<IReadOnlyList<GameLocalization>> FindLocalizationsAsync(
        IReadOnlyCollection<int> appIds,
        string locale,
        CancellationToken cancellationToken) =>
        Unavailable<IReadOnlyList<GameLocalization>>();

    private static Task<T> Unavailable<T>() =>
        Task.FromException<T>(new DatabaseNotConfiguredException());
}
