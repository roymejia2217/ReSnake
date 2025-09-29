/**
 * Entidad base del juego
 * Implementa el patrón Entity-Component
 * Principio: Open/Closed (SOLID) - Abierto para extensión, cerrado para modificación
 */

import type { Entity as IEntity, Component } from '@/core/types';

export abstract class BaseEntity implements IEntity {
  readonly id: string;
  components: Map<string, Component>;
  
  constructor(id: string) {
    this.id = id;
    this.components = new Map();
  }
  
  /**
   * Añade un componente a la entidad
   */
  addComponent(component: Component): void {
    this.components.set(component.type, component);
  }
  
  /**
   * Obtiene un componente por tipo
   */
  getComponent<T extends Component>(type: string): T | undefined {
    return this.components.get(type) as T | undefined;
  }
  
  /**
   * Verifica si la entidad tiene un componente
   */
  hasComponent(type: string): boolean {
    return this.components.has(type);
  }
  
  /**
   * Elimina un componente de la entidad
   */
  removeComponent(type: string): void {
    this.components.delete(type);
  }
}
