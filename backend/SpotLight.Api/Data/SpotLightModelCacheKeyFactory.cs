using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace SpotLight.Api.Data;

public sealed class SpotLightModelCacheKeyFactory : IModelCacheKeyFactory
{
    public object Create(DbContext context) => Create(context, false);

    public object Create(DbContext context, bool designTime) =>
        context is SpotLightDbContext spotLightContext
            ? (context.GetType(), spotLightContext.DatabaseProvider, designTime)
            : (object)(context.GetType(), designTime);
}
