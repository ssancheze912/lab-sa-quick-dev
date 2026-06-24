using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SiesaAgents.Domain.Entities;

namespace SiesaAgents.Infrastructure.Data.Configurations;

public class ContactoConfiguration : IEntityTypeConfiguration<ContactoEntity>
{
    public void Configure(EntityTypeBuilder<ContactoEntity> builder)
    {
        builder.ToTable("contactos");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Nombre).IsRequired().HasMaxLength(200);
        builder.Property(c => c.Cargo).IsRequired().HasMaxLength(100);
        builder.Property(c => c.Telefono).IsRequired().HasMaxLength(30);
        builder.Property(c => c.Email).IsRequired().HasMaxLength(200);
        builder.HasIndex(c => c.Email).HasDatabaseName("ix_contactos_email");
        builder.HasIndex(c => c.ClienteId).HasDatabaseName("ix_contactos_cliente_id");

        // FK: nullable, ON DELETE SET NULL
        builder.HasOne<ClienteEntity>()
               .WithMany()
               .HasForeignKey(c => c.ClienteId)
               .OnDelete(DeleteBehavior.SetNull)
               .HasConstraintName("fk_contactos_clientes");
    }
}
