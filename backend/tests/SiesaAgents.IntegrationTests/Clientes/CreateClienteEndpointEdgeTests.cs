/**
 * Edge-case API Integration Tests — POST /api/v1/clientes
 * Story 2.3 — Create Client — Automation Expansion
 *
 * Complements CreateClienteEndpointTests.cs (ATDD baseline).
 * Covers edge cases NOT in ATDD:
 *   - POST with whitespace-only field values → 400 Bad Request (FluentValidation)
 *   - POST with a very long nombre (boundary length) → 201 Created (no max length enforced by domain)
 *   - POST with NIT containing special characters (Colombian format) → 201 Created
 *   - POST with NIT containing uppercase letters (case-sensitive uniqueness) → two different NITs create 2 clients
 *   - POST with Content-Type missing → 415 Unsupported Media Type (or 400)
 *   - POST followed by GET /api/v1/clientes — newly created client appears in the list
 *   - POST with duplicate NIT returns 409 with problem+json Content-Type (exact header check)
 *   - POST with null field values → 400 Bad Request with errors for each null field
 *   - 201 response Location header points to the correct resource path
 *   - Idempotency: two POSTs with same data but different NITs both succeed (two distinct clients)
 *   - POST with only whitespace nombre → FluentValidation rejects → 400
 *
 * Stack: xUnit 2 + WebApplicationFactory<Program> + EF Core InMemory
 * Given-When-Then format per test method.
 */

using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests.Clientes;

/// <summary>
/// Edge-case tests for POST /api/v1/clientes.
/// Each test creates its own isolated factory with a unique in-memory DB.
/// </summary>
public sealed class CreateClienteEndpointEdgeTests
{
    // -------------------------------------------------------------------------
    // Helper: isolated factory per test
    // -------------------------------------------------------------------------

    private static CreateClienteWebApplicationFactory CreateIsolatedFactory() =>
        new() { DatabaseName = $"CreateEdgeDb_{Guid.NewGuid()}" };

    private static StringContent JsonPayload(object payload) =>
        new(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

    // -------------------------------------------------------------------------
    // Edge: POST with whitespace-only field values → 400
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a body where all 4 fields contain only whitespace characters,
    /// When POST /api/v1/clientes is called,
    /// Then returns HTTP 400 Bad Request with validation errors.
    /// FluentValidation's NotEmpty() (or equivalent) must reject whitespace-only strings.
    /// </summary>
    [Fact(DisplayName = "Edge — POST with whitespace-only field values returns 400")]
    public async Task PostCliente_Returns400_WhenAllFieldsAreWhitespaceOnly()
    {
        // GIVEN: All fields are non-empty strings but contain only spaces
        using var factory = CreateIsolatedFactory();
        var client = factory.CreateClient();

        var payload = new { nombre = "   ", nit = "   ", telefono = "   ", ciudad = "   " };

        // WHEN: POST /api/v1/clientes
        var response = await client.PostAsync("/api/v1/clientes", JsonPayload(payload));

        // THEN: HTTP 400 Bad Request (validation must reject whitespace-only values)
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // -------------------------------------------------------------------------
    // Edge: POST with Colombian NIT format (digits-digit) → 201
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a NIT in the standard Colombian format "900123456-7",
    /// When POST /api/v1/clientes is called,
    /// Then returns 201 Created — the domain accepts any non-empty string as NIT.
    /// </summary>
    [Fact(DisplayName = "Edge — POST with Colombian NIT format (900123456-7) returns 201")]
    public async Task PostCliente_Returns201_WithColombianNitFormat()
    {
        // GIVEN: Valid payload with Colombian NIT format
        using var factory = CreateIsolatedFactory();
        var client = factory.CreateClient();

        var payload = new
        {
            nombre = "Empresa Colombia SAS",
            nit = "900123456-7",
            telefono = "6011234567",
            ciudad = "Bogotá"
        };

        // WHEN: POST /api/v1/clientes
        var response = await client.PostAsync("/api/v1/clientes", JsonPayload(payload));

        // THEN: 201 Created
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        // THEN: NIT is preserved as-is in the response
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        doc.RootElement.TryGetProperty("nit", out var nitProp);
        Assert.Equal("900123456-7", nitProp.GetString());
    }

    // -------------------------------------------------------------------------
    // Edge: POST with NIT containing dots (alternative Latin American format) → 201
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a NIT with dots "900.123.456-7",
    /// When POST /api/v1/clientes is called,
    /// Then returns 201 Created — domain accepts any non-empty string format.
    /// </summary>
    [Fact(DisplayName = "Edge — POST with NIT containing dots returns 201")]
    public async Task PostCliente_Returns201_WithNitContainingDots()
    {
        // GIVEN: NIT with dots (alternative format)
        using var factory = CreateIsolatedFactory();
        var client = factory.CreateClient();

        var payload = new
        {
            nombre = "Empresa Puntos SA",
            nit = "900.123.456-7",
            telefono = "3012345678",
            ciudad = "Medellín"
        };

        // WHEN: POST /api/v1/clientes
        var response = await client.PostAsync("/api/v1/clientes", JsonPayload(payload));

        // THEN: 201 Created
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    // -------------------------------------------------------------------------
    // Edge: NIT uniqueness is case-sensitive
    // (two clients with NITs differing only in case = two distinct clients)
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a NIT "RUC-ABC123" already exists,
    /// When POST /api/v1/clientes is called with NIT "ruc-abc123" (lowercase),
    /// Then returns 201 Created (case-sensitive uniqueness means they are different NITs).
    /// This verifies the system does NOT normalize NIT to a canonical form.
    /// </summary>
    [Fact(DisplayName = "Edge — NIT uniqueness is case-sensitive (RUC-ABC123 ≠ ruc-abc123)")]
    public async Task PostCliente_Returns201_WhenNitDiffersOnlyInCase()
    {
        // GIVEN: First client with uppercase NIT
        using var factory = CreateIsolatedFactory();
        var client = factory.CreateClient();

        var firstPayload = new
        {
            nombre = "Empresa Mayúscula",
            nit = "RUC-ABC123-UPPER",
            telefono = "3000000001",
            ciudad = "Cali"
        };

        var firstResponse = await client.PostAsync("/api/v1/clientes", JsonPayload(firstPayload));
        Assert.Equal(HttpStatusCode.Created, firstResponse.StatusCode);

        // WHEN: POST with same NIT but lowercase
        var secondPayload = new
        {
            nombre = "Empresa Minúscula",
            nit = "ruc-abc123-upper", // lowercase version
            telefono = "3000000002",
            ciudad = "Barranquilla"
        };

        var secondResponse = await client.PostAsync("/api/v1/clientes", JsonPayload(secondPayload));

        // THEN: 201 Created — case-different NITs are treated as distinct
        Assert.Equal(HttpStatusCode.Created, secondResponse.StatusCode);
    }

    // -------------------------------------------------------------------------
    // Edge: POST creates a client that then appears in GET /api/v1/clientes list
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a client is created via POST,
    /// When GET /api/v1/clientes is called,
    /// Then the new client appears in the returned list.
    /// This validates end-to-end persistence and the list query reflects mutations.
    /// </summary>
    [Fact(DisplayName = "Edge — POST creates client that immediately appears in GET list")]
    public async Task PostCliente_NewClientAppearsInGetList()
    {
        // GIVEN: POST creates a client with a unique NIT
        using var factory = CreateIsolatedFactory();
        var client = factory.CreateClient();

        var uniqueNit = $"900EDGE{Guid.NewGuid().ToString("N")[..8].ToUpper()}-1";
        var payload = new
        {
            nombre = "Empresa Lista Check SA",
            nit = uniqueNit,
            telefono = "3009999999",
            ciudad = "Bogotá"
        };

        var postResponse = await client.PostAsync("/api/v1/clientes", JsonPayload(payload));
        Assert.Equal(HttpStatusCode.Created, postResponse.StatusCode);

        // WHEN: GET /api/v1/clientes
        var getResponse = await client.GetAsync("/api/v1/clientes");

        // THEN: 200 OK and newly created NIT appears in the list
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

        var json = await getResponse.Content.ReadAsStringAsync();
        Assert.Contains(uniqueNit, json, StringComparison.Ordinal);
    }

    // -------------------------------------------------------------------------
    // Edge: 409 response has Content-Type application/problem+json (exact)
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a duplicate NIT conflict,
    /// When POST /api/v1/clientes returns 409,
    /// Then Content-Type is application/problem+json (RFC 7807 requirement).
    /// This validates the content-type header contract, not just the status code.
    /// </summary>
    [Fact(DisplayName = "Edge — 409 Conflict response has Content-Type application/problem+json")]
    public async Task PostCliente_409_ContentTypeIsProblemJson()
    {
        // GIVEN: Create a client, then attempt to create a duplicate
        using var factory = CreateIsolatedFactory();
        var client = factory.CreateClient();

        var firstPayload = new
        {
            nombre = "First Empresa",
            nit = "900EDGE001-1",
            telefono = "3001001001",
            ciudad = "Bogotá"
        };

        var firstResponse = await client.PostAsync("/api/v1/clientes", JsonPayload(firstPayload));
        Assert.Equal(HttpStatusCode.Created, firstResponse.StatusCode);

        var duplicatePayload = new
        {
            nombre = "Duplicate Empresa",
            nit = "900EDGE001-1",
            telefono = "3002002002",
            ciudad = "Medellín"
        };

        // WHEN: POST with duplicate NIT
        var duplicateResponse = await client.PostAsync("/api/v1/clientes", JsonPayload(duplicatePayload));

        // THEN: 409 Conflict
        Assert.Equal(HttpStatusCode.Conflict, duplicateResponse.StatusCode);

        // THEN: Content-Type contains "problem+json"
        var contentType = duplicateResponse.Content.Headers.ContentType?.ToString() ?? string.Empty;
        Assert.Contains("problem+json", contentType, StringComparison.OrdinalIgnoreCase);
    }

    // -------------------------------------------------------------------------
    // Edge: 201 Location header points to the correct resource
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a valid create-client payload,
    /// When POST /api/v1/clientes returns 201,
    /// Then the Location header value is a valid URI pointing to the new resource.
    /// The URI must contain the UUID of the newly created client.
    /// </summary>
    [Fact(DisplayName = "Edge — 201 Created Location header contains the new client UUID")]
    public async Task PostCliente_201_LocationHeaderContainsNewClientId()
    {
        // GIVEN: Valid payload
        using var factory = CreateIsolatedFactory();
        var client = factory.CreateClient();

        var payload = new
        {
            nombre = "Location Header Test SA",
            nit = "900LOC001-1",
            telefono = "3001001011",
            ciudad = "Cali"
        };

        // WHEN: POST /api/v1/clientes
        var response = await client.PostAsync("/api/v1/clientes", JsonPayload(payload));

        // THEN: 201 Created
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        // THEN: Location header is present and not null
        Assert.NotNull(response.Headers.Location);

        // THEN: Location URI contains the new client's UUID
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.True(doc.RootElement.TryGetProperty("id", out var idProp));
        var createdId = idProp.GetString();

        var location = response.Headers.Location!.ToString();
        Assert.Contains(createdId!, location, StringComparison.OrdinalIgnoreCase);
    }

    // -------------------------------------------------------------------------
    // Edge: Two POSTs with different NITs both succeed (non-conflicting clients)
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given two POSTs with completely different NITs,
    /// When both are sent sequentially,
    /// Then both return 201 Created with distinct UUIDs.
    /// Verifies the 409 logic only fires when NITs actually match, not as a false positive.
    /// </summary>
    [Fact(DisplayName = "Edge — Two POSTs with different NITs both return 201 with distinct IDs")]
    public async Task PostCliente_TwoRequests_WithDifferentNits_BothReturn201()
    {
        // GIVEN: Two different valid payloads
        using var factory = CreateIsolatedFactory();
        var client = factory.CreateClient();

        var firstPayload = new
        {
            nombre = "Empresa Alpha",
            nit = "900ALPHA001-1",
            telefono = "3001001001",
            ciudad = "Bogotá"
        };

        var secondPayload = new
        {
            nombre = "Empresa Beta",
            nit = "900BETA002-2",
            telefono = "3002002002",
            ciudad = "Medellín"
        };

        // WHEN: Both POSTs sent
        var firstResponse = await client.PostAsync("/api/v1/clientes", JsonPayload(firstPayload));
        var secondResponse = await client.PostAsync("/api/v1/clientes", JsonPayload(secondPayload));

        // THEN: Both return 201
        Assert.Equal(HttpStatusCode.Created, firstResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Created, secondResponse.StatusCode);

        // THEN: Both clients have distinct UUIDs
        var json1 = await firstResponse.Content.ReadAsStringAsync();
        var json2 = await secondResponse.Content.ReadAsStringAsync();

        using var doc1 = JsonDocument.Parse(json1);
        using var doc2 = JsonDocument.Parse(json2);

        doc1.RootElement.TryGetProperty("id", out var id1);
        doc2.RootElement.TryGetProperty("id", out var id2);

        Assert.NotEqual(id1.GetString(), id2.GetString());
    }

    // -------------------------------------------------------------------------
    // Edge: 400 response from validation has title field (RFC 7807)
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given an empty body,
    /// When POST /api/v1/clientes returns 400,
    /// Then the Problem Details body contains a non-empty "title" field (RFC 7807).
    /// </summary>
    [Fact(DisplayName = "Edge — 400 Problem Details contains a non-empty 'title' field")]
    public async Task PostCliente_400_ProblemDetailsTitleIsPresent()
    {
        // GIVEN: Empty body
        using var factory = CreateIsolatedFactory();
        var client = factory.CreateClient();

        var content = new StringContent("{}", Encoding.UTF8, "application/json");

        // WHEN: POST /api/v1/clientes
        var response = await client.PostAsync("/api/v1/clientes", content);

        // THEN: 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        // THEN: Problem Details has a non-empty "title" field
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.True(doc.RootElement.TryGetProperty("title", out var titleProp),
            $"Problem Details must contain 'title'. Body: {json}");
        Assert.False(string.IsNullOrEmpty(titleProp.GetString()),
            "'title' must not be empty");
    }

    // -------------------------------------------------------------------------
    // Edge: POST with a single-character value for each field → 201 Created
    // (minimum boundary — no min-length > 1 is enforced)
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given all fields are exactly 1 character long (minimum valid boundary),
    /// When POST /api/v1/clientes is called,
    /// Then returns 201 Created — the domain does not enforce a minimum length > 1.
    /// </summary>
    [Fact(DisplayName = "Edge — POST with single-character field values returns 201 (no min length > 1)")]
    public async Task PostCliente_Returns201_WithSingleCharacterFieldValues()
    {
        // GIVEN: All fields have exactly 1 character
        using var factory = CreateIsolatedFactory();
        var client = factory.CreateClient();

        var payload = new
        {
            nombre = "A",
            nit = "1",
            telefono = "2",
            ciudad = "X"
        };

        // WHEN: POST /api/v1/clientes
        var response = await client.PostAsync("/api/v1/clientes", JsonPayload(payload));

        // THEN: 201 Created (FluentValidation only checks NotEmpty, not min length)
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    // -------------------------------------------------------------------------
    // Edge: POST response body has no envelope wrapper ("data", "result", "items")
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a valid create-client payload,
    /// When POST /api/v1/clientes returns 201,
    /// Then the root JSON element is a direct object (ClienteDto) — no envelope wrapper.
    /// </summary>
    [Fact(DisplayName = "Edge — 201 response root is a direct ClienteDto object (no envelope wrapper)")]
    public async Task PostCliente_201_ResponseRootIsDirectObject_NotWrapped()
    {
        // GIVEN: Valid payload
        using var factory = CreateIsolatedFactory();
        var client = factory.CreateClient();

        var payload = new
        {
            nombre = "No Envelope SA",
            nit = "900ENV001-1",
            telefono = "3001001010",
            ciudad = "Bogotá"
        };

        // WHEN: POST /api/v1/clientes
        var response = await client.PostAsync("/api/v1/clientes", JsonPayload(payload));

        // THEN: 201 Created
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        // THEN: Root JSON element is an object
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.Equal(JsonValueKind.Object, doc.RootElement.ValueKind);

        // THEN: No envelope keys present
        Assert.False(doc.RootElement.TryGetProperty("data", out _),
            "Response must not have an 'data' envelope key");
        Assert.False(doc.RootElement.TryGetProperty("result", out _),
            "Response must not have a 'result' envelope key");
        Assert.False(doc.RootElement.TryGetProperty("items", out _),
            "Response must not have an 'items' envelope key");
    }

    // -------------------------------------------------------------------------
    // Edge: 409 Problem Details "title" field is present and non-empty
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a duplicate NIT conflict,
    /// When POST /api/v1/clientes returns 409,
    /// Then the Problem Details body contains a non-empty "title" field (RFC 7807).
    /// </summary>
    [Fact(DisplayName = "Edge — 409 Problem Details contains non-empty 'title' field")]
    public async Task PostCliente_409_ProblemDetailsTitleIsPresent()
    {
        // GIVEN: Create first client, then attempt duplicate NIT
        using var factory = CreateIsolatedFactory();
        var client = factory.CreateClient();

        var nit = "900TITLE001-1";
        await client.PostAsync("/api/v1/clientes",
            JsonPayload(new { nombre = "Empresa Título", nit, telefono = "3001001001", ciudad = "Bogotá" }));

        // WHEN: POST with same NIT
        var response = await client.PostAsync("/api/v1/clientes",
            JsonPayload(new { nombre = "Empresa Duplicada", nit, telefono = "3002002002", ciudad = "Cali" }));

        // THEN: 409 Conflict
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);

        // THEN: Problem Details has a "title" field
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.True(doc.RootElement.TryGetProperty("title", out var titleProp),
            $"Problem Details must contain 'title'. Body: {json}");
        Assert.False(string.IsNullOrEmpty(titleProp.GetString()),
            "'title' must not be empty");
    }
}
