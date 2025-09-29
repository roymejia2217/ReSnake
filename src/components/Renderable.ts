/**
 * Componente de renderizado
 * Define cómo se dibuja una entidad
 * Principio: Single Responsibility (SOLID)
 */

import type { Component } from '@/core/types';

export class Renderable implements Component {
  readonly type = 'Renderable';
  
  constructor(
    public color: string,
    public shape: 'circle' | 'square' = 'circle',
    public size: number = 20
  ) {}
}
