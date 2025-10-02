/**
 * Sistema de Colisiones
 * Detecta colisiones entre serpiente-comida y serpiente-serpiente
 * Principio: Single Responsibility (SOLID)
 */

import type { System } from '@/core/types';
import type { Snake } from '@/entities/Snake';
import type { Food } from '@/entities/Food';
import type { SuperFood } from '@/entities/SuperFood';

export class CollisionSystem implements System {
  private onFoodEaten?: () => void;
  private onSuperFoodEaten?: () => void;
  private onGameOver?: () => void;
  
  constructor(
    private snake: Snake,
    private food: Food,
    private superFood?: SuperFood
  ) {}
  
  /**
   * Verifica colisiones cada frame
   */
  update(_deltaTime: number, _entities: never[]): void {
    this.checkFoodCollision();
    this.checkSelfCollision();
  }
  
  /**
   * Verifica si la serpiente come la comida
   */
  private checkFoodCollision(): void {
    const head = this.snake.head;
    
    // Colisión con comida normal
    if (head.equals(this.food.position) && !this.food.beingEaten) {
      this.food.startEatAnimation(performance.now());
      this.snake.grow();
      
      // Llama al callback después de un breve delay para la animación
      setTimeout(() => {
        this.onFoodEaten?.();
      }, 150);
    }
    
    // Colisión con supermanzana (si está presente)
    if (this.superFood && !this.superFood.beingEaten) {
      const hit = this.superFood.getCoveredCells().some(cell => head.equals(cell));
      if (hit) {
        this.superFood.startEatAnimation(performance.now());
        this.snake.grow();
        
        // Llama al callback después de un breve delay para la animación
        setTimeout(() => {
          this.onSuperFoodEaten?.();
        }, 150);
      }
    }
  }
  
  /**
   * Verifica si la serpiente choca consigo misma
   */
  private checkSelfCollision(): void {
    if (this.snake.checkSelfCollision()) {
      this.onGameOver?.();
    }
  }
  
  /**
   * Callback cuando se come la comida
   */
  setOnFoodEaten(callback: () => void): void {
    this.onFoodEaten = callback;
  }
  
  /**
   * Callback cuando se come la supermanzana
   */
  setOnSuperFoodEaten(callback: () => void): void {
    this.onSuperFoodEaten = callback;
  }
  
  /**
   * Callback cuando termina el juego
   */
  setOnGameOver(callback: () => void): void {
    this.onGameOver = callback;
  }
  
  /**
   * Actualiza la referencia a la supermanzana
   */
  setSuperFood(superFood?: SuperFood): void {
    this.superFood = superFood;
  }
}
