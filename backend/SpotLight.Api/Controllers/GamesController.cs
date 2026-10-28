using Microsoft.AspNetCore.Mvc;
using SpotLight.Api.Contracts;
using SpotLight.Api.Services;

namespace SpotLight.Api.Controllers;

[ApiController]
[Route("api/games")]
public sealed class GamesController(IGameService gameService) : ControllerBase
{
    [HttpGet("{appId:int}")]
    [ProducesResponseType<GameResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<GameResponse>> GetByAppId(
        int appId,
        CancellationToken cancellationToken)
    {
        var game = await gameService.GetByAppIdAsync(appId, cancellationToken);
        if (game is null)
        {
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Jogo não encontrado",
                detail: "Não existe um jogo com o identificador informado.");
        }

        return Ok(game);
    }
}
