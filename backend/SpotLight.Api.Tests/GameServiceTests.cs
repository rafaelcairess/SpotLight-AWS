using SpotLight.Api.Entities;
using SpotLight.Api.Repositories;
using SpotLight.Api.Services;

namespace SpotLight.Api.Tests;

public sealed class GameServiceTests
{
    [Fact]
    public async Task GetByAppId_MapsExistingGameWithoutProviderTypes()
    {
        var repository = new FakeGameRepository(new Game
        {
            AppId = 730,
            Title = "Counter-Strike 2",
            Image = "https://example.com/cs2.jpg",
            Genre = "Action",
            ActivePlayers = 900_000,
            CommunityRating = 87,
        });
        var service = new GameService(repository);

        var result = await service.GetByAppIdAsync(730, "pt", CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(730, result.AppId);
        Assert.Equal("Counter-Strike 2", result.Title);
        Assert.Equal(730, repository.RequestedAppId);
    }

    [Fact]
    public async Task GetByAppId_ReturnsNullWhenRepositoryDoesNotFindGame()
    {
        var service = new GameService(new FakeGameRepository(null));

        var result = await service.GetByAppIdAsync(10, "pt", CancellationToken.None);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetByAppId_AppliesRequestedLocalization()
    {
        var repository = new FakeGameRepository(
            new Game { AppId = 570, Title = "Dota 2", ShortDescription = "Default" },
            new GameLocalization
            {
                AppId = 570,
                Locale = "es",
                Title = "Dota 2 localizado",
                ShortDescription = "Descripción localizada",
            });
        var service = new GameService(repository);

        var result = await service.GetByAppIdAsync(570, "es", CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("Dota 2 localizado", result.Title);
        Assert.Equal("Descripción localizada", result.ShortDescription);
    }

    private sealed class FakeGameRepository(Game? game, GameLocalization? localization = null)
        : IGameRepository
    {
        public int? RequestedAppId { get; private set; }

        public Task<Game?> FindByAppIdAsync(int appId, CancellationToken cancellationToken)
        {
            RequestedAppId = appId;
            return Task.FromResult(game);
        }

        public Task<IReadOnlyList<Game>> FindPopularAsync(
            int limit,
            CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<Game>>(game is null ? [] : [game]);

        public Task<IReadOnlyList<Game>> FindRecentAsync(
            int limit,
            CancellationToken cancellationToken) =>
            FindPopularAsync(limit, cancellationToken);

        public Task<(IReadOnlyList<Game> Games, int Total)> FindDiscountedAsync(
            int page,
            int limit,
            CancellationToken cancellationToken)
        {
            IReadOnlyList<Game> games = game is null ? [] : [game];
            return Task.FromResult((games, games.Count));
        }

        public Task<IReadOnlyList<Game>> FindByAppIdsAsync(
            IReadOnlyCollection<int> appIds,
            CancellationToken cancellationToken) =>
            FindPopularAsync(appIds.Count, cancellationToken);

        public Task<IReadOnlyList<Game>> SearchAsync(
            string query,
            int limit,
            CancellationToken cancellationToken) =>
            FindPopularAsync(limit, cancellationToken);

        public Task<Game?> FindDailyFeaturedAsync(CancellationToken cancellationToken) =>
            Task.FromResult(game);

        public Task<IReadOnlyList<GameLocalization>> FindLocalizationsAsync(
            IReadOnlyCollection<int> appIds,
            string locale,
            CancellationToken cancellationToken)
        {
            IReadOnlyList<GameLocalization> localizations =
                localization is not null && localization.Locale == locale ? [localization] : [];
            return Task.FromResult(localizations);
        }
    }
}
