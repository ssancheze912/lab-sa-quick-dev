using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SiesaAgents.Domain.Entities;

namespace SiesaAgents.Infrastructure.Data.Configurations;

/// <summary>
/// EF Core mapping for <see cref="ClienteEntity"/>.
/// The explicit <c>ToTable("clientes")</c> opts into the plural snake_case table
/// name because <see cref="SnakeCaseNamingConvention.ApplySnakeCaseNaming"/> does
/// not pluralize entity type names. Property column names are rewritten to
/// snake_case by that same extension, applied AFTER this configuration runs.
/// </summary>
internal sealed class ClienteConfiguration : IEntityTypeConfiguration<ClienteEntity>
{
    public void Configure(EntityTypeBuilder<ClienteEntity> builder)
    {
        builder.ToTable("clientes");

        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).ValueGeneratedNever();

        builder.Property(c => c.Nombre).IsRequired().HasMaxLength(200);
        builder.Property(c => c.Nit).IsRequired().HasMaxLength(50);
        builder.Property(c => c.Telefono).IsRequired().HasMaxLength(50);
        builder.Property(c => c.Ciudad).IsRequired().HasMaxLength(100);

        builder.Property(c => c.CreatedAt).IsRequired();
        builder.Property(c => c.UpdatedAt).IsRequired();

        // SnakeCaseNamingConvention renames this index to `uk_clientes_nit`.
        builder.HasIndex(c => c.Nit).IsUnique();
    }
}
