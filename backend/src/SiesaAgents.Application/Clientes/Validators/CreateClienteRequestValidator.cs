using FluentValidation;
using SiesaAgents.Application.Clientes.DTOs;

namespace SiesaAgents.Application.Clientes.Validators;

public class CreateClienteRequestValidator : AbstractValidator<CreateClienteRequest>
{
    public CreateClienteRequestValidator()
    {
        // MaximumLength mirrors ClienteConfiguration's DB column limits (200/50/30/100) so an
        // over-length submission fails fast with a 400 instead of only surfacing at the
        // database's character varying constraint as a generic 500.
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Nit).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Telefono).NotEmpty().MaximumLength(30);
        RuleFor(x => x.Ciudad).NotEmpty().MaximumLength(100);
    }
}
