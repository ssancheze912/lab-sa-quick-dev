using FluentValidation;
using SiesaAgents.Application.Clientes.DTOs;

namespace SiesaAgents.Application.Clientes.Validators;

public class CreateClienteRequestValidator : AbstractValidator<CreateClienteRequest>
{
    public CreateClienteRequestValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty().WithMessage("El nombre es requerido.");
        RuleFor(x => x.NitRuc).NotEmpty().WithMessage("El NIT/RUC es requerido.");
        RuleFor(x => x.Telefono).NotEmpty().WithMessage("El teléfono es requerido.");
        RuleFor(x => x.Ciudad).NotEmpty().WithMessage("La ciudad es requerida.");
    }
}
