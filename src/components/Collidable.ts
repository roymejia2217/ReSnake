/**
 * Componente de colisión
 * Define qué tipo de colisión puede tener una entidad
 * Principio: Single Responsibility (SOLID)
 */

import type { Component } from '@/core/types';

export class Collidable implements Component {
  readonly type = 'Collidable';
  
  constructor(
    public layer: 'snake' | 'food' | 'wall' | 'obstacle' = 'snake'
  ) {}
}
