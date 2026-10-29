using System.Globalization;
using System.Net.Http.Headers;
using System.Text.Json;
using Amazon.AuroraDsql.Npgsql;
using Npgsql;
using NpgsqlTypes;
using System.Text.RegularExpressions;

if (args.Length == 0 || args[0] is "-h" or "--help")
{
    PrintUsage();
    return 0;
}

Dictionary<string, string> options;
try
{
    options = ParseOptions(args[1..]);
}
catch (ArgumentException exception)
{
    Console.Error.WriteLine(exception.Message);
    return 2;
}

if (args[0].Equals("validate-private-schema", StringComparison.OrdinalIgnoreCase))
{
    return await ValidatePrivateSchemaAsync(options);
}

var endpoint = GetOption(options, "endpoint")
    ?? Environment.GetEnvironmentVariable("DSQL_ENDPOINT");

if (string.IsNullOrWhiteSpace(endpoint))
{
    Console.Error.WriteLine("Informe --endpoint ou a variável DSQL_ENDPOINT.");
    return 2;
}

await using var dataSource = await DsqlDataSource.CreateAsync(new DsqlConfig
{
    Host = endpoint,
    User = GetOption(options, "user")
        ?? Environment.GetEnvironmentVariable("DSQL_USER")
        ?? "admin",
    OccMaxRetries = 3,
});

switch (args[0].ToLowerInvariant())
{
    case "apply-schema":
        return await ApplySchemaAsync(dataSource, options, endpoint);
    case "verify-schema":
        return await VerifySchemaAsync(dataSource);
    case "copy-catalog":
        return await CopyCatalogAsync(dataSource, options);
    case "grant-reader":
        return await GrantReaderAsync(dataSource, options);
    case "verify-reader":
        return await VerifyReaderAsync(dataSource);
    default:
        Console.Error.WriteLine($"Comando desconhecido: {args[0]}");
        PrintUsage();
        return 2;
}

static async Task<int> ApplySchemaAsync(
    DsqlDataSource dataSource,
    Dictionary<string, string> options,
    string endpoint)
{
    var schemaPath = GetOption(options, "schema")
        ?? Path.Combine("backend", "schema", "dsql", "001_catalog.sql");

    if (!File.Exists(schemaPath))
    {
        Console.Error.WriteLine($"Schema não encontrado: {Path.GetFullPath(schemaPath)}");
        return 2;
    }

    var statements = (await File.ReadAllTextAsync(schemaPath))
        .Split(';', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);

    foreach (var statement in statements)
    {
        await dataSource.ExecWithRetryAsync(statement);
    }

    Console.WriteLine($"Schema aplicado com sucesso em {endpoint} ({statements.Length} comandos).");
    return 0;
}

static async Task<int> ValidatePrivateSchemaAsync(Dictionary<string, string> options)
{
    var schemaPath = GetOption(options, "schema")
        ?? Path.Combine("backend", "schema", "dsql", "010_private_shadow.sql");
    var indexPath = GetOption(options, "indexes")
        ?? Path.Combine("backend", "schema", "dsql", "011_private_indexes.sql");

    foreach (var path in new[] { schemaPath, indexPath })
    {
        if (!File.Exists(path))
        {
            Console.Error.WriteLine($"Arquivo não encontrado: {Path.GetFullPath(path)}");
            return 2;
        }
    }

    var schema = await File.ReadAllTextAsync(schemaPath);
    var indexes = await File.ReadAllTextAsync(indexPath);
    var statements = Regex.Replace(schema, @"^\s*--.*$", string.Empty, RegexOptions.Multiline);
    var expectedTables = new HashSet<string>(StringComparer.Ordinal)
    {
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
    };
    var actualTables = Regex.Matches(
            statements,
            @"CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+spotlight_private\.([a-z0-9_]+)",
            RegexOptions.IgnoreCase)
        .Select(match => match.Groups[1].Value)
        .ToHashSet(StringComparer.Ordinal);

    var missingTables = expectedTables.Except(actualTables).Order().ToArray();
    var unexpectedTables = actualTables.Except(expectedTables).Order().ToArray();
    if (missingTables.Length > 0 || unexpectedTables.Length > 0)
    {
        Console.Error.WriteLine(
            $"Tabelas divergentes. Ausentes: {string.Join(", ", missingTables)}; "
            + $"inesperadas: {string.Join(", ", unexpectedTables)}.");
        return 1;
    }

    string[] forbiddenPatterns =
    [
        @"\bROW\s+LEVEL\s+SECURITY\b",
        @"\bCREATE\s+POLICY\b",
        @"\bCREATE\s+TRIGGER\b",
        @"\bLANGUAGE\s+PLPGSQL\b",
        @"\bSECURITY\s+DEFINER\b",
        @"\bAUTH\.UID\b",
        @"\bGRANT\b",
        @"\bREVOKE\b",
        @"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?public\.",
    ];

    foreach (var pattern in forbiddenPatterns)
    {
        if (Regex.IsMatch(statements, pattern, RegexOptions.IgnoreCase))
        {
            Console.Error.WriteLine($"Construção proibida encontrada no shadow schema: {pattern}");
            return 1;
        }
    }

    var indexStatements = Regex.Matches(
        Regex.Replace(indexes, @"^\s*--.*$", string.Empty, RegexOptions.Multiline),
        @"CREATE\s+(?:UNIQUE\s+)?INDEX[^;]+;",
        RegexOptions.IgnoreCase);
    if (indexStatements.Count == 0
        || indexStatements.Cast<Match>().Any(match => !Regex.IsMatch(
            match.Value,
            @"CREATE\s+(?:UNIQUE\s+)?INDEX\s+ASYNC",
            RegexOptions.IgnoreCase)))
    {
        Console.Error.WriteLine("Todo índice secundário deve usar CREATE INDEX ASYNC.");
        return 1;
    }

    if (!Regex.IsMatch(
        indexes,
        @"CREATE\s+UNIQUE\s+INDEX\s+ASYNC[^;]+friend_requests_active_pair_unique[^;]+WHERE\s+status\s+IN",
        RegexOptions.IgnoreCase))
    {
        Console.Error.WriteLine("O índice único de amizade ativa está ausente ou inválido.");
        return 1;
    }

    Console.WriteLine(
        $"Shadow schema validado localmente: {actualTables.Count} tabelas e "
        + $"{indexStatements.Count} índices. Nenhuma conexão foi aberta.");
    return 0;
}

static async Task<int> VerifySchemaAsync(DsqlDataSource dataSource)
{
    var expectedTables = CatalogDefinition.Tables.Select(table => table.Name).ToHashSet();
    var actualTables = new HashSet<string>(StringComparer.Ordinal);

    await using var connection = await dataSource.OpenConnectionAsync();
    await using var command = connection.CreateCommand();
    command.CommandText = """
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
        """;
    await using var reader = await command.ExecuteReaderAsync();

    while (await reader.ReadAsync())
    {
        actualTables.Add(reader.GetString(0));
    }
    await reader.DisposeAsync();

    var missingTables = expectedTables.Except(actualTables).Order().ToArray();
    if (missingTables.Length > 0)
    {
        Console.Error.WriteLine($"Tabelas ausentes: {string.Join(", ", missingTables)}");
        return 1;
    }

    Console.WriteLine($"Schema verificado: {string.Join(", ", expectedTables.Order())}.");

    foreach (var table in CatalogDefinition.Tables)
    {
        await using var countCommand = connection.CreateCommand();
        countCommand.CommandText = $"SELECT COUNT(*) FROM public.{table.Name}";
        var count = (long)(await countCommand.ExecuteScalarAsync() ?? 0L);
        Console.WriteLine($"{table.Name}: {count} registros.");
    }

    return 0;
}

static async Task<int> CopyCatalogAsync(
    DsqlDataSource dataSource,
    Dictionary<string, string> options)
{
    var sourceUrl = GetOption(options, "source-url")
        ?? Environment.GetEnvironmentVariable("SUPABASE_URL");
    var sourceKey = GetOption(options, "source-key")
        ?? Environment.GetEnvironmentVariable("SUPABASE_PUBLISHABLE_KEY");

    if (string.IsNullOrWhiteSpace(sourceUrl) || string.IsNullOrWhiteSpace(sourceKey))
    {
        Console.Error.WriteLine(
            "Informe --source-url e --source-key ou SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY.");
        return 2;
    }

    using var httpClient = new HttpClient
    {
        BaseAddress = new Uri(sourceUrl.TrimEnd('/') + "/rest/v1/"),
        Timeout = TimeSpan.FromSeconds(30),
    };
    httpClient.DefaultRequestHeaders.Add("apikey", sourceKey);
    httpClient.DefaultRequestHeaders.Authorization =
        new AuthenticationHeaderValue("Bearer", sourceKey);

    var selectedTables = (GetOption(options, "tables") ?? string.Empty)
        .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
        .ToHashSet(StringComparer.OrdinalIgnoreCase);
    var tables = selectedTables.Count == 0
        ? CatalogDefinition.Tables
        : CatalogDefinition.Tables
            .Where(table => selectedTables.Contains(table.Name))
            .ToArray();

    if (tables.Length != (selectedTables.Count == 0 ? CatalogDefinition.Tables.Length : selectedTables.Count))
    {
        Console.Error.WriteLine("--tables contém uma tabela que não faz parte do catálogo migrável.");
        return 2;
    }

    foreach (var table in tables)
    {
        var copiedRows = await CopyTableAsync(httpClient, dataSource, table);
        Console.WriteLine($"{table.Name}: {copiedRows} registros copiados.");
    }

    return 0;
}

static async Task<int> GrantReaderAsync(
    DsqlDataSource dataSource,
    Dictionary<string, string> options)
{
    var iamArn = GetOption(options, "iam-arn");
    var roleName = GetOption(options, "role") ?? "spotlight_api";

    if (string.IsNullOrWhiteSpace(iamArn)
        || !Regex.IsMatch(iamArn, "^arn:aws:iam::[0-9]{12}:(role|user)/[A-Za-z0-9+=,.@_/-]+$"))
    {
        Console.Error.WriteLine("--iam-arn deve ser o ARN de um usuário ou papel IAM.");
        return 2;
    }

    if (!Regex.IsMatch(roleName, "^[a-z_][a-z0-9_]{0,62}$"))
    {
        Console.Error.WriteLine("--role deve ser um identificador SQL minúsculo válido.");
        return 2;
    }

    if (!await ExistsAsync(
            dataSource,
            "SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = @value)",
            roleName))
    {
        await dataSource.ExecWithRetryAsync($"CREATE ROLE {roleName} WITH LOGIN");
    }

    if (!await MappingExistsAsync(dataSource, roleName, iamArn))
    {
        var escapedArn = iamArn.Replace("'", "''", StringComparison.Ordinal);
        await dataSource.ExecWithRetryAsync($"AWS IAM GRANT {roleName} TO '{escapedArn}'");
    }

    var catalogTables = string.Join(
        ", ",
        CatalogDefinition.Tables.Select(table => $"public.{table.Name}"));
    await dataSource.ExecWithRetryAsync(
        $"GRANT SELECT ON TABLE {catalogTables} TO {roleName}");

    Console.WriteLine($"Papel {roleName} associado a {iamArn} com acesso somente leitura.");
    return 0;
}

static async Task<int> VerifyReaderAsync(DsqlDataSource dataSource)
{
    await using var connection = await dataSource.OpenConnectionAsync();
    await using (var readCommand = connection.CreateCommand())
    {
        readCommand.CommandText = "SELECT title FROM public.games ORDER BY app_id LIMIT 1";
        _ = await readCommand.ExecuteScalarAsync();
    }

    try
    {
        await using var writeCommand = connection.CreateCommand();
        writeCommand.CommandText = "UPDATE public.games SET title = title WHERE false";
        await writeCommand.ExecuteNonQueryAsync();
        Console.Error.WriteLine("Falha: o papel de leitura aceitou um UPDATE.");
        return 1;
    }
    catch (PostgresException exception) when (exception.SqlState == PostgresErrorCodes.InsufficientPrivilege)
    {
        Console.WriteLine("Papel validado: SELECT permitido e UPDATE negado.");
        return 0;
    }
}

static async Task<bool> ExistsAsync(
    DsqlDataSource dataSource,
    string sql,
    string value)
{
    await using var connection = await dataSource.OpenConnectionAsync();
    await using var command = connection.CreateCommand();
    command.CommandText = sql;
    command.Parameters.AddWithValue("value", NpgsqlDbType.Text, value);
    return (bool)(await command.ExecuteScalarAsync() ?? false);
}

static async Task<bool> MappingExistsAsync(
    DsqlDataSource dataSource,
    string roleName,
    string iamArn)
{
    await using var connection = await dataSource.OpenConnectionAsync();
    await using var command = connection.CreateCommand();
    command.CommandText = """
        SELECT EXISTS (
            SELECT 1
            FROM sys.iam_pg_role_mappings
            WHERE pg_role_name = @role_name AND arn = @iam_arn
        )
        """;
    command.Parameters.AddWithValue("role_name", NpgsqlDbType.Text, roleName);
    command.Parameters.AddWithValue("iam_arn", NpgsqlDbType.Text, iamArn);
    return (bool)(await command.ExecuteScalarAsync() ?? false);
}

static async Task<int> CopyTableAsync(
    HttpClient httpClient,
    DsqlDataSource dataSource,
    TableDefinition table)
{
    const int pageSize = 100;
    var copiedRows = 0;

    while (true)
    {
        var requestPath = $"{table.Name}?select=*&order={table.OrderBy}"
            + $"&limit={pageSize}&offset={copiedRows}";
        using var response = await httpClient.GetAsync(requestPath);
        response.EnsureSuccessStatusCode();
        await using var responseStream = await response.Content.ReadAsStreamAsync();
        using var document = await JsonDocument.ParseAsync(responseStream);
        var rows = document.RootElement;

        await UpsertRowsAsync(dataSource, table, rows);
        copiedRows += rows.GetArrayLength();
        Console.WriteLine($"{table.Name}: {copiedRows} processados...");

        if (rows.GetArrayLength() < pageSize)
        {
            return copiedRows;
        }
    }
}

static async Task UpsertRowsAsync(
    DsqlDataSource dataSource,
    TableDefinition table,
    JsonElement rows)
{
    await dataSource.WithTransactionRetryAsync(async connection =>
    {
        foreach (var row in rows.EnumerateArray())
        {
            await using var command = connection.CreateCommand();
            command.CommandText = table.UpsertSql;

            foreach (var column in table.Columns)
            {
                AddParameter(command, column, row.GetProperty(column.Name));
            }

            await command.ExecuteNonQueryAsync();
        }
    });
}

static void AddParameter(NpgsqlCommand command, ColumnDefinition column, JsonElement value)
{
    var parameter = command.Parameters.Add(column.Name, column.Type);

    if (value.ValueKind == JsonValueKind.Null)
    {
        parameter.Value = DBNull.Value;
        return;
    }

    parameter.Value = column.Type switch
    {
        NpgsqlDbType.Integer => value.GetInt32(),
        NpgsqlDbType.Boolean => value.GetBoolean(),
        NpgsqlDbType.Uuid => value.GetGuid(),
        NpgsqlDbType.Date => DateOnly.Parse(value.GetString()!, CultureInfo.InvariantCulture),
        NpgsqlDbType.TimestampTz => DateTimeOffset.Parse(
            value.GetString()!,
            CultureInfo.InvariantCulture,
            DateTimeStyles.RoundtripKind),
        NpgsqlDbType.Jsonb => value.GetRawText(),
        _ => value.GetString()!,
    };
}

static Dictionary<string, string> ParseOptions(string[] values)
{
    var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

    for (var index = 0; index < values.Length; index += 2)
    {
        if (!values[index].StartsWith("--", StringComparison.Ordinal)
            || index + 1 >= values.Length)
        {
            throw new ArgumentException($"Opção inválida: {values[index]}");
        }

        result[values[index][2..]] = values[index + 1];
    }

    return result;
}

static string? GetOption(Dictionary<string, string> options, string name) =>
    options.GetValueOrDefault(name);

static void PrintUsage()
{
    Console.WriteLine("""
        dotnet run --project backend/SpotLight.Database.Tool -- <comando> --endpoint <endpoint> [opções]

        Comandos:
          apply-schema  [--schema <arquivo.sql>]
          validate-private-schema [--schema <arquivo.sql>] [--indexes <arquivo.sql>]
          verify-schema
          copy-catalog  --source-url <url> --source-key <chave-publicável> [--tables games,daily_featured]
          grant-reader  --iam-arn <arn-iam> [--role spotlight_api]
          verify-reader --user spotlight_api

        Também aceita DSQL_ENDPOINT, DSQL_USER, SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY.
        """);
}

internal static class CatalogDefinition
{
    public static readonly TableDefinition[] Tables =
    [
    new(
        "games",
        "app_id.asc",
        ["app_id"],
        [
            new("app_id", NpgsqlDbType.Integer),
            new("title", NpgsqlDbType.Text),
            new("image", NpgsqlDbType.Text),
            new("short_description", NpgsqlDbType.Text),
            new("genre", NpgsqlDbType.Text),
            new("tags", NpgsqlDbType.Jsonb),
            new("active_players", NpgsqlDbType.Integer),
            new("community_rating", NpgsqlDbType.Integer),
            new("price", NpgsqlDbType.Text),
            new("price_original", NpgsqlDbType.Text),
            new("discount_percent", NpgsqlDbType.Integer),
            new("release_date", NpgsqlDbType.Text),
            new("developer", NpgsqlDbType.Text),
            new("publisher", NpgsqlDbType.Text),
            new("platforms", NpgsqlDbType.Jsonb),
            new("background_image", NpgsqlDbType.Text),
            new("trailer_url", NpgsqlDbType.Text),
            new("trailer_thumbnail", NpgsqlDbType.Text),
            new("steam_url", NpgsqlDbType.Text),
            new("screenshot_urls", NpgsqlDbType.Jsonb),
            new("media_synced_at", NpgsqlDbType.TimestampTz),
            new("last_synced", NpgsqlDbType.TimestampTz),
        ]),
    new(
        "game_localizations",
        "app_id.asc,locale.asc",
        ["app_id", "locale"],
        [
            new("app_id", NpgsqlDbType.Integer),
            new("locale", NpgsqlDbType.Text),
            new("title", NpgsqlDbType.Text),
            new("short_description", NpgsqlDbType.Text),
            new("genre", NpgsqlDbType.Text),
            new("tags", NpgsqlDbType.Jsonb),
            new("updated_at", NpgsqlDbType.TimestampTz),
        ]),
    new(
        "daily_featured",
        "featured_date.asc",
        ["featured_date"],
        [
            new("id", NpgsqlDbType.Uuid),
            new("app_id", NpgsqlDbType.Integer),
            new("featured_date", NpgsqlDbType.Date),
            new("created_at", NpgsqlDbType.TimestampTz),
        ]),
    ];
}

internal sealed record ColumnDefinition(string Name, NpgsqlDbType Type);

internal sealed record TableDefinition(
    string Name,
    string OrderBy,
    string[] KeyColumns,
    ColumnDefinition[] Columns)
{
    public string UpsertSql { get; } = BuildUpsertSql(Name, KeyColumns, Columns);

    private static string BuildUpsertSql(
        string tableName,
        string[] keyColumns,
        ColumnDefinition[] columns)
    {
        var columnNames = string.Join(", ", columns.Select(column => column.Name));
        var parameters = string.Join(", ", columns.Select(column => $"@{column.Name}"));
        var conflictColumns = string.Join(", ", keyColumns);
        var updates = string.Join(
            ", ",
            columns
                .Where(column => !keyColumns.Contains(column.Name, StringComparer.Ordinal))
                .Select(column => $"{column.Name} = EXCLUDED.{column.Name}"));

        return $"INSERT INTO public.{tableName} ({columnNames}) VALUES ({parameters}) "
            + $"ON CONFLICT ({conflictColumns}) DO UPDATE SET {updates}";
    }
}
