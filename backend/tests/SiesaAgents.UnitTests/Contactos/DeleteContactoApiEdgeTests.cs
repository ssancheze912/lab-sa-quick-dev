using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace SiesaAgents.UnitTests.Contactos;

/// <summary>
/// Automation expansion — Story 3.5: DELETE /api/v1/contactos/:id edge cases.
/// Expands ATDD coverage (DeleteContactoApiTests.cs) with:
///
///   [P1] DELETE with malformed (non-UUID) ID → 400 or 404 (route constraint rejects it)
///   [P1] DELETE with integer ID → rejected by {id:guid} route constraint without 500
///   [P1] Idempotent: DELETE same contacto twice → second returns 404 Problem Details
///   [P1] DELETE 204 response body MUST be empty (Results.NoContent(), not Results.Ok(null))
///   [P1] Problem Details title is exact Spanish "Contacto no encontrado"
///   [P2] Problem Details 404 detail message contains exact Spanish phrase
///   [P2] Problem Details 404 Status field is exactly 404 (not 0 or null)
///   [P2] NFR6 — 404 response does NOT expose stack traces or internal types
///   [P2] Deleting contacto A does NOT affect contacto B (isolation — no side effects)
///   [P2] After DELETE, contacto is not in GET list AND not accessible via GET by ID
///   [P3] DELETE with nil UUID (all zeros) → 404 Problem Details (not a crash)
///   [P3] DELETE with max UUID (all f's) → 404 Problem Details (not a crash)
/// </summary>
public class DeleteContactoApiEdgeTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    private static readonly Guid NilUuid = Guid.Empty;
    private static readonly Guid MaxUuid = new Guid("ffffffff-ffff-ffff-ffff-ffffffffffff");

    public DeleteContactoApiEdgeTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helper: create a contacto and return its DTO for use in edge tests
    // ─────────────────────────────────────────────────────────────────────────

    private async Task<DeleteEdgeContactoDto> CreateContactoAsync(long suffix)
    {
        var payload = new
        {
            nombre = $"Contacto Edge Delete {suffix}",
            cargo = "Analista de Pruebas",
            telefono = "3001234567",
            email = $"edge.delete.{suffix}@empresa.co"
        };
        var response = await _client.PostAsJsonAsync("/api/v1/contactos", payload);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<DeleteEdgeContactoDto>();
        Assert.NotNull(dto);
        return dto!;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [P1] Malformed (non-UUID) ID → route constraint rejects it (400 or 404)
    // Route is /{id:guid} — non-GUID values must be rejected before reaching handler
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P1] DELETE /api/v1/contactos/not-a-uuid → rejected by {id:guid} route constraint.
    /// Must NOT return 500 (unhandled exception).
    /// </summary>
    [Fact]
    public async Task DeleteContacto_WithNonUuidId_RejectsWithoutServerError()
    {
        // GIVEN: A malformed ID that is not a valid UUID
        // WHEN: DELETE /api/v1/contactos/not-a-uuid
        var response = await _client.DeleteAsync("/api/v1/contactos/not-a-uuid");

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
    /// [P1] DELETE /api/v1/contactos/12345 (integer, not UUID) → rejected by route constraint.
    /// </summary>
    [Fact]
    public async Task DeleteContacto_WithIntegerId_RejectsWithoutServerError()
    {
        // WHEN: DELETE with an integer as ID
        var response = await _client.DeleteAsync("/api/v1/contactos/12345");

        // THEN: Not a 500; route constraint rejects non-GUID value
        Assert.NotEqual(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.True(
            response.StatusCode == HttpStatusCode.BadRequest ||
            response.StatusCode == HttpStatusCode.NotFound,
            $"Expected 400 or 404 for integer ID, got: {response.StatusCode}");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [P1] Idempotent: DELETE same contacto twice — second call returns 404
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P1] DELETE same contacto ID twice.
    /// First call: 204 (success).
    /// Second call: 404 Problem Details (resource no longer exists).
    /// Validates "not idempotent" contract — resource is removed on first DELETE.
    /// </summary>
    [Fact]
    public async Task DeleteContacto_CalledTwiceWithSameId_SecondCallReturns404()
    {
        // GIVEN: A contacto exists
        var created = await CreateContactoAsync(DateTimeOffset.UtcNow.ToUnixTimeMilliseconds());

        // WHEN: First DELETE call
        var firstResponse = await _client.DeleteAsync($"/api/v1/contactos/{created.Id}");

        // THEN: First call returns 204 No Content (success)
        Assert.Equal(HttpStatusCode.NoContent, firstResponse.StatusCode);

        // WHEN: Second DELETE call with the same ID
        var secondResponse = await _client.DeleteAsync($"/api/v1/contactos/{created.Id}");

        // THEN: Second call returns 404 (resource already deleted)
        Assert.Equal(HttpStatusCode.NotFound, secondResponse.StatusCode);

        // AND: Body is Problem Details RFC 7807 (not empty body — Results.Problem used)
        var body = await secondResponse.Content.ReadFromJsonAsync<DeleteEdgeProblemDetailsDto>();
        Assert.NotNull(body);
        Assert.Equal(404, body!.Status);
        Assert.Equal("Contacto no encontrado", body.Title);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [P1] DELETE 204 response body MUST be empty
    // Architecture: 204 No Content must have no response body (not even {})
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P1] DELETE successful response is 204 with an empty body.
    /// Verifies Results.NoContent() is used — NOT Results.Ok(null) or Results.Ok(new {}).
    /// </summary>
    [Fact]
    public async Task DeleteContacto_Success_Returns204WithEmptyBody()
    {
        // GIVEN: A contacto exists
        var created = await CreateContactoAsync(DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 1);

        // WHEN: DELETE call
        var response = await _client.DeleteAsync($"/api/v1/contactos/{created.Id}");

        // THEN: Status is 204 No Content
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        // AND: Response body is empty (not even whitespace — Results.NoContent() contract)
        var bodyText = await response.Content.ReadAsStringAsync();
        Assert.Equal(string.Empty, bodyText);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [P1] Problem Details — exact Spanish title
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P1] DELETE non-existent contacto returns Problem Details with exact Spanish title.
    /// Title must be exactly "Contacto no encontrado" (case-sensitive — architecture spec).
    /// </summary>
    [Fact]
    public async Task DeleteContacto_NotFound_TitleIsExactSpanishText()
    {
        // GIVEN: A UUID that does not exist
        var unknownId = Guid.NewGuid();

        // WHEN: DELETE call
        var response = await _client.DeleteAsync($"/api/v1/contactos/{unknownId}");

        // THEN: 404 Not Found
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<DeleteEdgeProblemDetailsDto>();
        Assert.NotNull(body);

        // AND: Title is the exact Spanish string (from ContactoEndpoints.cs → Results.Problem)
        Assert.Equal("Contacto no encontrado", body!.Title);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [P2] Problem Details — exact Spanish detail phrase
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P2] DELETE non-existent contacto returns Spanish detail phrase.
    /// Detail must contain "El contacto solicitado no fue encontrado." (i18n enforcement).
    /// </summary>
    [Fact]
    public async Task DeleteContacto_NotFound_DetailContainsExactSpanishPhrase()
    {
        // GIVEN: A UUID that does not exist
        var unknownId = Guid.NewGuid();

        // WHEN: DELETE call
        var response = await _client.DeleteAsync($"/api/v1/contactos/{unknownId}");

        // THEN: 404 Not Found
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<DeleteEdgeProblemDetailsDto>();
        Assert.NotNull(body);

        // AND: Detail contains the exact Spanish phrase from ContactoEndpoints.cs
        Assert.Contains(
            "El contacto solicitado no fue encontrado.",
            body!.Detail ?? string.Empty,
            StringComparison.Ordinal);
    }

    /// <summary>
    /// [P2] Problem Details 404 Status field is exactly 404 (not 0 or null).
    /// RFC 7807 requires an explicit Status numeric member.
    /// </summary>
    [Fact]
    public async Task DeleteContacto_NotFound_ProblemDetailsStatusIs404()
    {
        // GIVEN: A UUID that does not exist
        var unknownId = Guid.NewGuid();

        // WHEN: DELETE call
        var response = await _client.DeleteAsync($"/api/v1/contactos/{unknownId}");

        // THEN: Body Status field = 404 (not default 0 or null)
        var body = await response.Content.ReadFromJsonAsync<DeleteEdgeProblemDetailsDto>();
        Assert.NotNull(body);
        Assert.Equal(404, body!.Status);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [P2] NFR6 — No stack traces in 404 response (security enforcement)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P2] DELETE 404 response must NOT expose internal stack traces or types.
    /// NFR6: ExceptionHandlingMiddleware (Story 1.3) must prevent leakage.
    /// </summary>
    [Fact]
    public async Task DeleteContacto_NotFound_ResponseDoesNotExposeInternalDetails()
    {
        // GIVEN: A UUID that does not exist
        var unknownId = Guid.NewGuid();

        // WHEN: DELETE call
        var response = await _client.DeleteAsync($"/api/v1/contactos/{unknownId}");
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
    // [P2] Isolation — deleting contacto A does NOT affect contacto B
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P2] Deleting contacto A does not affect contacto B.
    /// Verifies the DELETE operation is scoped to the target ID only (no side effects).
    /// </summary>
    [Fact]
    public async Task DeleteContacto_DeletesOnlyTargetContacto_OtherContactosUntouched()
    {
        // GIVEN: Two contactos exist
        var suffixA = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 100;
        var suffixB = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 101;

        var contactoA = await CreateContactoAsync(suffixA);
        var contactoB = await CreateContactoAsync(suffixB);

        try
        {
            // WHEN: Only contacto A is deleted
            var deleteAResponse = await _client.DeleteAsync($"/api/v1/contactos/{contactoA.Id}");
            Assert.Equal(HttpStatusCode.NoContent, deleteAResponse.StatusCode);

            // THEN: Contacto A is no longer accessible
            var getA = await _client.GetAsync($"/api/v1/contactos/{contactoA.Id}");
            Assert.Equal(HttpStatusCode.NotFound, getA.StatusCode);

            // AND: Contacto B is still accessible and unchanged (no side effect)
            var getB = await _client.GetAsync($"/api/v1/contactos/{contactoB.Id}");
            Assert.Equal(HttpStatusCode.OK, getB.StatusCode);

            var bodyB = await getB.Content.ReadFromJsonAsync<DeleteEdgeContactoDto>();
            Assert.NotNull(bodyB);
            Assert.Equal(contactoB.Id, bodyB!.Id);
            Assert.Equal(contactoB.Nombre, bodyB.Nombre);
        }
        finally
        {
            // Cleanup: contactoA was deleted by the test; clean up contactoB
            await _client.DeleteAsync($"/api/v1/contactos/{contactoB.Id}");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [P2] Persistence verification — contacto absent from both GET by ID and GET list
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P2] After DELETE, contacto is accessible neither via GET by ID nor in the GET list.
    /// Stronger than ATDD test: verifies both persistence removal paths.
    /// </summary>
    [Fact]
    public async Task DeleteContacto_DeletedContactoNotAccessibleByIdOrInList()
    {
        // GIVEN: A contacto exists
        var suffix = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 200;
        var created = await CreateContactoAsync(suffix);

        // Pre-condition: contacto appears in the list
        var listBefore = await _client.GetAsync("/api/v1/contactos");
        Assert.Equal(HttpStatusCode.OK, listBefore.StatusCode);
        var bodyBefore = await listBefore.Content.ReadFromJsonAsync<DeleteEdgeContactoDto[]>();
        Assert.NotNull(bodyBefore);
        Assert.Contains(bodyBefore!, c => c.Id == created.Id);

        // WHEN: DELETE
        var deleteResponse = await _client.DeleteAsync($"/api/v1/contactos/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        // THEN: GET by ID returns 404
        var getById = await _client.GetAsync($"/api/v1/contactos/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getById.StatusCode);

        // AND: GET list does not contain the deleted ID (FR27)
        var listAfter = await _client.GetAsync("/api/v1/contactos");
        Assert.Equal(HttpStatusCode.OK, listAfter.StatusCode);
        var bodyAfter = await listAfter.Content.ReadFromJsonAsync<DeleteEdgeContactoDto[]>();
        Assert.NotNull(bodyAfter);
        Assert.DoesNotContain(bodyAfter!, c => c.Id == created.Id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // [P3] Nil UUID (all zeros) → 404 Problem Details (not a crash)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P3] DELETE /api/v1/contactos/00000000-0000-0000-0000-000000000000 (nil UUID).
    /// The nil UUID is a valid GUID format but should not match any real contacto.
    /// Must return 404 Problem Details, not 500.
    /// </summary>
    [Fact]
    public async Task DeleteContacto_WithNilUuid_Returns404NotServerError()
    {
        // GIVEN: Nil UUID (all zeros) — valid GUID format but no contacto should have this ID

        // WHEN: DELETE /api/v1/contactos/00000000-0000-0000-0000-000000000000
        var response = await _client.DeleteAsync($"/api/v1/contactos/{NilUuid}");

        // THEN: Returns 404 (no contacto with nil UUID) — NOT 500
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        // AND: Body is Problem Details (not a crash page or empty body)
        var body = await response.Content.ReadFromJsonAsync<DeleteEdgeProblemDetailsDto>();
        Assert.NotNull(body);
        Assert.Equal(404, body!.Status);
    }

    /// <summary>
    /// [P3] DELETE /api/v1/contactos/ffffffff-ffff-ffff-ffff-ffffffffffff (max UUID).
    /// Must return 404 Problem Details, not 500.
    /// </summary>
    [Fact]
    public async Task DeleteContacto_WithMaxUuid_Returns404NotServerError()
    {
        // WHEN: DELETE /api/v1/contactos/ffffffff-ffff-ffff-ffff-ffffffffffff
        var response = await _client.DeleteAsync($"/api/v1/contactos/{MaxUuid}");

        // THEN: Returns 404 (no contacto with max UUID) — NOT 500
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<DeleteEdgeProblemDetailsDto>();
        Assert.NotNull(body);
        Assert.Equal(404, body!.Status);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Response DTOs (private — scoped to this test class)
    // ─────────────────────────────────────────────────────────────────────────

    private sealed record DeleteEdgeContactoDto(
        Guid Id,
        string Nombre,
        string Cargo,
        string Telefono,
        string Email,
        string? ClienteId,
        DateTimeOffset CreatedAt,
        DateTimeOffset UpdatedAt
    );

    private sealed record DeleteEdgeProblemDetailsDto(
        int Status,
        string Title,
        string? Detail,
        string? Type
    );
}
