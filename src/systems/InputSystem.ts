/**
 * Sistema de Input
 * Maneja la entrada del usuario (teclado y controles táctiles)
 * Implementa Command Pattern
 * Principio: Single Responsibility (SOLID)
 */

import type { System } from '@/core/types';
import type { Snake } from '@/entities/Snake';
import { Velocity } from '@/components/Velocity';
import { DIRECTIONS, KEY_MAPPINGS } from '@/config/constants';
import type { Direction } from '@/core/types';

export class InputSystem implements System {
  private pendingDirection: Direction | null = null;
  private keydownHandler: (event: KeyboardEvent) => void;
  private touchHandlers: Map<HTMLElement, (event: Event) => void> = new Map();
  private touchStartHandler: (event: TouchEvent) => void;
  private touchMoveHandler: (event: TouchEvent) => void;
  private touchEndHandler: (event: TouchEvent) => void;
  private touchStartX = 0;
  private touchStartY = 0;
  private isSwiping = false;
  private enabled = true;
  
  constructor(private snake: Snake) {
    this.keydownHandler = this.handleKeyPress.bind(this);
    this.touchStartHandler = this.handleTouchStart.bind(this);
    this.touchMoveHandler = this.handleTouchMove.bind(this);
    this.touchEndHandler = this.handleTouchEnd.bind(this);
    this.setupEventListeners();
  }
  
  /**
   * Configura los event listeners del teclado y táctiles
   */
  private setupEventListeners(): void {
    // Teclado
    document.addEventListener('keydown', this.keydownHandler, false);
    
    // Botones de control táctil
    this.setupTouchControls();
    
    // Gestos de swipe en el canvas
    this.setupSwipeGestures();
  }
  
  /**
   * Configura los botones de control táctil
   */
  private setupTouchControls(): void {
    const buttons = document.querySelectorAll<HTMLElement>('.control-btn');
    
    buttons.forEach(button => {
      const handler = (event: Event) => {
        if (!this.enabled) return;
        
        // Solo previene el default si el evento es cancelable
        if (event.cancelable) {
          event.preventDefault();
        }
        const direction = button.getAttribute('data-direction') as Direction;
        if (direction) {
          this.pendingDirection = direction;
        }
      };
      
      // Soporta tanto click como touch
      button.addEventListener('click', handler);
      button.addEventListener('touchstart', handler, { passive: false });
      
      this.touchHandlers.set(button, handler);
    });
  }
  
  /**
   * Configura los gestos de swipe en el canvas
   */
  private setupSwipeGestures(): void {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    
    canvas.addEventListener('touchstart', this.touchStartHandler, { passive: false });
    canvas.addEventListener('touchmove', this.touchMoveHandler, { passive: false });
    canvas.addEventListener('touchend', this.touchEndHandler, { passive: false });
  }
  
  /**
   * Maneja el inicio del touch
   */
  private handleTouchStart(event: TouchEvent): void {
    if (!this.enabled) return;
    
    if (event.cancelable) {
      event.preventDefault();
    }
    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.isSwiping = true;
  }
  
  /**
   * Maneja el movimiento del touch
   */
  private handleTouchMove(event: TouchEvent): void {
    if (!this.isSwiping) return;
    if (event.cancelable) {
      event.preventDefault();
    }
  }
  
  /**
   * Maneja el fin del touch y detecta la dirección del swipe
   */
  private handleTouchEnd(event: TouchEvent): void {
    if (!this.isSwiping || !this.enabled) {
      this.isSwiping = false;
      return;
    }
    
    if (event.cancelable) {
      event.preventDefault();
    }
    this.isSwiping = false;
    
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;
    
    // Umbral mínimo para considerar un swipe (30px)
    const minSwipeDistance = 30;
    
    if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
      return;
    }
    
    // Determina la dirección dominante
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Swipe horizontal
      this.pendingDirection = deltaX > 0 ? 'RIGHT' : 'LEFT';
    } else {
      // Swipe vertical
      this.pendingDirection = deltaY > 0 ? 'DOWN' : 'UP';
    }
  }
  
  /**
   * Maneja las teclas presionadas
   */
  private handleKeyPress(event: KeyboardEvent): void {
    if (!this.enabled) return;
    
    const direction = KEY_MAPPINGS[event.key as keyof typeof KEY_MAPPINGS];
    
    if (direction) {
      event.preventDefault();
      this.pendingDirection = direction;
    }
  }
  
  /**
   * Actualiza la dirección de la serpiente
   * Solo aplica el cambio si no es dirección opuesta
   */
  update(_deltaTime: number, _entities: never[]): void {
    if (!this.enabled || !this.pendingDirection) return;
    
    const velocity = this.snake.getComponent<Velocity>('Velocity');
    if (!velocity) return;
    
    const newDirection = DIRECTIONS[this.pendingDirection];
    
    // Evita que la serpiente vaya en dirección opuesta
    if (!velocity.isOpposite(newDirection)) {
      velocity.setDirection(newDirection);
      this.pendingDirection = null;
    }
  }
  
  /**
   * Habilita el sistema de input
   */
  enable(): void {
    this.enabled = true;
  }
  
  /**
   * Deshabilita el sistema de input
   */
  disable(): void {
    this.enabled = false;
    this.pendingDirection = null; // Limpia cualquier dirección pendiente
  }
  
  /**
   * Limpia los event listeners
   */
  dispose(): void {
    document.removeEventListener('keydown', this.keydownHandler);
    
    // Limpia los botones táctiles
    this.touchHandlers.forEach((handler, button) => {
      button.removeEventListener('click', handler);
      button.removeEventListener('touchstart', handler);
    });
    this.touchHandlers.clear();
    
    // Limpia los gestos de swipe
    const canvas = document.getElementById('game-canvas');
    if (canvas) {
      canvas.removeEventListener('touchstart', this.touchStartHandler);
      canvas.removeEventListener('touchmove', this.touchMoveHandler);
      canvas.removeEventListener('touchend', this.touchEndHandler);
    }
  }
}
