/**
 * Configuración de Supabase
 * Centraliza la configuración del cliente Supabase para el sistema de puntuaciones en línea
 * Principio: Single Responsibility (SOLID)
 */

import type { SupabaseConfig } from '@/core/gameTypes';

/**
 * Configuración de Supabase para GitHub Pages
 * IMPORTANTE: Estas claves están diseñadas para ser públicas
 * La seguridad real está en Row Level Security (RLS) en la base de datos
 */
export const SUPABASE_CONFIG: SupabaseConfig = {
  url: 'https://oderixaxwztunjpgnmnl.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kZXJpeGF4d3p0dW5qcGdubW5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNjE4OTMsImV4cCI6MjA3NDgzNzg5M30.Rx16KzKypJaHI4JX7NJwDMc6gHRUS-jHoq6SuZQsrhw',
  tableName: 'scores'
};

/**
 * Configuración de validación para Supabase
 * Define límites y restricciones para mantener la integridad de los datos
 */
export const SUPABASE_VALIDATION = {
  MAX_SCORE: 10000, // Puntuación máxima permitida
  MIN_SCORE: 0, // Puntuación mínima permitida
  MAX_NAME_LENGTH: 20, // Longitud máxima del nombre (consistente con PLAYER_NAME_CONSTRAINTS)
  MIN_NAME_LENGTH: 2, // Longitud mínima del nombre (consistente con PLAYER_NAME_CONSTRAINTS)
  MAX_SCORES_PER_SYNC: 50, // Máximo de puntuaciones a sincronizar por lote
  SYNC_RETRY_ATTEMPTS: 3, // Intentos de reintento para sincronización
  SYNC_RETRY_DELAY: 1000, // Delay entre reintentos en ms
} as const;

/**
 * Configuración de rate limiting
 * Previene abuso del sistema de puntuaciones
 */
export const RATE_LIMITING = {
  MAX_INSERTS_PER_MINUTE: 10, // Máximo de inserciones por minuto por jugador
  MAX_INSERTS_PER_HOUR: 100, // Máximo de inserciones por hora por jugador
  STORAGE_KEY_PREFIX: 'supabase_rate_limit_', // Prefijo para localStorage
} as const;

/**
 * Mensajes de error estandarizados
 * Mantiene consistencia en el manejo de errores
 */
export const SUPABASE_ERROR_MESSAGES = {
  CONNECTION_FAILED: 'Error de conexión con el servidor',
  VALIDATION_FAILED: 'Datos de puntuación inválidos',
  RATE_LIMIT_EXCEEDED: 'Demasiadas puntuaciones enviadas. Intenta más tarde',
  SYNC_FAILED: 'Error al sincronizar puntuaciones',
  INVALID_CONFIG: 'Configuración de Supabase inválida',
} as const;
