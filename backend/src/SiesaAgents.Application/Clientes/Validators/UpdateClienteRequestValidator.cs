using FluentValidation;
using SiesaAgents.Application.Clientes.DTOs;

namespace SiesaAgents.Application.Clientes.Validators;

public class UpdateClienteRequestValidator : AbstractValidator<UpdateClienteRequest>
{
    public UpdateClienteRequestValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Nit).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Telefono).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Ciudad).NotEmpty().MaximumLength(100);
    }
}
