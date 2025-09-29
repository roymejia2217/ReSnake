/**
 * Componente de posición
 * Principio: Single Responsibility (SOLID)
 */

import type { Component, Vector2D } from '@/core/types';

export class Position implements Component {
  readonly type = 'Position';
  
  constructor(
    public x: number,
    public y: number
  ) {}
  
  /**
   * Compara si esta posición es igual a otra
   */
  equals(other: Vector2D): boolean {
    return this.x === other.x && this.y === other.y;
  }
  
  /**
   * Clona esta posición
   */
  clone(): Position {
    return new Position(this.x, this.y);
  }
  
  /**
   * Suma un vector a esta posición y devuelve una nueva
   */
  add(vector: Vector2D): Position {
    return new Position(this.x + vector.x, this.y + vector.y);
  }
}
