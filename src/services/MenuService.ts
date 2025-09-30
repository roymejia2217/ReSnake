/**
 * Servicio de Menú
 * Gestiona la navegación entre pantallas y estados de la UI
 * Principio: Single Responsibility (SOLID)
 */

export type MenuScreen = 
  | 'main-menu' 
  | 'game-mode-select' 
  | 'player-name' 
  | 'options' 
  | 'leaderboard' 
  | 'game'
  | 'game-over';

export class MenuService {
  private currentScreen: MenuScreen = 'main-menu';
  private screenHistory: MenuScreen[] = [];
  private onScreenChangeCallbacks: Array<(screen: MenuScreen) => void> = [];

  /**
   * Navega a una pantalla específica
   */
  navigateTo(screen: MenuScreen, addToHistory: boolean = true): void {
    if (addToHistory && this.currentScreen !== screen) {
      this.screenHistory.push(this.currentScreen);
    }

    this.currentScreen = screen;
    this.hideAllScreens();
    this.showScreen(screen);
    this.notifyScreenChange();
  }

  /**
   * Navega hacia atrás en el historial
   */
  navigateBack(): void {
    if (this.screenHistory.length > 0) {
      const previousScreen = this.screenHistory.pop()!;
      this.navigateTo(previousScreen, false);
    } else {
      // Si no hay historial, va al menú principal
      this.navigateTo('main-menu', false);
    }
  }

  /**
   * Obtiene la pantalla actual
   */
  getCurrentScreen(): MenuScreen {
    return this.currentScreen;
  }

  /**
   * Limpia el historial de navegación
   */
  clearHistory(): void {
    this.screenHistory = [];
  }

  /**
   * Registra un callback para cambios de pantalla
   */
  onScreenChange(callback: (screen: MenuScreen) => void): void {
    this.onScreenChangeCallbacks.push(callback);
  }

  /**
   * Muestra una pantalla específica
   */
  private showScreen(screen: MenuScreen): void {
    const element = document.getElementById(`screen-${screen}`);
    if (element) {
      element.style.display = 'flex';
      // Añade clase para animación
      element.classList.add('screen-active');
    }
  }

  /**
   * Oculta todas las pantallas
   */
  private hideAllScreens(): void {
    const screens: MenuScreen[] = [
      'main-menu',
      'game-mode-select',
      'player-name',
      'options',
      'leaderboard',
      'game',
      'game-over'
    ];

    screens.forEach(screen => {
      const element = document.getElementById(`screen-${screen}`);
      if (element) {
        element.style.display = 'none';
        element.classList.remove('screen-active');
      }
    });
  }

  /**
   * Notifica a todos los listeners sobre el cambio de pantalla
   */
  private notifyScreenChange(): void {
    this.onScreenChangeCallbacks.forEach(callback => callback(this.currentScreen));
  }
}
