/**
 * Servicio de Modos de Juego
 * Gestiona la configuración y comportamiento de cada modo
 * Principio: Single Responsibility, Strategy Pattern
 */

import type { GameMode, GameModeConfig } from '@/core/gameTypes';
import type { I18nService } from './I18nService';
import { GAME_CONFIG } from '@/config/constants';

export class GameModeService {
  private currentMode: GameMode = 'classic';
  private readonly STORAGE_KEY = 'snake-game-mode';

  constructor(private i18n: I18nService) {
    this.loadPreference();
  }

  /**
   * Obtiene el modo de juego actual
   */
  getCurrentMode(): GameMode {
    return this.currentMode;
  }

  /**
   * Establece el modo de juego
   */
  setMode(mode: GameMode): void {
    if (!this.isValidMode(mode)) {
      console.warn(`Invalid game mode: ${mode}`);
      return;
    }

    this.currentMode = mode;
    this.savePreference();
  }

  /**
   * Obtiene la configuración del modo actual
   */
  getCurrentConfig(): GameModeConfig {
    return this.getConfig(this.currentMode);
  }

  /**
   * Obtiene la configuración de un modo específico
   */
  getConfig(mode: GameMode): GameModeConfig {
    const configs: Record<GameMode, Omit<GameModeConfig, 'name' | 'description'>> = {
      classic: {
        mode: 'classic',
        hasWallCollision: false,
        hasSpeedIncrease: false,
      },
      speed: {
        mode: 'speed',
        hasWallCollision: false,
        hasSpeedIncrease: true,
        speedIncrement: 10, // Reduce 10ms por cada comida
      },
      wall: {
        mode: 'wall',
        hasWallCollision: true,
        hasSpeedIncrease: false,
      },
    };

    const baseConfig = configs[mode];

    return {
      ...baseConfig,
      name: this.i18n.t(`modes.${mode}`),
      description: this.i18n.t(`gameMode.${mode}Desc`),
    };
  }

  /**
   * Obtiene todas las configuraciones de modos
   */
  getAllConfigs(): GameModeConfig[] {
    return (['classic', 'speed', 'wall'] as GameMode[]).map(mode => this.getConfig(mode));
  }

  /**
   * Calcula la velocidad basada en el modo y la puntuación actual
   */
  calculateSpeed(score: number): number {
    const config = this.getCurrentConfig();

    if (!config.hasSpeedIncrease) {
      return GAME_CONFIG.INITIAL_SPEED;
    }

    // Modo velocidad: reduce el intervalo con cada punto
    const speedReduction = score * (config.speedIncrement || 0);
    const newSpeed = GAME_CONFIG.INITIAL_SPEED - speedReduction;

    // Límite mínimo de velocidad para evitar que sea imposible
    const MIN_SPEED = 50; // 50ms es muy rápido pero jugable
    return Math.max(newSpeed, MIN_SPEED);
  }

  /**
   * Verifica si el modo actual tiene colisión con paredes
   */
  hasWallCollision(): boolean {
    return this.getCurrentConfig().hasWallCollision;
  }

  /**
   * Verifica si el modo actual tiene incremento de velocidad
   */
  hasSpeedIncrease(): boolean {
    return this.getCurrentConfig().hasSpeedIncrease;
  }

  /**
   * Valida si un modo es válido
   */
  private isValidMode(mode: string): mode is GameMode {
    return ['classic', 'speed', 'wall'].includes(mode);
  }

  /**
   * Carga la preferencia desde localStorage
   */
  private loadPreference(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved && this.isValidMode(saved)) {
      this.currentMode = saved;
    }
  }

  /**
   * Guarda la preferencia en localStorage
   */
  private savePreference(): void {
    localStorage.setItem(this.STORAGE_KEY, this.currentMode);
  }
}
