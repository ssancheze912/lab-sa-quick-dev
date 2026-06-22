namespace SiesaAgents.Domain.Exceptions;

/// <summary>
/// Thrown when an operation conflicts with the current resource state.
/// Maps to HTTP 409 Conflict.
/// </summary>
public sealed class ConflictException(string message) : Exception(message);
