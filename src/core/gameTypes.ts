/**
 * Tipos específicos del juego
 * Define los tipos para modos de juego, usuarios y puntuaciones
 * Principio: Type Safety, Interface Segregation (SOLID)
 */

/**
 * Modos de juego disponibles
 */
export type GameMode = 'classic' | 'speed' | 'wall';

/**
 * Información del usuario/jugador
 */
export interface Player {
  id: string; // UUID único
  name: string; // 2-20 caracteres
  createdAt: number; // timestamp
}

/**
 * Entrada de puntuación con toda la información necesaria
 */
export interface ScoreEntry {
  id: string; // UUID único
  playerId: string; // Referencia al player.id
  playerName: string; // Desnormalizado para fácil acceso
  score: number;
  mode: GameMode;
  timestamp: number;
  // Preparado para Supabase
  syncedToCloud?: boolean;
  cloudId?: string;
}

/**
 * Configuración del modo de juego
 */
export interface GameModeConfig {
  mode: GameMode;
  name: string; // Nombre traducido del modo
  description: string; // Descripción traducida
  hasWallCollision: boolean; // Si colisionar con paredes termina el juego
  hasSpeedIncrease: boolean; // Si la velocidad aumenta con cada comida
  speedIncrement?: number; // Cuánto aumenta la velocidad (en ms)
}

/**
 * Estado de la sesión de juego actual
 */
export interface GameSession {
  player: Player;
  mode: GameMode;
  startedAt: number;
  score: number;
  isActive: boolean;
}

/**
 * Datos para almacenamiento local
 */
export interface LocalStorageData {
  currentPlayer?: Player;
  scores: ScoreEntry[];
  settings: {
    soundEnabled: boolean;
    theme: 'light' | 'dark';
    language: 'es' | 'en' | 'it';
  };
}

/**
 * Configuración para futuro Supabase
 */
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  tableName: string;
}

/**
 * Validación de nombre de jugador
 */
export const PLAYER_NAME_CONSTRAINTS = {
  MIN_LENGTH: 2,
  MAX_LENGTH: 20,
  PATTERN: /^[a-zA-Z0-9\s_-]+$/, // Solo alfanuméricos, espacios, guiones y guiones bajos
} as const;
