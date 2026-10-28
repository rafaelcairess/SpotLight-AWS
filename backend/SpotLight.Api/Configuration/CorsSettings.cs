namespace SpotLight.Api.Configuration;

public sealed class CorsSettings
{
    public const string SectionName = "Cors";

    public string[] AllowedOrigins { get; init; } = [];

    public static bool HasValidOrigins(CorsSettings settings)
    {
        return settings.AllowedOrigins.Length > 0
            && settings.AllowedOrigins.All(IsValidOrigin);
    }

    private static bool IsValidOrigin(string value)
    {
        if (!Uri.TryCreate(value, UriKind.Absolute, out var origin)
            || (origin.Scheme != Uri.UriSchemeHttps && origin.Scheme != Uri.UriSchemeHttp)
            || origin.AbsolutePath != "/"
            || !string.IsNullOrEmpty(origin.Query)
            || !string.IsNullOrEmpty(origin.Fragment)
            || !string.IsNullOrEmpty(origin.UserInfo))
        {
            return false;
        }

        return (origin.Scheme == Uri.UriSchemeHttps || origin.IsLoopback)
            && string.Equals(
                origin.GetLeftPart(UriPartial.Authority),
                value,
                StringComparison.OrdinalIgnoreCase);
    }
}
