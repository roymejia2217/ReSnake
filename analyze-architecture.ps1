# Script para análisis de arquitectura del proyecto ReSnake
# Ejecuta el servidor MCP de análisis de ADR y genera reportes

Write-Host "🔍 Iniciando análisis de arquitectura del proyecto ReSnake..." -ForegroundColor Green

# Configurar variables de entorno
$env:PROJECT_PATH = "C:\Users\Roy\Downloads\ReSnake"
$env:ADR_DIRECTORY = "docs/adrs"
$env:LOG_LEVEL = "INFO"
$env:CACHE_ENABLED = "true"

Write-Host "📁 Proyecto: $env:PROJECT_PATH" -ForegroundColor Yellow
Write-Host "📚 ADR Directory: $env:ADR_DIRECTORY" -ForegroundColor Yellow

# Verificar que el directorio de ADRs existe
if (Test-Path "docs\adrs") {
    Write-Host "✅ Directorio ADR encontrado" -ForegroundColor Green
    
    # Listar ADRs existentes
    $adrs = Get-ChildItem "docs\adrs\*.md"
    Write-Host "📄 ADRs encontrados:" -ForegroundColor Cyan
    foreach ($adr in $adrs) {
        Write-Host "   - $($adr.Name)" -ForegroundColor White
    }
} else {
    Write-Host "❌ Directorio ADR no encontrado" -ForegroundColor Red
    exit 1
}

# Ejecutar health check
Write-Host "`n🔧 Ejecutando health check..." -ForegroundColor Green
npx mcp-adr-analysis-server --test

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Health check exitoso" -ForegroundColor Green
    Write-Host "`n🚀 Servidor MCP listo para análisis de arquitectura" -ForegroundColor Green
    Write-Host "`n📊 Análisis disponible:" -ForegroundColor Cyan
    Write-Host "   - Análisis de decisiones arquitectónicas" -ForegroundColor White
    Write-Host "   - Evaluación de patrones de diseño" -ForegroundColor White
    Write-Host "   - Análisis de dependencias" -ForegroundColor White
    Write-Host "   - Recomendaciones de mejora" -ForegroundColor White
} else {
    Write-Host "❌ Error en health check" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎯 Para usar el servidor MCP, conéctate desde tu IDE con la configuración:" -ForegroundColor Yellow
Write-Host "   - Comando: npx mcp-adr-analysis-server" -ForegroundColor White
Write-Host "   - Proyecto: $($env:PROJECT_PATH)" -ForegroundColor White
