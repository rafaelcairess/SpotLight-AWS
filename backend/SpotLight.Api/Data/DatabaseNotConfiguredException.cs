namespace SpotLight.Api.Data;

public sealed class DatabaseNotConfiguredException()
    : InvalidOperationException(
        "O acesso ao banco de dados ainda não foi configurado para este ambiente.");
