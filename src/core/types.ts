/**
 * Tipos e interfaces centrales del juego
 * Principio: Dependency Inversion (SOLID)
 */

export interface Vector2D {
  x: number;
  y: number;
}

export interface Component {
  readonly type: string;
}

export interface Entity {
  readonly id: string;
  components: Map<string, Component>;
  addComponent(component: Component): void;
  getComponent<T extends Component>(type: string): T | undefined;
  hasComponent(type: string): boolean;
  removeComponent(type: string): void;
}

export interface System {
  update(deltaTime: number, entities: Entity[]): void;
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export enum GameState {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER'
}
