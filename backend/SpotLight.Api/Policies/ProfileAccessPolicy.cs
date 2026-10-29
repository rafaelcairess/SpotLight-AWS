namespace SpotLight.Api.Policies;

public static class ProfileAccessPolicy
{
    public static bool CanViewProfile(
        string? profileVisibility,
        bool isOwner,
        bool isFriend) =>
        CanView(profileVisibility, isOwner, isFriend);

    public static bool CanViewLibrary(
        string? profileVisibility,
        string? libraryVisibility,
        bool isOwner,
        bool isFriend) =>
        CanView(profileVisibility, isOwner, isFriend)
        && CanView(libraryVisibility, isOwner, isFriend);

    public static bool CanViewReviews(
        string? profileVisibility,
        string? reviewsVisibility,
        bool isOwner,
        bool isFriend) =>
        CanView(profileVisibility, isOwner, isFriend)
        && CanView(reviewsVisibility, isOwner, isFriend);

    public static bool CanComment(
        string? profileVisibility,
        string? commentsPermission,
        bool isOwner,
        bool isFriend)
    {
        if (isOwner || !CanView(profileVisibility, false, isFriend))
        {
            return false;
        }

        return commentsPermission?.Trim().ToLowerInvariant() switch
        {
            "public" => true,
            "friends" => isFriend,
            _ => false,
        };
    }

    public static bool CanViewGame(
        bool isPrivate,
        bool isHidden,
        bool isOwner,
        bool includeHiddenForOwner = false)
    {
        if (isHidden)
        {
            return isOwner && includeHiddenForOwner;
        }

        return isOwner || !isPrivate;
    }

    private static bool CanView(string? visibility, bool isOwner, bool isFriend)
    {
        if (isOwner)
        {
            return true;
        }

        return visibility?.Trim().ToLowerInvariant() switch
        {
            "public" => true,
            "friends" => isFriend,
            _ => false,
        };
    }
}
