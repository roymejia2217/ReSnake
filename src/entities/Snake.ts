/**
 * Entidad Serpiente
 * Maneja la lógica específica de la serpiente
 * Con soporte para animación de crecimiento suave
 * Principio: Single Responsibility (SOLID)
 */

import { BaseEntity } from './Entity';
import { Position } from '@/components/Position';
import { Velocity } from '@/components/Velocity';
import { Renderable } from '@/components/Renderable';
import { Collidable } from '@/components/Collidable';
import { GAME_CONFIG, DIRECTIONS } from '@/config/constants';
import { Animation, Easing } from '@/utils/AnimationHelper';

export class Snake extends BaseEntity {
  body: Position[] = [];
  private shouldGrow = false;
  private growthAnimation: Animation;
  private justGrew = false;
  
  constructor(initialPosition: Position) {
    super('snake');
    
    // Inicializa el cuerpo con una posición
    this.body.push(initialPosition);
    
    // Añade componentes
    this.addComponent(new Velocity(DIRECTIONS.RIGHT.x, DIRECTIONS.RIGHT.y));
    this.addComponent(new Renderable(GAME_CONFIG.COLORS.SNAKE));
    this.addComponent(new Collidable('snake'));
    
    // Configurar animación de crecimiento
    this.growthAnimation = new Animation(200, Easing.easeOutCubic);
  }
  
  /**
   * Obtiene la cabeza de la serpiente
   */
  get head(): Position {
    return this.body[0];
  }
  
  /**
   * Marca que la serpiente debe crecer en el próximo movimiento
   * Evita el bug de colisión inmediata al comer
   */
  grow(): void {
    this.shouldGrow = true;
  }
  
  /**
   * Mueve la serpiente a una nueva posición
   * Si debe crecer, no elimina la cola
   */
  move(newHead: Position): void {
    this.body.unshift(newHead);
    
    if (!this.shouldGrow) {
      this.body.pop();
      this.justGrew = false;
    } else {
      this.shouldGrow = false;
      this.justGrew = true;
      this.growthAnimation.restart(performance.now());
    }
  }
  
  /**
   * Obtiene el progreso de la animación de crecimiento (0-1)
   */
  getGrowthProgress(currentTime: number): number {
    return this.growthAnimation.getProgress(currentTime);
  }
  
  /**
   * Verifica si la serpiente acaba de crecer
   */
  get hasJustGrown(): boolean {
    return this.justGrew && this.growthAnimation.active;
  }
  
  /**
   * Verifica si la serpiente choca consigo misma
   * Solo verifica contra el cuerpo (sin incluir la cabeza)
   */
  checkSelfCollision(): boolean {
    const head = this.head;
    return this.body.slice(1).some(segment => segment.equals(head));
  }
}
