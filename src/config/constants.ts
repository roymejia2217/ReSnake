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
    SUPER_FOOD: '#ffd700',
    TEXT: '#ffffff'
  }
} as const;

export const SUPER_FOOD_CONFIG = {
  SIZE: 2,
  POINTS: 5,
  LIFETIME_MS: 3000,
  SPAWN_EVERY_NORMALS: 5
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

// Configuración del Easter Egg Romántico
export const ROMANTIC_EASTER_EGG_CONFIG = {
  SPECIAL_SCORE: 69, // Puntaje especial que activa el mensaje romántico
  SPECIAL_SCORE_TEXT: "Se que este numero es especial para ti" // Texto identificador del mensaje especial
} as const;

// Configuración del Sistema de Skins
export const SKIN_CONFIG = {
  DEFAULT_SKIN: 'default',
  AVAILABLE_SKINS: [
    {
      id: 'default',
      name: 'Clásica',
      description: 'Skin verde original',
      unlockRequirement: { score: -1, mode: 'classic' }, // -1 = siempre desbloqueada
      color: '#99cc00'
    },
    {
      id: 'skin1',
      name: 'Roja',
      description: 'Skin roja desbloqueable',
      unlockRequirement: { score: 30, mode: 'classic' },
      color: '#ff4444'
    }
  ],
  NOTIFICATION: {
    DURATION_MS: 3000,
    STORAGE_KEY: 'skin-notifications-shown'
  }
} as const;