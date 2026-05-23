using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using SiesaAgents.Infrastructure.Data;

#nullable disable

namespace SiesaAgents.Infrastructure.Data.Migrations;

[DbContext(typeof(AppDbContext))]
partial class AppDbContextModelSnapshot : ModelSnapshot
{
    protected override void BuildModel(ModelBuilder modelBuilder)
    {
#pragma warning disable 612, 618
        modelBuilder
            .HasAnnotation("ProductVersion", "10.0.0")
            .HasAnnotation("Relational:MaxIdentifierLength", 63);

        modelBuilder.Entity("SiesaAgents.Domain.Clientes.Entities.ClienteEntity", b =>
        {
            b.Property<Guid>("Id")
                .ValueGeneratedOnAdd()
                .HasColumnType("uuid")
                .HasColumnName("id");

            b.Property<string>("Ciudad")
                .IsRequired()
                .HasMaxLength(100)
                .HasColumnType("character varying(100)")
                .HasColumnName("ciudad");

            b.Property<DateTimeOffset>("CreatedAt")
                .HasColumnType("timestamp with time zone")
                .HasColumnName("created_at");

            b.Property<string>("Nit")
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnType("character varying(50)")
                .HasColumnName("nit");

            b.Property<string>("Nombre")
                .IsRequired()
                .HasMaxLength(200)
                .HasColumnType("character varying(200)")
                .HasColumnName("nombre");

            b.Property<string>("Telefono")
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnType("character varying(50)")
                .HasColumnName("telefono");

            b.Property<DateTimeOffset>("UpdatedAt")
                .HasColumnType("timestamp with time zone")
                .HasColumnName("updated_at");

            b.HasKey("Id")
                .HasName("pk_clientes");

            b.HasIndex("Nit")
                .IsUnique()
                .HasDatabaseName("uk_clientes_nit");

            b.ToTable("clientes");
        });
#pragma warning restore 612, 618
    }
}
