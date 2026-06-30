using FluentValidation;
using SiesaAgents.Application.Clientes.Commands;

namespace SiesaAgents.Application.Clientes.Validators;

public class CreateClienteCommandValidator : AbstractValidator<CreateClienteCommand>
{
    public CreateClienteCommandValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty().WithMessage("Nombre es requerido.");
        RuleFor(x => x.Nit).NotEmpty().WithMessage("NIT/RUC es requerido.");
        RuleFor(x => x.Telefono).NotEmpty().WithMessage("Teléfono es requerido.");
        RuleFor(x => x.Ciudad).NotEmpty().WithMessage("Ciudad es requerida.");
    }
}
