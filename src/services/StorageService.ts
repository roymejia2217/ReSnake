/**
 * Servicio de Almacenamiento
 * Maneja el guardado y carga de datos del juego
 * Principio: Single Responsibility (SOLID)
 */

interface GameSave {
  highScore: number;
  lastPlayed: string;
}

export class StorageService {
  private readonly STORAGE_KEY = 'snake-game-save';
  
  /**
   * Guarda los datos del juego
   */
  save(data: GameSave): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save game data:', error);
    }
  }
  
  /**
   * Carga los datos del juego
   */
  load(): GameSave | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load game data:', error);
      return null;
    }
  }
  
  /**
   * Limpia los datos guardados
   */
  clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
