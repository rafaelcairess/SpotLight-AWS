namespace SpotLight.Api.Data;

public sealed class DatabaseNotConfiguredException()
    : InvalidOperationException(
        "O acesso PostgreSQL ainda não foi configurado para este ambiente.");
