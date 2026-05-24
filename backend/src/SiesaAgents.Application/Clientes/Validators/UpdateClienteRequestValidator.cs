using FluentValidation;
using SiesaAgents.Application.Clientes.DTOs;

namespace SiesaAgents.Application.Clientes.Validators;

public class UpdateClienteRequestValidator : AbstractValidator<UpdateClienteRequest>
{
    public UpdateClienteRequestValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Telefono).MaximumLength(50).When(x => x.Telefono is not null);
        RuleFor(x => x.Ciudad).MaximumLength(100).When(x => x.Ciudad is not null);
    }
}
