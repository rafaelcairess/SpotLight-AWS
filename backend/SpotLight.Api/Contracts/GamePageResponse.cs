namespace SpotLight.Api.Contracts;

public sealed record GamePageResponse(
    IReadOnlyList<GameResponse> Games,
    int Total,
    int Page,
    int Limit);
