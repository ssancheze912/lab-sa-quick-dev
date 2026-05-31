using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Infrastructure.Data.Configurations;

public class ClienteConfiguration : IEntityTypeConfiguration<ClienteEntity>
{
    public void Configure(EntityTypeBuilder<ClienteEntity> builder)
    {
        builder.ToTable("clientes");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Nombre).IsRequired();
        builder.Property(c => c.Nit).IsRequired();
        builder.Property(c => c.Telefono).IsRequired();
        builder.Property(c => c.Ciudad).IsRequired();

        // Required for 409 NIT uniqueness (Stories 2.3, 2.4)
        builder.HasIndex(c => c.Nit)
               .IsUnique()
               .HasDatabaseName("uk_clientes_nit");
    }
}
