using FluentValidation;
using SiesaAgents.Application.Clientes.DTOs;

namespace SiesaAgents.Application.Clientes.Validators;

public class CreateClienteRequestValidator : AbstractValidator<CreateClienteRequest>
{
    public CreateClienteRequestValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty();
        RuleFor(x => x.Nit).NotEmpty();
        RuleFor(x => x.Telefono).NotEmpty();
        RuleFor(x => x.Ciudad).NotEmpty();
    }
}
