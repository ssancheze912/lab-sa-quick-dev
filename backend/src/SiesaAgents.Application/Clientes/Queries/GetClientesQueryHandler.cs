using Microsoft.EntityFrameworkCore;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Interfaces;

namespace SiesaAgents.Application.Clientes.Queries;

public class GetClientesQueryHandler
{
    private readonly IClientesDbContext _context;

    public GetClientesQueryHandler(IClientesDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ClienteDto>> HandleAsync()
    {
        var clientes = await _context.Clientes
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return clientes.Select(c => new ClienteDto(
            c.Id,
            c.Nombre,
            c.NIT,
            c.Telefono,
            c.Ciudad,
            c.CreatedAt,
            c.UpdatedAt
        ));
    }
}
