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
}
