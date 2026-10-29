using SpotLight.Api.Policies;

namespace SpotLight.Api.Tests;

public sealed class ProfileAccessPolicyTests
{
    public static TheoryData<string?, bool, bool, bool> ProfileCases => new()
    {
        { "public", false, false, true },
        { "friends", false, true, true },
        { "friends", false, false, false },
        { "private", false, true, false },
        { "private", true, false, true },
        { "unexpected", false, true, false },
        { null, false, false, false },
    };

    [Theory]
    [MemberData(nameof(ProfileCases))]
    public void CanViewProfile_FailsClosed(
        string? visibility,
        bool isOwner,
        bool isFriend,
        bool expected)
    {
        Assert.Equal(
            expected,
            ProfileAccessPolicy.CanViewProfile(visibility, isOwner, isFriend));
    }

    [Theory]
    [InlineData("public", "public", false, false, true)]
    [InlineData("public", "friends", false, true, true)]
    [InlineData("public", "friends", false, false, false)]
    [InlineData("friends", "public", false, false, false)]
    [InlineData("private", "public", false, true, false)]
    [InlineData("private", "private", true, false, true)]
    public void CanViewLibrary_RequiresProfileAndSectionVisibility(
        string profileVisibility,
        string sectionVisibility,
        bool isOwner,
        bool isFriend,
        bool expected)
    {
        Assert.Equal(
            expected,
            ProfileAccessPolicy.CanViewLibrary(
                profileVisibility,
                sectionVisibility,
                isOwner,
                isFriend));
        Assert.Equal(
            expected,
            ProfileAccessPolicy.CanViewReviews(
                profileVisibility,
                sectionVisibility,
                isOwner,
                isFriend));
    }

    [Theory]
    [InlineData("public", "public", false, false, true)]
    [InlineData("public", "friends", false, true, true)]
    [InlineData("public", "friends", false, false, false)]
    [InlineData("private", "public", false, true, false)]
    [InlineData("public", "disabled", false, true, false)]
    [InlineData("public", "public", true, false, false)]
    public void CanComment_RequiresVisibleProfileAndPermission(
        string profileVisibility,
        string permission,
        bool isOwner,
        bool isFriend,
        bool expected)
    {
        Assert.Equal(
            expected,
            ProfileAccessPolicy.CanComment(
                profileVisibility,
                permission,
                isOwner,
                isFriend));
    }

    [Theory]
    [InlineData(false, false, false, false, true)]
    [InlineData(true, false, false, false, false)]
    [InlineData(true, false, true, false, true)]
    [InlineData(false, true, false, false, false)]
    [InlineData(false, true, true, false, false)]
    [InlineData(false, true, true, true, true)]
    public void CanViewGame_SeparatesPrivateFromExplicitHiddenAccess(
        bool isPrivate,
        bool isHidden,
        bool isOwner,
        bool includeHiddenForOwner,
        bool expected)
    {
        Assert.Equal(
            expected,
            ProfileAccessPolicy.CanViewGame(
                isPrivate,
                isHidden,
                isOwner,
                includeHiddenForOwner));
    }
}
