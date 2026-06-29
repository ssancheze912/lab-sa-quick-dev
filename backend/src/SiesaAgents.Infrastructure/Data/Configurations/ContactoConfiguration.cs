using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SiesaAgents.Domain.Entities;

namespace SiesaAgents.Infrastructure.Data.Configurations;

public sealed class ContactoConfiguration : IEntityTypeConfiguration<ContactoEntity>
{
    public void Configure(EntityTypeBuilder<ContactoEntity> builder)
    {
        builder.ToTable("contactos");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Nombre)
            .IsRequired();

        builder.Property(c => c.Cargo)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(c => c.Telefono)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(c => c.Email)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(c => c.ClienteId)
            .IsRequired(false);

        builder.Property(c => c.CreatedAt)
            .IsRequired();

        builder.Property(c => c.UpdatedAt)
            .IsRequired();

        builder.HasIndex(c => c.Email)
            .HasDatabaseName("ix_contactos_email");

        builder.HasIndex(c => c.ClienteId)
            .HasDatabaseName("ix_contactos_cliente_id");

        builder.HasOne(c => c.Cliente)
            .WithMany()
            .HasForeignKey(c => c.ClienteId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
