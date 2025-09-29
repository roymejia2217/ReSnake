/**
 * Sistema de Renderizado Mejorado
 * Dibuja el juego en Canvas con diseño profesional y animaciones
 * - Serpiente con segmentos conectados y cabeza diferenciada
 * - Gradientes, sombras y efectos visuales
 * - Animaciones suaves de crecimiento y comida
 * Principio: Single Responsibility (SOLID)
 */

import type { System } from '@/core/types';
import type { Snake } from '@/entities/Snake';
import type { Food } from '@/entities/Food';
import { Renderable } from '@/components/Renderable';
import { GAME_CONFIG } from '@/config/constants';
import { lerp } from '@/utils/AnimationHelper';
import type { Velocity } from '@/components/Velocity';

export class RenderSystem implements System {
  private ctx: CanvasRenderingContext2D;
  private cellSize: number;
  private currentTime = 0;
  
  // Cache de gradientes para optimización
  private snakeGradientCache: CanvasGradient | null = null;
  
  constructor(
    private canvas: HTMLCanvasElement,
    private snake: Snake,
    private food: Food
  ) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas context not available');
    
    this.ctx = context;
    this.cellSize = GAME_CONFIG.CELL_SIZE;
    this.setupCanvas();
    this.setupResponsive();
  }
  
  /**
   * Configura el tamaño del canvas de forma responsiva
   */
  private setupCanvas(): void {
    this.updateCanvasSize();
    this.canvas.style.backgroundColor = GAME_CONFIG.COLORS.BACKGROUND;
  }
  
  /**
   * Configura el comportamiento responsivo del canvas
   */
  private setupResponsive(): void {
    window.addEventListener('resize', () => {
      this.updateCanvasSize();
      this.invalidateGradientCache();
    });
    
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.updateCanvasSize();
        this.invalidateGradientCache();
      }, 100);
    });
  }
  
  /**
   * Actualiza el tamaño del canvas según el viewport
   */
  private updateCanvasSize(): void {
    const container = this.canvas.parentElement;
    if (!container) return;
    
    const maxWidth = Math.min(window.innerWidth - 40, 600);
    const maxHeight = window.innerHeight - 250;
    const availableSize = Math.min(maxWidth, maxHeight);
    
    this.cellSize = Math.floor(availableSize / GAME_CONFIG.BOARD_SIZE);
    this.cellSize = Math.max(this.cellSize, 10);
    
    const canvasSize = GAME_CONFIG.BOARD_SIZE * this.cellSize;
    this.canvas.width = canvasSize;
    this.canvas.height = canvasSize;
    this.canvas.style.width = `${canvasSize}px`;
    this.canvas.style.height = `${canvasSize}px`;
  }
  
  /**
   * Invalida el cache de gradientes cuando cambia el tamaño
   */
  private invalidateGradientCache(): void {
    this.snakeGradientCache = null;
  }
  
  /**
   * Renderiza el frame actual
   */
  update(_deltaTime: number, _entities: never[]): void {
    this.currentTime = performance.now();
    this.clearCanvas();
    this.renderSnake();
    this.renderFood();
  }
  
  /**
   * Limpia el canvas
   */
  private clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  /**
   * Dibuja la serpiente con diseño mejorado
   */
  private renderSnake(): void {
    const renderable = this.snake.getComponent<Renderable>('Renderable');
    if (!renderable) return;
    
    const body = this.snake.body;
    if (body.length === 0) return;
    
    // Dibuja las conexiones entre segmentos primero
    this.drawSnakeConnections(body, renderable.color);
    
    // Dibuja los segmentos del cuerpo
    body.forEach((segment, index) => {
      if (index === 0) {
        // Cabeza con diseño especial
        this.drawSnakeHead(segment, renderable.color);
      } else if (index === body.length - 1) {
        // Cola con animación de crecimiento
        const scale = this.snake.hasJustGrown 
          ? lerp(0.5, 1, this.snake.getGrowthProgress(this.currentTime))
          : 1;
        this.drawSnakeSegment(segment, renderable.color, scale, true);
      } else {
        // Segmentos normales del cuerpo
        this.drawSnakeSegment(segment, renderable.color, 1, false);
      }
    });
  }
  
  /**
   * Dibuja las conexiones suaves entre segmentos
   * Evita dibujar conexiones cuando hay wrap-around en los bordes
   */
  private drawSnakeConnections(body: Array<{x: number, y: number}>, color: string): void {
    if (body.length < 2) return;
    
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = this.cellSize * 0.8;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    for (let i = 0; i < body.length - 1; i++) {
      const current = body[i];
      const next = body[i + 1];
      
      // Detecta wrap-around: si la distancia entre segmentos es mayor que 1, hay wrap
      const deltaX = Math.abs(current.x - next.x);
      const deltaY = Math.abs(current.y - next.y);
      
      // Si hay wrap-around, no dibuja la conexión
      if (deltaX > 1 || deltaY > 1) {
        continue;
      }
      
      const x1 = current.x * this.cellSize + this.cellSize / 2;
      const y1 = current.y * this.cellSize + this.cellSize / 2;
      const x2 = next.x * this.cellSize + this.cellSize / 2;
      const y2 = next.y * this.cellSize + this.cellSize / 2;
      
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    }
  }
  
  /**
   * Dibuja la cabeza de la serpiente con ojos y dirección
   */
  private drawSnakeHead(position: {x: number, y: number}, color: string): void {
    const centerX = position.x * this.cellSize + this.cellSize / 2;
    const centerY = position.y * this.cellSize + this.cellSize / 2;
    const radius = this.cellSize / 2;
    
    // Sombra
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    this.ctx.shadowBlur = this.cellSize * 0.15;
    this.ctx.shadowOffsetX = this.cellSize * 0.05;
    this.ctx.shadowOffsetY = this.cellSize * 0.05;
    
    // Círculo principal con gradiente
    const gradient = this.getSnakeGradient(centerX, centerY, radius);
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius - 1, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Reset sombra
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    
    // Obtiene dirección para posicionar ojos
    const velocity = this.snake.getComponent<Velocity>('Velocity');
    const eyeOffsetX = velocity ? velocity.x * 0.15 : 0.15;
    const eyeOffsetY = velocity ? velocity.y * 0.15 : 0;
    
    // Dibuja los ojos
    const eyeSize = Math.max(this.cellSize * 0.12, 2);
    const eyeDistance = this.cellSize * 0.25;
    
    // Determina la posición de los ojos según la dirección
    let eye1X, eye1Y, eye2X, eye2Y;
    
    if (velocity && Math.abs(velocity.x) > Math.abs(velocity.y)) {
      // Movimiento horizontal
      eye1X = centerX + eyeOffsetX * this.cellSize;
      eye1Y = centerY - eyeDistance;
      eye2X = centerX + eyeOffsetX * this.cellSize;
      eye2Y = centerY + eyeDistance;
    } else {
      // Movimiento vertical o inicial
      eye1X = centerX - eyeDistance;
      eye1Y = centerY + eyeOffsetY * this.cellSize;
      eye2X = centerX + eyeDistance;
      eye2Y = centerY + eyeOffsetY * this.cellSize;
    }
    
    // Ojo 1
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#000000';
    this.ctx.beginPath();
    this.ctx.arc(eye1X, eye1Y, eyeSize * 0.6, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Ojo 2
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#000000';
    this.ctx.beginPath();
    this.ctx.arc(eye2X, eye2Y, eyeSize * 0.6, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Borde decorativo
    this.ctx.strokeStyle = this.darkenColor(color, 0.2);
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius - 1, 0, Math.PI * 2);
    this.ctx.stroke();
  }
  
  /**
   * Dibuja un segmento del cuerpo de la serpiente
   */
  private drawSnakeSegment(
    position: {x: number, y: number}, 
    color: string, 
    scale: number,
    isTail: boolean
  ): void {
    const centerX = position.x * this.cellSize + this.cellSize / 2;
    const centerY = position.y * this.cellSize + this.cellSize / 2;
    const radius = (this.cellSize / 2 - 1) * scale;
    
    // Sombra más sutil para el cuerpo
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    this.ctx.shadowBlur = this.cellSize * 0.1;
    this.ctx.shadowOffsetX = this.cellSize * 0.03;
    this.ctx.shadowOffsetY = this.cellSize * 0.03;
    
    // Círculo con gradiente
    const gradient = this.getSnakeGradient(centerX, centerY, radius);
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Reset sombra
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    
    // Textura tipo escamas (solo en segmentos normales)
    if (!isTail && this.cellSize > 15) {
      this.ctx.fillStyle = this.lightenColor(color, 0.15);
      const scaleSize = Math.max(radius * 0.4, 2);
      this.ctx.beginPath();
      this.ctx.arc(centerX - radius * 0.25, centerY - radius * 0.25, scaleSize, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Borde
    this.ctx.strokeStyle = this.darkenColor(color, 0.2);
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.stroke();
  }
  
  /**
   * Dibuja la comida con animaciones
   */
  private renderFood(): void {
    const renderable = this.food.getComponent<Renderable>('Renderable');
    if (!renderable) return;
    
    const centerX = this.food.position.x * this.cellSize + this.cellSize / 2;
    const centerY = this.food.position.y * this.cellSize + this.cellSize / 2;
    const baseRadius = this.cellSize / 2 - 1;
    
    // Animación de spawn (aparición)
    const spawnProgress = this.food.getSpawnProgress(this.currentTime);
    const spawnScale = spawnProgress > 0 && spawnProgress < 1 
      ? spawnProgress 
      : 1;
    
    // Animación de comer (desaparición)
    const eatProgress = this.food.getEatProgress(this.currentTime);
    const eatScale = eatProgress > 0 && eatProgress < 1
      ? 1 - eatProgress
      : 1;
    
    const finalScale = spawnScale * eatScale;
    const radius = baseRadius * finalScale;
    
    if (radius <= 0) return;
    
    // Animación de pulsación sutil
    const pulseScale = 1 + Math.sin(this.currentTime / 400) * 0.08;
    const pulseRadius = radius * pulseScale;
    
    // Sombra
    this.ctx.shadowColor = 'rgba(255, 90, 95, 0.4)';
    this.ctx.shadowBlur = this.cellSize * 0.3;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    
    // Círculo principal con gradiente
    const gradient = this.getFoodGradient(centerX, centerY, pulseRadius);
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Reset sombra
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    
    // Brillo (highlight)
    if (this.cellSize > 12) {
      const highlightGradient = this.ctx.createRadialGradient(
        centerX - pulseRadius * 0.3,
        centerY - pulseRadius * 0.3,
        0,
        centerX - pulseRadius * 0.3,
        centerY - pulseRadius * 0.3,
        pulseRadius * 0.6
      );
      highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
      highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      this.ctx.fillStyle = highlightGradient;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Tallo (stem) si es grande
    if (this.cellSize > 15 && finalScale > 0.5) {
      this.ctx.fillStyle = '#7cb342';
      this.ctx.fillRect(
        centerX - this.cellSize * 0.05,
        centerY - pulseRadius - this.cellSize * 0.15,
        this.cellSize * 0.1,
        this.cellSize * 0.2
      );
      
      // Hoja
      this.ctx.fillStyle = '#7cb342';
      this.ctx.beginPath();
      this.ctx.ellipse(
        centerX + this.cellSize * 0.1,
        centerY - pulseRadius - this.cellSize * 0.05,
        this.cellSize * 0.12,
        this.cellSize * 0.08,
        Math.PI / 4,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
    }
  }
  
  /**
   * Obtiene o crea el gradiente para la serpiente (con cache)
   */
  private getSnakeGradient(centerX: number, centerY: number, radius: number): CanvasGradient {
    if (!this.snakeGradientCache) {
      const gradient = this.ctx.createRadialGradient(
        centerX - radius * 0.3,
        centerY - radius * 0.3,
        0,
        centerX,
        centerY,
        radius
      );
      gradient.addColorStop(0, this.lightenColor(GAME_CONFIG.COLORS.SNAKE, 0.25));
      gradient.addColorStop(0.7, GAME_CONFIG.COLORS.SNAKE);
      gradient.addColorStop(1, this.darkenColor(GAME_CONFIG.COLORS.SNAKE, 0.15));
      this.snakeGradientCache = gradient;
    }
    return this.snakeGradientCache;
  }
  
  /**
   * Obtiene o crea el gradiente para la comida (con cache)
   */
  private getFoodGradient(centerX: number, centerY: number, radius: number): CanvasGradient {
    const gradient = this.ctx.createRadialGradient(
      centerX - radius * 0.3,
      centerY - radius * 0.3,
      0,
      centerX,
      centerY,
      radius
    );
    gradient.addColorStop(0, this.lightenColor(GAME_CONFIG.COLORS.FOOD, 0.3));
    gradient.addColorStop(0.7, GAME_CONFIG.COLORS.FOOD);
    gradient.addColorStop(1, this.darkenColor(GAME_CONFIG.COLORS.FOOD, 0.2));
    return gradient;
  }
  
  /**
   * Aclara un color hexadecimal
   */
  private lightenColor(color: string, factor: number): string {
    const rgb = this.hexToRgb(color);
    if (!rgb) return color;
    
    return `rgb(${Math.min(255, rgb.r + factor * 255)}, ${Math.min(255, rgb.g + factor * 255)}, ${Math.min(255, rgb.b + factor * 255)})`;
  }
  
  /**
   * Oscurece un color hexadecimal
   */
  private darkenColor(color: string, factor: number): string {
    const rgb = this.hexToRgb(color);
    if (!rgb) return color;
    
    return `rgb(${Math.max(0, rgb.r - factor * 255)}, ${Math.max(0, rgb.g - factor * 255)}, ${Math.max(0, rgb.b - factor * 255)})`;
  }
  
  /**
   * Convierte color hexadecimal a RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
}