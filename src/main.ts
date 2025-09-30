/**
 * Punto de entrada principal del juego
 * Integra todos los sistemas usando el patrón Facade
 * Principio: Composition over Inheritance
 */

import { GameEngine } from '@/core/Engine';
import { Snake } from '@/entities/Snake';
import { Food } from '@/entities/Food';
import { Position } from '@/components/Position';
import { InputSystem } from '@/systems/InputSystem';
import { MovementSystem } from '@/systems/MovementSystem';
import { CollisionSystem } from '@/systems/CollisionSystem';
import { RenderSystem } from '@/systems/RenderSystem';
import { ScoreService } from '@/services/ScoreService';
import { SoundService } from '@/services/SoundService';
import { generateRandomPosition } from '@/utils/helpers';
import { GAME_CONFIG } from '@/config/constants';
import './styles/main.css';

/**
 * Clase principal del juego
 * Orquesta todos los sistemas y entidades
 */
class Game {
  private engine: GameEngine;
  private snake: Snake;
  private food: Food;
  private scoreService: ScoreService;
  private soundService: SoundService;
  private inputSystem?: InputSystem;
  private isPaused = false;
  
  constructor() {
    this.engine = new GameEngine();
    this.scoreService = new ScoreService();
    this.soundService = new SoundService();
    
    // Inicializa entidades en el centro del tablero
    const initialPosition = new Position(
      Math.floor(GAME_CONFIG.BOARD_SIZE / 2),
      Math.floor(GAME_CONFIG.BOARD_SIZE / 2)
    );
    
    this.snake = new Snake(initialPosition);
    this.food = new Food(generateRandomPosition(this.snake.body));
    this.food.startSpawnAnimation(performance.now());
    
    this.setupSystems();
    this.setupUI();
  }
  
  /**
   * Configura todos los sistemas del juego
   */
  private setupSystems(): void {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    
    if (!canvas) {
      throw new Error('Canvas element not found');
    }
    
    this.inputSystem = new InputSystem(this.snake);
    const movementSystem = new MovementSystem(this.snake);
    const collisionSystem = new CollisionSystem(this.snake, this.food);
    const renderSystem = new RenderSystem(canvas, this.snake, this.food);
    
    // Configura callbacks de colisiones
    collisionSystem.setOnFoodEaten(() => this.handleFoodEaten());
    collisionSystem.setOnGameOver(() => this.handleGameOver());
    
    // Añade sistemas al motor en orden de ejecución
    this.engine.addSystem(this.inputSystem);
    this.engine.addSystem(movementSystem);
    this.engine.addSystem(collisionSystem);
    this.engine.addSystem(renderSystem);
  }
  
  /**
   * Configura la interfaz de usuario
   */
  private setupUI(): void {
    const restartBtn = document.getElementById('restart-btn');
    const gameOverScreen = document.getElementById('game-over');
    const pauseBtn = document.getElementById('pause-btn');
    const soundBtn = document.getElementById('sound-btn');
    
    if (!restartBtn || !gameOverScreen || !pauseBtn || !soundBtn) {
      throw new Error('UI elements not found');
    }
    
    restartBtn.addEventListener('click', () => {
      gameOverScreen.style.display = 'none';
      this.restart();
    });
    
    // Maneja el botón de pausa
    pauseBtn.addEventListener('click', () => {
      this.togglePause();
    });
    
    // Maneja el botón de sonido
    soundBtn.addEventListener('click', () => {
      this.toggleSound();
    });
    
    // Establece el estado inicial del botón de sonido
    this.updateSoundButtonUI();
    
    // Atajo de teclado para pausa (Espacio o P)
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'p' || event.key === 'P') {
        // Solo pausa si el juego está en curso (no en game over)
        if (this.engine.getState() !== 'GAME_OVER' && this.engine.getState() !== 'IDLE') {
          event.preventDefault();
          this.togglePause();
        }
      }
    });
    
    // Actualiza la puntuación en tiempo real
    this.scoreService.setOnScoreChange(score => {
      const scoreEl = document.getElementById('score');
      if (scoreEl) {
        scoreEl.textContent = `Puntuación: ${score}`;
      }
    });
    
    // Muestra el high score inicial
    this.updateHighScoreDisplay();
  }
  
  /**
   * Maneja cuando la serpiente come
   */
  private handleFoodEaten(): void {
    this.scoreService.increment();
    this.soundService.play('eat');
    this.food.relocate(generateRandomPosition(this.snake.body), performance.now());
  }
  
  /**
   * Maneja el game over
   */
  private handleGameOver(): void {
    this.engine.stop();
    this.soundService.play('gameover');
    
    const gameOverScreen = document.getElementById('game-over');
    const finalScore = document.getElementById('final-score');
    const highScoreEl = document.getElementById('high-score-value');
    
    if (gameOverScreen) gameOverScreen.style.display = 'block';
    
    if (finalScore) {
      finalScore.textContent = `Puntuación final: ${this.scoreService.getScore()}`;
    }
    
    if (highScoreEl) {
      highScoreEl.textContent = `Récord: ${this.scoreService.getHighScore()}`;
    }
  }
  
  /**
   * Reinicia el juego
   */
  private restart(): void {
    // Crea nuevas entidades
    const initialPosition = new Position(
      Math.floor(GAME_CONFIG.BOARD_SIZE / 2),
      Math.floor(GAME_CONFIG.BOARD_SIZE / 2)
    );
    
    this.snake = new Snake(initialPosition);
    this.food = new Food(generateRandomPosition(this.snake.body));
    this.food.startSpawnAnimation(performance.now());
    this.scoreService.reset();
    
    // Limpia el sistema de input anterior
    if (this.inputSystem) {
      this.inputSystem.dispose();
    }
    
    // Crea un nuevo motor y reconfigura sistemas
    this.engine = new GameEngine();
    this.setupSystems();
    this.start();
  }
  
  /**
   * Actualiza el display del high score
   */
  private updateHighScoreDisplay(): void {
    const highScoreEl = document.getElementById('high-score-value');
    if (highScoreEl) {
      highScoreEl.textContent = `Récord: ${this.scoreService.getHighScore()}`;
    }
  }
  
  /**
   * Alterna entre pausa y resume
   */
  private togglePause(): void {
    const pauseBtn = document.getElementById('pause-btn');
    const pauseOverlay = document.getElementById('pause-overlay');
    const pauseIcon = document.getElementById('pause-icon');
    const playIcon = document.getElementById('play-icon');
    
    if (!pauseBtn || !pauseOverlay || !pauseIcon || !playIcon) return;
    
    if (this.isPaused) {
      // Resume
      this.engine.resume();
      this.isPaused = false;
      pauseBtn.classList.remove('paused');
      pauseOverlay.style.display = 'none';
      pauseIcon.style.display = 'block';
      playIcon.style.display = 'none';
      
      // Habilita el input
      if (this.inputSystem) {
        this.inputSystem.enable();
      }
    } else {
      // Pause
      this.engine.pause();
      this.isPaused = true;
      pauseBtn.classList.add('paused');
      pauseOverlay.style.display = 'block';
      pauseIcon.style.display = 'none';
      playIcon.style.display = 'block';
      
      // Deshabilita el input
      if (this.inputSystem) {
        this.inputSystem.disable();
      }
    }
  }
  
  /**
   * Alterna el estado del sonido
   */
  private toggleSound(): void {
    const isEnabled = this.soundService.toggle();
    this.updateSoundButtonUI();
    
    // Feedback visual (opcional)
    if (isEnabled) {
      // Reproduce un sonido breve para confirmar
      this.soundService.play('eat');
    }
  }
  
  /**
   * Actualiza la UI del botón de sonido
   */
  private updateSoundButtonUI(): void {
    const soundBtn = document.getElementById('sound-btn');
    const soundOnIcon = document.getElementById('sound-on-icon');
    const soundOffIcon = document.getElementById('sound-off-icon');
    
    if (!soundBtn || !soundOnIcon || !soundOffIcon) return;
    
    const isEnabled = this.soundService.isEnabled();
    
    if (isEnabled) {
      soundBtn.classList.remove('muted');
      soundOnIcon.style.display = 'block';
      soundOffIcon.style.display = 'none';
      soundBtn.setAttribute('aria-label', 'Silenciar sonido');
    } else {
      soundBtn.classList.add('muted');
      soundOnIcon.style.display = 'none';
      soundOffIcon.style.display = 'block';
      soundBtn.setAttribute('aria-label', 'Activar sonido');
    }
  }
  
  /**
   * Inicia el juego
   */
  start(): void {
    this.engine.start();
    this.isPaused = false;
  }
}

// Inicializa el juego cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.start();
});
