/**
 * Entidad Comida
 * Representa la comida que la serpiente debe comer
 * Con soporte para animaciones de aparición/desaparición
 * Principio: Single Responsibility (SOLID)
 */

import { BaseEntity } from './Entity';
import { Position } from '@/components/Position';
import { Renderable } from '@/components/Renderable';
import { Collidable } from '@/components/Collidable';
import { GAME_CONFIG } from '@/config/constants';
import { Animation, Easing } from '@/utils/AnimationHelper';

export class Food extends BaseEntity {
  position: Position;
  private spawnAnimation: Animation;
  private eatAnimation: Animation;
  private isBeingEaten = false;
  
  constructor(position: Position) {
    super('food');
    this.position = position;
    
    // Añade componentes
    this.addComponent(new Renderable(GAME_CONFIG.COLORS.FOOD));
    this.addComponent(new Collidable('food'));
    
    // Configurar animaciones
    this.spawnAnimation = new Animation(300, Easing.easeOutElastic);
    this.eatAnimation = new Animation(200, Easing.easeInQuad);
  }
  
  /**
   * Inicia la animación de aparición
   */
  startSpawnAnimation(currentTime: number): void {
    this.spawnAnimation.start(currentTime);
    this.isBeingEaten = false;
  }
  
  /**
   * Inicia la animación de ser comida
   */
  startEatAnimation(currentTime: number): void {
    this.eatAnimation.start(currentTime);
    this.isBeingEaten = true;
  }
  
  /**
   * Obtiene el progreso de la animación de spawn (0-1)
   */
  getSpawnProgress(currentTime: number): number {
    return this.spawnAnimation.getProgress(currentTime);
  }
  
  /**
   * Obtiene el progreso de la animación de comer (0-1)
   */
  getEatProgress(currentTime: number): number {
    return this.eatAnimation.getProgress(currentTime);
  }
  
  /**
   * Verifica si está siendo comida
   */
  get beingEaten(): boolean {
    return this.isBeingEaten;
  }
  
  /**
   * Reubica la comida en una nueva posición
   */
  relocate(newPosition: Position, currentTime: number): void {
    this.position = newPosition;
    this.startSpawnAnimation(currentTime);
  }
}
