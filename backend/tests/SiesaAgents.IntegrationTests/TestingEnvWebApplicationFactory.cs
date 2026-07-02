// -----------------------------------------------------------------------------
//  Story 1.3 — Backend Database Foundation
//  RED-phase ATDD test support: WebApplicationFactory<Program> customized to
//  run in the "Testing" environment, which unlocks the internal
//  /api/v1/test-error endpoint registered in Program.cs (Task 5 of Story 1.3).
//
//  This file WILL NOT COMPILE until the DEV team implements:
//    - Task 4: `public partial class Program;` sentinel at the bottom of
//      backend/src/SiesaAgents.API/Program.cs
//    - Task 8: creation of the SiesaAgents.IntegrationTests project referencing
//      SiesaAgents.API and adding the Microsoft.AspNetCore.Mvc.Testing package
//  Its intentional inability to compile IS the RED-phase signal for AC #3, #7.
// -----------------------------------------------------------------------------
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace SiesaAgents.IntegrationTests;

public class TestingEnvWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Unlocks the /api/v1/test-error endpoint that is ONLY mapped when
        // Environment == "Testing" (see Task 5 of Story 1.3). This keeps the
        // dev/prod surface clean while giving integration tests a deterministic
        // exception-throwing endpoint to exercise ExceptionHandlingMiddleware.
        builder.UseEnvironment("Testing");
    }
}
