using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SiesaAgents.Domain.Contactos.Entities;

namespace SiesaAgents.Infrastructure.Data.Configurations;

public class ContactoConfiguration : IEntityTypeConfiguration<ContactoEntity>
{
    public void Configure(EntityTypeBuilder<ContactoEntity> builder)
    {
        builder.HasKey(c => c.Id).HasName("pk_contactos");

        builder.Property(c => c.Nombre).IsRequired().HasMaxLength(200);
        builder.Property(c => c.Cargo).IsRequired().HasMaxLength(100);
        builder.Property(c => c.Telefono).IsRequired().HasMaxLength(50);
        builder.Property(c => c.Email).IsRequired().HasMaxLength(200);
        builder.Property(c => c.ClienteId).IsRequired(false);

        // FK → clientes.id with SET NULL on delete (orphan contacts persist)
        builder.HasOne<SiesaAgents.Domain.Clientes.Entities.ClienteEntity>()
            .WithMany()
            .HasForeignKey(c => c.ClienteId)
            .OnDelete(DeleteBehavior.SetNull)
            .HasConstraintName("fk_contactos_clientes");

        // Index for client filtering (Epic 4)
        builder.HasIndex(c => c.ClienteId).HasDatabaseName("ix_contactos_cliente_id");

        // Index for email lookups
        builder.HasIndex(c => c.Email).HasDatabaseName("ix_contactos_email");
    }
}
