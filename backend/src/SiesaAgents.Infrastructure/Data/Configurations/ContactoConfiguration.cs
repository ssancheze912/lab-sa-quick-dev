using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Contactos.Entities;

namespace SiesaAgents.Infrastructure.Data.Configurations;

public class ContactoConfiguration : IEntityTypeConfiguration<ContactoEntity>
{
    public void Configure(EntityTypeBuilder<ContactoEntity> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Nombre).IsRequired().HasMaxLength(255);
        builder.Property(c => c.Cargo).IsRequired().HasMaxLength(255);
        builder.Property(c => c.Telefono).IsRequired().HasMaxLength(50);
        builder.Property(c => c.Email).IsRequired().HasMaxLength(255);
        builder.Property(c => c.ClienteId).IsRequired(false); // nullable FK
        // FK: ON DELETE SET NULL (contact becomes orphan when client deleted)
        builder.HasOne<ClienteEntity>()
               .WithMany()
               .HasForeignKey(c => c.ClienteId)
               .IsRequired(false)
               .OnDelete(DeleteBehavior.SetNull);
        builder.HasIndex(c => c.ClienteId).HasDatabaseName("ix_contactos_cliente_id");
        builder.HasIndex(c => c.Email).HasDatabaseName("ix_contactos_email");
        // ApplySnakeCaseNaming() is configured on DbContextOptionsBuilder in DI (Program.cs)
    }
}
