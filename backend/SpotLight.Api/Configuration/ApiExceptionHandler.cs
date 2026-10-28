using System.Data.Common;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using SpotLight.Api.Data;

namespace SpotLight.Api.Configuration;

public sealed class ApiExceptionHandler(
    ILogger<ApiExceptionHandler> logger,
    IProblemDetailsService problemDetailsService) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var isDatabaseUnavailable = exception is DatabaseNotConfiguredException or DbException;
        var statusCode = isDatabaseUnavailable
            ? StatusCodes.Status503ServiceUnavailable
            : StatusCodes.Status500InternalServerError;

        if (isDatabaseUnavailable)
        {
            logger.LogWarning("A operação solicitada requer PostgreSQL configurado.");
        }
        else
        {
            logger.LogError(exception, "Erro inesperado ao processar {Method} {Path}.",
                httpContext.Request.Method,
                httpContext.Request.Path);
        }

        httpContext.Response.StatusCode = statusCode;

        return await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = new ProblemDetails
            {
                Status = statusCode,
                Title = isDatabaseUnavailable
                    ? "Banco de dados indisponível"
                    : "Erro interno do servidor",
                Detail = isDatabaseUnavailable
                    ? "O acesso a dados não está disponível neste ambiente."
                    : "Não foi possível concluir a solicitação.",
            },
        });
    }
}
