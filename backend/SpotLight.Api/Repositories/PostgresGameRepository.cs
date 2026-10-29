using Microsoft.EntityFrameworkCore;
using SpotLight.Api.Data;
using SpotLight.Api.Entities;

namespace SpotLight.Api.Repositories;

public sealed class PostgresGameRepository(SpotLightDbContext dbContext) : IGameRepository
{
    public Task<Game?> FindByAppIdAsync(int appId, CancellationToken cancellationToken)
    {
        return dbContext.Games
            .AsNoTracking()
            .SingleOrDefaultAsync(game => game.AppId == appId, cancellationToken);
    }

    public async Task<IReadOnlyList<Game>> FindPopularAsync(
        int limit,
        CancellationToken cancellationToken)
    {
        return await dbContext.Games
            .AsNoTracking()
            .Where(game => game.CommunityRating >= 72 && game.ActivePlayers > 0)
            .OrderByDescending(game => game.ActivePlayers)
            .Take(limit)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Game>> FindRecentAsync(
        int limit,
        CancellationToken cancellationToken)
    {
        return await dbContext.Games
            .AsNoTracking()
            .OrderByDescending(game => game.LastSynced)
            .Take(limit)
            .ToListAsync(cancellationToken);
    }

    public async Task<(IReadOnlyList<Game> Games, int Total)> FindDiscountedAsync(
        int page,
        int limit,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Games
            .AsNoTracking()
            .Where(game => game.DiscountPercent > 0);
        var total = await query.CountAsync(cancellationToken);
        var games = await query
            .OrderByDescending(game => game.ActivePlayers)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync(cancellationToken);

        return (games, total);
    }

    public async Task<IReadOnlyList<Game>> FindByAppIdsAsync(
        IReadOnlyCollection<int> appIds,
        CancellationToken cancellationToken)
    {
        return await dbContext.Games
            .AsNoTracking()
            .Where(game => appIds.Contains(game.AppId))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Game>> SearchAsync(
        string query,
        int limit,
        CancellationToken cancellationToken)
    {
        var pattern = $"%{query}%";
        return await dbContext.Games
            .AsNoTracking()
            .Where(game => EF.Functions.ILike(game.Title, pattern))
            .OrderByDescending(game => game.ActivePlayers)
            .Take(limit)
            .ToListAsync(cancellationToken);
    }

    public async Task<Game?> FindDailyFeaturedAsync(CancellationToken cancellationToken)
    {
        var appId = await dbContext.DailyFeatured
            .AsNoTracking()
            .OrderByDescending(featured => featured.FeaturedDate)
            .Select(featured => (int?)featured.AppId)
            .FirstOrDefaultAsync(cancellationToken);

        return appId is null
            ? null
            : await FindByAppIdAsync(appId.Value, cancellationToken);
    }

    public async Task<IReadOnlyList<GameLocalization>> FindLocalizationsAsync(
        IReadOnlyCollection<int> appIds,
        string locale,
        CancellationToken cancellationToken)
    {
        return await dbContext.GameLocalizations
            .AsNoTracking()
            .Where(localization =>
                localization.Locale == locale && appIds.Contains(localization.AppId))
            .ToListAsync(cancellationToken);
    }
}
