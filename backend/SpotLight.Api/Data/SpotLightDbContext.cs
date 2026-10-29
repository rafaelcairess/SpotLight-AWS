using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Microsoft.Extensions.Options;
using System.Text.Json;
using SpotLight.Api.Configuration;
using SpotLight.Api.Entities;

namespace SpotLight.Api.Data;

public sealed class SpotLightDbContext : DbContext
{
    private static readonly ValueConverter<string[]?, string?> NullableStringArrayJsonConverter =
        new(
            values => values == null ? null : JsonSerializer.Serialize(values, JsonSerializerOptions.Default),
            json => json == null ? null : JsonSerializer.Deserialize<string[]>(json, JsonSerializerOptions.Default));

    private static readonly ValueConverter<string[], string> StringArrayJsonConverter =
        new(
            values => JsonSerializer.Serialize(values, JsonSerializerOptions.Default),
            json => JsonSerializer.Deserialize<string[]>(json, JsonSerializerOptions.Default) ?? Array.Empty<string>());

    private static readonly ValueComparer<string[]?> NullableStringArrayComparer =
        new(
            (left, right) => ReferenceEquals(left, right)
                || (left != null && right != null && left.SequenceEqual(right)),
            values => values == null
                ? 0
                : values.Aggregate(0, (hash, value) => HashCode.Combine(hash, value)),
            values => values == null ? null : values.ToArray());

    private static readonly ValueComparer<string[]> StringArrayComparer =
        new(
            (left, right) => ReferenceEquals(left, right) || left.SequenceEqual(right),
            values => values.Aggregate(0, (hash, value) => HashCode.Combine(hash, value)),
            values => values.ToArray());

    private readonly DatabaseProvider databaseProvider;

    public SpotLightDbContext(
        DbContextOptions<SpotLightDbContext> options,
        IOptions<DatabaseSettings>? settings = null)
        : base(options)
    {
        databaseProvider = settings?.Value.Provider ?? DatabaseProvider.PostgreSql;
    }

    public DbSet<Game> Games => Set<Game>();

    internal DatabaseProvider DatabaseProvider => databaseProvider;

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.ReplaceService<IModelCacheKeyFactory, SpotLightModelCacheKeyFactory>();
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var game = modelBuilder.Entity<Game>();

        game.ToTable("games", "public");
        game.HasKey(entity => entity.AppId);
        game.Property(entity => entity.AppId).HasColumnName("app_id").ValueGeneratedNever();
        game.Property(entity => entity.Title).HasColumnName("title");
        game.Property(entity => entity.Image).HasColumnName("image");
        game.Property(entity => entity.ShortDescription).HasColumnName("short_description");
        game.Property(entity => entity.Genre).HasColumnName("genre");
        game.Property(entity => entity.Tags).HasColumnName("tags");
        game.Property(entity => entity.ActivePlayers).HasColumnName("active_players");
        game.Property(entity => entity.CommunityRating).HasColumnName("community_rating");
        game.Property(entity => entity.Price).HasColumnName("price");
        game.Property(entity => entity.PriceOriginal).HasColumnName("price_original");
        game.Property(entity => entity.DiscountPercent).HasColumnName("discount_percent");
        game.Property(entity => entity.ReleaseDate).HasColumnName("release_date");
        game.Property(entity => entity.Developer).HasColumnName("developer");
        game.Property(entity => entity.Publisher).HasColumnName("publisher");
        game.Property(entity => entity.Platforms).HasColumnName("platforms");
        game.Property(entity => entity.BackgroundImage).HasColumnName("background_image");
        game.Property(entity => entity.TrailerUrl).HasColumnName("trailer_url");
        game.Property(entity => entity.TrailerThumbnail).HasColumnName("trailer_thumbnail");
        game.Property(entity => entity.SteamUrl).HasColumnName("steam_url");
        game.Property(entity => entity.ScreenshotUrls).HasColumnName("screenshot_urls");
        game.Property(entity => entity.MediaSyncedAt).HasColumnName("media_synced_at");
        game.Property(entity => entity.LastSynced).HasColumnName("last_synced");

        if (databaseProvider == DatabaseProvider.AuroraDsql)
        {
            ConfigureJsonArray(game.Property(entity => entity.Tags));
            ConfigureJsonArray(game.Property(entity => entity.Platforms));
            game.Property(entity => entity.ScreenshotUrls)
                .HasConversion(StringArrayJsonConverter)
                .Metadata.SetValueComparer(StringArrayComparer);
            game.Property(entity => entity.ScreenshotUrls).HasColumnType("jsonb");
        }
    }

    private static void ConfigureJsonArray(
        Microsoft.EntityFrameworkCore.Metadata.Builders.PropertyBuilder<string[]?> property)
    {
        property
            .HasConversion(NullableStringArrayJsonConverter)
            .HasColumnType("jsonb");
        property.Metadata.SetValueComparer(NullableStringArrayComparer);
    }
}
