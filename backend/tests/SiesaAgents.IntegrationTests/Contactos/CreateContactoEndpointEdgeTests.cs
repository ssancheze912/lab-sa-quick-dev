/**
 * Edge-case API Integration Tests — POST /api/v1/contactos
 * Story 3.3 — Create Contact — Automation Expansion
 *
 * Complements CreateContactoEndpointTests.cs (ATDD baseline).
 * Covers edge cases NOT in ATDD:
 *   - POST with whitespace-only field values → 400 Bad Request (FluentValidation NotEmpty + trim)
 *   - POST with single-character values for all fields → 201 Created (no min length > 1 enforced)
 *   - POST creates a contact that then appears in GET /api/v1/contactos list
 *   - POST followed by a second POST with same email → 201 (email is NOT unique for contacts)
 *   - 201 Location header contains the new contact UUID
 *   - 400 Problem Details body has non-empty "title" field (RFC 7807)
 *   - 201 response root is a direct ContactoDto object (no envelope wrapper)
 *   - POST with valid email containing subdomain → 201 Created
 *   - POST with valid email containing plus-sign alias → 201 Created
 *   - clienteId is always null on creation (never set by the create endpoint)
 *   - Two POSTs with different emails both succeed and return distinct UUIDs
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

namespace SiesaAgents.IntegrationTests.Contactos;

/// <summary>
/// Edge-case tests for POST /api/v1/contactos.
/// Each test creates its own isolated factory with a unique in-memory DB.
/// Uses the factory from CreateContactoEndpointTests.cs in the same namespace.
/// </summary>
public sealed class CreateContactoEndpointEdgeTests
{
    // -------------------------------------------------------------------------
    // Helper: isolated factory per test
    // -------------------------------------------------------------------------

    private static CreateContactoWebApplicationFactory CreateIsolatedFactory() =>
        new() { DatabaseName = $"CreateContactoEdgeDb_{Guid.NewGuid()}" };

    private static StringContent JsonPayload(object payload) =>
        new(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

    // -------------------------------------------------------------------------
    // Edge: POST with whitespace-only field values → 400
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a body where all 4 fields contain only whitespace characters,
    /// When POST /api/v1/contactos is called,
    /// Then returns HTTP 400 Bad Request with validation errors.
    /// FluentValidation's NotEmpty() must reject whitespace-only strings.
    /// </summary>
    [Fact(DisplayName = "Edge — POST with whitespace-only field values returns 400")]
    public async Task PostContacto_Returns400_WhenAllFieldsAreWhitespaceOnly()
    {
        // GIVEN: All fields are non-empty strings but contain only spaces
        using var factory = CreateIsolatedFactory();
        var client = factory.CreateClient();

        var payload = new { nombre = "   ", cargo = "   ", telefono = "   ", email = "   " };

        // WHEN: POST /api/v1/contactos
        var response = await client.PostAsync("/api/v1/contactos", JsonPayload(payload));

        // THEN: HTTP 400 Bad Request (validation must reject whitespace-only values)
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    /// <summary>
    /// Given a body where only email contains whitespace (other fields valid),
    /// When POST /api/v1/contactos is called,
    /// Then returns HTTP 400 Bad Request with error on email.
    /// </summary>
    [Fact(DisplayName = "Edge — POST with whitespace-only email returns 400")]
    public async Task PostContacto_Returns400_WhenEmailIsWhitespaceOnly()
    {
        // GIVEN: Only email is whitespace-only
        using var factory = CreateIsolatedFactory();
        var client = factory.CreateClient();

        var payload = new
        {
            nombre = "Ana García",
            cargo = "Directora",
            telefono = "3101234567",
            email = "   "  // whitespace only
        };

        // WHEN: POST /api/v1/contactos
        var response = await client.PostAsync("/api/v1/contactos", JsonPayload(payload));

        // THEN: HTTP 400 Bad Request
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        // THEN: errors object has an entry for email
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.True(doc.RootElement.TryGetProperty("errors", out var errorsProp),
            $"Problem Details must contain 'errors'. Body: {json}");
        Assert.True(
            errorsProp.TryGetProperty("email", out _) || errorsProp.TryGetProperty("Email", out _),
            $"'errors' must contain 'email'. Body: {json}"
        );
    }

    // -------------------------------------------------------------------------
    // Edge: POST with single-character field values → 201 Created
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given all 4 fields are exactly 1 character long (minimum valid boundary),
    /// When POST /api/v1/contactos is called with a single-char email that is valid format,
    /// Then returns 201 Created — the domain does not enforce a minimum length > 1.
    /// Note: email must still be a valid format, so we use "a@b.co" (shortest valid email).
    /// </summary>
    [Fact(DisplayName = "Edge — POST with single-character nombre/cargo/telefono and minimal email returns 201")]
    public async Task PostContacto_Returns201_WithMinimumBoundaryValues()
    {
        // GIVEN: All string fields are at their minimum (1 char or minimal valid email)
        using var factory = CreateIsolatedFactory();
        var client = factory.CreateClient();

        var payload = new
        {
            nombre = "A",
            cargo = "B",
            telefono = "1",
            email = "a@b.co"  // minimal valid email
        };

        // WHEN: POST /api/v1/contactos
        var response = await client.PostAsync("/api/v1/contactos", JsonPayload(payload));

        // THEN: 201 Created (FluentValidation only checks NotEmpty and valid email format)
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    // -------------------------------------------------------------------------
    // Edge: POST creates a contact that then appears in GET /api/v1/contactos list
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a contact is created via POST,
    /// When GET /api/v1/contactos is called,
    /// Then the new contact appears in the returned list.
    /// This validates end-to-end persistence and the list query reflects mutations.
    /// </summary>
    [Fact(DisplayName = "Edge — POST creates contact that immediately appears in GET list")]
    public async Task PostContacto_NewContactAppearsInGetList()
    {
        // GIVEN: POST creates a contact with a unique email
        using var factory = CreateIsolatedFactory();
        var client = factory.CreateClient();

        var uniqueEmail = $"edge.test.{Guid.NewGuid().ToString("N")[..8]}@siesa.com";
        var payload = new
        {
            nombre = "Contacto Lista Check",
            cargo = "Analista",
            telefono = "3009999999",
            email = uniqueEmail
        };

        var postResponse = await client.PostAsync("/api/v1/contactos", JsonPayload(payload));
        Assert.Equal(HttpStatusCode.Created, postResponse.StatusCode);

        // WHEN: GET /api/v1/contactos
        var getResponse = await client.GetAsync("/api/v1/contactos");

        // THEN: 200 OK and the unique email appears in the list response body
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

        var json = await getResponse.Content.ReadAsStringAsync();
        Assert.Contains(uniqueEmail, json, StringComparison.Ordinal);
    }

    // -------------------------------------------------------------------------
    // Edge: Duplicate email is allowed (email is NOT unique for contacts)
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a contact with a specific email already exists,
    /// When POST /api/v1/contactos is called with the SAME email,
    /// Then returns 201 Created — email is indexed but NOT unique for contacts.
    /// (Dev Notes: "No duplicate-key constraint for contacts unlike clients with NIT uniqueness.")
    /// </summary>
    [Fact(DisplayName = "Edge — POST with duplicate email returns 201 (email is not unique for contacts)")]
    public async Task PostContacto_Returns201_WhenEmailIsDuplicated()
    {
        // GIVEN: First contact created with a specific email
        using var factory = CreateIsolatedFactory();
        var client = factory.CreateClient();

        var sharedEmail = "shared.email@siesa.com";

        var firstPayload = new
        {
            nombre = "Primer Contacto",
            cargo = "Analista",
            telefono = "3101234567",
            email = sharedEmail
        };

        var firstResponse = await client.PostAsync("/api/v1/contactos", JsonPayload(firstPayload));
        Assert.Equal(HttpStatusCode.Created, firstResponse.StatusCode);

        // WHEN: Second contact with the same email
        var secondPayload = new
        {
            nombre = "Segundo Contacto",
            cargo = "Gerente",
            telefono = "3109999999",
            email = sharedEmail  // same email as the first contact
        };

        var secondResponse = await client.PostAsync("/api/v1/contactos", JsonPayload(secondPayload));

        // THEN: 201 Created — contacts allow duplicate emails
        Assert.Equal(HttpStatusCode.Created, secondResponse.StatusCode);
    }

    // -------------------------------------------------------------------------
    // Edge: 201 Location header contains the new contact UUID
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a valid create-contact payload,
    /// When POST /api/v1/contactos returns 201,
    /// Then the Location header contains the UUID of the newly created contact.
    /// </summary>
    [Fact(DisplayName = "Edge — 201 Created Location header contains the new contact UUID")]
    public async Task PostContacto_201_LocationHeaderContainsNewContactId()
    {
        // GIVEN: Valid payload
        using var factory = CreateIsolatedFactory();
        var client = factory.CreateClient();

        var payload = new
        {
            nombre = "Location Header Test",
            cargo = "QA Engineer",
            telefono = "3001001011",
            email = "location.test@siesa.com"
        };

        // WHEN: POST /api/v1/contactos
        var response = await client.PostAsync("/api/v1/contactos", JsonPayload(payload));

        // THEN: 201 Created
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        // THEN: Location header is present
        Assert.NotNull(response.Headers.Location);

        // THEN: Location URI contains the new contact's UUID
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        Assert.True(doc.RootElement.TryGetProperty("id", out var idProp));
        var createdId = idProp.GetString();
        Assert.False(string.IsNullOrEmpty(createdId));

        var location = response.Headers.Location!.ToString();
        Assert.Contains(createdId!, location, StringComparison.OrdinalIgnoreCase);
    }

    // -------------------------------------------------------------------------
    // Edge: 400 Problem Details body has non-empty "title" field (RFC 7807)
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given an empty body {},
    /// When POST /api/v1/contactos returns 400,
    /// Then the Problem Details body contains a non-empty "title" field (RFC 7807).
    /// </summary>
    [Fact(DisplayName = "Edge — 400 Problem Details contains a non-empty 'title' field")]
    public async Task PostContacto_400_ProblemDetailsTitleIsPresent()
    {
        // GIVEN: Empty body
        using var factory = CreateIsolatedFactory();
        var client = factory.CreateClient();

        var content = new StringContent("{}", Encoding.UTF8, "application/json");

        // WHEN: POST /api/v1/contactos
        var response = await client.PostAsync("/api/v1/contactos", content);

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
    // Edge: 201 response root is a direct ContactoDto (no envelope wrapper)
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a valid create-contact payload,
    /// When POST /api/v1/contactos returns 201,
    /// Then the root JSON element is a direct ContactoDto — no "data", "result", or "items" wrapper.
    /// </summary>
    [Fact(DisplayName = "Edge — 201 response root is a direct ContactoDto object (no envelope wrapper)")]
    public async Task PostContacto_201_ResponseRootIsDirectObject_NotWrapped()
    {
        // GIVEN: Valid payload
        using var factory = CreateIsolatedFactory();
        var client = factory.CreateClient();

        var payload = new
        {
            nombre = "No Envelope Test",
            cargo = "Analista",
            telefono = "3001001010",
            email = "no.envelope@siesa.com"
        };

        // WHEN: POST /api/v1/contactos
        var response = await client.PostAsync("/api/v1/contactos", JsonPayload(payload));

        // THEN: 201 Created
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        // THEN: Root JSON element is an object
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.Equal(JsonValueKind.Object, doc.RootElement.ValueKind);

        // THEN: No envelope keys present
        Assert.False(doc.RootElement.TryGetProperty("data", out _),
            "Response must not have a 'data' envelope key");
        Assert.False(doc.RootElement.TryGetProperty("result", out _),
            "Response must not have a 'result' envelope key");
        Assert.False(doc.RootElement.TryGetProperty("items", out _),
            "Response must not have an 'items' envelope key");
    }

    // -------------------------------------------------------------------------
    // Edge: POST with valid subdomain email → 201 Created
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a valid payload with an email containing a subdomain (e.g. user@mail.siesa.com),
    /// When POST /api/v1/contactos is called,
    /// Then returns 201 Created — subdomain emails are valid per RFC 5321.
    /// </summary>
    [Fact(DisplayName = "Edge — POST with subdomain email returns 201")]
    public async Task PostContacto_Returns201_WithSubdomainEmail()
    {
        // GIVEN: Email with subdomain
        using var factory = CreateIsolatedFactory();
        var client = factory.CreateClient();

        var payload = new
        {
            nombre = "Ana García",
            cargo = "Directora",
            telefono = "3101234567",
            email = "ana@mail.siesa.com"
        };

        // WHEN: POST /api/v1/contactos
        var response = await client.PostAsync("/api/v1/contactos", JsonPayload(payload));

        // THEN: 201 Created
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    // -------------------------------------------------------------------------
    // Edge: POST with plus-sign email alias → 201 Created
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a valid payload with an email containing a plus-sign alias (e.g. user+tag@siesa.com),
    /// When POST /api/v1/contactos is called,
    /// Then returns 201 Created — plus addressing is valid per RFC 5321.
    /// </summary>
    [Fact(DisplayName = "Edge — POST with plus-sign email alias returns 201")]
    public async Task PostContacto_Returns201_WithPlusSignEmailAlias()
    {
        // GIVEN: Email with plus-sign alias
        using var factory = CreateIsolatedFactory();
        var client = factory.CreateClient();

        var payload = new
        {
            nombre = "Ana García",
            cargo = "Directora",
            telefono = "3101234567",
            email = "ana+tag@siesa.com"
        };

        // WHEN: POST /api/v1/contactos
        var response = await client.PostAsync("/api/v1/contactos", JsonPayload(payload));

        // THEN: 201 Created
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    // -------------------------------------------------------------------------
    // Edge: clienteId is always null on creation (never set by create endpoint)
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given a valid create-contact payload (no clienteId field),
    /// When POST /api/v1/contactos returns 201,
    /// Then the ContactoDto in the response always has clienteId as null.
    /// Contacts are created independently of clients (FR25, Epic 4 handles association).
    /// </summary>
    [Fact(DisplayName = "Edge — ContactoDto.clienteId is always null on creation (orphan contact)")]
    public async Task PostContacto_201_ContactoDtoClienteIdIsAlwaysNull()
    {
        // GIVEN: Valid payload without any clienteId
        using var factory = CreateIsolatedFactory();
        var client = factory.CreateClient();

        var payload = new
        {
            nombre = "Contacto Sin Cliente",
            cargo = "Independiente",
            telefono = "3100000001",
            email = "sin.cliente@empresa.co"
        };

        // WHEN: POST /api/v1/contactos
        var response = await client.PostAsync("/api/v1/contactos", JsonPayload(payload));

        // THEN: 201 Created
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        // THEN: clienteId in response is null
        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        Assert.True(doc.RootElement.TryGetProperty("clienteId", out var clienteIdProp),
            $"Response must contain 'clienteId'. Body: {json}");
        Assert.True(clienteIdProp.ValueKind == JsonValueKind.Null,
            $"'clienteId' must be null on creation. Body: {json}");
    }

    // -------------------------------------------------------------------------
    // Edge: Two POSTs with different emails both succeed with distinct UUIDs
    // -------------------------------------------------------------------------

    /// <summary>
    /// Given two POSTs with completely different emails,
    /// When both are sent sequentially,
    /// Then both return 201 Created with distinct UUIDs.
    /// Verifies the system does not accidentally deduplicate contacts by email.
    /// </summary>
    [Fact(DisplayName = "Edge — Two POSTs with different emails both return 201 with distinct IDs")]
    public async Task PostContacto_TwoRequests_WithDifferentEmails_BothReturn201WithDistinctIds()
    {
        // GIVEN: Two different valid payloads
        using var factory = CreateIsolatedFactory();
        var client = factory.CreateClient();

        var firstPayload = new
        {
            nombre = "Contacto Alpha",
            cargo = "Analista",
            telefono = "3001001001",
            email = "alpha@siesa.com"
        };

        var secondPayload = new
        {
            nombre = "Contacto Beta",
            cargo = "Gerente",
            telefono = "3002002002",
            email = "beta@siesa.com"
        };

        // WHEN: Both POSTs sent sequentially
        var firstResponse = await client.PostAsync("/api/v1/contactos", JsonPayload(firstPayload));
        var secondResponse = await client.PostAsync("/api/v1/contactos", JsonPayload(secondPayload));

        // THEN: Both return 201
        Assert.Equal(HttpStatusCode.Created, firstResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Created, secondResponse.StatusCode);

        // THEN: Both contacts have distinct UUIDs
        var json1 = await firstResponse.Content.ReadAsStringAsync();
        var json2 = await secondResponse.Content.ReadAsStringAsync();

        using var doc1 = JsonDocument.Parse(json1);
        using var doc2 = JsonDocument.Parse(json2);

        doc1.RootElement.TryGetProperty("id", out var id1);
        doc2.RootElement.TryGetProperty("id", out var id2);

        Assert.NotEqual(id1.GetString(), id2.GetString());
    }
}
