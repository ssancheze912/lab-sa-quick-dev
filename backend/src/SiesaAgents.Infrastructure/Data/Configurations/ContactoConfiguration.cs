using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Contactos.Entities;

namespace SiesaAgents.Infrastructure.Data.Configurations;

public sealed class ContactoConfiguration : IEntityTypeConfiguration<ContactoEntity>
{
    public void Configure(EntityTypeBuilder<ContactoEntity> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Nombre)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(e => e.Cargo)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(e => e.Telefono)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(e => e.Email)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(e => e.ClienteId)
            .IsRequired(false);

        builder.Property(e => e.CreatedAt)
            .IsRequired();

        builder.Property(e => e.UpdatedAt)
            .IsRequired();

        builder.HasIndex(e => e.Email)
            .HasDatabaseName("ix_contactos_email");

        builder.HasIndex(e => e.ClienteId)
            .HasDatabaseName("ix_contactos_cliente_id");

        builder.HasOne<ClienteEntity>()
            .WithMany()
            .HasForeignKey(nameof(ContactoEntity.ClienteId))
            .HasConstraintName("fk_contactos_clientes")
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);
    }
}
