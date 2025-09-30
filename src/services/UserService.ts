/**
 * Servicio de Usuarios
 * Gestiona la creación, validación y almacenamiento de usuarios
 * Genera UUIDs únicos y valida entradas
 * Principio: Single Responsibility (SOLID)
 */

import type { Player } from '@/core/gameTypes';
import { PLAYER_NAME_CONSTRAINTS } from '@/core/gameTypes';

export class UserService {
  private readonly STORAGE_KEY = 'snake-current-player';
  private currentPlayer: Player | null = null;

  constructor() {
    this.loadCurrentPlayer();
  }

  /**
   * Crea un nuevo jugador con validación robusta
   * @throws {Error} Si el nombre no cumple las restricciones
   */
  createPlayer(name: string): Player {
    const sanitizedName = this.sanitizeName(name);
    this.validatePlayerName(sanitizedName);

    const player: Player = {
      id: this.generateUUID(),
      name: sanitizedName,
      createdAt: Date.now(),
    };

    this.currentPlayer = player;
    this.saveCurrentPlayer();

    return player;
  }

  /**
   * Obtiene el jugador actual
   */
  getCurrentPlayer(): Player | null {
    return this.currentPlayer;
  }

  /**
   * Establece el jugador actual
   */
  setCurrentPlayer(player: Player): void {
    this.currentPlayer = player;
    this.saveCurrentPlayer();
  }

  /**
   * Limpia el jugador actual
   */
  clearCurrentPlayer(): void {
    this.currentPlayer = null;
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Valida un nombre de jugador según las restricciones
   * @throws {Error} Si el nombre no es válido
   */
  validatePlayerName(name: string): void {
    if (!name || typeof name !== 'string') {
      throw new Error('El nombre es requerido');
    }

    const trimmedName = name.trim();

    if (trimmedName.length < PLAYER_NAME_CONSTRAINTS.MIN_LENGTH) {
      throw new Error(
        `El nombre debe tener al menos ${PLAYER_NAME_CONSTRAINTS.MIN_LENGTH} caracteres`
      );
    }

    if (trimmedName.length > PLAYER_NAME_CONSTRAINTS.MAX_LENGTH) {
      throw new Error(
        `El nombre no puede exceder ${PLAYER_NAME_CONSTRAINTS.MAX_LENGTH} caracteres`
      );
    }

    if (!PLAYER_NAME_CONSTRAINTS.PATTERN.test(trimmedName)) {
      throw new Error(
        'El nombre solo puede contener letras, números, espacios, guiones y guiones bajos'
      );
    }
  }

  /**
   * Sanitiza el nombre removiendo espacios extra y caracteres peligrosos
   */
  private sanitizeName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ') // Múltiples espacios a uno solo
      .replace(/[<>\"'&]/g, ''); // Remover caracteres HTML peligrosos
  }

  /**
   * Genera un UUID v4 compatible
   */
  private generateUUID(): string {
    // Implementación simple de UUID v4
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Carga el jugador actual desde localStorage
   */
  private loadCurrentPlayer(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const player = JSON.parse(saved) as Player;
        // Valida la estructura del objeto cargado
        if (this.isValidPlayer(player)) {
          this.currentPlayer = player;
        }
      }
    } catch (error) {
      console.error('Error loading current player:', error);
      this.currentPlayer = null;
    }
  }

  /**
   * Guarda el jugador actual en localStorage
   */
  private saveCurrentPlayer(): void {
    try {
      if (this.currentPlayer) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentPlayer));
      }
    } catch (error) {
      console.error('Error saving current player:', error);
    }
  }

  /**
   * Valida que un objeto tenga la estructura de Player
   */
  private isValidPlayer(obj: any): obj is Player {
    return (
      obj &&
      typeof obj === 'object' &&
      typeof obj.id === 'string' &&
      typeof obj.name === 'string' &&
      typeof obj.createdAt === 'number' &&
      obj.id.length > 0 &&
      obj.name.length >= PLAYER_NAME_CONSTRAINTS.MIN_LENGTH &&
      obj.name.length <= PLAYER_NAME_CONSTRAINTS.MAX_LENGTH
    );
  }
}
