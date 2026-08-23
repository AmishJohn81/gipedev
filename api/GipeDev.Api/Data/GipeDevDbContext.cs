using GipeDev.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace GipeDev.Api.Data;

public sealed class GipeDevDbContext(DbContextOptions<GipeDevDbContext> options)
    : DbContext(options)
{
    public DbSet<ContactSubmission> ContactSubmissions => Set<ContactSubmission>();

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
    }
}
