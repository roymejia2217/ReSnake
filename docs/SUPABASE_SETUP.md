# Configuración de Supabase para ReSnake

## 📋 Resumen

Este documento explica cómo configurar Supabase para habilitar el sistema de puntuaciones en línea en ReSnake. El sistema está diseñado para funcionar de forma híbrida: **offline-first** con sincronización automática cuando hay conexión.

## 🚀 Características Implementadas

- ✅ **Sincronización automática** de puntuaciones
- ✅ **Leaderboard global** en tiempo real
- ✅ **Detección de récords mundiales**
- ✅ **Rate limiting** para prevenir abuso
- ✅ **Validación robusta** de datos
- ✅ **Funcionamiento offline** con sincronización posterior
- ✅ **Seguridad con Row Level Security (RLS)**

## 🛠️ Configuración Paso a Paso

### 1. Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Anota la **URL** y **anon key** de tu proyecto

### 2. Configurar la Base de Datos

Ejecuta los siguientes comandos SQL en el **SQL Editor** de Supabase:

```sql
-- Crear tabla de puntuaciones
CREATE TABLE scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10000),
  mode TEXT NOT NULL CHECK (mode IN ('classic', 'speed', 'wall')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX idx_scores_mode_score ON scores(mode, score DESC);
CREATE INDEX idx_scores_player_name ON scores(player_name);
CREATE INDEX idx_scores_created_at ON scores(created_at DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Política para lectura pública (todos pueden leer puntuaciones)
CREATE POLICY "Public read access to scores" ON scores
FOR SELECT USING (true);

-- Política para inserción con validación
CREATE POLICY "Allow score insertion with validation" ON scores
FOR INSERT WITH CHECK (
  score >= 0 AND 
  score <= 10000 AND
  length(player_name) >= 2 AND
  length(player_name) <= 20 AND
  mode IN ('classic', 'speed', 'wall')
);

-- Política para actualización (opcional, para futuras funcionalidades)
CREATE POLICY "Allow score updates" ON scores
FOR UPDATE USING (true) WITH CHECK (
  score >= 0 AND 
  score <= 10000
);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_scores_updated_at
  BEFORE UPDATE ON scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 3. Configurar el Proyecto Local

1. **Copia el archivo de ejemplo:**
   ```bash
   cp env.example .env
   ```

2. **Edita `.env` con tus credenciales:**
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-clave-anonima-aqui
   VITE_SUPABASE_TABLE_NAME=scores
   ```

3. **Instala dependencias:**
   ```bash
   npm install
   ```

4. **Actualiza la configuración en el código:**
   
   Edita `src/config/supabase.ts`:
   ```typescript
   export const SUPABASE_CONFIG: SupabaseConfig = {
     url: 'https://tu-proyecto.supabase.co', // Tu URL real
     anonKey: 'tu-clave-anonima-aqui', // Tu clave real
     tableName: 'scores'
   };
   ```

### 4. Configurar GitHub Pages

1. **Habilita GitHub Pages en tu repositorio:**
   - Ve a Settings → Pages
   - Source: GitHub Actions

2. **El workflow ya está configurado** en `.github/workflows/deploy.yml`

3. **Haz push a main** para desplegar automáticamente

## 🔒 Seguridad

### Row Level Security (RLS)

El sistema usa **Row Level Security** para proteger los datos:

- ✅ **Lectura pública**: Cualquiera puede ver las puntuaciones
- ✅ **Inserción validada**: Solo se permiten datos válidos
- ✅ **Límites de puntuación**: 0-10,000 puntos máximo
- ✅ **Validación de nombres**: 2-20 caracteres, solo alfanuméricos
- ✅ **Modos válidos**: Solo 'classic', 'speed', 'wall'

### Rate Limiting

El sistema incluye rate limiting en el cliente:

- ✅ **10 inserciones por minuto** por jugador
- ✅ **100 inserciones por hora** por jugador
- ✅ **Almacenamiento en localStorage** para tracking

### Validación de Datos

- ✅ **Validación en cliente** antes de enviar
- ✅ **Validación en servidor** con RLS
- ✅ **Sanitización de nombres** de usuario
- ✅ **Verificación de tipos** de datos

## 🎮 Funcionalidades del Sistema

### Sincronización Automática

- **Offline-first**: El juego funciona sin conexión
- **Sincronización en segundo plano**: No interrumpe el gameplay
- **Reintentos automáticos**: Si falla la sincronización
- **Deduplicación**: Evita puntuaciones duplicadas

### Leaderboard Híbrido

- **Datos locales**: Siempre disponibles
- **Datos globales**: Cuando hay conexión
- **Combinación inteligente**: Prioriza datos locales
- **Fallback graceful**: Si falla la conexión

### Detección de Récords

- **Récords locales**: Inmediatos
- **Récords mundiales**: Verificación en línea
- **Notificaciones**: Al usuario cuando logra un récord

## 🚨 Solución de Problemas

### Error: "Supabase no disponible"

**Causa**: Problema de conexión o configuración incorrecta

**Solución**:
1. Verifica que la URL y clave sean correctas
2. Revisa la consola del navegador para errores
3. Verifica que RLS esté habilitado en Supabase

### Error: "Rate limit exceeded"

**Causa**: Demasiadas puntuaciones enviadas

**Solución**:
- Espera unos minutos antes de intentar de nuevo
- El límite se resetea automáticamente

### Error: "Datos de puntuación inválidos"

**Causa**: Puntuación fuera de rango o nombre inválido

**Solución**:
- Verifica que la puntuación esté entre 0-10,000
- El nombre debe tener 2-20 caracteres alfanuméricos

### Puntuaciones no se sincronizan

**Causa**: Problema de red o configuración

**Solución**:
1. Verifica la conexión a internet
2. Revisa la consola para errores
3. Verifica que la tabla 'scores' exista en Supabase

## 📊 Monitoreo

### Métricas en Supabase

- **Dashboard**: Ve a tu proyecto → Dashboard
- **Logs**: Revisa los logs de API
- **Métricas**: Monitorea el uso de la base de datos

### Límites del Plan Gratuito

- **500MB** de base de datos
- **2GB** de ancho de banda
- **50,000 requests/mes**

## 🔄 Actualizaciones Futuras

### Funcionalidades Planificadas

- [ ] **Autenticación de usuarios** (opcional)
- [ ] **Estadísticas avanzadas** por jugador
- [ ] **Torneos y eventos** especiales
- [ ] **Notificaciones push** para récords
- [ ] **API pública** para desarrolladores

### Mejoras de Seguridad

- [ ] **Validación de IP** para rate limiting
- [ ] **Detección de bots** y puntuaciones falsas
- [ ] **Encriptación** de datos sensibles
- [ ] **Auditoría** de cambios en la base de datos

## 📞 Soporte

Si tienes problemas con la configuración:

1. **Revisa este documento** completamente
2. **Verifica la consola** del navegador
3. **Revisa los logs** de Supabase
4. **Consulta la documentación** de Supabase

---

**¡Disfruta jugando ReSnake con puntuaciones en línea! 🐍🏆**
