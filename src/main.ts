/**
 * Punto de entrada principal del juego
 * Integra todos los sistemas con arquitectura de menús y modos de juego
 * Principio: Composition over Inheritance, SOLID
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
import { ThemeService } from '@/services/ThemeService';
import { I18nService } from '@/services/I18nService';
import { UserService } from '@/services/UserService';
import { GameModeService } from '@/services/GameModeService';
import { MenuService } from '@/services/MenuService';
import { LeaderboardService } from '@/services/LeaderboardService';
import { generateRandomPosition } from '@/utils/helpers';
import { GAME_CONFIG } from '@/config/constants';
import type { GameMode, Player } from '@/core/gameTypes';
import './styles/main.css';

// Inicializa servicios globales INMEDIATAMENTE
const globalThemeService = new ThemeService();
const globalI18nService = new I18nService();

/**
 * Clase principal del juego con sistema completo de menús
 */
class Game {
  // Servicios
  private i18n: I18nService;
  private themeService: ThemeService;
  private soundService: SoundService;
  private userService: UserService;
  private gameModeService: GameModeService;
  private menuService: MenuService;
  private leaderboardService: LeaderboardService;
  private scoreService: ScoreService;
  
  // Motor y entidades
  private engine?: GameEngine;
  private snake?: Snake;
  private food?: Food;
  private inputSystem?: InputSystem;
  private movementSystem?: MovementSystem;
  
  // Estado del juego
  private currentPlayer?: Player;
  private currentMode: GameMode = 'classic';
  private isPaused = false;
  
  constructor() {
    // Inicializa servicios
    this.i18n = globalI18nService;
    this.themeService = globalThemeService;
    this.soundService = new SoundService();
    this.userService = new UserService();
    this.gameModeService = new GameModeService(this.i18n);
    this.menuService = new MenuService();
    this.leaderboardService = new LeaderboardService();
    this.scoreService = new ScoreService();
    
    this.setupMenus();
    this.setupOptionsHandlers();
    this.setupLanguageSync();
    this.updateAllTranslations();
    this.setupSupabaseAvailability();
  }
  
  /**
   * Configura todos los menús y navegación
   */
  private setupMenus(): void {
    // MENÚ PRINCIPAL
    const btnPlay = document.getElementById('btn-play');
    const btnOptions = document.getElementById('btn-options');
    const btnLeaderboard = document.getElementById('btn-leaderboard');
    
    btnPlay?.addEventListener('click', () => {
      this.menuService.navigateTo('game-mode-select');
    });
    
    btnOptions?.addEventListener('click', () => {
      this.menuService.navigateTo('options');
    });
    
    btnLeaderboard?.addEventListener('click', async () => {
      await this.updateLeaderboard('all');
      this.menuService.navigateTo('leaderboard');
    });
    
    // SELECCIÓN DE MODO
    const modeCards = document.querySelectorAll('.mode-card');
    modeCards.forEach(card => {
      card.addEventListener('click', () => {
        const mode = card.getAttribute('data-mode') as GameMode;
        if (mode) {
          this.currentMode = mode;
          this.gameModeService.setMode(mode);
          this.menuService.navigateTo('player-name');
        }
      });
    });
    
    document.getElementById('btn-back-from-mode')?.addEventListener('click', () => {
      this.menuService.navigateBack();
    });
    
    // INGRESO DE NOMBRE
    const playerNameForm = document.getElementById('player-name-form') as HTMLFormElement;
    playerNameForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handlePlayerNameSubmit();
    });
    
    document.getElementById('btn-back-from-name')?.addEventListener('click', () => {
      this.menuService.navigateBack();
    });
    
    // OPCIONES
    document.getElementById('btn-back-from-options')?.addEventListener('click', () => {
      this.menuService.navigateBack();
    });
    
    // LEADERBOARD
    document.getElementById('btn-back-from-leaderboard')?.addEventListener('click', () => {
      this.menuService.navigateBack();
    });
    
    // Tabs del leaderboard (Local/Online)
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const tab = btn.getAttribute('data-tab');
        
        // Actualiza estado activo visualmente
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Actualiza el leaderboard según el tab seleccionado
        await this.updateLeaderboardTab(tab as 'local' | 'online');
      });
    });
    
    // Filtros del leaderboard
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const mode = btn.getAttribute('data-mode') as GameMode | 'all';
        
        // Actualiza estado activo visualmente
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Actualiza el leaderboard con el filtro seleccionado
        await this.updateLeaderboard(mode);
      });
    });
    
    // GAME OVER
    document.getElementById('restart-btn')?.addEventListener('click', () => {
      this.restart();
    });
    
    document.getElementById('menu-btn')?.addEventListener('click', () => {
      this.menuService.clearHistory();
      this.menuService.navigateTo('main-menu');
    });
    
    // Pausa
    document.getElementById('pause-btn')?.addEventListener('click', () => {
      this.togglePause();
    });
    
    // Botón de salir
    document.getElementById('exit-btn')?.addEventListener('click', () => {
      this.showExitConfirmation();
    });
    
    // Modal de confirmación de salida
    document.getElementById('exit-confirm-btn')?.addEventListener('click', () => {
      this.confirmExit();
    });
    
    document.getElementById('exit-cancel-btn')?.addEventListener('click', () => {
      this.hideExitConfirmation();
    });
    
    // Cerrar modal con Escape
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.hideExitConfirmation();
      }
    });
    
    // Atajo de teclado para pausa
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'p' || event.key === 'P') {
        if (this.menuService.getCurrentScreen() === 'game') {
          event.preventDefault();
          this.togglePause();
        }
      }
    });
    
    // Inicia en el menú principal
    this.menuService.navigateTo('main-menu');
  }
  
  /**
   * Maneja el envío del formulario de nombre
   */
  private handlePlayerNameSubmit(): void {
    const input = document.getElementById('player-name-input') as HTMLInputElement;
    const errorDiv = document.getElementById('name-error');
    
    if (!input || !errorDiv) return;
    
    const name = input.value.trim();
    
    try {
      // Valida y crea el jugador
      this.currentPlayer = this.userService.createPlayer(name);
      
      // Limpia error y comienza el juego
      errorDiv.style.display = 'none';
      input.value = '';
      this.startNewGame();
    } catch (error) {
      // Muestra error de validación
      errorDiv.textContent = error instanceof Error ? error.message : this.i18n.t('playerName.error');
      errorDiv.style.display = 'block';
      
      // Aplica shake animation
      input.classList.add('shake');
      setTimeout(() => input.classList.remove('shake'), 500);
    }
  }
  
  /**
   * Configura los manejadores de opciones
   */
  private setupOptionsHandlers(): void {
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    
    toggleButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const option = btn.getAttribute('data-option');
        const value = btn.getAttribute('data-value');
        
        if (!option || !value) return;
        
        // Actualiza estado activo visualmente
        const group = btn.parentElement;
        group?.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Procesa la opción
        switch (option) {
          case 'sound':
            this.soundService.setEnabled(value === 'true');
            break;
          case 'theme':
            this.themeService.setTheme(value as 'light' | 'dark');
            break;
          case 'language':
            this.i18n.setLanguage(value as 'es' | 'en' | 'it');
            this.updateAllTranslations();
            break;
        }
      });
    });
    
    // Sincroniza estado inicial
    this.syncOptionsUI();
  }
  
  /**
   * Sincroniza el UI de opciones con el estado actual
   */
  private syncOptionsUI(): void {
    // Sonido
    const soundEnabled = this.soundService.isEnabled();
    document.querySelectorAll('[data-option="sound"]').forEach(btn => {
      const value = btn.getAttribute('data-value');
      btn.classList.toggle('active', value === String(soundEnabled));
    });
    
    // Tema
    const theme = this.themeService.getTheme();
    document.querySelectorAll('[data-option="theme"]').forEach(btn => {
      const value = btn.getAttribute('data-value');
      btn.classList.toggle('active', value === theme);
    });
    
    // Idioma
    const lang = this.i18n.getLanguage();
    document.querySelectorAll('[data-option="language"]').forEach(btn => {
      const value = btn.getAttribute('data-value');
      btn.classList.toggle('active', value === lang);
    });
  }
  
  /**
   * Configura la sincronización de idioma en tiempo real
   */
  private setupLanguageSync(): void {
    this.i18n.onLanguageChange(() => {
      this.updateAllTranslations();
    });
  }

  /**
   * Configura la disponibilidad del botón "En línea" basado en Supabase
   */
  private setupSupabaseAvailability(): void {
    // Verificar disponibilidad de Supabase después de un breve delay
    setTimeout(() => {
      const onlineTab = document.querySelector('[data-tab="online"]') as HTMLButtonElement;
      if (onlineTab) {
        // Verificar si Supabase está disponible
        const isAvailable = this.leaderboardService.getSupabaseService().isAvailable();
        onlineTab.disabled = !isAvailable;
        
        if (isAvailable) {
          console.log('Supabase disponible - Botón "En línea" habilitado');
        } else {
          console.log('Supabase no disponible - Botón "En línea" deshabilitado');
        }
      }
    }, 3000); // 3 segundos de delay para permitir la inicialización
  }
  
  /**
   * Actualiza todas las traducciones en la página
   */
  private updateAllTranslations(): void {
    // Actualiza lang attribute del HTML
    const htmlRoot = document.getElementById('html-root');
    if (htmlRoot) {
      htmlRoot.setAttribute('lang', this.i18n.getLanguage());
    }
    
    // Actualiza todos los elementos con data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.textContent = this.i18n.t(key);
      }
    });
    
    // Actualiza placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key && el instanceof HTMLInputElement) {
        el.placeholder = this.i18n.t(key);
      }
    });
  }
  
  /**
   * Inicia un nuevo juego con el modo y jugador seleccionados
   */
  private startNewGame(): void {
    if (!this.currentPlayer) return;
    
    this.setupGame();
    this.menuService.navigateTo('game');
    this.engine?.start();
    this.isPaused = false;
    
    // Mostrar mensaje especial romántico al iniciar el juego
    const romanticEasterEgg = this.userService.getRomanticEasterEgg();
    if (romanticEasterEgg.isEasterEggActive()) {
      romanticEasterEgg.showSpecialMessage('gameStart');
    }
    
    // Actualiza UI con modo actual y jugador
    this.updateModeDisplay();
    this.updatePlayerDisplay();
  }
  
  /**
   * Configura el motor y entidades del juego
   */
  private setupGame(): void {
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
    
    // Crea nuevo motor y sistemas
    this.engine = new GameEngine();
    
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('Canvas element not found');
    }
    
    this.inputSystem = new InputSystem(this.snake);
    this.movementSystem = new MovementSystem(this.snake);
    const collisionSystem = new CollisionSystem(this.snake, this.food);
    const renderSystem = new RenderSystem(canvas, this.snake, this.food);
    
    // Configurar easter egg romántico en el sistema de renderizado
    renderSystem.setRomanticEasterEgg(this.userService.getRomanticEasterEgg());
    
    // Configura el modo de juego
    const modeConfig = this.gameModeService.getCurrentConfig();
    this.movementSystem.setWallCollision(modeConfig.hasWallCollision);
    this.movementSystem.setOnWallCollision(() => this.handleGameOver());
    
    // Configura callbacks de colisiones
    collisionSystem.setOnFoodEaten(() => this.handleFoodEaten());
    collisionSystem.setOnGameOver(() => this.handleGameOver());
    
    // Añade sistemas al motor
    this.engine.addSystem(this.inputSystem);
    this.engine.addSystem(this.movementSystem);
    this.engine.addSystem(collisionSystem);
    this.engine.addSystem(renderSystem);
    
    // Configura callback de puntuación
    this.scoreService.setOnScoreChange(score => {
      const scoreEl = document.getElementById('score');
      if (scoreEl) {
        scoreEl.textContent = `${this.i18n.t('game.score')}: ${score}`;
      }
    });
    
    // Configura incremento de velocidad si el modo lo requiere
    if (modeConfig.hasSpeedIncrease) {
      this.scoreService.setOnScoreIncrement(() => {
        const newSpeed = this.gameModeService.calculateSpeed(this.scoreService.getScore());
        this.movementSystem?.setSpeed(newSpeed);
      });
    }
  }
  
  /**
   * Actualiza el display del modo de juego actual
   */
  private updateModeDisplay(): void {
    const modeEl = document.getElementById('current-mode');
    if (modeEl) {
      const modeConfig = this.gameModeService.getCurrentConfig();
      modeEl.textContent = modeConfig.name;
    }
  }
  
  /**
   * Actualiza el display del nombre del jugador
   */
  private updatePlayerDisplay(): void {
    const playerNameEl = document.getElementById('player-name');
    if (playerNameEl && this.currentPlayer) {
      playerNameEl.textContent = this.currentPlayer.name;
    }
  }
  
  /**
   * Maneja cuando la serpiente come
   */
  private handleFoodEaten(): void {
    this.scoreService.increment();
    this.soundService.play('eat');
    
    // Mostrar mensaje especial romántico al conseguir puntos
    const romanticEasterEgg = this.userService.getRomanticEasterEgg();
    if (romanticEasterEgg.isEasterEggActive()) {
      romanticEasterEgg.showSpecialMessage('score');
    }
    
    if (this.snake && this.food) {
      this.food.relocate(generateRandomPosition(this.snake.body), performance.now());
    }
  }
  
  /**
   * Maneja el game over
   */
  private handleGameOver(): void {
    this.engine?.stop();
    this.soundService.play('gameover');
    
    // Guarda la puntuación en el leaderboard
    if (this.currentPlayer) {
      this.leaderboardService.addScore(
        this.currentPlayer,
        this.scoreService.getScore(),
        this.currentMode
      );
    }
    
    // Muestra pantalla de game over
    this.showGameOver();
  }
  
  /**
   * Muestra la pantalla de game over con estadísticas inteligentes
   */
  private async showGameOver(): Promise<void> {
    const finalScoreEl = document.getElementById('final-score');
    const finalModeEl = document.getElementById('final-mode');
    const recordInfoEl = document.getElementById('record-info');
    const romanticMessageContainer = document.getElementById('romantic-record-message');
    const romanticMessageText = document.getElementById('romantic-record-text');
    const romanticMessageEmoji = document.getElementById('romantic-record-emoji');
    
    const score = this.scoreService.getScore();
    const modeConfig = this.gameModeService.getCurrentConfig();
    
    if (finalScoreEl) {
      finalScoreEl.textContent = `${this.i18n.t('game.finalScore')}: ${score}`;
    }
    
    if (finalModeEl) {
      finalModeEl.textContent = `${this.i18n.t('leaderboard.mode')}: ${modeConfig.name}`;
    }
    
    // Ocultar mensaje romántico por defecto
    if (romanticMessageContainer) {
      romanticMessageContainer.style.display = 'none';
    }
    
    // Sistema inteligente de detección de récords (prioriza datos globales)
    if (recordInfoEl && this.currentPlayer) {
      try {
        // Verificar récord mundial usando datos globales
        const isNewWorldRecord = await this.leaderboardService.isWorldRecord(score, this.currentMode);
        const isNewPersonalRecord = this.leaderboardService.isNewPersonalRecord(
          score, 
          this.currentPlayer.id, 
          this.currentMode
        );
        
        if (isNewWorldRecord) {
          // ¡NUEVO RÉCORD MUNDIAL!
          recordInfoEl.textContent = `🏆 ${this.i18n.t('game.newWorldRecord')}!`;
          recordInfoEl.style.color = 'var(--color-snake)';
          recordInfoEl.style.fontWeight = 'bold';
          recordInfoEl.style.animation = 'pulse 1s infinite';
          
          // SOLUCIÓN: Mostrar mensaje romántico en game over
          this.showRomanticRecordMessage(romanticMessageContainer, romanticMessageText, romanticMessageEmoji);
        } else if (isNewPersonalRecord) {
          // Nuevo récord personal
          const currentRecord = this.leaderboardService.getGlobalBestScore(this.currentMode);
          recordInfoEl.textContent = `⭐ ${this.i18n.t('game.newPersonalRecord')}! (${this.i18n.t('game.worldRecord')}: ${currentRecord})`;
          recordInfoEl.style.color = '#ffd700';
          recordInfoEl.style.fontWeight = 'bold';
          
          // SOLUCIÓN: Mostrar mensaje romántico en game over
          this.showRomanticRecordMessage(romanticMessageContainer, romanticMessageText, romanticMessageEmoji);
        } else {
          // No es récord, muestra información del récord actual
          const currentRecord = this.leaderboardService.getGlobalBestScore(this.currentMode);
          const personalBest = this.leaderboardService.getPlayerBestScore(
            this.currentPlayer.id, 
            this.currentMode
          );
          
          recordInfoEl.textContent = `${this.i18n.t('game.worldRecord')}: ${currentRecord} | ${this.i18n.t('game.personalBest')}: ${personalBest}`;
          recordInfoEl.style.color = 'var(--panel-text-secondary)';
          recordInfoEl.style.fontWeight = 'normal';
          recordInfoEl.style.animation = 'none';
        }
      } catch (error) {
        console.warn('Error verificando récords, usando datos locales:', error);
        // Fallback a verificación local
        const isNewLocalRecord = this.leaderboardService.isNewRecord(score, this.currentMode);
        
        if (isNewLocalRecord) {
          recordInfoEl.textContent = `⭐ ${this.i18n.t('game.newPersonalRecord')}!`;
          recordInfoEl.style.color = '#ffd700';
          recordInfoEl.style.fontWeight = 'bold';
          
          // SOLUCIÓN: Mostrar mensaje romántico en game over
          this.showRomanticRecordMessage(romanticMessageContainer, romanticMessageText, romanticMessageEmoji);
        } else {
          const currentRecord = this.leaderboardService.getGlobalBestScore(this.currentMode);
          const personalBest = this.leaderboardService.getPlayerBestScore(
            this.currentPlayer.id, 
            this.currentMode
          );
          
          recordInfoEl.textContent = `${this.i18n.t('game.worldRecord')}: ${currentRecord} | ${this.i18n.t('game.personalBest')}: ${personalBest}`;
          recordInfoEl.style.color = 'var(--panel-text-secondary)';
          recordInfoEl.style.fontWeight = 'normal';
        }
      }
    }
    
    this.menuService.navigateTo('game-over', false);
  }
  
  /**
   * Muestra el mensaje romántico de récord en la pantalla de game over
   * Método auxiliar para DRY (Don't Repeat Yourself)
   */
  private showRomanticRecordMessage(
    container: HTMLElement | null,
    textElement: HTMLElement | null, 
    emojiElement: HTMLElement | null
  ): void {
    const romanticEasterEgg = this.userService.getRomanticEasterEgg();
    
    // Verifica que el easter egg esté activo y los elementos existan
    if (!romanticEasterEgg.isEasterEggActive() || !container || !textElement || !emojiElement) {
      return;
    }
    
    // Obtiene el mensaje romántico de récord
    const romanticMessage = romanticEasterEgg.getSpecialMessage('record');
    
    if (!romanticMessage) {
      return;
    }
    
    // Actualiza el DOM con el mensaje
    textElement.textContent = romanticMessage.text;
    emojiElement.textContent = romanticMessage.emoji;
    container.style.display = 'flex';
    
    console.log(`💕 Mensaje romántico de récord mostrado: "${romanticMessage.text}" 💕`);
  }
  
  /**
   * Reinicia el juego con el mismo jugador y modo
   */
  private restart(): void {
    this.menuService.navigateTo('game', false);
    this.startNewGame();
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
      this.engine?.resume();
      this.isPaused = false;
      pauseOverlay.style.display = 'none';
      pauseIcon.style.display = 'block';
      playIcon.style.display = 'none';
      
      if (this.inputSystem) {
        this.inputSystem.enable();
      }
    } else {
      // Pause
      this.engine?.pause();
      this.isPaused = true;
      pauseOverlay.style.display = 'block';
      pauseIcon.style.display = 'none';
      playIcon.style.display = 'block';
      
      if (this.inputSystem) {
        this.inputSystem.disable();
      }
    }
  }
  
  /**
   * Actualiza el tab del leaderboard (Local/Online)
   */
  private async updateLeaderboardTab(tab: 'local' | 'online'): Promise<void> {
    if (tab === 'online') {
      // Verificar si Supabase está disponible
      if (this.leaderboardService && this.leaderboardService.getSupabaseService().isAvailable()) {
        await this.updateGlobalLeaderboard('all');
      } else {
        // Si no está disponible, volver al tab local
        const localTab = document.querySelector('[data-tab="local"]') as HTMLButtonElement;
        localTab?.click();
        return;
      }
    } else {
      // Tab local
      await this.updateLeaderboard('all');
    }
  }

  /**
   * Actualiza el leaderboard con sistema inteligente (prioriza datos globales)
   */
  private async updateLeaderboard(filterMode: GameMode | 'all' = 'all'): Promise<void> {
    const tbody = document.getElementById('leaderboard-body');
    const noScores = document.getElementById('no-scores');
    const container = document.querySelector('.leaderboard-container');
    
    if (!tbody || !noScores || !container) return;
    
    // Verificar si estamos en tab "En línea" y Supabase está disponible
    const onlineTab = document.querySelector('[data-tab="online"]') as HTMLButtonElement;
    const isOnlineTab = onlineTab?.classList.contains('active');
    
    if (isOnlineTab && this.leaderboardService.getSupabaseService().isAvailable()) {
      // Usar datos globales
      await this.updateGlobalLeaderboard(filterMode);
      return;
    }
    
    // Usar datos locales (tab "Local" o Supabase no disponible)
    let topScores: any[];
    if (filterMode === 'all') {
      topScores = this.leaderboardService.getTopScoresAllModes(20);
    } else {
      topScores = this.leaderboardService.getTopScores(20, filterMode);
    }
    
    this.renderLeaderboardScores(topScores, tbody, noScores, container);
  }

  /**
   * Renderiza las puntuaciones en el leaderboard (método reutilizable)
   */
  private renderLeaderboardScores(scores: any[], tbody: HTMLElement, noScores: HTMLElement, container: Element): void {
    if (scores.length === 0) {
      tbody.innerHTML = '';
      noScores.style.display = 'block';
      noScores.textContent = this.i18n.t('leaderboard.noScores');
      container.classList.remove('has-more-content');
      return;
    }
    
    noScores.style.display = 'none';
    
    // Genera el HTML de todas las puntuaciones
    tbody.innerHTML = scores.map((entry, index) => {
      const modeConfig = this.gameModeService.getConfig(entry.mode);
      const isTopThree = index < 3;
      const positionClass = isTopThree ? `position position-${index + 1}` : 'position';
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
      
      return `
        <tr class="${isTopThree ? 'top-three' : ''}">
          <td class="${positionClass}">${medal} ${index + 1}</td>
          <td class="player-name">${this.escapeHtml(entry.playerName)}</td>
          <td class="score">${entry.score}</td>
          <td><span class="mode-badge mode-${entry.mode}">${modeConfig.name}</span></td>
        </tr>
      `;
    }).join('');
    
    // Detecta si hay más de 5 registros para mostrar el indicador de scroll
    this.updateScrollIndicator(container, scores.length);
    
    // Configura el scroll suave
    this.setupSmoothScroll(container);
  }

  /**
   * Actualiza el leaderboard global desde Supabase
   */
  private async updateGlobalLeaderboard(filterMode: GameMode | 'all' = 'all'): Promise<void> {
    const tbody = document.getElementById('leaderboard-body');
    const noScores = document.getElementById('no-scores');
    const container = document.querySelector('.leaderboard-container');
    
    if (!tbody || !noScores || !container) return;
    
    // Mostrar indicador de carga
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">Cargando puntuaciones globales...</td></tr>';
    
    try {
      // Obtener puntuaciones globales
      const globalScores = await this.leaderboardService.getGlobalLeaderboard(20, filterMode === 'all' ? undefined : filterMode);
      
      // Usar el método reutilizable para renderizar
      this.renderLeaderboardScores(globalScores, tbody, noScores, container);
      
    } catch (error) {
      console.error('Error cargando leaderboard global:', error);
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: var(--color-error);">Error cargando puntuaciones globales</td></tr>';
    }
  }

  /**
   * Actualiza el indicador visual de scroll (simplificado)
   */
  private updateScrollIndicator(container: Element, totalScores: number): void {
    // Solo mantenemos la clase para estilos CSS si es necesario
    if (totalScores > 5) {
      container.classList.add('has-more-content');
    } else {
      container.classList.remove('has-more-content');
    }
  }

  /**
   * Configura el scroll suave y comportamiento inteligente
   */
  private setupSmoothScroll(container: Element): void {
    // Scroll suave al inicio
    container.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Detecta cuando el usuario llega al final del scroll
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5;
      
      if (isAtBottom) {
        // Removemos la clase cuando llega al final
        container.classList.remove('has-more-content');
      } else {
        // Restauramos la clase si no está al final y hay más de 5 registros
        const tbody = container.querySelector('tbody');
        if (tbody && tbody.children.length > 5) {
          container.classList.add('has-more-content');
        }
      }
    };
    
    // Removemos listeners anteriores para evitar duplicados
    container.removeEventListener('scroll', handleScroll);
    container.addEventListener('scroll', handleScroll);
  }
  
  /**
   * Escapa HTML para prevenir XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  /**
   * Muestra el modal de confirmación para salir del juego
   */
  private showExitConfirmation(): void {
    const modal = document.getElementById('exit-confirmation-modal');
    if (modal) {
      modal.style.display = 'flex';
      // Pausa el juego mientras se muestra el modal
      if (!this.isPaused) {
        this.togglePause();
      }
    }
  }
  
  /**
   * Oculta el modal de confirmación
   */
  private hideExitConfirmation(): void {
    const modal = document.getElementById('exit-confirmation-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }
  
  /**
   * Confirma la salida del juego
   */
  private confirmExit(): void {
    this.hideExitConfirmation();
    this.engine?.stop();
    this.menuService.clearHistory();
    this.menuService.navigateTo('main-menu');
  }
}

// Inicializa el juego cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
  new Game();
});