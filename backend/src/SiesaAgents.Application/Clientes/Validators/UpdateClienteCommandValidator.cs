using FluentValidation;
using SiesaAgents.Application.Clientes.Commands;

namespace SiesaAgents.Application.Clientes.Validators;

public class UpdateClienteCommandValidator : AbstractValidator<UpdateClienteCommand>
{
    public UpdateClienteCommandValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty().WithMessage("El nombre es requerido");
        RuleFor(x => x.Nit).NotEmpty().WithMessage("El NIT/RUC es requerido");
        RuleFor(x => x.Telefono).NotEmpty().WithMessage("El teléfono es requerido");
        RuleFor(x => x.Ciudad).NotEmpty().WithMessage("La ciudad es requerida");
    }
}
