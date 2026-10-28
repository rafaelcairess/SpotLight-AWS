using SpotLight.Api.Entities;

namespace SpotLight.Api.Repositories;

public interface IGameRepository
{
    Task<Game?> FindByAppIdAsync(int appId, CancellationToken cancellationToken);
}
