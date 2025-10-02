/**
 * Servicio de Sprites
 * Maneja la carga y cache de sprites para el renderizado optimizado
 * Principio: Single Responsibility (SOLID)
 */

export type SpriteType = 'head' | 'body' | 'tail';

export class SpriteService {
  private readonly sprites: Map<SpriteType, HTMLImageElement>;
  private loadedCount = 0;
  private readonly totalSprites = 3;
  private readonly basePath: string;
  private loadingPromise: Promise<void> | null = null;
  
  constructor() {
    this.sprites = new Map();
    this.basePath = import.meta.env.BASE_URL;
  }
  
  /**
   * Carga todos los sprites de forma asíncrona
   * Retorna una promesa que se resuelve cuando todos están cargados
   */
  async loadSprites(): Promise<void> {
    // Evitar cargas múltiples simultáneas
    if (this.loadingPromise) {
      return this.loadingPromise;
    }
    
    this.loadingPromise = this.performSpriteLoading();
    return this.loadingPromise;
  }
  
  /**
   * Realiza la carga de sprites
   */
  private async performSpriteLoading(): Promise<void> {
    const spriteTypes: SpriteType[] = ['head', 'body', 'tail'];
    
    const loadPromises = spriteTypes.map(type => 
      this.loadSprite(type, `${this.basePath}sprites/${type}.png`)
    );
    
    await Promise.all(loadPromises);
  }
  
  /**
   * Carga un sprite individual
   */
  private loadSprite(type: SpriteType, src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.sprites.set(type, img);
        this.loadedCount++;
        resolve();
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load sprite: ${src}`));
      };
      
      img.src = src;
    });
  }
  
  /**
   * Obtiene un sprite por su tipo
   */
  getSprite(type: SpriteType): HTMLImageElement | undefined {
    return this.sprites.get(type);
  }
  
  /**
   * Verifica si todos los sprites están cargados
   */
  areAllSpritesLoaded(): boolean {
    return this.loadedCount === this.totalSprites;
  }
  
  /**
   * Obtiene el progreso de carga (0-1)
   */
  getLoadingProgress(): number {
    return this.loadedCount / this.totalSprites;
  }
  
  /**
   * Determina el tipo de sprite basado en la posición en el cuerpo
   */
  getSpriteTypeForPosition(index: number, totalLength: number): SpriteType {
    if (index === 0) return 'head';
    if (index === totalLength - 1) return 'tail';
    return 'body';
  }
  
  /**
   * Reinicia el servicio (útil para testing)
   */
  reset(): void {
    this.sprites.clear();
    this.loadedCount = 0;
    this.loadingPromise = null;
  }
}
