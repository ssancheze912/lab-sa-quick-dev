namespace SiesaAgents.Domain.Exceptions;

/// <summary>
/// Thrown when a requested resource is not found.
/// Maps to HTTP 404 Not Found.
/// </summary>
public sealed class NotFoundException(string message) : Exception(message);
