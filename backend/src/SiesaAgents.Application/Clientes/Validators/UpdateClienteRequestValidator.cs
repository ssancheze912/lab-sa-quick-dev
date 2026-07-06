using FluentValidation;
using SiesaAgents.Application.Clientes.DTOs;

namespace SiesaAgents.Application.Clientes.Validators;

public class UpdateClienteRequestValidator : AbstractValidator<UpdateClienteRequest>
{
    public UpdateClienteRequestValidator()
    {
        // MaximumLength mirrors ClienteConfiguration's DB column limits (200/50/30/100), same
        // as CreateClienteRequestValidator, present from the start (Story 2.3's code-review
        // lesson).
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Nit).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Telefono).NotEmpty().MaximumLength(30);
        RuleFor(x => x.Ciudad).NotEmpty().MaximumLength(100);
    }
}
