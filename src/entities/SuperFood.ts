/**
 * Entidad SuperComida
 * Representa la supermanzana 2x2 que otorga puntos extra
 * Con soporte para animaciones de aparición/desaparición
 * Principio: Single Responsibility (SOLID)
 */

import { BaseEntity } from './Entity';
import { Position } from '@/components/Position';
import { Renderable } from '@/components/Renderable';
import { Collidable } from '@/components/Collidable';
import { GAME_CONFIG, SUPER_FOOD_CONFIG } from '@/config/constants';
import { Animation, Easing } from '@/utils/AnimationHelper';

export class SuperFood extends BaseEntity {
  position: Position;
  private spawnAnimation: Animation;
  private eatAnimation: Animation;
  private isBeingEaten = false;
  
  constructor(position: Position) {
    super('superfood');
    this.position = position;
    
    // Añade componentes
    this.addComponent(new Renderable(GAME_CONFIG.COLORS.SUPER_FOOD));
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
   * Obtiene todas las celdas cubiertas por la supermanzana 2x2
   */
  getCoveredCells(): Position[] {
    const cells: Position[] = [];
    const size = SUPER_FOOD_CONFIG.SIZE;
    
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        cells.push(new Position(this.position.x + x, this.position.y + y));
      }
    }
    
    return cells;
  }
  
  /**
   * Reubica la supermanzana en una nueva posición
   */
  relocate(newPosition: Position, currentTime: number): void {
    this.position = newPosition;
    this.startSpawnAnimation(currentTime);
  }
}
