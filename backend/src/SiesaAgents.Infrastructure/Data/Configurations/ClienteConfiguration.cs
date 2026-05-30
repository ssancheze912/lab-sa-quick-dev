using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Infrastructure.Data.Configurations;

public class ClienteConfiguration : IEntityTypeConfiguration<ClienteEntity>
{
    public void Configure(EntityTypeBuilder<ClienteEntity> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Nombre).HasMaxLength(200).IsRequired();
        builder.Property(x => x.NIT).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Telefono).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Ciudad).HasMaxLength(100).IsRequired();
        builder.HasIndex(x => x.NIT).IsUnique().HasDatabaseName("uk_clientes_nit");
    }
}
