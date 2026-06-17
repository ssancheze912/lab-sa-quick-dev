using FluentValidation;

namespace SiesaAgents.Application.Clientes.Commands;

public class UpdateClienteCommandValidator : AbstractValidator<UpdateClienteCommand>
{
    public UpdateClienteCommandValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty().WithMessage("El nombre es requerido.").MaximumLength(200);
        RuleFor(x => x.NitRuc).NotEmpty().WithMessage("El NIT/RUC es requerido.").MaximumLength(50);
        RuleFor(x => x.Telefono).NotEmpty().WithMessage("El teléfono es requerido.").MaximumLength(50);
        RuleFor(x => x.Ciudad).NotEmpty().WithMessage("La ciudad es requerida.").MaximumLength(100);
    }
}
