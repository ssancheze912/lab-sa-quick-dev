using FluentValidation;

namespace SiesaAgents.API.Endpoints;

/// <summary>
/// Endpoint filter that runs FluentValidation for a specific argument type and
/// returns a Problem Details RFC 7807 400 response when validation fails.
/// Keeps Minimal API endpoints clean of manual validation branching (Story 2.3).
/// </summary>
public sealed class ValidationEndpointFilter<T> : IEndpointFilter where T : class
{
    private readonly IValidator<T> _validator;

    public ValidationEndpointFilter(IValidator<T> validator)
    {
        _validator = validator;
    }

    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var candidate = context.Arguments.OfType<T>().FirstOrDefault();
        if (candidate is null)
        {
            return await next(context);
        }

        var result = await _validator.ValidateAsync(candidate, context.HttpContext.RequestAborted);
        if (result.IsValid)
        {
            return await next(context);
        }

        var errors = result.Errors
            .GroupBy(f => ToCamelCase(f.PropertyName))
            .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());

        return Results.ValidationProblem(
            errors,
            title: "Validation Failed",
            statusCode: StatusCodes.Status400BadRequest);
    }

    /// <summary>
    /// Converts a FluentValidation <c>PropertyName</c> (e.g. <c>"Nombre"</c>, or
    /// <c>"Address.City"</c> for nested rules) into a camelCase JSON key. Guards
    /// against an empty first segment — a defensive check for rules that emit a
    /// blank <c>PropertyName</c> (rare but possible for cross-property rules).
    /// </summary>
    private static string ToCamelCase(string propertyName)
    {
        if (string.IsNullOrEmpty(propertyName))
        {
            return propertyName;
        }
        return char.ToLowerInvariant(propertyName[0]) + propertyName[1..];
    }
}
