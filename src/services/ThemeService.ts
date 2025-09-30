/**
 * Servicio de Tema
 * Maneja el tema claro/oscuro y preferencias del usuario
 * Principio: Single Responsibility (SOLID)
 */

export type Theme = 'light' | 'dark';

export class ThemeService {
  private currentTheme: Theme = 'dark';
  private readonly STORAGE_KEY = 'snake-theme';
  
  constructor() {
    this.loadPreference();
    this.applyTheme();
  }
  
  /**
   * Obtiene el tema actual
   */
  getTheme(): Theme {
    return this.currentTheme;
  }
  
  /**
   * Establece un tema específico
   */
  setTheme(theme: Theme): void {
    this.currentTheme = theme;
    this.applyTheme();
    this.savePreference();
  }
  
  /**
   * Alterna entre tema claro y oscuro
   */
  toggle(): Theme {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme();
    this.savePreference();
    return this.currentTheme;
  }
  
  /**
   * Verifica si el tema actual es oscuro
   */
  isDark(): boolean {
    return this.currentTheme === 'dark';
  }
  
  /**
   * Aplica el tema al documento
   */
  private applyTheme(): void {
    document.documentElement.setAttribute('data-theme', this.currentTheme);
  }
  
  /**
   * Carga la preferencia desde localStorage
   */
  private loadPreference(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    
    // Si hay preferencia guardada, la usa
    if (saved !== null) {
      this.currentTheme = saved as Theme;
    }
    // Si no hay preferencia, mantiene el tema oscuro por defecto
    // (consistente con el diseño original del juego)
  }
  
  /**
   * Guarda la preferencia en localStorage
   */
  private savePreference(): void {
    localStorage.setItem(this.STORAGE_KEY, this.currentTheme);
  }
}
