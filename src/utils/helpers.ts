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
 * Genera una posición top-left válida para un área de tamaño específico
 * Garantiza que toda el área quepa dentro del tablero y no colisione con posiciones excluidas
 */
export function generateRandomTopLeftArea(
  areaWidth: number,
  areaHeight: number,
  excludePositions: Position[] = []
): Position {
  const size = GAME_CONFIG.BOARD_SIZE;
  let position: Position;
  
  do {
    position = new Position(
      Math.floor(Math.random() * (size - areaWidth + 1)),
      Math.floor(Math.random() * (size - areaHeight + 1))
    );
  } while (isAreaColliding(position, areaWidth, areaHeight, excludePositions));
  
  return position;
}

/**
 * Verifica si un área colisiona con alguna posición excluida
 */
function isAreaColliding(
  topLeft: Position,
  width: number,
  height: number,
  excludePositions: Position[]
): boolean {
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const cellPosition = new Position(topLeft.x + x, topLeft.y + y);
      if (excludePositions.some(p => p.equals(cellPosition))) {
        return true;
      }
    }
  }
  return false;
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

/**
 * Calcula la distancia Manhattan entre dos posiciones
 * (Distancia en línea recta horizontal + vertical)
 */
export function manhattanDistance(pos1: Position, pos2: Position): number {
  return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
}

/**
 * Genera una posición aleatoria segura para obstáculos
 * Evita posiciones ocupadas y mantiene distancia mínima de posiciones críticas
 */
export function generateSafeObstaclePosition(
  excludePositions: Position[],
  criticalPositions: { position: Position; minDistance: number }[]
): Position {
  const size = GAME_CONFIG.BOARD_SIZE;
  let position: Position;
  let attempts = 0;
  const maxAttempts = 100;
  
  do {
    position = new Position(
      Math.floor(Math.random() * size),
      Math.floor(Math.random() * size)
    );
    attempts++;
    
    // Si no se encuentra posición después de muchos intentos, devolver cualquier posición válida
    if (attempts >= maxAttempts) {
      console.warn('Max attempts reached for obstacle placement, using fallback position');
      break;
    }
  } while (
    // Evitar posiciones ocupadas
    excludePositions.some(p => p.equals(position)) ||
    // Mantener distancia mínima de posiciones críticas
    criticalPositions.some(critical => 
      manhattanDistance(position, critical.position) < critical.minDistance
    )
  );
  
  return position;
}