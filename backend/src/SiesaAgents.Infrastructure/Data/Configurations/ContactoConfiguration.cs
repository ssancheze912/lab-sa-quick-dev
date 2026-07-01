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

        builder.Property(c => c.Nombre).IsRequired();
        builder.Property(c => c.Cargo).IsRequired();
        builder.Property(c => c.Telefono).IsRequired();
        builder.Property(c => c.Email).IsRequired();
        builder.Property(c => c.CreatedAt).IsRequired();
        builder.Property(c => c.UpdatedAt).IsRequired();

        builder.HasIndex(c => c.ClienteId).HasDatabaseName("ix_contactos_cliente_id");

        // Story 2.5, R2 (single most important test in the epic): explicitly
        // configured as SetNull — do NOT rely on EF Core's default convention
        // for nullable FKs, which is not guaranteed to be SetNull across EF
        // Core versions/configurations. Deleting a Cliente must orphan its
        // contacts (cliente_id = NULL), never cascade-delete them.
        builder.HasOne<ClienteEntity>()
            .WithMany()
            .HasForeignKey(c => c.ClienteId)
            .HasConstraintName("fk_contactos_clientes")
            .OnDelete(DeleteBehavior.SetNull);
    }
}
