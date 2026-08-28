using GipeDev.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace GipeDev.Api.Data;

public sealed class GipeDevDbContext(DbContextOptions<GipeDevDbContext> options)
    : DbContext(options)
{
    public DbSet<ContactSubmission> ContactSubmissions => Set<ContactSubmission>();
    public DbSet<AsteroidsPilot> AsteroidsPilots => Set<AsteroidsPilot>();
    public DbSet<AsteroidsScore> AsteroidsScores => Set<AsteroidsScore>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var contact = modelBuilder.Entity<ContactSubmission>();

        contact.ToTable("contact_submissions");
        contact.HasKey(submission => submission.Id);
        contact.Property(submission => submission.Name).HasMaxLength(100).IsRequired();
        contact.Property(submission => submission.Email).HasMaxLength(254).IsRequired();
        contact.Property(submission => submission.Subject).HasMaxLength(150).IsRequired();
        contact.Property(submission => submission.Message).HasMaxLength(5000).IsRequired();
        contact.Property(submission => submission.CreatedAtUtc).IsRequired();
        contact.HasIndex(submission => submission.CreatedAtUtc);

        var pilot = modelBuilder.Entity<AsteroidsPilot>();

        pilot.ToTable("asteroids_pilots");
        pilot.HasKey(entry => entry.Id);
        pilot.Property(entry => entry.Name).HasMaxLength(10).IsRequired();
        pilot.Property(entry => entry.NormalizedName).HasMaxLength(10).IsRequired();
        pilot.Property(entry => entry.CreatedAtUtc).IsRequired();
        pilot.HasIndex(entry => entry.NormalizedName).IsUnique();

        var score = modelBuilder.Entity<AsteroidsScore>();

        score.ToTable("asteroids_scores");
        score.HasKey(entry => entry.Id);
        score.Property(entry => entry.Score).IsRequired();
        score.Property(entry => entry.CreatedAtUtc).IsRequired();
        score.HasIndex(entry => entry.Score);
        score.HasIndex(entry => entry.CreatedAtUtc);
        score.HasOne(entry => entry.Pilot)
            .WithMany(entry => entry.Scores)
            .HasForeignKey(entry => entry.PilotId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
