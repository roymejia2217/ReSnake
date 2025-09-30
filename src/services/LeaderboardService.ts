/**
 * Servicio de Leaderboard
 * Gestiona las puntuaciones locales con sistema de categorías por modo
 * Principio: Single Responsibility (SOLID)
 */

import type { ScoreEntry, GameMode, Player } from '@/core/gameTypes';
import { SupabaseService } from './SupabaseService';

export class LeaderboardService {
  private readonly STORAGE_KEY = 'snake-leaderboard';
  private scores: ScoreEntry[] = [];
  private readonly MAX_SCORES_PER_MODE = 20; // Top 20 por modo de juego
  private readonly MAX_LOCAL_SCORES = 100; // Límite total de puntuaciones locales
  private supabaseService: SupabaseService;
  private syncInProgress = false;

  constructor() {
    this.loadScores();
    this.supabaseService = new SupabaseService();
    
    // Sincronización automática al inicializar (si hay puntuaciones no sincronizadas)
    this.autoSync();
  }

  /**
   * Obtiene el servicio de Supabase (para verificar disponibilidad)
   */
  getSupabaseService(): SupabaseService {
    return this.supabaseService;
  }

  /**
   * Añade una nueva puntuación al leaderboard
   * Mantiene solo las mejores 20 puntuaciones por modo
   * Sincroniza automáticamente con Supabase si está disponible
   */
  addScore(player: Player, score: number, mode: GameMode): ScoreEntry {
    const entry: ScoreEntry = {
      id: this.generateUUID(),
      playerId: player.id,
      playerName: this.sanitizePlayerName(player.name),
      score: this.validateScore(score),
      mode: mode,
      timestamp: Date.now(),
      syncedToCloud: false,
    };

    this.scores.push(entry);
    this.trimScoresByMode();
    this.saveScores();

    // Sincronización automática en segundo plano
    this.syncScoreAsync(entry);

    return entry;
  }

  /**
   * Obtiene el top N de puntuaciones por modo específico
   * Por defecto retorna las mejores 20 puntuaciones del modo
   */
  getTopScores(limit: number = 20, mode?: GameMode): ScoreEntry[] {
    let filteredScores = [...this.scores];

    // Filtra por modo si se especifica
    if (mode) {
      filteredScores = filteredScores.filter(s => s.mode === mode);
    }

    // Ordena por puntuación descendente y luego por timestamp (más reciente primero en caso de empate)
    return filteredScores
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return b.timestamp - a.timestamp;
      })
      .slice(0, limit);
  }

  /**
   * Obtiene las mejores puntuaciones de todos los modos combinadas
   * Útil para mostrar un ranking general
   */
  getTopScoresAllModes(limit: number = 20): ScoreEntry[] {
    return this.scores
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return b.timestamp - a.timestamp;
      })
      .slice(0, limit);
  }

  /**
   * Obtiene las puntuaciones de un jugador específico
   */
  getPlayerScores(playerId: string): ScoreEntry[] {
    return this.scores
      .filter(s => s.playerId === playerId)
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Obtiene la mejor puntuación de un jugador en un modo específico
   */
  getPlayerBestScore(playerId: string, mode: GameMode): number {
    const playerScores = this.scores
      .filter(s => s.playerId === playerId && s.mode === mode)
      .map(s => s.score);

    return playerScores.length > 0 ? Math.max(...playerScores) : 0;
  }

  /**
   * Obtiene la mejor puntuación global de cualquier jugador en un modo específico
   * IMPORTANTE: Este es el método que se debe usar para detectar récords
   */
  getGlobalBestScore(mode: GameMode): number {
    const modeScores = this.scores.filter(s => s.mode === mode);
    const scores = modeScores.map(s => s.score);
    return scores.length > 0 ? Math.max(...scores) : 0;
  }

  /**
   * Verifica si una puntuación es un nuevo récord para el modo específico
   * Compara con la mejor puntuación global del modo
   */
  isNewRecord(score: number, mode: GameMode): boolean {
    const currentBest = this.getGlobalBestScore(mode);
    return score > currentBest;
  }

  /**
   * Verifica si una puntuación es un nuevo récord personal para el jugador en el modo específico
   */
  isNewPersonalRecord(score: number, playerId: string, mode: GameMode): boolean {
    const playerBest = this.getPlayerBestScore(playerId, mode);
    return score > playerBest;
  }

  /**
   * Obtiene todas las puntuaciones no sincronizadas (para Supabase)
   */
  getUnsyncedScores(): ScoreEntry[] {
    return this.scores.filter(s => !s.syncedToCloud);
  }

  /**
   * Marca una puntuación como sincronizada
   */
  markAsSynced(scoreId: string, cloudId: string): void {
    const score = this.scores.find(s => s.id === scoreId);
    if (score) {
      score.syncedToCloud = true;
      score.cloudId = cloudId;
      this.saveScores();
    }
  }

  /**
   * Limpia todas las puntuaciones (con confirmación)
   */
  clearAllScores(): void {
    this.scores = [];
    this.saveScores();
  }

  /**
   * Obtiene estadísticas por modo de juego
   */
  getStatsByMode(): Record<GameMode, { count: number; avgScore: number; maxScore: number; topScores: ScoreEntry[] }> {
    const modes: GameMode[] = ['classic', 'speed', 'wall'];
    const stats: any = {};

    modes.forEach(mode => {
      const modeScores = this.scores.filter(s => s.mode === mode);
      const scores = modeScores.map(s => s.score);

      stats[mode] = {
        count: modeScores.length,
        avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
        maxScore: scores.length > 0 ? Math.max(...scores) : 0,
        topScores: this.getTopScores(20, mode),
      };
    });

    return stats;
  }

  /**
   * Obtiene el ranking de un jugador específico en un modo
   * Retorna la posición (1-based) o 0 si no está en el top
   */
  getPlayerRank(playerId: string, mode: GameMode): number {
    const topScores = this.getTopScores(20, mode);
    const playerIndex = topScores.findIndex(score => score.playerId === playerId);
    return playerIndex >= 0 ? playerIndex + 1 : 0;
  }

  /**
   * Obtiene información detallada sobre el récord actual de un modo
   */
  getRecordInfo(mode: GameMode): { score: number; playerName: string; timestamp: number } | null {
    const topScores = this.getTopScores(1, mode);
    if (topScores.length === 0) {
      return null;
    }

    const record = topScores[0];
    return {
      score: record.score,
      playerName: record.playerName,
      timestamp: record.timestamp,
    };
  }

  /**
   * Exporta las puntuaciones en formato JSON para backup
   */
  exportScores(): string {
    return JSON.stringify(this.scores, null, 2);
  }

  /**
   * Importa puntuaciones desde un JSON (con validación)
   */
  importScores(jsonData: string): void {
    try {
      const imported = JSON.parse(jsonData);

      if (!Array.isArray(imported)) {
        throw new Error('Invalid format: expected array');
      }

      const validScores = imported.filter(s => this.isValidScoreEntry(s));

      if (validScores.length === 0) {
        throw new Error('No valid scores found');
      }

      this.scores = [...this.scores, ...validScores];
      this.trimScoresByMode();
      this.saveScores();
    } catch (error) {
      console.error('Error importing scores:', error);
      throw new Error('Error al importar puntuaciones');
    }
  }

  /**
   * Sincroniza una puntuación individual con Supabase de forma asíncrona
   * No bloquea la UI y maneja errores silenciosamente
   */
  private async syncScoreAsync(entry: ScoreEntry): Promise<void> {
    if (!this.supabaseService.isAvailable() || entry.syncedToCloud) {
      return;
    }

    try {
      const cloudId = await this.supabaseService.syncScore(entry);
      this.markAsSynced(entry.id, cloudId);
      console.log(`Puntuación sincronizada: ${entry.playerName} - ${entry.score}`);
    } catch (error) {
      console.warn('Error sincronizando puntuación:', error);
      // No lanzamos el error para no interrumpir el flujo del juego
    }
  }

  /**
   * Sincroniza todas las puntuaciones no sincronizadas
   * Útil para sincronización manual o al inicializar
   */
  async syncAllUnsyncedScores(): Promise<{ success: boolean; syncedCount: number; errors: string[] }> {
    if (!this.supabaseService.isAvailable()) {
      return { success: false, syncedCount: 0, errors: ['Supabase no disponible'] };
    }

    if (this.syncInProgress) {
      return { success: false, syncedCount: 0, errors: ['Sincronización ya en progreso'] };
    }

    this.syncInProgress = true;
    const unsyncedScores = this.getUnsyncedScores();

    if (unsyncedScores.length === 0) {
      this.syncInProgress = false;
      return { success: true, syncedCount: 0, errors: [] };
    }

    try {
      const result = await this.supabaseService.syncScores(unsyncedScores);
      
      // Marcar como sincronizadas las que se sincronizaron exitosamente
      if (result.success && result.syncedCount > 0) {
        // Asumimos que las primeras N puntuaciones se sincronizaron
        const syncedScores = unsyncedScores.slice(0, result.syncedCount);
        syncedScores.forEach((score, index) => {
          // Generar un cloudId temporal (en un caso real, Supabase devolvería los IDs)
          const cloudId = `temp_${Date.now()}_${index}`;
          this.markAsSynced(score.id, cloudId);
        });
      }

      this.syncInProgress = false;
      return {
        success: result.success,
        syncedCount: result.syncedCount,
        errors: result.errors
      };
    } catch (error) {
      this.syncInProgress = false;
      return {
        success: false,
        syncedCount: 0,
        errors: [error instanceof Error ? error.message : 'Error desconocido']
      };
    }
  }

  /**
   * Sincronización automática al inicializar el servicio
   * Se ejecuta en segundo plano sin bloquear la UI
   */
  private autoSync(): void {
    // Ejecutar sincronización después de un breve delay para no bloquear la inicialización
    setTimeout(() => {
      this.syncAllUnsyncedScores().then(result => {
        if (result.success && result.syncedCount > 0) {
          console.log(`Sincronización automática completada: ${result.syncedCount} puntuaciones sincronizadas`);
        }
      }).catch(error => {
        console.warn('Error en sincronización automática:', error);
      });
    }, 2000); // 2 segundos de delay
  }

  /**
   * Obtiene el leaderboard global desde Supabase (solo datos remotos)
   * NO combina con datos locales - muestra únicamente puntuaciones globales
   */
  async getGlobalLeaderboard(limit: number = 20, mode?: GameMode): Promise<ScoreEntry[]> {
    if (!this.supabaseService.isAvailable()) {
      throw new Error('Supabase no disponible');
    }

    try {
      const globalScores = await this.supabaseService.getGlobalLeaderboard(limit, mode);
      return globalScores;
    } catch (error) {
      console.warn('Error obteniendo leaderboard global:', error);
      throw error;
    }
  }

  /**
   * Verifica si una puntuación es un récord mundial
   * Prioriza verificación global, fallback a local
   */
  async isWorldRecord(score: number, mode: GameMode): Promise<boolean> {
    // Verificar récord global si Supabase está disponible
    if (this.supabaseService.isAvailable()) {
      try {
        return await this.supabaseService.isWorldRecord(score, mode);
      } catch (error) {
        console.warn('Error verificando récord mundial, usando fallback local:', error);
      }
    }

    // Fallback: verificar récord local
    const localBest = this.getGlobalBestScore(mode);
    return score > localBest;
  }

  /**
   * Obtiene estadísticas globales (prioriza datos remotos, fallback a locales)
   */
  async getGlobalStats(): Promise<Record<GameMode, { count: number; avgScore: number; maxScore: number; topScores: ScoreEntry[] }>> {
    if (!this.supabaseService.isAvailable()) {
      return this.getStatsByMode();
    }

    try {
      const globalStats = await this.supabaseService.getGlobalStats();
      
      // Convertir estadísticas globales al formato esperado
      const formattedStats: any = {};
      const modes: GameMode[] = ['classic', 'speed', 'wall'];
      
      modes.forEach(mode => {
        const global = globalStats[mode];
        
        formattedStats[mode] = {
          count: global.count,
          maxScore: global.maxScore,
          avgScore: global.avgScore,
          topScores: [] // Se llenará dinámicamente cuando se necesite
        };
      });
      
      return formattedStats;
    } catch (error) {
      console.warn('Error obteniendo estadísticas globales, usando fallback local:', error);
      return this.getStatsByMode();
    }
  }

  /**
   * Valida que un objeto tenga la estructura de ScoreEntry
   */
  private isValidScoreEntry(obj: any): obj is ScoreEntry {
    return (
      obj &&
      typeof obj === 'object' &&
      typeof obj.id === 'string' &&
      typeof obj.playerId === 'string' &&
      typeof obj.playerName === 'string' &&
      typeof obj.score === 'number' &&
      typeof obj.mode === 'string' &&
      typeof obj.timestamp === 'number' &&
      ['classic', 'speed', 'wall'].includes(obj.mode) &&
      obj.score >= 0
    );
  }

  /**
   * Valida que una puntuación sea válida
   */
  private validateScore(score: number): number {
    if (typeof score !== 'number' || isNaN(score) || score < 0) {
      throw new Error('Invalid score value');
    }
    return Math.floor(score); // Asegura que sea entero
  }

  /**
   * Sanitiza el nombre del jugador
   */
  private sanitizePlayerName(name: string): string {
    return name
      .trim()
      .replace(/[<>\"'&]/g, '') // Remover caracteres HTML peligrosos
      .substring(0, 20); // Limitar longitud
  }

  /**
   * Recorta las puntuaciones por modo al límite máximo (mantiene las mejores 20 por modo)
   */
  private trimScoresByMode(): void {
    const modes: GameMode[] = ['classic', 'speed', 'wall'];
    let allScores: ScoreEntry[] = [];

    // Mantiene las mejores 20 puntuaciones por cada modo
    modes.forEach(mode => {
      const modeScores = this.scores
        .filter(s => s.mode === mode)
        .sort((a, b) => {
          if (b.score !== a.score) {
            return b.score - a.score;
          }
          return b.timestamp - a.timestamp;
        })
        .slice(0, this.MAX_SCORES_PER_MODE);
      
      allScores = allScores.concat(modeScores);
    });

    // Si aún excede el límite total, recorta las más antiguas
    if (allScores.length > this.MAX_LOCAL_SCORES) {
      allScores = allScores
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, this.MAX_LOCAL_SCORES);
    }

    this.scores = allScores;
  }

  /**
   * Genera un UUID v4
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Carga las puntuaciones desde localStorage
   */
  private loadScores(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.scores = parsed.filter(s => this.isValidScoreEntry(s));
        }
      }
    } catch (error) {
      console.error('Error loading scores:', error);
      this.scores = [];
    }
  }

  /**
   * Guarda las puntuaciones en localStorage
   */
  private saveScores(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.scores));
    } catch (error) {
      console.error('Error saving scores:', error);
    }
  }
}
