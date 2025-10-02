/**
 * Servicio de SuperComida
 * Gestiona el spawn, estado y expiración de la supermanzana
 * Principio: Single Responsibility (SOLID)
 */

import { SuperFood } from '@/entities/SuperFood';
import type { Position } from '@/components/Position';
import type { GameMode } from '@/core/gameTypes';
import { SUPER_FOOD_CONFIG } from '@/config/constants';
import { generateRandomTopLeftArea } from '@/utils/helpers';

export class SuperFoodService {
  private active = false;
  private expireAt: number | null = null;
  private position: Position | null = null;
  private normalEatenCounter = 0;
  private superFood: SuperFood | null = null;
  private expireTimeout: ReturnType<typeof setTimeout> | null = null;
  private onExpired?: () => void;
  
  constructor() {}
  
  /**
   * Se llama cuando se come una manzana normal
   */
  onNormalEaten(): void {
    this.normalEatenCounter++;
  }
  
  /**
   * Verifica si debe aparecer la supermanzana
   */
  shouldSpawn(mode: GameMode): boolean {
    return !this.active && 
           (mode === 'classic' || mode === 'wall') &&
           this.normalEatenCounter >= SUPER_FOOD_CONFIG.SPAWN_EVERY_NORMALS;
  }
  
  /**
   * Genera una posición válida para la supermanzana
   */
  private generateValidPosition(
    snakeBody: Position[],
    foodPosition: Position
  ): Position {
    const excludePositions = [...snakeBody, foodPosition];
    return generateRandomTopLeftArea(
      SUPER_FOOD_CONFIG.SIZE,
      SUPER_FOOD_CONFIG.SIZE,
      excludePositions
    );
  }
  
  /**
   * Hace aparecer la supermanzana
   */
  spawn(
    snakeBody: Position[],
    foodPosition: Position,
    currentTime: number
  ): SuperFood {
    if (this.active) {
      this.despawn();
    }
    
    const position = this.generateValidPosition(snakeBody, foodPosition);
    this.position = position;
    this.active = true;
    this.expireAt = currentTime + SUPER_FOOD_CONFIG.LIFETIME_MS;
    this.normalEatenCounter = 0;
    
    // Crear la entidad supermanzana
    this.superFood = new SuperFood(position);
    this.superFood.startSpawnAnimation(currentTime);
    
    // Configurar timeout de expiración
    this.expireTimeout = setTimeout(() => {
      this.despawn();
      this.onExpired?.();
    }, SUPER_FOOD_CONFIG.LIFETIME_MS);
    
    return this.superFood;
  }
  
  /**
   * Hace desaparecer la supermanzana
   */
  despawn(): void {
    this.active = false;
    this.expireAt = null;
    this.position = null;
    this.superFood = null;
    
    if (this.expireTimeout) {
      clearTimeout(this.expireTimeout);
      this.expireTimeout = null;
    }
  }
  
  /**
   * Verifica si la supermanzana está activa
   */
  isActive(): boolean {
    return this.active;
  }
  
  /**
   * Obtiene el tiempo de expiración
   */
  getExpireAt(): number | null {
    return this.expireAt;
  }
  
  /**
   * Obtiene la posición de la supermanzana
   */
  getPosition(): Position | null {
    return this.position;
  }
  
  /**
   * Obtiene la entidad supermanzana
   */
  getSuperFood(): SuperFood | null {
    return this.superFood;
  }
  
  /**
   * Reinicia el contador de manzanas normales
   */
  reset(): void {
    this.normalEatenCounter = 0;
    this.despawn();
  }
  
  /**
   * Callback cuando expira el tiempo de la supermanzana
   */
  setOnExpired(callback: () => void): void {
    this.onExpired = callback;
  }
}
