using Microsoft.AspNetCore.Mvc;
using SpotLight.Api.Contracts;
using SpotLight.Api.Services;

namespace SpotLight.Api.Controllers;

[ApiController]
[Route("api/games")]
public sealed class GamesController(IGameService gameService) : ControllerBase
{
    [HttpGet("popular")]
    [ProducesResponseType<IReadOnlyList<GameResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<GameResponse>>> GetPopular(
        [FromQuery] int limit = 10,
        [FromQuery] string locale = "pt",
        CancellationToken cancellationToken = default)
    {
        return Ok(await gameService.GetPopularAsync(
            NormalizeLimit(limit, 100), locale, cancellationToken));
    }

    [HttpGet("recent")]
    [ProducesResponseType<IReadOnlyList<GameResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<GameResponse>>> GetRecent(
        [FromQuery] int limit = 200,
        [FromQuery] string locale = "pt",
        CancellationToken cancellationToken = default)
    {
        return Ok(await gameService.GetRecentAsync(
            NormalizeLimit(limit, 200), locale, cancellationToken));
    }

    [HttpGet("discounted")]
    [ProducesResponseType<GamePageResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<GamePageResponse>> GetDiscounted(
        [FromQuery] int page = 1,
        [FromQuery] int limit = 30,
        [FromQuery] string locale = "pt",
        CancellationToken cancellationToken = default)
    {
        return Ok(await gameService.GetDiscountedAsync(
            Math.Max(1, page),
            NormalizeLimit(limit, 100),
            locale,
            cancellationToken));
    }

    [HttpGet("batch")]
    [ProducesResponseType<IReadOnlyList<GameResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<GameResponse>>> GetByAppIds(
        [FromQuery(Name = "appId")] int[] appIds,
        [FromQuery] string locale = "pt",
        CancellationToken cancellationToken = default)
    {
        return Ok(await gameService.GetByAppIdsAsync(appIds, locale, cancellationToken));
    }

    [HttpGet("search")]
    [ProducesResponseType<IReadOnlyList<GameResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<GameResponse>>> Search(
        [FromQuery] string q,
        [FromQuery] int limit = 20,
        [FromQuery] string locale = "pt",
        CancellationToken cancellationToken = default)
    {
        return Ok(await gameService.SearchAsync(
            q ?? string.Empty,
            NormalizeLimit(limit, 50),
            locale,
            cancellationToken));
    }

    [HttpGet("featured")]
    [ProducesResponseType<GameResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<ActionResult<GameResponse>> GetDailyFeatured(
        [FromQuery] string locale = "pt",
        CancellationToken cancellationToken = default)
    {
        var game = await gameService.GetDailyFeaturedAsync(locale, cancellationToken);
        return game is null ? NoContent() : Ok(game);
    }

    [HttpGet("{appId:int}")]
    [ProducesResponseType<GameResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<GameResponse>> GetByAppId(
        int appId,
        [FromQuery] string locale = "pt",
        CancellationToken cancellationToken = default)
    {
        var game = await gameService.GetByAppIdAsync(appId, locale, cancellationToken);
        if (game is null)
        {
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Jogo não encontrado",
                detail: "Não existe um jogo com o identificador informado.");
        }

        return Ok(game);
    }

    private static int NormalizeLimit(int value, int maximum) => Math.Clamp(value, 1, maximum);
}
