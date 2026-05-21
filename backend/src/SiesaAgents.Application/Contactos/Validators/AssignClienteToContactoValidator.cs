using FluentValidation;
using SiesaAgents.Application.Contactos.DTOs;

namespace SiesaAgents.Application.Contactos.Validators;

public class AssignClienteToContactoValidator : AbstractValidator<AssignClienteToContactoRequest>
{
    public AssignClienteToContactoValidator()
    {
        When(x => x.ClienteId.HasValue, () =>
        {
            RuleFor(x => x.ClienteId!.Value)
                .NotEqual(Guid.Empty).WithMessage("El clienteId no puede ser un UUID vacío");
        });
    }
}
