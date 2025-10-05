/**
 * Servicio de Sprites para Items
 * Maneja la carga y cache de sprites para items del juego (manzana, supermanzana, etc.)
 * Principio: Single Responsibility (SOLID)
 * Extensible para futuros items siguiendo DRY/KISS
 */

export type ItemSpriteType = 'apple' | 'super_apple' | 'golden_apple';

export class ItemSpriteService {
  private readonly sprites: Map<ItemSpriteType, HTMLImageElement>;
  private loadedCount = 0;
  private readonly basePath: string;
  private loadingPromise: Promise<void> | null = null;
  
  constructor() {
    this.sprites = new Map();
    this.basePath = import.meta.env.BASE_URL;
  }
  
  /**
   * Carga todos los sprites de items de forma asíncrona
   * Retorna una promesa que se resuelve cuando todos están cargados
   */
  async loadSprites(): Promise<void> {
    // Evitar cargas múltiples simultáneas
    if (this.loadingPromise) {
      return this.loadingPromise;
    }
    
    this.loadingPromise = this.performItemSpriteLoading();
    return this.loadingPromise;
  }
  
  /**
   * Realiza la carga de sprites para items
   */
  private async performItemSpriteLoading(): Promise<void> {
    const itemTypes: ItemSpriteType[] = ['apple'];
    
    const loadPromises = itemTypes.map(type => 
      this.loadItemSprite(type, `${this.basePath}sprites/items/${type}.png`)
    );
    
    await Promise.all(loadPromises);
  }
  
  /**
   * Carga un sprite individual para un item específico
   */
  private loadItemSprite(type: ItemSpriteType, src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.sprites.set(type, img);
        this.loadedCount++;
        resolve();
      };
      
      img.onerror = () => {
        console.error(`Failed to load item sprite: ${src}`);
        reject(new Error(`Failed to load item sprite: ${src}`));
      };
      
      img.src = src;
    });
  }
  
  /**
   * Obtiene un sprite por su tipo
   */
  getSprite(type: ItemSpriteType): HTMLImageElement | undefined {
    return this.sprites.get(type);
  }
  
  /**
   * Verifica si todos los sprites están cargados
   */
  areAllSpritesLoaded(): boolean {
    return this.sprites.size === 1; // Actualmente solo apple
  }
  
  /**
   * Obtiene el progreso de carga (0-1)
   */
  getLoadingProgress(): number {
    return this.sprites.size / 1; // Actualmente solo apple
  }
  
  /**
   * Verifica si un sprite específico está cargado
   */
  isSpriteLoaded(type: ItemSpriteType): boolean {
    return this.sprites.has(type);
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
