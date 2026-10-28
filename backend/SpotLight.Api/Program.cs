using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using SpotLight.Api.Authentication;
using SpotLight.Api.Configuration;
using SpotLight.Api.Data;
using SpotLight.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<ApiExceptionHandler>();
builder.Services.AddSingleton(TimeProvider.System);

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUser, HttpContextCurrentUser>();
builder.Services.AddScoped<IGameService, GameService>();

builder.Services.AddSupabaseAuthentication(builder.Configuration);
builder.Services.AddSpotLightData(builder.Configuration);

builder.Services
    .AddOptions<CorsSettings>()
    .Bind(builder.Configuration.GetRequiredSection(CorsSettings.SectionName))
    .Validate(CorsSettings.HasValidOrigins, "Cors:AllowedOrigins contém uma origem inválida.")
    .ValidateOnStart();

var corsSettings = builder.Configuration
    .GetRequiredSection(CorsSettings.SectionName)
    .Get<CorsSettings>()
    ?? throw new InvalidOperationException("A configuração Cors não foi encontrada.");

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy
            .WithOrigins(corsSettings.AllowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod());
});

builder.Services
    .AddHealthChecks()
    .AddCheck(
        "self",
        () => HealthCheckResult.Healthy(),
        tags: ["live", "ready"]);

var app = builder.Build();

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = registration => registration.Tags.Contains("live"),
    ResponseWriter = HealthCheckResponseWriter.WriteAsync,
});
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = registration => registration.Tags.Contains("ready"),
    ResponseWriter = HealthCheckResponseWriter.WriteAsync,
});
app.MapHealthChecks("/health", new HealthCheckOptions
{
    Predicate = registration => registration.Tags.Contains("ready"),
    ResponseWriter = HealthCheckResponseWriter.WriteAsync,
});

app.Run();

public partial class Program;
