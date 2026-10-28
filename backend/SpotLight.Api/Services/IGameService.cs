using SpotLight.Api.Contracts;

namespace SpotLight.Api.Services;

public interface IGameService
{
    Task<GameResponse?> GetByAppIdAsync(int appId, CancellationToken cancellationToken);
}
