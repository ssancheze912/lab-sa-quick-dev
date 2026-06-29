using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Infrastructure.Data.Configurations;

/// <summary>
/// EF Core configuration for <see cref="ClienteEntity"/>.
/// snake_case naming is applied by <c>ApplySnakeCaseNaming()</c> in
/// <see cref="AppDbContext.OnModelCreating"/> — only logical names go here.
/// </summary>
public sealed class ClienteConfiguration : IEntityTypeConfiguration<ClienteEntity>
{
    public void Configure(EntityTypeBuilder<ClienteEntity> builder)
    {
        builder.ToTable("clientes");

        builder.HasKey(c => c.Id)
            .HasName("pk_clientes");

        builder.Property(c => c.Id)
            .ValueGeneratedNever();

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

        builder.Property(c => c.CreatedAt)
            .HasDefaultValueSql("NOW()");

        builder.Property(c => c.UpdatedAt)
            .HasDefaultValueSql("NOW()");

        builder.HasIndex(c => c.Nit)
            .IsUnique()
            .HasDatabaseName("uk_clientes_nit");

        builder.HasIndex(c => c.Nombre)
            .HasDatabaseName("ix_clientes_nombre_trgm")
            .HasMethod("gin")
            .HasOperators("gin_trgm_ops");
    }
}
