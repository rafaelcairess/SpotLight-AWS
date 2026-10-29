using SpotLight.Api.Contracts;

namespace SpotLight.Api.Services;

public interface IGameService
{
    Task<GameResponse?> GetByAppIdAsync(
        int appId,
        string locale,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<GameResponse>> GetPopularAsync(
        int limit,
        string locale,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<GameResponse>> GetRecentAsync(
        int limit,
        string locale,
        CancellationToken cancellationToken);

    Task<GamePageResponse> GetDiscountedAsync(
        int page,
        int limit,
        string locale,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<GameResponse>> GetByAppIdsAsync(
        IReadOnlyCollection<int> appIds,
        string locale,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<GameResponse>> SearchAsync(
        string query,
        int limit,
        string locale,
        CancellationToken cancellationToken);

    Task<GameResponse?> GetDailyFeaturedAsync(
        string locale,
        CancellationToken cancellationToken);
}
