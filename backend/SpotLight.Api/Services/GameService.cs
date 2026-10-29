using SpotLight.Api.Contracts;
using SpotLight.Api.Repositories;

namespace SpotLight.Api.Services;

public sealed class GameService(IGameRepository repository) : IGameService
{
    public async Task<GameResponse?> GetByAppIdAsync(
        int appId,
        CancellationToken cancellationToken)
    {
        var game = await repository.FindByAppIdAsync(appId, cancellationToken);

        return game is null
            ? null
            : new GameResponse(
                game.AppId,
                game.Title,
                game.Image,
                game.ShortDescription,
                game.Genre,
                game.Tags,
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
                game.ScreenshotUrls,
                game.MediaSyncedAt,
                game.LastSynced);
    }
}
