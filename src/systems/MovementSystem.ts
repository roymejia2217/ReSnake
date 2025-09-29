/**
 * Sistema de Movimiento
 * Maneja el movimiento de la serpiente con wrapping en los bordes
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
    
    // Wrapping: la serpiente aparece del otro lado
    this.wrapPosition(newHead);
    
    this.snake.move(newHead);
  }
  
  /**
   * Hace wrap de la posición en los bordes del tablero
   * Comportamiento diferente al original que tenía colisión con bordes
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
}
