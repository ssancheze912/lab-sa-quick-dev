using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Infrastructure.Data.Configurations;

/// <summary>
/// EF Core configuration for <see cref="ClienteEntity"/> — Story 2.1.
///
/// The snake_case naming convention (<c>UseSnakeCaseNamingConvention()</c>) is applied globally at
/// DI registration (see <c>Program.cs</c>), so column names are auto-derived. Only the explicit
/// table name is set here as a defensive guard against future entity renames.
///
/// The unique index <c>uk_clientes_nit</c> is added in this first migration so Story 2.3's
/// duplicate-NIT enforcement (409) does not require a follow-up migration.
/// </summary>
public class ClienteConfiguration : IEntityTypeConfiguration<ClienteEntity>
{
    public void Configure(EntityTypeBuilder<ClienteEntity> builder)
    {
        builder.ToTable("clientes");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Nombre).HasMaxLength(255).IsRequired();
        builder.Property(c => c.Nit).HasMaxLength(50).IsRequired();
        builder.Property(c => c.Telefono).HasMaxLength(50).IsRequired();
        builder.Property(c => c.Ciudad).HasMaxLength(100).IsRequired();
        builder.Property(c => c.CreatedAt).IsRequired();
        builder.Property(c => c.UpdatedAt).IsRequired();

        // Foundation for Story 2.3's duplicate-NIT 409 — created here so subsequent
        // stories don't need a second migration.
        builder.HasIndex(c => c.Nit)
               .IsUnique()
               .HasDatabaseName("uk_clientes_nit");
    }
}
