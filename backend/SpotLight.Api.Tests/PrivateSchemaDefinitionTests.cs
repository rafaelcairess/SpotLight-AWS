using System.Text.RegularExpressions;

namespace SpotLight.Api.Tests;

public sealed partial class PrivateSchemaDefinitionTests
{
    private static readonly string RepositoryRoot = FindRepositoryRoot();
    private static readonly string SchemaPath = Path.Combine(
        RepositoryRoot,
        "backend",
        "schema",
        "dsql",
        "010_private_shadow.sql");
    private static readonly string IndexPath = Path.Combine(
        RepositoryRoot,
        "backend",
        "schema",
        "dsql",
        "011_private_indexes.sql");

    private static readonly string[] ExpectedTables =
    [
        "app_users",
        "user_identities",
        "profiles",
        "user_games",
        "user_game_platinum_platforms",
        "user_top_games",
        "profile_platinum_showcase",
        "reviews",
        "review_reactions",
        "user_lists",
        "user_list_games",
        "follows",
        "friend_requests",
        "notifications",
        "profile_comments",
        "price_alerts",
        "feedback",
        "rate_limits",
    ];

    [Fact]
    public async Task ShadowSchema_ContainsTheReviewedPrivateSurface()
    {
        var sql = await File.ReadAllTextAsync(
            SchemaPath,
            TestContext.Current.CancellationToken);
        var actualTables = CreateTableRegex()
            .Matches(sql)
            .Select(match => match.Groups[1].Value)
            .ToArray();

        Assert.Equal(ExpectedTables.Order(), actualTables.Order());
        Assert.Contains("CREATE SCHEMA IF NOT EXISTS spotlight_private", sql);
        Assert.DoesNotContain("CREATE TABLE IF NOT EXISTS public.", sql);
    }

    [Fact]
    public async Task ShadowSchema_DoesNotDependOnUnsupportedDatabaseAuthorization()
    {
        var sql = await File.ReadAllTextAsync(
            SchemaPath,
            TestContext.Current.CancellationToken);
        var statements = SqlCommentRegex().Replace(sql, string.Empty);

        string[] forbiddenTokens =
        [
            "ROW LEVEL SECURITY",
            "CREATE POLICY",
            "CREATE TRIGGER",
            "LANGUAGE PLPGSQL",
            "SECURITY DEFINER",
            "AUTH.UID",
            "GRANT ",
            "REVOKE ",
        ];

        foreach (var token in forbiddenTokens)
        {
            Assert.DoesNotContain(token, statements, StringComparison.OrdinalIgnoreCase);
        }
    }

    [Fact]
    public async Task ShadowSchema_UsesLocalPrincipalsAndRelationalIntegrity()
    {
        var sql = await File.ReadAllTextAsync(
            SchemaPath,
            TestContext.Current.CancellationToken);

        Assert.DoesNotContain("auth.users", SqlCommentRegex().Replace(sql, string.Empty));
        Assert.Contains("spotlight_private.app_users", sql);
        Assert.Contains("spotlight_private.user_identities", sql);
        Assert.Contains("FOREIGN KEY", sql);
        Assert.Contains("CHECK", sql);
        Assert.Contains("UNIQUE", sql);
    }

    [Fact]
    public async Task SecondaryIndexes_AreExplicitlyAsynchronous()
    {
        var sql = await File.ReadAllTextAsync(
            IndexPath,
            TestContext.Current.CancellationToken);
        var createIndexes = CreateIndexRegex().Matches(sql);

        Assert.NotEmpty(createIndexes);
        Assert.All(
            createIndexes.Cast<Match>(),
            match => Assert.Matches(@"CREATE\s+(UNIQUE\s+)?INDEX\s+ASYNC", match.Value));
    }

    [Fact]
    public async Task DefaultDatabaseCommandAndWorkflow_StillApplyOnlyThePublicCatalog()
    {
        var programPath = Path.Combine(
            RepositoryRoot,
            "backend",
            "SpotLight.Database.Tool",
            "Program.cs");
        var program = await File.ReadAllTextAsync(
            programPath,
            TestContext.Current.CancellationToken);

        Assert.Matches(
            @"ApplySchemaAsync[\s\S]+?GetOption\(options, ""schema""\)[\s\S]+?001_catalog\.sql",
            program);

        var workflowPath = Path.Combine(
            RepositoryRoot,
            ".github",
            "workflows",
            "api-staging.yml");
        var workflow = await File.ReadAllTextAsync(
            workflowPath,
            TestContext.Current.CancellationToken);

        Assert.DoesNotContain("010_private_shadow.sql", workflow);
        Assert.DoesNotContain("011_private_indexes.sql", workflow);
    }

    private static string FindRepositoryRoot()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);

        while (directory is not null)
        {
            if (File.Exists(Path.Combine(directory.FullName, "SpotLight.sln")))
            {
                return directory.Parent?.FullName
                    ?? throw new InvalidOperationException("Raiz do repositório não encontrada.");
            }

            directory = directory.Parent;
        }

        throw new InvalidOperationException("Raiz do repositório não encontrada.");
    }

    [GeneratedRegex(
        @"CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+spotlight_private\.([a-z0-9_]+)",
        RegexOptions.IgnoreCase)]
    private static partial Regex CreateTableRegex();

    [GeneratedRegex(@"^\s*--.*$", RegexOptions.Multiline)]
    private static partial Regex SqlCommentRegex();

    [GeneratedRegex(@"CREATE\s+(?:UNIQUE\s+)?INDEX[^;]+;", RegexOptions.IgnoreCase)]
    private static partial Regex CreateIndexRegex();
}
