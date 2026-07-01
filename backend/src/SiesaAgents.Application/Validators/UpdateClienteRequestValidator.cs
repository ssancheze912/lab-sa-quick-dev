using FluentValidation;
using SiesaAgents.Application.Commands.Clientes;

namespace SiesaAgents.Application.Validators;

public class UpdateClienteRequestValidator : AbstractValidator<UpdateClienteCommand>
{
    public UpdateClienteRequestValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty();
        RuleFor(x => x.Nit).NotEmpty();
        RuleFor(x => x.Telefono).NotEmpty();
        RuleFor(x => x.Ciudad).NotEmpty();
    }
}
