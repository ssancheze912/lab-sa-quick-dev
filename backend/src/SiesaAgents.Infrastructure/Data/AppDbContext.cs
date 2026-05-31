using Microsoft.EntityFrameworkCore;
using System.Reflection;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // DbSet<ClienteEntity> Clientes will be added in Story 2.1
    // DbSet<ContactoEntity> Contactos will be added in Story 3.1

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Auto-register all IEntityTypeConfiguration<T> in this assembly
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        // Snake_case naming is applied via UseSnakeCaseNamingConvention() on DbContextOptionsBuilder
        // in Program.cs / DI registration. This is the correct EFCore.NamingConventions API.
        // No [Column] or [Table] attributes needed on any entity.
    }
}
