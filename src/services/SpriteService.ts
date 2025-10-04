/**
 * Servicio de Sprites
 * Maneja la carga y cache de sprites para el renderizado optimizado
 * Principio: Single Responsibility (SOLID)
 */

import { SKIN_CONFIG } from '@/config/constants';

export type SpriteType = 'head' | 'body' | 'bodyleftup' | 'bodyrightup' | 'bodyrightdown' | 'bodyupright' | 'tail';

export class SpriteService {
  private readonly sprites: Map<string, Map<SpriteType, HTMLImageElement>>;
  private loadedCount = 0;
  private readonly totalSprites = 7;
  private readonly basePath: string;
  private loadingPromise: Promise<void> | null = null;
  private currentSkin: string = SKIN_CONFIG.DEFAULT_SKIN;
  
  constructor() {
    this.sprites = new Map();
    this.basePath = import.meta.env.BASE_URL;
    this.loadCurrentSkin();
  }
  
  /**
   * Establece la skin activa y recarga sprites si es necesario
   */
  setSkin(skinId: string): Promise<void> {
    if (skinId === this.currentSkin) {
      return Promise.resolve();
    }

    this.currentSkin = skinId;
    this.saveCurrentSkin();
    
    // Si no tenemos esta skin cargada, la cargamos
    if (!this.sprites.has(skinId)) {
      return this.loadSpritesForSkin(skinId);
    }
    
    return Promise.resolve();
  }

  /**
   * Obtiene la skin actual
   */
  getCurrentSkin(): string {
    return this.currentSkin;
  }

  /**
   * Carga todos los sprites de la skin actual de forma asíncrona
   * Retorna una promesa que se resuelve cuando todos están cargados
   */
  async loadSprites(): Promise<void> {
    return this.loadSpritesForSkin(this.currentSkin);
  }

  /**
   * Carga sprites para una skin específica
   */
  private async loadSpritesForSkin(skinId: string): Promise<void> {
    // Evitar cargas múltiples simultáneas para la misma skin
    const cacheKey = `loading-${skinId}`;
    if (this.loadingPromise && this.sprites.has(cacheKey)) {
      return this.loadingPromise;
    }
    
    this.loadingPromise = this.performSpriteLoading(skinId);
    return this.loadingPromise;
  }
  
  /**
   * Realiza la carga de sprites para una skin específica
   */
  private async performSpriteLoading(skinId: string): Promise<void> {
    const spriteTypes: SpriteType[] = ['head', 'body', 'bodyleftup', 'bodyrightup', 'bodyrightdown', 'bodyupright', 'tail'];
    
    // Inicializar mapa para esta skin si no existe
    if (!this.sprites.has(skinId)) {
      this.sprites.set(skinId, new Map());
    }
    
    const loadPromises = spriteTypes.map(type => 
      this.loadSprite(skinId, type, `${this.basePath}sprites/${skinId}/${type}.png`)
    );
    
    await Promise.all(loadPromises);
  }
  
  /**
   * Carga un sprite individual para una skin específica
   */
  private loadSprite(skinId: string, type: SpriteType, src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        const skinSprites = this.sprites.get(skinId)!;
        skinSprites.set(type, img);
        this.loadedCount++;
        resolve();
      };
      
      img.onerror = () => {
        // Fallback a skin default si falla la carga
        if (skinId !== SKIN_CONFIG.DEFAULT_SKIN) {
          console.warn(`Failed to load sprite ${src}, falling back to default skin`);
          this.loadSpriteFallback(skinId, type);
          resolve();
        } else {
          reject(new Error(`Failed to load sprite: ${src}`));
        }
      };
      
      img.src = src;
    });
  }

  /**
   * Carga fallback desde skin default
   */
  private async loadSpriteFallback(skinId: string, type: SpriteType): Promise<void> {
    if (skinId === SKIN_CONFIG.DEFAULT_SKIN) {
      return;
    }

    try {
      const defaultSrc = `${this.basePath}sprites/${SKIN_CONFIG.DEFAULT_SKIN}/${type}.png`;
      const img = new Image();
      
      img.onload = () => {
        const skinSprites = this.sprites.get(skinId)!;
        skinSprites.set(type, img);
      };
      
      img.src = defaultSrc;
    } catch (error) {
      console.error(`Failed to load fallback sprite for ${type}:`, error);
    }
  }
  
  /**
   * Obtiene un sprite por su tipo de la skin actual
   */
  getSprite(type: SpriteType): HTMLImageElement | undefined {
    const skinSprites = this.sprites.get(this.currentSkin);
    return skinSprites?.get(type);
  }

  /**
   * Obtiene un sprite específico de una skin específica
   */
  getSpriteForSkin(skinId: string, type: SpriteType): HTMLImageElement | undefined {
    const skinSprites = this.sprites.get(skinId);
    return skinSprites?.get(type);
  }
  
  /**
   * Verifica si todos los sprites están cargados para la skin actual
   */
  areAllSpritesLoaded(): boolean {
    const skinSprites = this.sprites.get(this.currentSkin);
    return skinSprites ? skinSprites.size === this.totalSprites : false;
  }
  
  /**
   * Obtiene el progreso de carga (0-1) para la skin actual
   */
  getLoadingProgress(): number {
    const skinSprites = this.sprites.get(this.currentSkin);
    return skinSprites ? skinSprites.size / this.totalSprites : 0;
  }

  /**
   * Carga la skin actual desde localStorage
   */
  private loadCurrentSkin(): void {
    try {
      const saved = localStorage.getItem('snake-current-skin');
      if (saved) {
        this.currentSkin = saved;
      }
    } catch (error) {
      console.error('Error loading current skin:', error);
      this.currentSkin = SKIN_CONFIG.DEFAULT_SKIN;
    }
  }

  /**
   * Guarda la skin actual en localStorage
   */
  private saveCurrentSkin(): void {
    try {
      localStorage.setItem('snake-current-skin', this.currentSkin);
    } catch (error) {
      console.error('Error saving current skin:', error);
    }
  }
  
  /**
   * Determina el tipo de sprite basado en la posición en el cuerpo
   * ✅ NUEVO: Usa sprites específicos para cada tipo de curva
   */
  getSpriteTypeForPosition(index: number, totalLength: number, body?: { x: number; y: number }[]): SpriteType {
    if (index === 0) return 'head';
    if (index === totalLength - 1) return 'tail';
    
    // ✅ DETECCIÓN DE CURVAS: Usar sprite específico según el tipo de curva
    if (body && this.isCurveSegment(index, body)) {
      return this.getCurveSpriteType(index, body);
    }
    
    return 'body';
  }
  
  /**
   * ✅ NUEVO: Detecta si un segmento del cuerpo está en una curva
   * Analiza la dirección entre segmentos adyacentes para detectar cambios
   */
  private isCurveSegment(index: number, body: { x: number; y: number }[]): boolean {
    // Necesitamos al menos 3 segmentos para detectar una curva
    if (body.length < 3 || index <= 0 || index >= body.length - 1) {
      return false;
    }
    
    const prevSegment = body[index - 1];
    const currentSegment = body[index];
    const nextSegment = body[index + 1];
    
    // Calcular direcciones
    const directionFromPrev = {
      x: currentSegment.x - prevSegment.x,
      y: currentSegment.y - prevSegment.y
    };
    
    const directionToNext = {
      x: nextSegment.x - currentSegment.x,
      y: nextSegment.y - currentSegment.y
    };
    
    // Detectar si hay cambio de dirección (curva)
    // Si las direcciones son diferentes, es una curva
    const isCurve = !this.areDirectionsEqual(directionFromPrev, directionToNext);
    
    return isCurve;
  }
  
  /**
   * ✅ NUEVO: Compara dos direcciones para detectar si son iguales
   */
  private areDirectionsEqual(dir1: { x: number; y: number }, dir2: { x: number; y: number }): boolean {
    return dir1.x === dir2.x && dir1.y === dir2.y;
  }
  
  /**
   * ✅ NUEVO: Determina el sprite específico según el tipo de curva
   */
  private getCurveSpriteType(index: number, body: { x: number; y: number }[]): SpriteType {
    if (index <= 0 || index >= body.length - 1) {
      return 'body'; // Fallback
    }
    
    const prevSegment = body[index - 1];
    const currentSegment = body[index];
    const nextSegment = body[index + 1];
    
    // Calcular direcciones usando la misma lógica que isCurveSegment
    const directionIn = {
      x: currentSegment.x - prevSegment.x,
      y: currentSegment.y - prevSegment.y
    };
    
    const directionOut = {
      x: nextSegment.x - currentSegment.x,
      y: nextSegment.y - currentSegment.y
    };
    
    // Mapear a sprites específicos
    // LEFT → UP
    if (directionIn.x === -1 && directionIn.y === 0 && directionOut.x === 0 && directionOut.y === -1) {
      return 'bodyleftup';
    }
    
    // RIGHT → UP
    if (directionIn.x === 1 && directionIn.y === 0 && directionOut.x === 0 && directionOut.y === -1) {
      return 'bodyrightup';
    }
    
    // RIGHT → DOWN
    if (directionIn.x === 1 && directionIn.y === 0 && directionOut.x === 0 && directionOut.y === 1) {
      return 'bodyrightdown';
    }
    
    // UP → RIGHT
    if (directionIn.x === 0 && directionIn.y === -1 && directionOut.x === 1 && directionOut.y === 0) {
      return 'bodyupright';
    }
    
    // DOWN → RIGHT (usar bodyleftup)
    if (directionIn.x === 0 && directionIn.y === 1 && directionOut.x === 1 && directionOut.y === 0) {
      return 'bodyleftup';
    }
    
    // UP → LEFT (usar bodyrightdown)
    if (directionIn.x === 0 && directionIn.y === -1 && directionOut.x === -1 && directionOut.y === 0) {
      return 'bodyrightdown';
    }
    
    // LEFT → DOWN (usar bodyupright)
    if (directionIn.x === -1 && directionIn.y === 0 && directionOut.x === 0 && directionOut.y === 1) {
      return 'bodyupright';
    }
    
    // DOWN → LEFT (usar bodyrightup)
    if (directionIn.x === 0 && directionIn.y === 1 && directionOut.x === -1 && directionOut.y === 0) {
      return 'bodyrightup';
    }
    
    // Fallback para otros casos
    return 'body';
  }
  
  /**
   * Reinicia el servicio (útil para testing)
   */
  reset(): void {
    this.sprites.clear();
    this.loadedCount = 0;
    this.loadingPromise = null;
    this.currentSkin = SKIN_CONFIG.DEFAULT_SKIN;
  }
}
