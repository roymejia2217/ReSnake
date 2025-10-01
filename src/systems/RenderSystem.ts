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
import type { RomanticEasterEggService } from '@/services/RomanticEasterEggService';

export class RenderSystem implements System {
  private ctx: CanvasRenderingContext2D;
  private cellSize: number;
  private currentTime = 0;
  
  // Cache de gradientes para optimización
  private snakeGradientCache: CanvasGradient | null = null;
  
  // Colores dinámicos del tema
  private snakeColor: string = GAME_CONFIG.COLORS.SNAKE;
  private foodColor: string = GAME_CONFIG.COLORS.FOOD;
  
  // Servicio de easter egg romántico
  private romanticEasterEgg?: RomanticEasterEggService;
  
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
    this.updateCanvasBackground();
  }
  
  /**
   * Actualiza el color de fondo del canvas según el tema
   */
  private updateCanvasBackground(): void {
    const computedStyle = getComputedStyle(document.documentElement);
    const bgColor = computedStyle.getPropertyValue('--canvas-bg').trim();
    if (bgColor) {
      this.canvas.style.backgroundColor = bgColor;
    }
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
   * REFACTORIZADO: Cálculo mejorado para evitar corte de última fila
   */
  private updateCanvasSize(): void {
    const container = this.canvas.parentElement;
    if (!container) return;
    
    // Calcular espacio disponible con márgenes seguros
    const maxWidth = Math.min(window.innerWidth - 40, 600);
    
    // ✅ SOLUCIÓN: Reservar espacio dinámico para panel y mensajes
    // Panel de score: ~80px + Mensaje romántico: ~30px + Controles móviles: ~80px + Margen: 60px
    const reservedHeight = 250;
    const maxHeight = window.innerHeight - reservedHeight;
    
    // Calcular cellSize basado en el espacio disponible
    let cellSize = Math.floor(Math.min(maxWidth, maxHeight) / GAME_CONFIG.BOARD_SIZE);
    cellSize = Math.max(cellSize, 10); // Tamaño mínimo
    
    // ✅ SOLUCIÓN: Verificar que el canvas completo quepa en el espacio vertical
    let canvasSize = GAME_CONFIG.BOARD_SIZE * cellSize;
    
    // Si el canvas es más alto que el espacio disponible, recalcular
    if (canvasSize > maxHeight) {
      cellSize = Math.floor(maxHeight / GAME_CONFIG.BOARD_SIZE);
      cellSize = Math.max(cellSize, 10);
      canvasSize = GAME_CONFIG.BOARD_SIZE * cellSize;
    }
    
    // Si el canvas es más ancho que el espacio disponible, recalcular
    if (canvasSize > maxWidth) {
      cellSize = Math.floor(maxWidth / GAME_CONFIG.BOARD_SIZE);
      cellSize = Math.max(cellSize, 10);
      canvasSize = GAME_CONFIG.BOARD_SIZE * cellSize;
    }
    
    this.cellSize = cellSize;
    this.canvas.width = canvasSize;
    this.canvas.height = canvasSize;
    this.canvas.style.width = `${canvasSize}px`;
    this.canvas.style.height = `${canvasSize}px`;
    
    // Canvas actualizado
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
    this.updateThemeColors();
    this.clearCanvas();
    this.renderSnake();
    this.renderFood();
    this.updateRomanticMessageDOM();
  }
  
  /**
   * Actualiza los colores según el tema actual
   */
  private updateThemeColors(): void {
    const computedStyle = getComputedStyle(document.documentElement);
    const newSnakeColor = computedStyle.getPropertyValue('--color-snake').trim() || GAME_CONFIG.COLORS.SNAKE;
    const newFoodColor = computedStyle.getPropertyValue('--color-food').trim() || GAME_CONFIG.COLORS.FOOD;
    
    // Si cambió el color, invalida el cache de gradientes y actualiza el canvas
    if (newSnakeColor !== this.snakeColor || newFoodColor !== this.foodColor) {
      this.snakeColor = newSnakeColor;
      this.foodColor = newFoodColor;
      this.invalidateGradientCache();
      this.updateCanvasBackground(); // Actualiza el fondo del canvas
    }
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
      gradient.addColorStop(0, this.lightenColor(this.snakeColor, 0.25));
      gradient.addColorStop(0.7, this.snakeColor);
      gradient.addColorStop(1, this.darkenColor(this.snakeColor, 0.15));
      this.snakeGradientCache = gradient;
    }
    return this.snakeGradientCache;
  }
  
  /**
   * Obtiene o crea el gradiente para la comida (sin cache por animación)
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
    gradient.addColorStop(0, this.lightenColor(this.foodColor, 0.3));
    gradient.addColorStop(0.7, this.foodColor);
    gradient.addColorStop(1, this.darkenColor(this.foodColor, 0.2));
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

  /**
   * Establece el servicio de easter egg romántico
   */
  setRomanticEasterEgg(romanticEasterEgg: RomanticEasterEggService): void {
    this.romanticEasterEgg = romanticEasterEgg;
  }

  /**
   * Actualiza el contenedor HTML con los mensajes románticos
   */
  private updateRomanticMessageDOM(): void {
    const container = document.getElementById('romantic-message-container');
    const textElement = document.getElementById('romantic-message-text');
    const emojiElement = document.getElementById('romantic-message-emoji');

    if (!container || !textElement || !emojiElement) {
      console.warn('Elementos del mensaje romántico no encontrados en el DOM');
      return;
    }

    if (!this.romanticEasterEgg || !this.romanticEasterEgg.isEasterEggActive()) {
      container.style.visibility = 'hidden';
      container.style.opacity = '0';
      return;
    }

    const message = this.romanticEasterEgg.getCurrentMessage();
    
    if (!message) {
      // Ocultar pero mantener el espacio
      container.style.visibility = 'hidden';
      container.style.opacity = '0';
      return;
    }

    // Mostrar el contenedor
    container.style.visibility = 'visible';
    container.style.opacity = '1';

    // Actualizar el texto y emoji
    textElement.textContent = message.text;
    emojiElement.textContent = message.emoji;
  }
}