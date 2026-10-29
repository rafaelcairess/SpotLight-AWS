using Amazon.AuroraDsql.Npgsql;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace SpotLight.Api.Data;

public sealed class DatabaseReadinessHealthCheck(IServiceScopeFactory scopeFactory)
    : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var dsqlDataSource = scope.ServiceProvider.GetService<DsqlDataSource>();

            if (dsqlDataSource is not null)
            {
                await using var connection = await dsqlDataSource.OpenConnectionAsync(cancellationToken);
                await using var command = connection.CreateCommand();
                command.CommandText = "SELECT 1";
                await command.ExecuteScalarAsync(cancellationToken);
            }
            else
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<SpotLightDbContext>();
                if (!await dbContext.Database.CanConnectAsync(cancellationToken))
                {
                    return HealthCheckResult.Unhealthy();
                }
            }

            return HealthCheckResult.Healthy();
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            return HealthCheckResult.Unhealthy(
                "A consulta de readiness do banco falhou.",
                exception);
        }
    }
}
