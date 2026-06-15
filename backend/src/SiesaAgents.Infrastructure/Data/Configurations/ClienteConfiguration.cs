using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Infrastructure.Data.Configurations;

/// <summary>
/// EF Core mapping for <see cref="ClienteEntity"/>. The configuration is
/// auto-discovered by <c>ApplyConfigurationsFromAssembly</c> in
/// <see cref="AppDbContext.OnModelCreating"/>.
/// </summary>
public class ClienteConfiguration : IEntityTypeConfiguration<ClienteEntity>
{
    public void Configure(EntityTypeBuilder<ClienteEntity> builder)
    {
        // Explicit table name — `ApplySnakeCaseNaming` would otherwise produce
        // `cliente_entity`, so we override to the canonical plural form.
        builder.ToTable("clientes");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Id).IsRequired();
        builder.Property(c => c.Nombre).IsRequired().HasMaxLength(200);
        builder.Property(c => c.Nit).IsRequired().HasMaxLength(50);
        builder.Property(c => c.Telefono).HasMaxLength(50);
        builder.Property(c => c.Ciudad).HasMaxLength(100);
        builder.Property(c => c.CreatedAt).IsRequired();
        builder.Property(c => c.UpdatedAt).IsRequired();

        // Explicit `uk_clientes_nit` to guarantee the canonical company-standards
        // index name regardless of the snake_case convention's prefix handling.
        builder.HasIndex(c => c.Nit).IsUnique().HasDatabaseName("uk_clientes_nit");
    }
}
