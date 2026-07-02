using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Infrastructure.Data.Configurations;

/// <summary>
/// EF Core mapping for <see cref="ClienteEntity"/>. Table + column names are
/// rewritten to snake_case by <see cref="ModelBuilderExtensions.ApplySnakeCaseNaming"/>
/// which runs as the final statement of <see cref="AppDbContext.OnModelCreating"/>.
/// </summary>
public class ClienteConfiguration : IEntityTypeConfiguration<ClienteEntity>
{
    public void Configure(EntityTypeBuilder<ClienteEntity> builder)
    {
        builder.ToTable("Clientes");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Nombre)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(c => c.Nit)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(c => c.Telefono)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(c => c.Ciudad)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(c => c.CreatedAt).IsRequired();
        builder.Property(c => c.UpdatedAt).IsRequired();

        // Unique constraint declared here (owner of the field) — Story 2.3 uses
        // it to reject duplicate NIT on create (R-002 mitigation).
        builder.HasIndex(c => c.Nit)
            .IsUnique()
            .HasDatabaseName("uk_clientes_nit");
    }
}
