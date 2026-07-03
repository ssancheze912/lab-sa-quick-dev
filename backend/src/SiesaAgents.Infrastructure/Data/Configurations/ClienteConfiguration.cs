using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Infrastructure.Data.Configurations;

/// <summary>
/// EF Core configuration for <see cref="ClienteEntity"/>. Uses PascalCase names
/// so the <c>ApplySnakeCaseNaming</c> convention (called LAST in
/// <see cref="AppDbContext.OnModelCreating"/>) rewrites everything to
/// snake_case: <c>Clientes → clientes</c>, <c>NitRuc → nit_ruc</c>,
/// <c>PK_Clientes → pk_clientes</c>, index <c>IX_Clientes_NitRuc → uk_clientes_nit_ruc</c>.
/// Manual <c>[Table]</c> / <c>[Column]</c> attributes are forbidden per
/// company-standards.
/// </summary>
public class ClienteConfiguration : IEntityTypeConfiguration<ClienteEntity>
{
    public void Configure(EntityTypeBuilder<ClienteEntity> builder)
    {
        builder.ToTable("Clientes");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Nombre).IsRequired();
        builder.Property(c => c.NitRuc).IsRequired();
        builder.Property(c => c.Telefono).IsRequired();
        builder.Property(c => c.Ciudad).IsRequired();
        builder.Property(c => c.CreatedAt).IsRequired();
        builder.Property(c => c.UpdatedAt).IsRequired();

        // Unique index — ApplySnakeCaseNaming rewrites the name to
        // uk_clientes_nit_ruc (uk_ prefix because IsUnique = true).
        builder.HasIndex(c => c.NitRuc).IsUnique();
    }
}
