/**
 * Servicio de Puntuación
 * Maneja la puntuación del juego y el high score
 * Principio: Single Responsibility (SOLID)
 */

export class ScoreService {
  private score = 0;
  private highScore = 0;
  private onScoreChange?: (score: number) => void;
  
  constructor() {
    this.loadHighScore();
  }
  
  /**
   * Incrementa la puntuación
   */
  increment(): void {
    this.score++;
    this.onScoreChange?.(this.score);
    
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
    }
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
   * Obtiene el high score
   */
  getHighScore(): number {
    return this.highScore;
  }
  
  /**
   * Callback para cambios de puntuación
   */
  setOnScoreChange(callback: (score: number) => void): void {
    this.onScoreChange = callback;
  }
  
  /**
   * Carga el high score desde localStorage
   */
  private loadHighScore(): void {
    const saved = localStorage.getItem('snake-high-score');
    this.highScore = saved ? parseInt(saved, 10) : 0;
  }
  
  /**
   * Guarda el high score en localStorage
   */
  private saveHighScore(): void {
    localStorage.setItem('snake-high-score', this.highScore.toString());
  }
}
