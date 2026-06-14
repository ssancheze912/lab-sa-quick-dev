using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Infrastructure.Data.Configurations;

public class ClienteConfiguration : IEntityTypeConfiguration<ClienteEntity>
{
    public void Configure(EntityTypeBuilder<ClienteEntity> builder)
    {
        builder.ToTable("clientes");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Nombre).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Nit).IsRequired().HasMaxLength(50);
        builder.Property(x => x.Telefono).IsRequired().HasMaxLength(50);
        builder.Property(x => x.Ciudad).IsRequired().HasMaxLength(100);
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();

        builder.HasIndex(x => x.Nit).IsUnique().HasDatabaseName("uk_clientes_nit");
        builder.HasIndex(x => x.Nombre).HasDatabaseName("ix_clientes_nombre");
    }
}
