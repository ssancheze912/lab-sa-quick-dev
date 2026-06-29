using FluentValidation;
using SiesaAgents.Application.Clientes.Commands;

namespace SiesaAgents.Application.Clientes.Validators;

public sealed class CreateClienteRequestValidator : AbstractValidator<CreateClienteCommand>
{
    public CreateClienteRequestValidator()
    {
        RuleFor(x => x.Nombre)
            .NotEmpty()
            .WithMessage("El campo Nombre es obligatorio.");

        RuleFor(x => x.Nit)
            .NotEmpty()
            .WithMessage("El campo NIT es obligatorio.");

        RuleFor(x => x.Telefono)
            .NotEmpty()
            .WithMessage("El campo Teléfono es obligatorio.");

        RuleFor(x => x.Ciudad)
            .NotEmpty()
            .WithMessage("El campo Ciudad es obligatorio.");
    }
}
