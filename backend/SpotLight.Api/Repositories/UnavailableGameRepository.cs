using SpotLight.Api.Data;
using SpotLight.Api.Entities;

namespace SpotLight.Api.Repositories;

public sealed class UnavailableGameRepository : IGameRepository
{
    public Task<Game?> FindByAppIdAsync(int appId, CancellationToken cancellationToken)
    {
        return Task.FromException<Game?>(new DatabaseNotConfiguredException());
    }
}
