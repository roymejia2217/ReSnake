/**
 * Servicio de Sprites
 * Maneja la carga y cache de sprites para el renderizado optimizado
 * Principio: Single Responsibility (SOLID)
 */

export type SpriteType = 'head' | 'body' | 'bodyleftup' | 'bodyrightup' | 'bodyrightdown' | 'bodyupright' | 'tail';

export class SpriteService {
  private readonly sprites: Map<SpriteType, HTMLImageElement>;
  private loadedCount = 0;
  private readonly totalSprites = 7;
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
    const spriteTypes: SpriteType[] = ['head', 'body', 'bodyleftup', 'bodyrightup', 'bodyrightdown', 'bodyupright', 'tail'];
    
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
  }
}
