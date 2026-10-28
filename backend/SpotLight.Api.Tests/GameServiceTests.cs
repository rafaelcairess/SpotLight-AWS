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

        var result = await service.GetByAppIdAsync(730, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(730, result.AppId);
        Assert.Equal("Counter-Strike 2", result.Title);
        Assert.Equal(730, repository.RequestedAppId);
    }

    [Fact]
    public async Task GetByAppId_ReturnsNullWhenRepositoryDoesNotFindGame()
    {
        var service = new GameService(new FakeGameRepository(null));

        var result = await service.GetByAppIdAsync(10, CancellationToken.None);

        Assert.Null(result);
    }

    private sealed class FakeGameRepository(Game? game) : IGameRepository
    {
        public int? RequestedAppId { get; private set; }

        public Task<Game?> FindByAppIdAsync(int appId, CancellationToken cancellationToken)
        {
            RequestedAppId = appId;
            return Task.FromResult(game);
        }
    }
}
