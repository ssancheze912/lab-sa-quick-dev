using FluentValidation;
using SiesaAgents.Application.Commands.Clientes;

namespace SiesaAgents.Application.Validators;

public class CreateClienteRequestValidator : AbstractValidator<CreateClienteCommand>
{
    public CreateClienteRequestValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty();
        RuleFor(x => x.Nit).NotEmpty();
        RuleFor(x => x.Telefono).NotEmpty();
        RuleFor(x => x.Ciudad).NotEmpty();
    }
}
