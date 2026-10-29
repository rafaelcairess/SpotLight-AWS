using System.Security.Claims;
using System.Text.Json;

namespace SpotLight.Api.Authentication;

public static class ProtectedClaims
{
    private const string AppMetadataClaim = "app_metadata";

    public static bool IsAdmin(ClaimsPrincipal? principal)
    {
        if (principal?.Identity?.IsAuthenticated is not true)
        {
            return false;
        }

        var appMetadata = principal?.FindFirstValue(AppMetadataClaim);
        if (string.IsNullOrWhiteSpace(appMetadata))
        {
            return false;
        }

        try
        {
            using var document = JsonDocument.Parse(appMetadata);
            return document.RootElement.ValueKind == JsonValueKind.Object
                && document.RootElement.TryGetProperty("role", out var role)
                && role.ValueKind == JsonValueKind.String
                && string.Equals(role.GetString(), "admin", StringComparison.Ordinal);
        }
        catch (JsonException)
        {
            return false;
        }
    }
}
