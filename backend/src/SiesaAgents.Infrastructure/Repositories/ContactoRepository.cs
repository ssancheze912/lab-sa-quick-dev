using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Contactos.Entities;
using SiesaAgents.Domain.Contactos.Interfaces;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.Infrastructure.Repositories;

public class ContactoRepository(AppDbContext context) : IContactoRepository
{
    public async Task<IReadOnlyList<ContactoEntity>> GetAllAsync(CancellationToken cancellationToken = default)
        => await context.Contactos.AsNoTracking().ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<ContactoEntity>> GetByClienteIdAsync(Guid clienteId, CancellationToken cancellationToken = default)
        => await context.Contactos.AsNoTracking().Where(c => c.ClienteId == clienteId).ToListAsync(cancellationToken);

    public async Task<ContactoEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => await context.Contactos.FindAsync([id], cancellationToken);

    public async Task AddAsync(ContactoEntity contacto, CancellationToken cancellationToken = default)
        => await context.Contactos.AddAsync(contacto, cancellationToken);

    public void Update(ContactoEntity contacto)
        => context.Contactos.Update(contacto);

    public void Remove(ContactoEntity contacto)
        => context.Contactos.Remove(contacto);

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
        => await context.SaveChangesAsync(cancellationToken);
}
