/**
 * Constantes de configuración del juego
 * Principio: DRY (Don't Repeat Yourself)
 * 
 * Valores preservados del juego original:
 * - Tablero: 20x20
 * - Celda: 20px
 * - Velocidad: 200ms
 * - Colores: #99cc00 (serpiente), #ff5a5f (fruta), #222222 (fondo)
 */

export const GAME_CONFIG = {
  BOARD_SIZE: 20,
  CELL_SIZE: 20,
  INITIAL_SPEED: 200,
  SPEED_INCREMENT: 10,
  COLORS: {
    BACKGROUND: '#222222',
    SNAKE: '#99cc00',
    FOOD: '#ff5a5f',
    TEXT: '#ffffff'
  }
} as const;

export const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 }
} as const;

export const KEY_MAPPINGS = {
  ArrowUp: 'UP',
  ArrowDown: 'DOWN',
  ArrowLeft: 'LEFT',
  ArrowRight: 'RIGHT'
} as const;
