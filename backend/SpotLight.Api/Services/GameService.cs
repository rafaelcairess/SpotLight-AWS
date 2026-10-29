using SpotLight.Api.Contracts;
using SpotLight.Api.Entities;
using SpotLight.Api.Repositories;

namespace SpotLight.Api.Services;

public sealed class GameService(IGameRepository repository) : IGameService
{
    public async Task<GameResponse?> GetByAppIdAsync(
        int appId,
        string locale,
        CancellationToken cancellationToken)
    {
        var game = await repository.FindByAppIdAsync(appId, cancellationToken);
        if (game is null)
        {
            return null;
        }

        return (await LocalizeAndMapAsync([game], locale, cancellationToken))[0];
    }

    public async Task<IReadOnlyList<GameResponse>> GetPopularAsync(
        int limit,
        string locale,
        CancellationToken cancellationToken)
    {
        var games = await repository.FindPopularAsync(limit, cancellationToken);
        return await LocalizeAndMapAsync(games, locale, cancellationToken);
    }

    public async Task<IReadOnlyList<GameResponse>> GetRecentAsync(
        int limit,
        string locale,
        CancellationToken cancellationToken)
    {
        var games = await repository.FindRecentAsync(limit, cancellationToken);
        return await LocalizeAndMapAsync(games, locale, cancellationToken);
    }

    public async Task<GamePageResponse> GetDiscountedAsync(
        int page,
        int limit,
        string locale,
        CancellationToken cancellationToken)
    {
        var result = await repository.FindDiscountedAsync(page, limit, cancellationToken);
        var games = await LocalizeAndMapAsync(result.Games, locale, cancellationToken);
        return new GamePageResponse(games, result.Total, page, limit);
    }

    public async Task<IReadOnlyList<GameResponse>> GetByAppIdsAsync(
        IReadOnlyCollection<int> appIds,
        string locale,
        CancellationToken cancellationToken)
    {
        var uniqueIds = appIds.Where(appId => appId > 0).Distinct().Take(100).ToArray();
        if (uniqueIds.Length == 0)
        {
            return [];
        }

        var games = await repository.FindByAppIdsAsync(uniqueIds, cancellationToken);
        var order = uniqueIds.Select((appId, index) => (appId, index))
            .ToDictionary(item => item.appId, item => item.index);
        var orderedGames = games.OrderBy(game => order.GetValueOrDefault(game.AppId, int.MaxValue));
        return await LocalizeAndMapAsync(orderedGames.ToArray(), locale, cancellationToken);
    }

    public async Task<IReadOnlyList<GameResponse>> SearchAsync(
        string query,
        int limit,
        string locale,
        CancellationToken cancellationToken)
    {
        var normalized = query.Trim();
        if (normalized.Length < 2)
        {
            return [];
        }

        var games = await repository.SearchAsync(normalized, limit, cancellationToken);
        return await LocalizeAndMapAsync(games, locale, cancellationToken);
    }

    public async Task<GameResponse?> GetDailyFeaturedAsync(
        string locale,
        CancellationToken cancellationToken)
    {
        var game = await repository.FindDailyFeaturedAsync(cancellationToken);
        if (game is null)
        {
            return null;
        }

        return (await LocalizeAndMapAsync([game], locale, cancellationToken))[0];
    }

    private async Task<IReadOnlyList<GameResponse>> LocalizeAndMapAsync(
        IReadOnlyCollection<Game> games,
        string locale,
        CancellationToken cancellationToken)
    {
        if (games.Count == 0)
        {
            return [];
        }

        var normalizedLocale = NormalizeLocale(locale);
        var localizations = await repository.FindLocalizationsAsync(
            games.Select(game => game.AppId).ToArray(),
            normalizedLocale,
            cancellationToken);
        var localizationByAppId = localizations.ToDictionary(localization => localization.AppId);

        return games
            .Select(game => Map(game, localizationByAppId.GetValueOrDefault(game.AppId)))
            .ToArray();
    }

    private static string NormalizeLocale(string locale) =>
        locale.Trim().ToLowerInvariant() switch
        {
            "en" => "en",
            "es" => "es",
            _ => "pt",
        };

    private static GameResponse Map(Game game, GameLocalization? localization) =>
        new(
            game.AppId,
            localization?.Title ?? game.Title,
            game.Image,
            localization?.ShortDescription ?? game.ShortDescription,
            localization?.Genre ?? game.Genre,
            localization?.Tags ?? game.Tags,
            game.ActivePlayers,
            game.CommunityRating,
            game.Price,
            game.PriceOriginal,
            game.DiscountPercent,
            game.ReleaseDate,
            game.Developer,
            game.Publisher,
            game.Platforms,
            game.BackgroundImage,
            game.TrailerUrl,
            game.TrailerThumbnail,
            game.SteamUrl,
            game.ScreenshotUrls,
            game.MediaSyncedAt,
            game.LastSynced);
}
