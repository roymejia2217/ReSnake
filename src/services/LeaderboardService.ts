/**
 * Servicio de Leaderboard
 * Gestiona las puntuaciones locales y preparación para Supabase
 * Principio: Single Responsibility (SOLID)
 */

import type { ScoreEntry, GameMode, Player } from '@/core/gameTypes';

export class LeaderboardService {
  private readonly STORAGE_KEY = 'snake-leaderboard';
  private scores: ScoreEntry[] = [];
  private readonly MAX_LOCAL_SCORES = 100; // Límite de puntuaciones locales

  constructor() {
    this.loadScores();
  }

  /**
   * Añade una nueva puntuación al leaderboard
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
    this.trimScores();
    this.saveScores();

    return entry;
  }

  /**
   * Obtiene el top N de puntuaciones
   */
  getTopScores(limit: number = 10, mode?: GameMode): ScoreEntry[] {
    let filteredScores = [...this.scores];

    // Filtra por modo si se especifica
    if (mode) {
      filteredScores = filteredScores.filter(s => s.mode === mode);
    }

    // Ordena por puntuación descendente
    return filteredScores
      .sort((a, b) => b.score - a.score)
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
   * Obtiene la mejor puntuación global de cualquier jugador
   */
  getGlobalBestScore(mode?: GameMode): number {
    let filteredScores = this.scores;

    if (mode) {
      filteredScores = filteredScores.filter(s => s.mode === mode);
    }

    const scores = filteredScores.map(s => s.score);
    return scores.length > 0 ? Math.max(...scores) : 0;
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
  getStatsByMode(): Record<GameMode, { count: number; avgScore: number; maxScore: number }> {
    const modes: GameMode[] = ['classic', 'speed', 'wall'];
    const stats: any = {};

    modes.forEach(mode => {
      const modeScores = this.scores.filter(s => s.mode === mode);
      const scores = modeScores.map(s => s.score);

      stats[mode] = {
        count: modeScores.length,
        avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
        maxScore: scores.length > 0 ? Math.max(...scores) : 0,
      };
    });

    return stats;
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
      this.trimScores();
      this.saveScores();
    } catch (error) {
      console.error('Error importing scores:', error);
      throw new Error('Error al importar puntuaciones');
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
   * Recorta las puntuaciones al límite máximo (mantiene las mejores)
   */
  private trimScores(): void {
    if (this.scores.length > this.MAX_LOCAL_SCORES) {
      this.scores = this.scores
        .sort((a, b) => b.score - a.score)
        .slice(0, this.MAX_LOCAL_SCORES);
    }
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
