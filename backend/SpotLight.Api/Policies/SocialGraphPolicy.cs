namespace SpotLight.Api.Policies;

public static class SocialGraphPolicy
{
    public static bool CanCreateFollow(Guid actorId, Guid followerId, Guid followingId) =>
        IsUsable(actorId)
        && actorId == followerId
        && followerId != followingId;

    public static bool CanDeleteFollow(Guid actorId, Guid followerId) =>
        IsUsable(actorId) && actorId == followerId;

    public static bool CanCreateFriendRequest(
        Guid actorId,
        Guid requesterId,
        Guid addresseeId) =>
        IsUsable(actorId)
        && actorId == requesterId
        && requesterId != addresseeId;

    public static bool CanTransitionFriendRequest(
        Guid actorId,
        Guid addresseeId,
        string? currentStatus,
        string? requestedStatus)
    {
        if (!IsUsable(actorId)
            || actorId != addresseeId
            || !string.Equals(currentStatus, "pending", StringComparison.Ordinal))
        {
            return false;
        }

        return requestedStatus is "accepted" or "declined";
    }

    public static bool CanDeleteFriendRequest(
        Guid actorId,
        Guid requesterId,
        Guid addresseeId) =>
        IsUsable(actorId)
        && (actorId == requesterId || actorId == addresseeId);

    public static bool CanManageNotification(Guid actorId, Guid ownerId) =>
        IsUsable(actorId) && actorId == ownerId;

    private static bool IsUsable(Guid userId) => userId != Guid.Empty;
}
