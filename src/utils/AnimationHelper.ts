/**
 * Helper para animaciones con easing functions
 * Proporciona funciones de interpolación y timing
 * Principio: DRY - Centraliza lógica de animaciones
 */

export type EasingFunction = (t: number) => number;

/**
 * Funciones de easing estándar
 * @param t - Valor normalizado entre 0 y 1
 * @returns Valor interpolado entre 0 y 1
 */
export const Easing = {
  // Linear
  linear: (t: number): number => t,
  
  // Ease In (aceleración)
  easeInQuad: (t: number): number => t * t,
  easeInCubic: (t: number): number => t * t * t,
  
  // Ease Out (desaceleración)
  easeOutQuad: (t: number): number => t * (2 - t),
  easeOutCubic: (t: number): number => --t * t * t + 1,
  easeOutElastic: (t: number): number => {
    const p = 0.3;
    return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
  },
  
  // Ease In Out (aceleración y desaceleración)
  easeInOutQuad: (t: number): number => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInOutCubic: (t: number): number => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  
  // Bounce
  easeOutBounce: (t: number): number => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  }
};

/**
 * Clase para manejar animaciones basadas en tiempo
 */
export class Animation {
  private startTime = 0;
  private isActive = false;
  
  constructor(
    private duration: number,
    private easing: EasingFunction = Easing.linear
  ) {}
  
  /**
   * Inicia la animación
   */
  start(currentTime: number): void {
    this.startTime = currentTime;
    this.isActive = true;
  }
  
  /**
   * Reinicia la animación
   */
  restart(currentTime: number): void {
    this.start(currentTime);
  }
  
  /**
   * Obtiene el progreso actual de la animación (0-1)
   */
  getProgress(currentTime: number): number {
    if (!this.isActive) return 0;
    
    const elapsed = currentTime - this.startTime;
    const t = Math.min(elapsed / this.duration, 1);
    
    if (t >= 1) {
      this.isActive = false;
    }
    
    return this.easing(t);
  }
  
  /**
   * Verifica si la animación está activa
   */
  get active(): boolean {
    return this.isActive;
  }
  
  /**
   * Detiene la animación
   */
  stop(): void {
    this.isActive = false;
  }
}

/**
 * Interpola entre dos valores
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Interpola entre dos colores en formato hexadecimal
 */
export function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  
  if (!c1 || !c2) return color1;
  
  const r = Math.round(lerp(c1.r, c2.r, t));
  const g = Math.round(lerp(c1.g, c2.g, t));
  const b = Math.round(lerp(c1.b, c2.b, t));
  
  return rgbToHex(r, g, b);
}

/**
 * Convierte color hexadecimal a RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Convierte RGB a color hexadecimal
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}
