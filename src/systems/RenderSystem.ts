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
import type { SuperFood } from '@/entities/SuperFood';
import { Renderable } from '@/components/Renderable';
import { Position } from '@/components/Position';
import { GAME_CONFIG, SUPER_FOOD_CONFIG } from '@/config/constants';
import { lerp } from '@/utils/AnimationHelper';
import type { Velocity } from '@/components/Velocity';
import type { RomanticEasterEggService } from '@/services/RomanticEasterEggService';
import type { SpriteService } from '@/services/SpriteService';
import type { ItemSpriteService } from '@/services/ItemSpriteService';

// Interfaz para partículas de corazón en la lluvia
interface HeartParticle {
  x: number;
  y: number;
  velocity: number;
  size: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
}

export class RenderSystem implements System {
  private ctx: CanvasRenderingContext2D;
  private cellSize: number;
  private currentTime = 0;
  
  // Cache de gradientes para optimización
  private snakeGradientCache: CanvasGradient | null = null;
  
  // Colores dinámicos del tema
  private snakeColor: string = GAME_CONFIG.COLORS.SNAKE;
  private foodColor: string = GAME_CONFIG.COLORS.FOOD;
  private superFoodColor: string = GAME_CONFIG.COLORS.SUPER_FOOD;
  
  // Servicio de easter egg romántico
  private romanticEasterEgg?: RomanticEasterEggService;
  
  // ✅ NUEVO: Servicio de sprites para renderizado optimizado
  private spriteService?: SpriteService;
  
  // ✅ NUEVO: Servicio de sprites para items (manzana, supermanzana, etc.)
  private itemSpriteService?: ItemSpriteService;
  
  // Control de barra de progreso de supermanzana
  private superFoodExpireAt: number | null = null;
  
  // Sistema de lluvia de corazones para puntaje especial
  private heartRain: HeartParticle[] = [];
  private heartRainActive = false;
  private heartRainStartTime = 0;
  
  // Obstáculos para el modo obstacles
  private obstacles: import('@/entities/Obstacle').Obstacle[] = [];
  
  constructor(
    private canvas: HTMLCanvasElement,
    private snake: Snake,
    private food: Food,
    private superFood?: SuperFood
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
    this.renderObstacles();
    this.renderSnake();
    this.renderFood();
    this.renderSuperFood();
    this.updateSuperFoodProgress();
    this.updateHeartRain();
    this.renderHeartRain();
    this.updateRomanticMessageDOM();
  }
  
  /**
   * Actualiza los colores según el tema actual
   */
  private updateThemeColors(): void {
    const computedStyle = getComputedStyle(document.documentElement);
    const newSnakeColor = computedStyle.getPropertyValue('--color-snake').trim() || GAME_CONFIG.COLORS.SNAKE;
    const newFoodColor = computedStyle.getPropertyValue('--color-food').trim() || GAME_CONFIG.COLORS.FOOD;
    const newSuperFoodColor = computedStyle.getPropertyValue('--color-super-food').trim() || GAME_CONFIG.COLORS.SUPER_FOOD;
    
    // Si cambió el color, invalida el cache de gradientes y actualiza el canvas
    if (newSnakeColor !== this.snakeColor || newFoodColor !== this.foodColor || newSuperFoodColor !== this.superFoodColor) {
      this.snakeColor = newSnakeColor;
      this.foodColor = newFoodColor;
      this.superFoodColor = newSuperFoodColor;
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
   * Dibuja la serpiente usando sprites optimizados con rotación automática
   * ✅ NUEVA IMPLEMENTACIÓN: Renderizado con sprites para mejor rendimiento
   */
  private renderSnake(): void {
    const body = this.snake.body;
    if (body.length === 0 || !this.spriteService) return;
    
    // ✅ Obtener dirección del movimiento para rotación
    const velocity = this.snake.getComponent<Velocity>('Velocity');
    const rotationAngle = this.getRotationAngle(velocity, body);
    
    // ✅ RENDERIZADO OPTIMIZADO: Usar sprites con rotación automática y detección de curvas
    body.forEach((segment, index) => {
      const spriteType = this.spriteService!.getSpriteTypeForPosition(index, body.length, body);
      const sprite = this.spriteService!.getSprite(spriteType);
      
      if (sprite) {
        const x = segment.x * this.cellSize;
        const y = segment.y * this.cellSize;
        
        // ✅ ROTACIÓN SIMPLE: Solo para sprites normales, curvas usan sprites específicos
        let angle = rotationAngle[index];
        // Los sprites de curva (bodyleftup, bodyrightup, etc.) no necesitan rotación
        if (spriteType.includes('body') && spriteType !== 'body') {
          angle = 0; // Sin rotación para sprites específicos de curva
        }
        
        // Animación de crecimiento solo para la cola
        if (spriteType === 'tail' && this.snake.hasJustGrown) {
          const scale = lerp(0.5, 1, this.snake.getGrowthProgress(this.currentTime));
          this.drawRotatedScaledSprite(sprite, x, y, scale, angle);
        } else {
          // Renderizado normal con rotación
          this.drawRotatedSprite(sprite, x, y, angle);
        }
      } else {
        // Fallback: usar renderizado Canvas original si no hay sprites
        this.renderSnakeFallback(segment, index, body.length);
      }
    });
  }
  

  /**
   * ✅ CORREGIDO: Calcula ángulos de rotación para cada segmento de la serpiente
   * La cabeza mantiene su orientación hasta que se genere realmente una curvatura
   * Maneja correctamente el wrap-around detectando distancias anómalas
   */
  private getRotationAngle(velocity: Velocity | undefined, body: Position[]): number[] {
    const angles: number[] = [];
    
    for (let i = 0; i < body.length; i++) {
      if (i === 0) {
        // ✅ CORRECCIÓN CRÍTICA: Cabeza usa dirección del movimiento ACTUAL del cuerpo
        // Mantiene orientación hasta que se genere realmente la curvatura
        if (body.length > 1) {
          // ✅ DETECCIÓN DE WRAP-AROUND: Si la distancia es > 1, hay wrap-around
          const distance = this.getManhattanDistance(body[0], body[1]);
          if (distance > 1) {
            // Durante wrap-around, usar la dirección del Velocity
            angles.push(this.getDirectionAngle(velocity));
          } else {
            // Movimiento normal: usar dirección del cuerpo
            const bodyMovementDirection = this.getSegmentDirection(body[1], body[0]);
            angles.push(this.getDirectionAngle(bodyMovementDirection));
          }
        } else {
          // Fallback para cuando solo hay cabeza
          angles.push(this.getDirectionAngle(velocity));
        }
      } else if (i === body.length - 1) {
        // ✅ CORRECCIÓN WRAP-AROUND PARA COLA: Detecta wrap-around en la cola
        // Cola: rotación basada en dirección hacia el segmento anterior
        if (body.length > 1) {
          // ✅ DETECCIÓN DE WRAP-AROUND EN COLA: Si la distancia es > 1, hay wrap-around
          const distance = this.getManhattanDistance(body[i], body[i - 1]);
          if (distance > 1) {
            // ✅ CORRECCIÓN: Durante wrap-around, usar la misma dirección del Velocity
            // La cola debe apuntar en la misma dirección que el movimiento actual
            angles.push(this.getDirectionAngle(velocity));
          } else {
            // Movimiento normal: usar dirección normal entre segmentos
            const tailDirection = this.getSegmentDirection(body[i], body[i - 1]);
            angles.push(this.getDirectionAngle(tailDirection));
          }
        } else {
          // Fallback para cuando solo hay un segmento
          const tailDirection = this.getSegmentDirection(body[i], body[i - 1]);
          angles.push(this.getDirectionAngle(tailDirection));
        }
      } else {
        // Cuerpo: rotación basada en dirección entre segmentos adyacentes
        const bodyDirection = this.getSegmentDirection(body[i - 1], body[i + 1]);
        angles.push(this.getDirectionAngle(bodyDirection));
      }
    }
    
    return angles;
  }
  
  /**
   * ✅ NUEVO: Calcula la dirección entre dos segmentos
   */
  private getSegmentDirection(from: Position, to: Position): { x: number; y: number } {
    return {
      x: to.x - from.x,
      y: to.y - from.y
    };
  }
  
  /**
   * ✅ NUEVO: Calcula la distancia Manhattan entre dos posiciones
   * Usado para detectar wrap-around cuando la distancia es > 1
   */
  private getManhattanDistance(pos1: Position, pos2: Position): number {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
  }
  
  /**
   * ✅ CORREGIDO: Convierte dirección a ángulo en radianes
   * Los sprites están diseñados para ir hacia ARRIBA por defecto
   */
  private getDirectionAngle(direction: { x: number; y: number } | undefined): number {
    if (!direction) return 0;
    
    // Mapeo de direcciones a ángulos (sprites diseñados para UP por defecto):
    // UP (0,-1) = 0° (por defecto - sin rotación)
    // RIGHT (1,0) = 90° (rotar 90° hacia la derecha)
    // DOWN (0,1) = 180° (rotar 180° - invertir)
    // LEFT (-1,0) = 270° (rotar 270° hacia la izquierda)
    
    if (direction.x > 0) return Math.PI / 2;     // Derecha: 90°
    if (direction.x < 0) return 3 * Math.PI / 2; // Izquierda: 270°
    if (direction.y > 0) return Math.PI;         // Abajo: 180°
    if (direction.y < 0) return 0;               // Arriba: 0° (por defecto)
    
    return 0; // Por defecto (arriba)
  }
  
  /**
   * ✅ NUEVO: Dibuja un sprite con rotación
   */
  private drawRotatedSprite(sprite: HTMLImageElement, x: number, y: number, angle: number): void {
    const centerX = x + this.cellSize / 2;
    const centerY = y + this.cellSize / 2;
    
    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate(angle);
    this.ctx.drawImage(sprite, -this.cellSize / 2, -this.cellSize / 2, this.cellSize, this.cellSize);
    this.ctx.restore();
  }
  
  /**
   * ✅ NUEVO: Dibuja un sprite con rotación y escalado
   */
  private drawRotatedScaledSprite(sprite: HTMLImageElement, x: number, y: number, scale: number, angle: number): void {
    const scaledSize = this.cellSize * scale;
    const centerX = x + this.cellSize / 2;
    const centerY = y + this.cellSize / 2;
    
    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate(angle);
    this.ctx.drawImage(sprite, -scaledSize / 2, -scaledSize / 2, scaledSize, scaledSize);
    this.ctx.restore();
  }
  
  
  /**
   * Fallback: renderizado Canvas original (para casos sin sprites)
   */
  private renderSnakeFallback(segment: Position, index: number, totalLength: number): void {
    const renderable = this.snake.getComponent<Renderable>('Renderable');
    if (!renderable) return;
    
    if (index === 0) {
      this.drawSnakeHead(segment, renderable.color);
    } else if (index === totalLength - 1) {
      const scale = this.snake.hasJustGrown 
        ? lerp(0.5, 1, this.snake.getGrowthProgress(this.currentTime))
        : 1;
      this.drawSnakeSegment(segment, renderable.color, scale, true);
    } else {
      this.drawSnakeSegment(segment, renderable.color, 1, false);
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
   * Dibuja la comida con animaciones usando sprite optimizado
   * ✅ REFACTORIZADO: Usa sprite en lugar de gradientes para mejor rendimiento
   */
  private renderFood(): void {
    const renderable = this.food.getComponent<Renderable>('Renderable');
    if (!renderable) return;
    
    const centerX = this.food.position.x * this.cellSize + this.cellSize / 2;
    const centerY = this.food.position.y * this.cellSize + this.cellSize / 2;
    
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
    
    if (finalScale <= 0) return;
    
    // Animación de pulsación sutil
    const pulseScale = 1 + Math.sin(this.currentTime / 400) * 0.08;
    const totalScale = finalScale * pulseScale;
    
    // ✅ OPTIMIZACIÓN: Usar sprite si está disponible, fallback a renderizado Canvas
    const appleSprite = this.itemSpriteService?.getSprite('apple');
    
    if (appleSprite) {
      // Renderizado optimizado con sprite
      this.drawItemSprite(appleSprite, centerX, centerY, totalScale);
    } else {
      // Fallback: renderizado Canvas original (mantiene compatibilidad)
      this.renderFoodFallback(centerX, centerY, finalScale, pulseScale);
    }
  }
  
  /**
   * ✅ NUEVO: Dibuja un sprite de item con escalado y animaciones
   */
  private drawItemSprite(sprite: HTMLImageElement, centerX: number, centerY: number, scale: number): void {
    const scaledSize = this.cellSize * scale;
    
    // Sombra sutil para el sprite
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    this.ctx.shadowBlur = this.cellSize * 0.2;
    this.ctx.shadowOffsetX = this.cellSize * 0.05;
    this.ctx.shadowOffsetY = this.cellSize * 0.05;
    
    // Dibujar sprite centrado
    this.ctx.drawImage(
      sprite, 
      centerX - scaledSize / 2, 
      centerY - scaledSize / 2, 
      scaledSize, 
      scaledSize
    );
    
    // Reset sombra
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
  }
  
  /**
   * ✅ NUEVO: Fallback para renderizado Canvas original (compatibilidad)
   */
  private renderFoodFallback(centerX: number, centerY: number, finalScale: number, pulseScale: number): void {
    const baseRadius = this.cellSize / 2 - 1;
    const radius = baseRadius * finalScale;
    const pulseRadius = radius * pulseScale;
    
    if (radius <= 0) return;
    
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
   * Dibuja la supermanzana con animaciones usando sprite optimizado
   * ✅ REFACTORIZADO: Preparado para usar sprite cuando esté disponible
   */
  private renderSuperFood(): void {
    if (!this.superFood) return;
    
    const renderable = this.superFood.getComponent<Renderable>('Renderable');
    if (!renderable) return;
    
    const coveredCells = this.superFood.getCoveredCells();
    
    // Animación de spawn (aparición)
    const spawnProgress = this.superFood.getSpawnProgress(this.currentTime);
    const spawnScale = spawnProgress > 0 && spawnProgress < 1 
      ? spawnProgress 
      : 1;
    
    // Animación de comer (desaparición)
    const eatProgress = this.superFood.getEatProgress(this.currentTime);
    const eatScale = eatProgress > 0 && eatProgress < 1
      ? 1 - eatProgress
      : 1;
    
    const finalScale = spawnScale * eatScale;
    
    if (finalScale <= 0) return;
    
    // ✅ FUTURO: Usar sprite de supermanzana cuando esté disponible
    const superAppleSprite = this.itemSpriteService?.getSprite('super_apple');
    
    if (superAppleSprite) {
      // Renderizado optimizado con sprite (cuando esté implementado)
      this.renderSuperFoodWithSprite(coveredCells, superAppleSprite, finalScale);
    } else {
      // Renderizado Canvas actual (mantiene compatibilidad)
      coveredCells.forEach(cell => {
        this.renderSuperFoodCell(cell, renderable.color, finalScale);
      });
    }
  }
  
  /**
   * ✅ CORREGIDO: Renderiza supermanzana usando sprite como imagen única de 36x36
   */
  private renderSuperFoodWithSprite(
    coveredCells: {x: number, y: number}[], 
    sprite: HTMLImageElement, 
    scale: number
  ): void {
    if (coveredCells.length === 0) return;
    
    // La supermanzana ocupa 4 celdas (2x2), tomamos la posición de la primera celda (esquina superior izquierda)
    const topLeftCell = coveredCells[0];
    
    // Animación de pulsación más intensa para supermanzana
    const pulseScale = 1 + Math.sin(this.currentTime / 300) * 0.15;
    const totalScale = scale * pulseScale;
    
    // Calcular posición de la esquina superior izquierda de la supermanzana
    const superFoodX = topLeftCell.x * this.cellSize;
    const superFoodY = topLeftCell.y * this.cellSize;
    
    // Tamaño de la supermanzana (2x2 celdas = 36x36 píxeles)
    const superFoodSize = this.cellSize * SUPER_FOOD_CONFIG.SIZE;
    
    // Sombra más intensa para supermanzana
    this.ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
    this.ctx.shadowBlur = this.cellSize * 0.4;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    
    // Renderizar el sprite completo de supermanzana como una sola imagen
    this.ctx.save();
    this.ctx.translate(
      superFoodX + superFoodSize / 2, 
      superFoodY + superFoodSize / 2
    );
    this.ctx.scale(totalScale, totalScale);
    
    this.ctx.drawImage(
      sprite,
      -superFoodSize / 2,
      -superFoodSize / 2,
      superFoodSize,
      superFoodSize
    );
    
    this.ctx.restore();
    
    // Reset sombra
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
  }
  
  /**
   * Dibuja una celda individual de la supermanzana
   */
  private renderSuperFoodCell(
    position: {x: number, y: number}, 
    color: string, 
    scale: number
  ): void {
    const centerX = position.x * this.cellSize + this.cellSize / 2;
    const centerY = position.y * this.cellSize + this.cellSize / 2;
    const baseRadius = this.cellSize / 2 - 1;
    const radius = baseRadius * scale;
    
    if (radius <= 0) return;
    
    // Animación de pulsación más intensa para supermanzana
    const pulseScale = 1 + Math.sin(this.currentTime / 300) * 0.15;
    const pulseRadius = radius * pulseScale;
    
    // Sombra más intensa
    this.ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
    this.ctx.shadowBlur = this.cellSize * 0.4;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    
    // Círculo principal con gradiente
    const gradient = this.getSuperFoodGradient(centerX, centerY, pulseRadius);
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Reset sombra
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    
    // Brillo más intenso
    if (this.cellSize > 12) {
      const highlightGradient = this.ctx.createRadialGradient(
        centerX - pulseRadius * 0.3,
        centerY - pulseRadius * 0.3,
        0,
        centerX - pulseRadius * 0.3,
        centerY - pulseRadius * 0.3,
        pulseRadius * 0.8
      );
      highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      this.ctx.fillStyle = highlightGradient;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Borde dorado
    this.ctx.strokeStyle = this.lightenColor(color, 0.3);
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
    this.ctx.stroke();
  }
  
  /**
   * Obtiene o crea el gradiente para la supermanzana
   */
  private getSuperFoodGradient(centerX: number, centerY: number, radius: number): CanvasGradient {
    const gradient = this.ctx.createRadialGradient(
      centerX - radius * 0.3,
      centerY - radius * 0.3,
      0,
      centerX,
      centerY,
      radius
    );
    gradient.addColorStop(0, this.lightenColor(this.superFoodColor, 0.4));
    gradient.addColorStop(0.7, this.superFoodColor);
    gradient.addColorStop(1, this.darkenColor(this.superFoodColor, 0.1));
    return gradient;
  }
  
  /**
   * Actualiza la barra de progreso de la supermanzana
   */
  private updateSuperFoodProgress(): void {
    const progressElement = document.getElementById('superfood-progress');
    const progressFill = progressElement?.querySelector('.progress-fill') as HTMLElement;
    
    if (!progressElement || !progressFill) return;
    
    if (!this.superFoodExpireAt) {
      progressElement.style.display = 'none';
      return;
    }
    
    const remaining = Math.max(0, this.superFoodExpireAt - this.currentTime);
    const percentage = (remaining / SUPER_FOOD_CONFIG.LIFETIME_MS) * 100;
    
    if (percentage <= 0) {
      progressElement.style.display = 'none';
      this.superFoodExpireAt = null;
      return;
    }
    
    progressElement.style.display = 'block';
    progressFill.style.width = `${percentage}%`;
  }
  
  /**
   * Establece el tiempo de expiración de la supermanzana
   */
  setSuperFoodExpireAt(expireAt: number | null): void {
    this.superFoodExpireAt = expireAt;
  }
  
  /**
   * Actualiza la referencia a la supermanzana
   */
  setSuperFood(superFood?: SuperFood): void {
    this.superFood = superFood;
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
   * ✅ NUEVO: Establece el servicio de sprites
   */
  setSpriteService(spriteService: SpriteService): void {
    this.spriteService = spriteService;
  }
  
  /**
   * ✅ NUEVO: Establece el servicio de sprites para items
   */
  setItemSpriteService(itemSpriteService: ItemSpriteService): void {
    this.itemSpriteService = itemSpriteService;
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
    
    // Nota: La lluvia de corazones se activa desde el callback de puntuación, no desde aquí

    // Mostrar el contenedor
    container.style.visibility = 'visible';
    container.style.opacity = '1';

    // Actualizar el texto y emoji
    textElement.textContent = message.text;
    emojiElement.textContent = message.emoji;
  }

  /**
   * Activa la lluvia de corazones para el puntaje especial
   */
  startHeartRain(): void {
    this.heartRainActive = true;
    this.heartRainStartTime = this.currentTime;
    this.heartRain = [];
    
    // Crear partículas iniciales
    for (let i = 0; i < 20; i++) {
      this.createHeartParticle();
    }
  }

  /**
   * Detiene la lluvia de corazones
   */
  stopHeartRain(): void {
    this.heartRainActive = false;
    this.heartRain = [];
  }

  /**
   * Crea una nueva partícula de corazón
   */
  private createHeartParticle(): void {
    const particle: HeartParticle = {
      x: Math.random() * this.canvas.width,
      y: -20,
      velocity: 1 + Math.random() * 2,
      size: 8 + Math.random() * 12,
      opacity: 0.6 + Math.random() * 0.4,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.1
    };
    
    this.heartRain.push(particle);
  }

  /**
   * Actualiza las partículas de corazón
   */
  private updateHeartRain(): void {
    if (!this.heartRainActive) return;

    // Crear nuevas partículas ocasionalmente
    if (Math.random() < 0.3) {
      this.createHeartParticle();
    }

    // Actualizar partículas existentes
    for (let i = this.heartRain.length - 1; i >= 0; i--) {
      const particle = this.heartRain[i];
      
      // Mover hacia abajo
      particle.y += particle.velocity;
      particle.rotation += particle.rotationSpeed;
      
      // Reducir opacidad gradualmente
      particle.opacity -= 0.005;
      
      // Remover partículas que salieron de la pantalla o perdieron opacidad
      if (particle.y > this.canvas.height + 20 || particle.opacity <= 0) {
        this.heartRain.splice(i, 1);
      }
    }

    // Detener la lluvia después de 8 segundos
    if (this.currentTime - this.heartRainStartTime > 8000) {
      this.stopHeartRain();
    }
  }

  /**
   * Renderiza las partículas de corazón
   */
  private renderHeartRain(): void {
    if (!this.heartRainActive || this.heartRain.length === 0) return;

    this.ctx.save();
    
    this.heartRain.forEach(particle => {
      this.ctx.save();
      this.ctx.globalAlpha = particle.opacity;
      this.ctx.translate(particle.x, particle.y);
      this.ctx.rotate(particle.rotation);
      
      // Dibujar corazón
      this.drawHeart(0, 0, particle.size, '#ff69b4');
      
      this.ctx.restore();
    });
    
    this.ctx.restore();
  }

  /**
   * Dibuja un corazón en las coordenadas especificadas
   */
  private drawHeart(x: number, y: number, size: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1;
    
    const scale = size / 20;
    
    this.ctx.beginPath();
    this.ctx.moveTo(x, y + 5 * scale);
    
    // Curva izquierda del corazón
    this.ctx.bezierCurveTo(
      x - 5 * scale, y - 5 * scale,
      x - 10 * scale, y - 5 * scale,
      x - 10 * scale, y + 2.5 * scale
    );
    
    // Curva inferior izquierda
    this.ctx.bezierCurveTo(
      x - 10 * scale, y + 10 * scale,
      x, y + 10 * scale,
      x, y + 5 * scale
    );
    
    // Curva inferior derecha
    this.ctx.bezierCurveTo(
      x, y + 10 * scale,
      x + 10 * scale, y + 10 * scale,
      x + 10 * scale, y + 2.5 * scale
    );
    
    // Curva derecha del corazón
    this.ctx.bezierCurveTo(
      x + 10 * scale, y - 5 * scale,
      x + 5 * scale, y - 5 * scale,
      x, y + 5 * scale
    );
    
    this.ctx.fill();
    this.ctx.stroke();
  }
  
  /**
   * Establece los obstáculos para renderizar
   */
  setObstacles(obstacles: import('@/entities/Obstacle').Obstacle[]): void {
    this.obstacles = obstacles;
  }
  
  /**
   * Renderiza los obstáculos como cajas sólidas con efecto 3D
   */
  private renderObstacles(): void {
    if (this.obstacles.length === 0) return;
    
    this.obstacles.forEach(obstacle => {
      const x = obstacle.position.x * this.cellSize;
      const y = obstacle.position.y * this.cellSize;
      
      // Color base del obstáculo (marrón tipo caja de madera)
      const baseColor = obstacle.getComponent<Renderable>('Renderable')?.color || '#8b4513';
      
      this.ctx.save();
      
      // Sombra para efecto 3D
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      this.ctx.shadowBlur = 4;
      this.ctx.shadowOffsetX = 2;
      this.ctx.shadowOffsetY = 2;
      
      // Caja principal
      this.ctx.fillStyle = baseColor;
      this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
      
      // Borde más oscuro para efecto de profundidad
      this.ctx.strokeStyle = this.adjustBrightness(baseColor, -30);
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x, y, this.cellSize, this.cellSize);
      
      // Highlight para efecto 3D (esquina superior izquierda)
      this.ctx.fillStyle = this.adjustBrightness(baseColor, 40);
      this.ctx.fillRect(x + 2, y + 2, this.cellSize / 3, 2);
      this.ctx.fillRect(x + 2, y + 2, 2, this.cellSize / 3);
      
      this.ctx.restore();
    });
  }
  
  /**
   * Ajusta el brillo de un color hexadecimal
   */
  private adjustBrightness(color: string, amount: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
    const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }
}