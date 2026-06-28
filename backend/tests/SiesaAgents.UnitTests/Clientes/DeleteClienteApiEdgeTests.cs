using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace SiesaAgents.UnitTests.Clientes;

/// <summary>
/// Automation expansion — Story 2.5: DELETE /api/v1/clientes/:id edge cases.
/// Expands ATDD coverage (DeleteClienteApiTests.cs) with:
///
///   [P1] DELETE with malformed (non-UUID) ID in route → 400 or 404 (route constraint rejects it)
///   [P1] Idempotent: DELETE same ID twice → second returns 404 Problem Details (resource already gone)
///   [P1] DELETE returns 204 (no body) — response body MUST be empty
///   [P1] DELETE 204 response has no Content-Type header (or empty body enforced)
///   [P2] Problem Details 404 detail message is in Spanish (i18n enforcement)
///   [P2] Problem Details 404 does NOT expose stack traces or internal types (NFR6)
///   [P2] Problem Details 404 has Status field equal to 404 (not 0 or null)
///   [P2] Problem Details 404 has Title = "Cliente no encontrado" (exact text)
///   [P2] DELETE response for valid ID includes correct HTTP verb in audit (no side effects on GET)
///   [P3] DELETE with nil UUID (all zeros) → 404 Problem Details (not a crash)
///   [P3] DELETE with max UUID (all f's) → 404 Problem Details
/// </summary>
public class DeleteClienteApiEdgeTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    private static readonly Guid NilUuid = Guid.Empty;
    private static readonly Guid MaxUuid = new Guid("ffffffff-ffff-ffff-ffff-ffffffffffff");

    public DeleteClienteApiEdgeTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helper: create a client and return its ID
    // ─────────────────────────────────────────────────────────────────────────

    private async Task<DeleteTestClienteDto> CreateClienteAsync(string suffix)
    {
        var payload = new
        {
            nombre = $"Empresa Edge Delete {suffix}",
            nit = $"940{Math.Abs(suffix.GetHashCode()) % 1_000_000:D6}-9",
            telefono = "3009999888",
            ciudad = "Bogotá"
        };
        var response = await _client.PostAsJsonAsync("/api/v1/clientes", payload);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<DeleteTestClienteDto>();
        Assert.NotNull(dto);
        return dto!;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [P1] Malformed (non-UUID) ID → route constraint rejects it (400 or 404)
    // The route is /{id:guid} — non-GUID values should be rejected before handler
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P1] DELETE /api/v1/clientes/not-a-uuid → rejected by route constraint.
    /// ASP.NET Core {id:guid} rejects non-UUID values with 400 or 404 (depends on routing).
    /// The key invariant: it must NOT return 500 (no unhandled exception).
    /// </summary>
    [Fact]
    public async Task DeleteCliente_WithNonUuidId_RejectsWithoutServerError()
    {
        // GIVEN: A malformed ID that is not a valid UUID
        // WHEN: DELETE /api/v1/clientes/not-a-uuid
        var response = await _client.DeleteAsync("/api/v1/clientes/not-a-uuid");

        // THEN: Response is not 500 (route constraint must have caught it)
        Assert.NotEqual(HttpStatusCode.InternalServerError, response.StatusCode);

        // AND: Response is either 400 Bad Request or 404 Not Found
        // (ASP.NET Core returns 404 for unmatched routes with {id:guid} constraint)
        Assert.True(
            response.StatusCode == HttpStatusCode.BadRequest ||
            response.StatusCode == HttpStatusCode.NotFound,
            $"Expected 400 or 404 for non-UUID ID, got: {response.StatusCode}");
    }

    /// <summary>
    /// [P1] DELETE /api/v1/clientes/12345 (integer, not UUID) → rejected by route constraint.
    /// </summary>
    [Fact]
    public async Task DeleteCliente_WithIntegerId_RejectsWithoutServerError()
    {
        // WHEN: DELETE with an integer as ID
        var response = await _client.DeleteAsync("/api/v1/clientes/12345");

        // THEN: Not a 500; route constraint rejects it
        Assert.NotEqual(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.True(
            response.StatusCode == HttpStatusCode.BadRequest ||
            response.StatusCode == HttpStatusCode.NotFound,
            $"Expected 400 or 404 for integer ID, got: {response.StatusCode}");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [P1] Idempotent: DELETE same client twice — second call returns 404
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P1] DELETE same client ID twice.
    /// First call: 204 (success).
    /// Second call: 404 Problem Details (resource no longer exists).
    /// This validates the "not idempotent" contract of DELETE for this endpoint.
    /// </summary>
    [Fact]
    public async Task DeleteCliente_CalledTwiceWithSameId_SecondCallReturns404()
    {
        // GIVEN: A client exists
        var suffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();
        var created = await CreateClienteAsync(suffix);

        // WHEN: First DELETE call
        var firstResponse = await _client.DeleteAsync($"/api/v1/clientes/{created.Id}");

        // THEN: First call returns 204 (success)
        Assert.Equal(HttpStatusCode.NoContent, firstResponse.StatusCode);

        // WHEN: Second DELETE call with the same ID
        var secondResponse = await _client.DeleteAsync($"/api/v1/clientes/{created.Id}");

        // THEN: Second call returns 404 (resource already deleted)
        Assert.Equal(HttpStatusCode.NotFound, secondResponse.StatusCode);

        // AND: Body is Problem Details RFC 7807
        var body = await secondResponse.Content.ReadFromJsonAsync<DeleteProblemDetailsDto>();
        Assert.NotNull(body);
        Assert.Equal(404, body!.Status);
        Assert.Equal("Cliente no encontrado", body.Title);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [P1] DELETE 204 response body MUST be empty
    // Architecture: 204 No Content must have no response body (not even {})
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P1] DELETE successful response is 204 with an empty body.
    /// Verifies Results.NoContent() is used — NOT Results.Ok(null) or Results.Ok(new {}).
    /// Architecture: 204 responses must have no body.
    /// </summary>
    [Fact]
    public async Task DeleteCliente_Success_Returns204WithEmptyBody()
    {
        // GIVEN: A client exists
        var suffix = (DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 1).ToString();
        var created = await CreateClienteAsync(suffix);

        // WHEN: DELETE call
        var response = await _client.DeleteAsync($"/api/v1/clientes/{created.Id}");

        // THEN: Status is 204 No Content
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        // AND: Response body is empty (not even whitespace)
        var bodyText = await response.Content.ReadAsStringAsync();
        Assert.Equal(string.Empty, bodyText);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [P2] Problem Details 404 — exact title and detail in Spanish (i18n enforcement)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P2] DELETE non-existent client returns Spanish Problem Details.
    /// Title must be "Cliente no encontrado" (exact).
    /// Detail must contain "El cliente solicitado no fue encontrado" (exact phrase).
    /// </summary>
    [Fact]
    public async Task DeleteCliente_NotFound_TitleAndDetailAreInSpanish()
    {
        // GIVEN: A UUID that does not exist
        var unknownId = Guid.NewGuid();

        // WHEN: DELETE call
        var response = await _client.DeleteAsync($"/api/v1/clientes/{unknownId}");

        // THEN: 404 Not Found
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<DeleteProblemDetailsDto>();
        Assert.NotNull(body);

        // AND: Title is the exact Spanish string
        Assert.Equal("Cliente no encontrado", body!.Title);

        // AND: Detail contains the exact Spanish message
        Assert.Contains(
            "El cliente solicitado no fue encontrado.",
            body.Detail ?? string.Empty,
            StringComparison.Ordinal);
    }

    /// <summary>
    /// [P2] Problem Details response has Status field = 404 (not 0 or null).
    /// Verifies the RFC 7807 Status field is explicitly set.
    /// </summary>
    [Fact]
    public async Task DeleteCliente_NotFound_ProblemDetailsStatusIs404()
    {
        // GIVEN: A UUID that does not exist
        var unknownId = Guid.NewGuid();

        // WHEN: DELETE call
        var response = await _client.DeleteAsync($"/api/v1/clientes/{unknownId}");

        // THEN: Body Status field = 404 (not default 0 or null)
        var body = await response.Content.ReadFromJsonAsync<DeleteProblemDetailsDto>();
        Assert.NotNull(body);
        Assert.Equal(404, body!.Status);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [P2] NFR6 — No stack traces in 404 response (security enforcement)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P2] DELETE 404 response must NOT expose internal stack traces.
    /// NFR6: No stack traces, exception types, or internal file paths in error responses.
    /// </summary>
    [Fact]
    public async Task DeleteCliente_NotFound_ResponseDoesNotExposeInternalDetails()
    {
        // GIVEN: A UUID that does not exist
        var unknownId = Guid.NewGuid();

        // WHEN: DELETE call
        var response = await _client.DeleteAsync($"/api/v1/clientes/{unknownId}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        var rawBody = await response.Content.ReadAsStringAsync();

        // THEN: No stack trace indicators (NFR6 enforcement)
        Assert.DoesNotContain("StackTrace", rawBody, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("at SiesaAgents.", rawBody, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("System.Exception", rawBody, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("InnerException", rawBody, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("Microsoft.EntityFrameworkCore", rawBody, StringComparison.OrdinalIgnoreCase);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [P2] DELETE valid ID — GET afterwards returns 404 (verified persistence)
    // Stronger than ATDD test: verifies the resource is removed from persistence, not just cache
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P2] After DELETE, both GET by ID and GET list no longer return the deleted client.
    /// Two persistence checks in one test for completeness.
    /// </summary>
    [Fact]
    public async Task DeleteCliente_DeletedClientNotAccessibleByIdOrInList()
    {
        // GIVEN: A client exists
        var suffix = (DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 5).ToString();
        var created = await CreateClienteAsync(suffix);

        // Pre-condition: client is in the list
        var listBefore = await _client.GetAsync("/api/v1/clientes");
        Assert.Equal(HttpStatusCode.OK, listBefore.StatusCode);
        var bodyBefore = await listBefore.Content.ReadFromJsonAsync<DeleteTestClienteDto[]>();
        Assert.NotNull(bodyBefore);
        Assert.Contains(bodyBefore!, c => c.Id == created.Id);

        // WHEN: DELETE
        var deleteResponse = await _client.DeleteAsync($"/api/v1/clientes/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        // THEN: GET by ID returns 404
        var getById = await _client.GetAsync($"/api/v1/clientes/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getById.StatusCode);

        // AND: GET list does not contain the deleted ID
        var listAfter = await _client.GetAsync("/api/v1/clientes");
        Assert.Equal(HttpStatusCode.OK, listAfter.StatusCode);
        var bodyAfter = await listAfter.Content.ReadFromJsonAsync<DeleteTestClienteDto[]>();
        Assert.NotNull(bodyAfter);
        Assert.DoesNotContain(bodyAfter!, c => c.Id == created.Id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [P3] Nil UUID (all zeros) → 404 Problem Details (not a crash)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P3] DELETE /api/v1/clientes/00000000-0000-0000-0000-000000000000 (nil UUID).
    /// The nil UUID is a valid GUID format but should not match any real client.
    /// Must return 404 Problem Details, not 500.
    /// </summary>
    [Fact]
    public async Task DeleteCliente_WithNilUuid_Returns404NotServerError()
    {
        // GIVEN: Nil UUID (all zeros) — valid format but no client should have this ID

        // WHEN: DELETE /api/v1/clientes/00000000-0000-0000-0000-000000000000
        var response = await _client.DeleteAsync($"/api/v1/clientes/{NilUuid}");

        // THEN: Returns 404 (no client with nil UUID) — NOT 500
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // AND: Body is Problem Details (not a 500 error page)
        var body = await response.Content.ReadFromJsonAsync<DeleteProblemDetailsDto>();
        Assert.NotNull(body);
        Assert.Equal(404, body!.Status);
    }

    /// <summary>
    /// [P3] DELETE /api/v1/clientes/ffffffff-ffff-ffff-ffff-ffffffffffff (max UUID).
    /// Must return 404 Problem Details, not 500.
    /// </summary>
    [Fact]
    public async Task DeleteCliente_WithMaxUuid_Returns404NotServerError()
    {
        // WHEN: DELETE /api/v1/clientes/ffffffff-ffff-ffff-ffff-ffffffffffff
        var response = await _client.DeleteAsync($"/api/v1/clientes/{MaxUuid}");

        // THEN: Returns 404 (no client with max UUID) — NOT 500
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<DeleteProblemDetailsDto>();
        Assert.NotNull(body);
        Assert.Equal(404, body!.Status);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [P2] DELETE does NOT modify other clients (isolation — no side effects)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P2] Deleting client A does not affect client B.
    /// Verifies the DELETE operation is scoped to the target ID only.
    /// </summary>
    [Fact]
    public async Task DeleteCliente_DeletesOnlyTargetClient_OtherClientsUntouched()
    {
        // GIVEN: Two clients exist
        var suffixA = (DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 100).ToString();
        var suffixB = (DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 101).ToString();

        var clienteA = await CreateClienteAsync(suffixA);
        var clienteB = await CreateClienteAsync(suffixB);

        try
        {
            // WHEN: Only client A is deleted
            var deleteAResponse = await _client.DeleteAsync($"/api/v1/clientes/{clienteA.Id}");
            Assert.Equal(HttpStatusCode.NoContent, deleteAResponse.StatusCode);

            // THEN: Client A is no longer accessible
            var getA = await _client.GetAsync($"/api/v1/clientes/{clienteA.Id}");
            Assert.Equal(HttpStatusCode.NotFound, getA.StatusCode);

            // AND: Client B is still accessible and unchanged (no side effect)
            var getB = await _client.GetAsync($"/api/v1/clientes/{clienteB.Id}");
            Assert.Equal(HttpStatusCode.OK, getB.StatusCode);

            var bodyB = await getB.Content.ReadFromJsonAsync<DeleteTestClienteDto>();
            Assert.NotNull(bodyB);
            Assert.Equal(clienteB.Id, bodyB!.Id);
            Assert.Equal(clienteB.Nombre, bodyB.Nombre);
        }
        finally
        {
            // Cleanup: delete client B (A is already deleted)
            await _client.DeleteAsync($"/api/v1/clientes/{clienteB.Id}");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [P2] Response shape: 200 + { hadContacts: true } — body has exactly the expected fields
    // Edge case: no extra fields, no camelCase vs PascalCase mismatch
    // ─────────────────────────────────────────────────────────────────────────

    // Note: This test is TECH DEBT — Epic 3 (Contactos) must exist for the 200 path.
    // Documents the expected contract for when Epic 3 is implemented.
    // Marked as tech debt per story decision.

    /// <summary>
    /// [P2] DELETE 200 response (when contacts exist) body must be { hadContacts: true } in camelCase.
    /// Epic 3 tech debt: currently returns 204 until Contactos table exists.
    /// When Epic 3 adds the contacts table, this test validates the exact JSON shape.
    /// </summary>
    [Fact]
    public async Task DeleteCliente_200ResponseBodyHasHadContactsCamelCase_TechDebt_Epic3()
    {
        // GIVEN: A client exists (without contacts — Epic 3 not implemented yet)
        var suffix = (DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 200).ToString();
        var created = await CreateClienteAsync(suffix);

        // WHEN: DELETE
        var response = await _client.DeleteAsync($"/api/v1/clientes/{created.Id}");

        // THEN: Currently returns 204 (Epic 3 tech debt — no Contactos table yet)
        // When Epic 3 is complete and contacts are seeded, this will be 200 + { hadContacts: true }
        Assert.True(
            response.StatusCode == HttpStatusCode.NoContent ||
            response.StatusCode == HttpStatusCode.OK,
            $"Expected 204 or 200, got: {response.StatusCode}");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            // Validate the exact JSON shape of the 200 response body
            var rawBody = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(rawBody);

            // AND: Body has exactly { "hadContacts": ... } in camelCase
            Assert.True(
                doc.RootElement.TryGetProperty("hadContacts", out var hadContactsProp),
                $"Expected 'hadContacts' (camelCase) in response body. Got: {rawBody}");

            // AND: hadContacts is a boolean value
            Assert.Equal(JsonValueKind.True, hadContactsProp.ValueKind);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Response DTOs (private — scoped to this test class)
    // ─────────────────────────────────────────────────────────────────────────

    private sealed record DeleteTestClienteDto(
        Guid Id,
        string Nombre,
        string Nit,
        string Telefono,
        string Ciudad,
        DateTimeOffset CreatedAt,
        DateTimeOffset UpdatedAt
    );

    private sealed record DeleteProblemDetailsDto(
        int Status,
        string Title,
        string? Detail,
        string? Type
    );
}
