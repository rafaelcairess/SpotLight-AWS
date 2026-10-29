using SpotLight.Api.Policies;

namespace SpotLight.Api.Tests;

public sealed class SocialGraphPolicyTests
{
    private static readonly Guid Alice = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid Bob = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid Carol = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

    [Fact]
    public void FollowRequiresActorOwnershipAndRejectsSelfFollow()
    {
        Assert.True(SocialGraphPolicy.CanCreateFollow(Alice, Alice, Bob));
        Assert.False(SocialGraphPolicy.CanCreateFollow(Bob, Alice, Bob));
        Assert.False(SocialGraphPolicy.CanCreateFollow(Alice, Alice, Alice));
        Assert.False(SocialGraphPolicy.CanCreateFollow(Guid.Empty, Guid.Empty, Bob));
        Assert.True(SocialGraphPolicy.CanDeleteFollow(Alice, Alice));
        Assert.False(SocialGraphPolicy.CanDeleteFollow(Bob, Alice));
    }

    [Fact]
    public void FriendRequestRequiresRequesterIdentityAndDifferentTarget()
    {
        Assert.True(SocialGraphPolicy.CanCreateFriendRequest(Alice, Alice, Bob));
        Assert.False(SocialGraphPolicy.CanCreateFriendRequest(Bob, Alice, Bob));
        Assert.False(SocialGraphPolicy.CanCreateFriendRequest(Alice, Alice, Alice));
    }

    [Theory]
    [InlineData("pending", "accepted", true)]
    [InlineData("pending", "declined", true)]
    [InlineData("pending", "pending", false)]
    [InlineData("accepted", "declined", false)]
    [InlineData("declined", "accepted", false)]
    [InlineData("PENDING", "accepted", false)]
    [InlineData("pending", "unexpected", false)]
    public void OnlyAddresseeCanPerformValidFriendshipTransitions(
        string currentStatus,
        string requestedStatus,
        bool expected)
    {
        Assert.Equal(
            expected,
            SocialGraphPolicy.CanTransitionFriendRequest(
                Bob,
                Bob,
                currentStatus,
                requestedStatus));
        Assert.False(
            SocialGraphPolicy.CanTransitionFriendRequest(
                Alice,
                Bob,
                currentStatus,
                requestedStatus));
    }

    [Fact]
    public void EitherParticipantCanDeleteFriendRequest()
    {
        Assert.True(SocialGraphPolicy.CanDeleteFriendRequest(Alice, Alice, Bob));
        Assert.True(SocialGraphPolicy.CanDeleteFriendRequest(Bob, Alice, Bob));
        Assert.False(SocialGraphPolicy.CanDeleteFriendRequest(Carol, Alice, Bob));
    }

    [Fact]
    public void NotificationsAreManagedOnlyByTheirOwner()
    {
        Assert.True(SocialGraphPolicy.CanManageNotification(Alice, Alice));
        Assert.False(SocialGraphPolicy.CanManageNotification(Bob, Alice));
        Assert.False(SocialGraphPolicy.CanManageNotification(Guid.Empty, Guid.Empty));
    }
}
