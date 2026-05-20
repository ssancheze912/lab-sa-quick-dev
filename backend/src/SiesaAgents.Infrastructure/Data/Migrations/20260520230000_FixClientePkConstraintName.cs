using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SiesaAgents.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class FixClientePkConstraintName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Rename PK constraint to comply with company naming convention (pk_{table})
            migrationBuilder.Sql(
                "ALTER TABLE clientes RENAME CONSTRAINT p_k_clientes TO pk_clientes;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "ALTER TABLE clientes RENAME CONSTRAINT pk_clientes TO p_k_clientes;");
        }
    }
}
