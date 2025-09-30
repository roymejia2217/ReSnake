/**
 * Sistema de Movimiento
 * Maneja el movimiento de la serpiente con soporte para múltiples modos
 * Principio: Single Responsibility (SOLID)
 */

import type { System } from '@/core/types';
import type { Snake } from '@/entities/Snake';
import { Position } from '@/components/Position';
import { Velocity } from '@/components/Velocity';
import { GAME_CONFIG } from '@/config/constants';

export class MovementSystem implements System {
  private accumulator = 0;
  private moveInterval: number = GAME_CONFIG.INITIAL_SPEED;
  private hasWallCollision: boolean = false;
  private onWallCollision?: () => void;
  
  constructor(private snake: Snake) {}
  
  /**
   * Actualiza el movimiento usando un acumulador de tiempo
   * Esto permite movimiento consistente independiente del framerate
   */
  update(deltaTime: number, _entities: never[]): void {
    this.accumulator += deltaTime;
    
    if (this.accumulator < this.moveInterval) return;
    
    this.accumulator = 0;
    this.moveSnake();
  }
  
  /**
   * Mueve la serpiente en la dirección actual
   */
  private moveSnake(): void {
    const velocity = this.snake.getComponent<Velocity>('Velocity');
    if (!velocity) return;
    
    const head = this.snake.head;
    const newHead = head.add(velocity);
    
    // Modo Pared: verifica colisión con bordes
    if (this.hasWallCollision && this.checkWallCollision(newHead)) {
      this.onWallCollision?.();
      return;
    }
    
    // Modo Clásico: wrapping en los bordes
    if (!this.hasWallCollision) {
      this.wrapPosition(newHead);
    }
    
    this.snake.move(newHead);
  }
  
  /**
   * Verifica si hay colisión con las paredes
   */
  private checkWallCollision(position: Position): boolean {
    const size = GAME_CONFIG.BOARD_SIZE;
    return position.x < 0 || position.x >= size || position.y < 0 || position.y >= size;
  }
  
  /**
   * Hace wrap de la posición en los bordes del tablero
   */
  private wrapPosition(position: Position): void {
    const size = GAME_CONFIG.BOARD_SIZE;
    
    if (position.x < 0) position.x = size - 1;
    if (position.x >= size) position.x = 0;
    if (position.y < 0) position.y = size - 1;
    if (position.y >= size) position.y = 0;
  }
  
  /**
   * Permite ajustar la velocidad dinámicamente
   */
  setSpeed(speed: number): void {
    this.moveInterval = speed;
  }

  /**
   * Configura si el modo tiene colisión con paredes
   */
  setWallCollision(enabled: boolean): void {
    this.hasWallCollision = enabled;
  }

  /**
   * Callback cuando hay colisión con pared
   */
  setOnWallCollision(callback: () => void): void {
    this.onWallCollision = callback;
  }
}
