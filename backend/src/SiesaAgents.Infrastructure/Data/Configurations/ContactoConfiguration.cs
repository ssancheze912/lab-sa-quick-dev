using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SiesaAgents.Domain.Contactos.Entities;

namespace SiesaAgents.Infrastructure.Data.Configurations;

public class ContactoConfiguration : IEntityTypeConfiguration<ContactoEntity>
{
    public void Configure(EntityTypeBuilder<ContactoEntity> builder)
    {
        builder.ToTable("contactos");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Nombre).IsRequired().HasMaxLength(200);
        builder.Property(c => c.Cargo).HasMaxLength(100);
        builder.Property(c => c.Telefono).HasMaxLength(50);
        builder.Property(c => c.Email).IsRequired().HasMaxLength(254);
        builder.Property(c => c.ClienteId).IsRequired(false);
        builder.Property(c => c.CreatedAt).IsRequired();
        builder.Property(c => c.UpdatedAt).IsRequired();

        builder.HasIndex(c => c.ClienteId).HasDatabaseName("ix_contactos_cliente_id");
        builder.HasIndex(c => c.Email).HasDatabaseName("ix_contactos_email");
    }
}
