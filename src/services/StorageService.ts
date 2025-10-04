/**
 * Servicio de Almacenamiento
 * Maneja el guardado y carga de datos del juego
 * Principio: Single Responsibility (SOLID)
 */

import type { GameMode } from '@/core/gameTypes';

interface GameSave {
  highScore: number;
  lastPlayed: string;
  maxScoresByMode: Record<GameMode, number>;
}

interface SkinProgress {
  unlockedSkins: string[];
  currentSkin: string;
  notificationsShown: string[];
}

export class StorageService {
  private readonly STORAGE_KEY = 'snake-game-save';
  private readonly SKIN_STORAGE_KEY = 'snake-skin-progress';
  
  /**
   * Guarda los datos del juego
   */
  save(data: GameSave): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save game data:', error);
    }
  }
  
  /**
   * Carga los datos del juego
   */
  load(): GameSave | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load game data:', error);
      return null;
    }
  }

  /**
   * Guarda el progreso de skins
   */
  saveSkinProgress(data: SkinProgress): void {
    try {
      localStorage.setItem(this.SKIN_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save skin progress:', error);
    }
  }

  /**
   * Carga el progreso de skins
   */
  loadSkinProgress(): SkinProgress | null {
    try {
      const data = localStorage.getItem(this.SKIN_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load skin progress:', error);
      return null;
    }
  }

  /**
   * Actualiza la puntuación máxima por modo
   */
  updateMaxScore(mode: GameMode, score: number): void {
    const currentData = this.load();
    if (!currentData) {
      this.save({
        highScore: score,
        lastPlayed: new Date().toISOString(),
        maxScoresByMode: {
          classic: mode === 'classic' ? score : 0,
          speed: mode === 'speed' ? score : 0,
          wall: mode === 'wall' ? score : 0
        }
      });
      return;
    }

    const maxScoresByMode = { ...currentData.maxScoresByMode };
    maxScoresByMode[mode] = Math.max(maxScoresByMode[mode] || 0, score);

    this.save({
      ...currentData,
      highScore: Math.max(currentData.highScore, score),
      lastPlayed: new Date().toISOString(),
      maxScoresByMode
    });
  }

  /**
   * Obtiene la puntuación máxima para un modo específico
   */
  getMaxScoreForMode(mode: GameMode): number {
    const data = this.load();
    return data?.maxScoresByMode?.[mode] || 0;
  }

  /**
   * Obtiene la puntuación máxima global
   */
  getMaxScore(): number {
    const data = this.load();
    return data?.highScore || 0;
  }
  
  /**
   * Limpia los datos guardados
   */
  clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.SKIN_STORAGE_KEY);
  }

  /**
   * Limpia solo el progreso de skins
   */
  clearSkinProgress(): void {
    localStorage.removeItem(this.SKIN_STORAGE_KEY);
  }
}
