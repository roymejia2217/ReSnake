/**
 * Motor principal del juego
 * Implementa el Game Loop con requestAnimationFrame
 * Principio: Single Responsibility (SOLID)
 */

import type { System } from './types';
import { GameState } from './types';

export class GameEngine {
  private systems: System[] = [];
  private state: GameState = GameState.IDLE;
  private animationFrameId: number | null = null;
  private lastTimestamp = 0;
  
  /**
   * Añade un sistema al motor
   */
  addSystem(system: System): void {
    this.systems.push(system);
  }
  
  /**
   * Inicia el game loop
   */
  start(): void {
    if (this.state === GameState.PLAYING) return;
    
    this.state = GameState.PLAYING;
    this.lastTimestamp = performance.now();
    this.loop(this.lastTimestamp);
  }
  
  /**
   * Loop principal del juego
   * Usa requestAnimationFrame para sincronización con GPU
   */
  private loop = (timestamp: number): void => {
    if (this.state !== GameState.PLAYING) return;
    
    const deltaTime = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;
    
    this.update(deltaTime);
    
    this.animationFrameId = requestAnimationFrame(this.loop);
  };
  
  /**
   * Actualiza todos los sistemas
   */
  private update(deltaTime: number): void {
    this.systems.forEach(system => {
      system.update(deltaTime, []);
    });
  }
  
  /**
   * Pausa el juego
   */
  pause(): void {
    this.state = GameState.PAUSED;
  }
  
  /**
   * Reanuda el juego
   */
  resume(): void {
    if (this.state === GameState.PAUSED) {
      this.state = GameState.PLAYING;
      this.lastTimestamp = performance.now();
      this.loop(this.lastTimestamp);
    }
  }
  
  /**
   * Detiene el juego
   */
  stop(): void {
    this.state = GameState.GAME_OVER;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  /**
   * Obtiene el estado actual del juego
   */
  getState(): GameState {
    return this.state;
  }
  
  /**
   * Obtiene todos los sistemas del motor
   */
  getSystems(): System[] {
    return [...this.systems];
  }
}
