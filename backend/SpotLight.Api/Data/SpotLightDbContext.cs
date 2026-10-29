using Microsoft.EntityFrameworkCore;
using SpotLight.Api.Entities;

namespace SpotLight.Api.Data;

public sealed class SpotLightDbContext(DbContextOptions<SpotLightDbContext> options)
    : DbContext(options)
{
    public DbSet<Game> Games => Set<Game>();

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
        game.Property(entity => entity.ScreenshotUrls).HasColumnName("screenshot_urls");
        game.Property(entity => entity.MediaSyncedAt).HasColumnName("media_synced_at");
        game.Property(entity => entity.LastSynced).HasColumnName("last_synced");
    }
}
