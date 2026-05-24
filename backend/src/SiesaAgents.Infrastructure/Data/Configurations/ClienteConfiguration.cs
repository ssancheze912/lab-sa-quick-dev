using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Infrastructure.Data.Configurations;

public sealed class ClienteConfiguration : IEntityTypeConfiguration<ClienteEntity>
{
    public void Configure(EntityTypeBuilder<ClienteEntity> builder)
    {
        builder.ToTable("clientes");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Nombre)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(c => c.NitRuc)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(c => c.Telefono)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(c => c.Ciudad)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(c => c.CreatedAt)
            .IsRequired();

        builder.Property(c => c.UpdatedAt)
            .IsRequired();

        builder.HasIndex(c => c.NitRuc)
            .IsUnique()
            .HasDatabaseName("uk_clientes_nit_ruc");
    }
}
