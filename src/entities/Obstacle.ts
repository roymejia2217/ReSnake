/**
 * Entidad Obstáculo
 * Representa obstáculos estáticos que añaden dificultad al juego
 * Principio: Single Responsibility (SOLID)
 */

import { BaseEntity } from './Entity';
import { Position } from '@/components/Position';
import { Renderable } from '@/components/Renderable';
import { Collidable } from '@/components/Collidable';
import { OBSTACLE_CONFIG } from '@/config/constants';

export class Obstacle extends BaseEntity {
  position: Position;
  
  constructor(position: Position) {
    super('obstacle');
    this.position = position;
    
    // Añade componentes
    this.addComponent(new Renderable(OBSTACLE_CONFIG.COLOR));
    this.addComponent(new Collidable('obstacle'));
  }
  
  /**
   * Reubica el obstáculo en una nueva posición
   */
  relocate(newPosition: Position): void {
    this.position = newPosition;
  }
}

