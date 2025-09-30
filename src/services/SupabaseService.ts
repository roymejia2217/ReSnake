/**
 * Servicio de Supabase
 * Gestiona la sincronización de puntuaciones con la base de datos en línea
 * Principio: Single Responsibility (SOLID)
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { ScoreEntry, GameMode } from '@/core/gameTypes';
import { PLAYER_NAME_CONSTRAINTS } from '@/core/gameTypes';
import { 
  SUPABASE_CONFIG, 
  SUPABASE_VALIDATION, 
  RATE_LIMITING, 
  SUPABASE_ERROR_MESSAGES 
} from '@/config/supabase';

/**
 * Interfaz para la respuesta de Supabase
 * Mantiene consistencia con los tipos existentes
 */
interface SupabaseScoreEntry {
  id: string;
  player_name: string;
  score: number;
  mode: GameMode;
  created_at: string;
  updated_at: string;
}

/**
 * Interfaz para el resultado de sincronización
 * Proporciona información detallada sobre el proceso
 */
interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: string[];
}

export class SupabaseService {
  private supabase!: SupabaseClient;
  private isInitialized = false;
  private connectionStatus: 'connected' | 'disconnected' | 'unknown' = 'unknown';

  constructor() {
    this.initializeClient();
  }

  /**
   * Inicializa el cliente de Supabase
   * Valida la configuración antes de crear la conexión
   */
  private initializeClient(): void {
    try {
      this.validateConfig();
      
      this.supabase = createClient(
        SUPABASE_CONFIG.url,
        SUPABASE_CONFIG.anonKey,
        {
          auth: {
            persistSession: false // No necesitamos autenticación para puntuaciones públicas
          }
        }
      );
      
      this.isInitialized = true;
      this.testConnection();
    } catch (error) {
      console.error('Error initializing Supabase client:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Valida la configuración de Supabase
   * @throws {Error} Si la configuración es inválida
   */
  private validateConfig(): void {
    if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
      throw new Error(SUPABASE_ERROR_MESSAGES.INVALID_CONFIG);
    }
    
    if (!SUPABASE_CONFIG.url.startsWith('https://')) {
      throw new Error('URL de Supabase debe usar HTTPS');
    }
    
    if (SUPABASE_CONFIG.anonKey.length < 50) {
      throw new Error('Clave anónima de Supabase parece inválida');
    }
  }

  /**
   * Prueba la conexión con Supabase
   * Verifica que el servicio esté disponible
   */
  private async testConnection(): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(SUPABASE_CONFIG.tableName)
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        this.connectionStatus = 'disconnected';
        console.warn('Supabase connection test failed:', error.message);
      } else {
        this.connectionStatus = 'connected';
        console.log('Supabase connection established');
      }
    } catch (error) {
      this.connectionStatus = 'disconnected';
      console.warn('Supabase connection test error:', error);
    }
  }

  /**
   * Verifica si el servicio está disponible
   */
  isAvailable(): boolean {
    return this.isInitialized && this.connectionStatus === 'connected';
  }

  /**
   * Valida una entrada de puntuación antes de enviarla
   * Aplica las mismas validaciones que el sistema local
   */
  private validateScoreEntry(entry: ScoreEntry): void {
    // Validación de puntuación
    if (typeof entry.score !== 'number' || isNaN(entry.score)) {
      throw new Error('Puntuación debe ser un número válido');
    }
    
    if (entry.score < SUPABASE_VALIDATION.MIN_SCORE || entry.score > SUPABASE_VALIDATION.MAX_SCORE) {
      throw new Error(`Puntuación debe estar entre ${SUPABASE_VALIDATION.MIN_SCORE} y ${SUPABASE_VALIDATION.MAX_SCORE}`);
    }
    
    // Validación de nombre (consistente con UserService)
    if (!entry.playerName || typeof entry.playerName !== 'string') {
      throw new Error('Nombre de jugador es requerido');
    }
    
    const trimmedName = entry.playerName.trim();
    if (trimmedName.length < PLAYER_NAME_CONSTRAINTS.MIN_LENGTH || 
        trimmedName.length > PLAYER_NAME_CONSTRAINTS.MAX_LENGTH) {
      throw new Error(`Nombre debe tener entre ${PLAYER_NAME_CONSTRAINTS.MIN_LENGTH} y ${PLAYER_NAME_CONSTRAINTS.MAX_LENGTH} caracteres`);
    }
    
    if (!PLAYER_NAME_CONSTRAINTS.PATTERN.test(trimmedName)) {
      throw new Error('Nombre contiene caracteres no permitidos');
    }
    
    // Validación de modo
    if (!['classic', 'speed', 'wall'].includes(entry.mode)) {
      throw new Error('Modo de juego inválido');
    }
    
    // Validación de timestamp
    if (!entry.timestamp || typeof entry.timestamp !== 'number' || entry.timestamp <= 0) {
      throw new Error('Timestamp inválido');
    }
  }

  /**
   * Verifica rate limiting para un jugador
   * Previene abuso del sistema
   */
  private checkRateLimit(playerName: string): void {
    const now = Date.now();
    const minuteKey = `${RATE_LIMITING.STORAGE_KEY_PREFIX}minute_${playerName}`;
    const hourKey = `${RATE_LIMITING.STORAGE_KEY_PREFIX}hour_${playerName}`;
    
    // Verificar límite por minuto
    const minuteData = localStorage.getItem(minuteKey);
    if (minuteData) {
      const { count, timestamp } = JSON.parse(minuteData);
      if (now - timestamp < 60000) { // 1 minuto
        if (count >= RATE_LIMITING.MAX_INSERTS_PER_MINUTE) {
          throw new Error(SUPABASE_ERROR_MESSAGES.RATE_LIMIT_EXCEEDED);
        }
      }
    }
    
    // Verificar límite por hora
    const hourData = localStorage.getItem(hourKey);
    if (hourData) {
      const { count, timestamp } = JSON.parse(hourData);
      if (now - timestamp < 3600000) { // 1 hora
        if (count >= RATE_LIMITING.MAX_INSERTS_PER_HOUR) {
          throw new Error(SUPABASE_ERROR_MESSAGES.RATE_LIMIT_EXCEEDED);
        }
      }
    }
  }

  /**
   * Actualiza los contadores de rate limiting
   */
  private updateRateLimit(playerName: string): void {
    const now = Date.now();
    const minuteKey = `${RATE_LIMITING.STORAGE_KEY_PREFIX}minute_${playerName}`;
    const hourKey = `${RATE_LIMITING.STORAGE_KEY_PREFIX}hour_${playerName}`;
    
    // Actualizar contador por minuto
    const minuteData = localStorage.getItem(minuteKey);
    if (minuteData) {
      const { count, timestamp } = JSON.parse(minuteData);
      if (now - timestamp < 60000) {
        localStorage.setItem(minuteKey, JSON.stringify({ count: count + 1, timestamp }));
      } else {
        localStorage.setItem(minuteKey, JSON.stringify({ count: 1, timestamp: now }));
      }
    } else {
      localStorage.setItem(minuteKey, JSON.stringify({ count: 1, timestamp: now }));
    }
    
    // Actualizar contador por hora
    const hourData = localStorage.getItem(hourKey);
    if (hourData) {
      const { count, timestamp } = JSON.parse(hourData);
      if (now - timestamp < 3600000) {
        localStorage.setItem(hourKey, JSON.stringify({ count: count + 1, timestamp }));
      } else {
        localStorage.setItem(hourKey, JSON.stringify({ count: 1, timestamp: now }));
      }
    } else {
      localStorage.setItem(hourKey, JSON.stringify({ count: 1, timestamp: now }));
    }
  }

  /**
   * Convierte ScoreEntry local a formato de Supabase
   * Mantiene consistencia de datos
   */
  private convertToSupabaseFormat(entry: ScoreEntry): Partial<SupabaseScoreEntry> {
    return {
      player_name: entry.playerName,
      score: entry.score,
      mode: entry.mode,
      created_at: new Date(entry.timestamp).toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Convierte respuesta de Supabase a ScoreEntry local
   * Mantiene compatibilidad con el sistema existente
   */
  private convertFromSupabaseFormat(supabaseEntry: SupabaseScoreEntry): ScoreEntry {
    return {
      id: supabaseEntry.id,
      playerId: '', // No tenemos playerId en Supabase, se puede generar si es necesario
      playerName: supabaseEntry.player_name,
      score: supabaseEntry.score,
      mode: supabaseEntry.mode,
      timestamp: new Date(supabaseEntry.created_at).getTime(),
      syncedToCloud: true,
      cloudId: supabaseEntry.id
    };
  }

  /**
   * Sincroniza una puntuación individual con Supabase
   * Incluye validación y rate limiting
   */
  async syncScore(entry: ScoreEntry): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error(SUPABASE_ERROR_MESSAGES.CONNECTION_FAILED);
    }
    
    this.validateScoreEntry(entry);
    this.checkRateLimit(entry.playerName);
    
    const supabaseData = this.convertToSupabaseFormat(entry);
    
    const { data, error } = await this.supabase
      .from(SUPABASE_CONFIG.tableName)
      .insert(supabaseData)
      .select('id')
      .single();
    
    if (error) {
      throw new Error(`Error al sincronizar puntuación: ${error.message}`);
    }
    
    this.updateRateLimit(entry.playerName);
    return data.id;
  }

  /**
   * Sincroniza múltiples puntuaciones en lote
   * Optimiza el rendimiento para múltiples entradas
   */
  async syncScores(entries: ScoreEntry[]): Promise<SyncResult> {
    if (!this.isAvailable()) {
      throw new Error(SUPABASE_ERROR_MESSAGES.CONNECTION_FAILED);
    }
    
    if (entries.length === 0) {
      return { success: true, syncedCount: 0, failedCount: 0, errors: [] };
    }
    
    if (entries.length > SUPABASE_VALIDATION.MAX_SCORES_PER_SYNC) {
      throw new Error(`Máximo ${SUPABASE_VALIDATION.MAX_SCORES_PER_SYNC} puntuaciones por sincronización`);
    }
    
    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      errors: []
    };
    
    // Validar todas las entradas primero
    for (const entry of entries) {
      try {
        this.validateScoreEntry(entry);
        this.checkRateLimit(entry.playerName);
      } catch (error) {
        result.failedCount++;
        result.errors.push(`Validación fallida para ${entry.playerName}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }
    
    if (result.errors.length > 0) {
      result.success = false;
      return result;
    }
    
    // Convertir todas las entradas
    const supabaseData = entries.map(entry => this.convertToSupabaseFormat(entry));
    
    // Insertar en lote
    const { data, error } = await this.supabase
      .from(SUPABASE_CONFIG.tableName)
      .insert(supabaseData)
      .select('id');
    
    if (error) {
      result.success = false;
      result.failedCount = entries.length;
      result.errors.push(`Error en lote: ${error.message}`);
    } else {
      result.syncedCount = data?.length || 0;
      
      // Actualizar rate limiting para todos los jugadores únicos
      const uniquePlayers = [...new Set(entries.map(e => e.playerName))];
      uniquePlayers.forEach(player => this.updateRateLimit(player));
    }
    
    return result;
  }

  /**
   * Obtiene el leaderboard global desde Supabase
   * Soporta filtrado por modo y límite de resultados
   */
  async getGlobalLeaderboard(limit: number = 20, mode?: GameMode): Promise<ScoreEntry[]> {
    if (!this.isAvailable()) {
      throw new Error(SUPABASE_ERROR_MESSAGES.CONNECTION_FAILED);
    }
    
    let query = this.supabase
      .from(SUPABASE_CONFIG.tableName)
      .select('*')
      .order('score', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (mode) {
      query = query.eq('mode', mode);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Error al obtener leaderboard: ${error.message}`);
    }
    
    return data?.map(entry => this.convertFromSupabaseFormat(entry)) || [];
  }

  /**
   * Obtiene las mejores puntuaciones de un jugador específico
   */
  async getPlayerScores(playerName: string, limit: number = 10): Promise<ScoreEntry[]> {
    if (!this.isAvailable()) {
      throw new Error(SUPABASE_ERROR_MESSAGES.CONNECTION_FAILED);
    }
    
    const { data, error } = await this.supabase
      .from(SUPABASE_CONFIG.tableName)
      .select('*')
      .eq('player_name', playerName)
      .order('score', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      throw new Error(`Error al obtener puntuaciones del jugador: ${error.message}`);
    }
    
    return data?.map(entry => this.convertFromSupabaseFormat(entry)) || [];
  }

  /**
   * Obtiene estadísticas globales por modo
   */
  async getGlobalStats(): Promise<Record<GameMode, { count: number; maxScore: number; avgScore: number }>> {
    if (!this.isAvailable()) {
      throw new Error(SUPABASE_ERROR_MESSAGES.CONNECTION_FAILED);
    }
    
    const modes: GameMode[] = ['classic', 'speed', 'wall'];
    const stats: any = {};
    
    for (const mode of modes) {
      const { data, error } = await this.supabase
        .from(SUPABASE_CONFIG.tableName)
        .select('score')
        .eq('mode', mode);
      
      if (error) {
        console.warn(`Error obteniendo estadísticas para modo ${mode}:`, error.message);
        stats[mode] = { count: 0, maxScore: 0, avgScore: 0 };
        continue;
      }
      
      const scores = data?.map(d => d.score) || [];
      stats[mode] = {
        count: scores.length,
        maxScore: scores.length > 0 ? Math.max(...scores) : 0,
        avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
      };
    }
    
    return stats;
  }

  /**
   * Verifica si una puntuación es un récord mundial
   */
  async isWorldRecord(score: number, mode: GameMode): Promise<boolean> {
    if (!this.isAvailable()) {
      return false; // Si no hay conexión, asumimos que no es récord
    }
    
    try {
      const { data, error } = await this.supabase
        .from(SUPABASE_CONFIG.tableName)
        .select('score')
        .eq('mode', mode)
        .order('score', { ascending: false })
        .limit(1)
        .single();
      
      if (error || !data) {
        return true; // Si no hay datos, cualquier puntuación es récord
      }
      
      return score > data.score;
    } catch (error) {
      console.warn('Error verificando récord mundial:', error);
      return false;
    }
  }
}
