/**
 * Funciones de utilidad
 * Principio: KISS (Keep It Simple, Stupid)
 */

import { Position } from '@/components/Position';
import { GAME_CONFIG } from '@/config/constants';

/**
 * Genera una posición aleatoria en el tablero
 * Evita posiciones ocupadas
 */
export function generateRandomPosition(
  excludePositions: Position[] = []
): Position {
  const size = GAME_CONFIG.BOARD_SIZE;
  let position: Position;
  
  do {
    position = new Position(
      Math.floor(Math.random() * size),
      Math.floor(Math.random() * size)
    );
  } while (excludePositions.some(p => p.equals(position)));
  
  return position;
}

/**
 * Función debounce para optimizar eventos
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
