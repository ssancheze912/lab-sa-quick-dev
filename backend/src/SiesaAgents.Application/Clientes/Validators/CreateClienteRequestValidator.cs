using FluentValidation;
using SiesaAgents.Application.Clientes.DTOs;

namespace SiesaAgents.Application.Clientes.Validators;

public class CreateClienteRequestValidator : AbstractValidator<CreateClienteRequest>
{
    public CreateClienteRequestValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty().WithMessage("Este campo es requerido");
        RuleFor(x => x.Nit).NotEmpty().WithMessage("El NIT no puede estar vacío");
        RuleFor(x => x.Telefono).NotEmpty().WithMessage("Este campo es requerido");
        RuleFor(x => x.Ciudad).NotEmpty().WithMessage("Este campo es requerido");
    }
}
