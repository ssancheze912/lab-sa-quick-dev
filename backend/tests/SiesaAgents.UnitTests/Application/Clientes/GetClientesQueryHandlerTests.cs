/**
 * Story 2.1: Client List & Search
 * Unit tests for GetClientesQueryHandler
 *
 * Acceptance Criteria covered: AC1 — backend handler maps ClienteEntity → ClienteDto correctly
 *
 * NOTE: Tests are in RED state — they will fail until the following are implemented:
 *   - ClienteEntity (Domain/Clientes/Entities/ClienteEntity.cs)
 *   - IClienteRepository (Domain/Clientes/Interfaces/IClienteRepository.cs)
 *   - ClienteDto (Application/Clientes/DTOs/ClienteDto.cs)
 *   - GetClientesQuery (Application/Clientes/Queries/GetClientesQuery.cs)
 *   - GetClientesQueryHandler (Application/Clientes/Queries/GetClientesQueryHandler.cs)
 */

using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Domain.Clientes.Interfaces;

namespace SiesaAgents.UnitTests.Application.Clientes;

public class GetClientesQueryHandlerTests
{
    // ─── Given/When/Then: Empty repository ──────────────────────────────────

    /// <summary>
    /// Given: The repository returns no entities
    /// When: GetClientesQueryHandler.Handle() is called
    /// Then: Returns an empty IEnumerable&lt;ClienteDto&gt;
    /// AC1 coverage — boundary case
    /// </summary>
    [Fact]
    public async Task ReturnsEmpty_WhenRepositoryReturnsNoEntities()
    {
        // Arrange
        var repositoryMock = new FakeClienteRepository(new List<ClienteEntity>());
        var handler = new GetClientesQueryHandler(repositoryMock);
        var query = new GetClientesQuery();

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    // ─── Given/When/Then: Mapping correctness ───────────────────────────────

    /// <summary>
    /// Given: The repository returns one ClienteEntity with known field values
    /// When: GetClientesQueryHandler.Handle() is called
    /// Then: The returned ClienteDto has all fields correctly mapped
    ///       (Id, Nombre, Nit, Telefono, Ciudad, CreatedAt, UpdatedAt)
    /// AC1 coverage — mapping correctness
    /// </summary>
    [Fact]
    public async Task MapsClienteEntityToDto_Correctly()
    {
        // Arrange
        var entity = ClienteEntity.Create(
            nombre: "Constructora Andina S.A.S",
            nit: "900123456-1",
            telefono: "3001234567",
            ciudad: "Bogotá"
        );

        var repositoryMock = new FakeClienteRepository(new List<ClienteEntity> { entity });
        var handler = new GetClientesQueryHandler(repositoryMock);
        var query = new GetClientesQuery();

        // Act
        var result = await handler.Handle(query, CancellationToken.None);
        var dtos = result.ToList();

        // Assert — one DTO returned
        Assert.Single(dtos);
        var dto = dtos[0];

        // Field mapping assertions
        Assert.Equal(entity.Id, dto.Id);
        Assert.Equal("Constructora Andina S.A.S", dto.Nombre);
        Assert.Equal("900123456-1", dto.Nit);
        Assert.Equal("3001234567", dto.Telefono);
        Assert.Equal("Bogotá", dto.Ciudad);
        Assert.Equal(entity.CreatedAt, dto.CreatedAt);
        Assert.Equal(entity.UpdatedAt, dto.UpdatedAt);
    }

    /// <summary>
    /// Given: The repository returns multiple ClienteEntity records
    /// When: GetClientesQueryHandler.Handle() is called
    /// Then: Returns the same number of DTOs
    /// </summary>
    [Fact]
    public async Task ReturnsCorrectCount_WhenRepositoryHasMultipleEntities()
    {
        // Arrange
        var entities = new List<ClienteEntity>
        {
            ClienteEntity.Create("Empresa A", "111111111-1", "3001111111", "Bogotá"),
            ClienteEntity.Create("Empresa B", "222222222-2", "3002222222", "Medellín"),
            ClienteEntity.Create("Empresa C", "333333333-3", "3003333333", "Cali"),
        };

        var repositoryMock = new FakeClienteRepository(entities);
        var handler = new GetClientesQueryHandler(repositoryMock);
        var query = new GetClientesQuery();

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.Equal(3, result.Count());
    }

    /// <summary>
    /// Given: The repository returns a ClienteEntity
    /// When: The handler maps it to a ClienteDto
    /// Then: ClienteDto.Id is a non-empty Guid matching the entity's Id
    /// </summary>
    [Fact]
    public async Task MappedDto_IdMatchesEntityId_AndIsNonEmpty()
    {
        // Arrange
        var entity = ClienteEntity.Create("Test Cliente", "999888777-0", "3009998887", "Barranquilla");
        var repositoryMock = new FakeClienteRepository(new List<ClienteEntity> { entity });
        var handler = new GetClientesQueryHandler(repositoryMock);

        // Act
        var result = await handler.Handle(new GetClientesQuery(), CancellationToken.None);
        var dto = result.First();

        // Assert
        Assert.NotEqual(Guid.Empty, dto.Id);
        Assert.Equal(entity.Id, dto.Id);
    }

    // ─── Internal test double ────────────────────────────────────────────────

    private sealed class FakeClienteRepository : IClienteRepository
    {
        private readonly IEnumerable<ClienteEntity> _data;

        public FakeClienteRepository(IEnumerable<ClienteEntity> data)
        {
            _data = data;
        }

        public Task<IEnumerable<ClienteEntity>> GetAllAsync(CancellationToken ct = default)
        {
            return Task.FromResult(_data);
        }
    }
}
