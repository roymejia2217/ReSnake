/**
 * Servicio de Sonido
 * Maneja la reproducción de audio y preferencias del usuario
 * Principio: Single Responsibility (SOLID)
 */

export class SoundService {
  private readonly sounds: Map<string, HTMLAudioElement>;
  private enabled: boolean = true;
  private readonly STORAGE_KEY = 'snake-sound-enabled';
  
  constructor() {
    this.sounds = new Map();
    this.loadPreference();
    this.initializeSounds();
  }
  
  /**
   * Inicializa los archivos de audio
   */
  private initializeSounds(): void {
    const basePath = import.meta.env.BASE_URL;
    this.createSound('eat', `${basePath}sounds/ap.mp3`);
    this.createSound('super_eat', `${basePath}sounds/sap.mp3`);
    this.createSound('gameover', `${basePath}sounds/end.mp3`);
  }
  
  /**
   * Crea y registra un sonido
   */
  private createSound(id: string, path: string): void {
    const audio = new Audio(path);
    audio.preload = 'auto';
    this.sounds.set(id, audio);
  }
  
  /**
   * Reproduce un sonido por su ID
   */
  play(soundId: string): void {
    if (!this.enabled) return;
    
    const sound = this.sounds.get(soundId);
    if (!sound) {
      console.warn(`Sound '${soundId}' not found`);
      return;
    }
    
    // Reinicia el sonido si ya está reproduciéndose
    sound.currentTime = 0;
    sound.play().catch(error => {
      console.warn(`Failed to play sound '${soundId}':`, error);
    });
  }
  
  /**
   * Habilita o deshabilita todos los sonidos
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.savePreference();
    
    // Detiene todos los sonidos si se deshabilita
    if (!enabled) {
      this.stopAll();
    }
  }
  
  /**
   * Alterna entre habilitado y deshabilitado
   */
  toggle(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }
  
  /**
   * Verifica si el sonido está habilitado
   */
  isEnabled(): boolean {
    return this.enabled;
  }
  
  /**
   * Detiene todos los sonidos en reproducción
   */
  private stopAll(): void {
    this.sounds.forEach(sound => {
      sound.pause();
      sound.currentTime = 0;
    });
  }
  
  /**
   * Carga la preferencia desde localStorage
   */
  private loadPreference(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    this.enabled = saved === null ? true : saved === 'true';
  }
  
  /**
   * Guarda la preferencia en localStorage
   */
  private savePreference(): void {
    localStorage.setItem(this.STORAGE_KEY, this.enabled.toString());
  }
  
  /**
   * Limpia todos los recursos de audio
   */
  dispose(): void {
    this.stopAll();
    this.sounds.clear();
  }
}
