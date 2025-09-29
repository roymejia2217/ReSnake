/**
 * Componente de velocidad (dirección de movimiento)
 * Principio: Single Responsibility (SOLID)
 */

import type { Component, Vector2D } from '@/core/types';

export class Velocity implements Component {
  readonly type = 'Velocity';
  
  constructor(
    public x: number,
    public y: number
  ) {}
  
  /**
   * Cambia la dirección del movimiento
   */
  setDirection(direction: Vector2D): void {
    this.x = direction.x;
    this.y = direction.y;
  }
  
  /**
   * Verifica si una dirección es opuesta a la actual
   * Evita que la serpiente se mueva en dirección contraria
   */
  isOpposite(other: Vector2D): boolean {
    return this.x === -other.x && this.y === -other.y;
  }
}
