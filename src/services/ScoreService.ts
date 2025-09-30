/**
 * Servicio de Puntuación
 * Maneja la puntuación de la sesión actual
 * Principio: Single Responsibility (SOLID)
 */

export class ScoreService {
  private score = 0;
  private onScoreChange?: (score: number) => void;
  private onScoreIncrement?: () => void;
  
  constructor() {}
  
  /**
   * Incrementa la puntuación
   */
  increment(): void {
    this.score++;
    this.onScoreChange?.(this.score);
    this.onScoreIncrement?.();
  }
  
  /**
   * Reinicia la puntuación
   */
  reset(): void {
    this.score = 0;
    this.onScoreChange?.(this.score);
  }
  
  /**
   * Obtiene la puntuación actual
   */
  getScore(): number {
    return this.score;
  }
  
  /**
   * Establece la puntuación directamente
   */
  setScore(score: number): void {
    this.score = Math.max(0, Math.floor(score));
    this.onScoreChange?.(this.score);
  }
  
  /**
   * Callback para cambios de puntuación
   */
  setOnScoreChange(callback: (score: number) => void): void {
    this.onScoreChange = callback;
  }

  /**
   * Callback para cuando se incrementa la puntuación (para incremento de velocidad)
   */
  setOnScoreIncrement(callback: () => void): void {
    this.onScoreIncrement = callback;
  }
}
