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
        game.Property(entity => entity.Genre).HasColumnName("genre");
        game.Property(entity => entity.ActivePlayers).HasColumnName("active_players");
        game.Property(entity => entity.CommunityRating).HasColumnName("community_rating");
    }
}
