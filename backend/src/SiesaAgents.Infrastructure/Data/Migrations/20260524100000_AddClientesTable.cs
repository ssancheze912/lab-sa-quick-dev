using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SiesaAgents.Infrastructure.Data.Migrations;

/// <inheritdoc />
public partial class AddClientesTable : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "clientes",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                nombre = table.Column<string>(type: "text", nullable: false),
                nit = table.Column<string>(type: "text", nullable: false),
                telefono = table.Column<string>(type: "text", nullable: false),
                ciudad = table.Column<string>(type: "text", nullable: false),
                created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_clientes", x => x.id);
            });

        migrationBuilder.CreateIndex(
            name: "uk_clientes_nit",
            table: "clientes",
            column: "nit",
            unique: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "clientes");
    }
}
