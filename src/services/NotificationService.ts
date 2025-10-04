/**
 * Servicio de Notificaciones
 * Gestiona las notificaciones de logros y desbloqueos
 * Principio: Single Responsibility (SOLID)
 */

import { SKIN_CONFIG } from '@/config/constants';

export interface Notification {
  id: string;
  type: 'achievement' | 'unlock' | 'info';
  title: string;
  message: string;
  duration: number;
  timestamp: number;
}

export class NotificationService {
  private notifications: Notification[] = [];
  private notificationContainer: HTMLElement | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Inicializa el servicio de notificaciones
   */
  private initialize(): void {
    if (this.isInitialized) return;

    this.createNotificationContainer();
    this.isInitialized = true;
  }

  /**
   * Crea el contenedor de notificaciones en el DOM
   */
  private createNotificationContainer(): void {
    // Verificar si ya existe
    this.notificationContainer = document.getElementById('notification-container');
    
    if (!this.notificationContainer) {
      this.notificationContainer = document.createElement('div');
      this.notificationContainer.id = 'notification-container';
      this.notificationContainer.className = 'notification-container';
      
      // Aplicar estilos inline para garantizar funcionamiento
      this.notificationContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 300px;
      `;
      
      document.body.appendChild(this.notificationContainer);
    }
  }

  /**
   * Muestra una notificación de logro de skin desbloqueada
   */
  showSkinUnlockedNotification(skinId: string): void {
    const skin = SKIN_CONFIG.AVAILABLE_SKINS.find(s => s.id === skinId);
    if (!skin) return;

    const notification: Notification = {
      id: `skin-unlocked-${skinId}`,
      type: 'achievement',
      title: '¡Skin Desbloqueada!',
      message: `Has desbloqueado la skin "${skin.name}"`,
      duration: SKIN_CONFIG.NOTIFICATION.DURATION_MS,
      timestamp: Date.now()
    };

    this.showNotification(notification);
  }

  /**
   * Muestra una notificación personalizada
   */
  showCustomNotification(type: Notification['type'], title: string, message: string, duration: number = 3000): void {
    const notification: Notification = {
      id: `custom-${Date.now()}`,
      type,
      title,
      message,
      duration,
      timestamp: Date.now()
    };

    this.showNotification(notification);
  }

  /**
   * Muestra una notificación
   */
  private showNotification(notification: Notification): void {
    if (!this.notificationContainer) {
      this.initialize();
    }

    // Evitar duplicados
    if (this.notifications.some(n => n.id === notification.id)) {
      return;
    }

    this.notifications.push(notification);
    this.renderNotification(notification);
    
    // Auto-remover después de la duración especificada
    setTimeout(() => {
      this.removeNotification(notification.id);
    }, notification.duration);
  }

  /**
   * Renderiza una notificación en el DOM
   */
  private renderNotification(notification: Notification): void {
    if (!this.notificationContainer) return;

    const notificationElement = document.createElement('div');
    notificationElement.className = `notification notification-${notification.type}`;
    notificationElement.dataset.notificationId = notification.id;
    
    // Aplicar estilos según el tipo
    const baseStyles = `
      background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      border-left: 4px solid #3498db;
      transform: translateX(100%);
      transition: transform 0.3s ease-out, opacity 0.3s ease-out;
      opacity: 0;
      pointer-events: auto;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    `;

    let typeStyles = '';
    switch (notification.type) {
      case 'achievement':
        typeStyles = `
          border-left-color: #f39c12;
          background: linear-gradient(135deg, #e67e22 0%, #f39c12 100%);
        `;
        break;
      case 'unlock':
        typeStyles = `
          border-left-color: #27ae60;
          background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
        `;
        break;
      case 'info':
        typeStyles = `
          border-left-color: #3498db;
          background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
        `;
        break;
    }

    notificationElement.style.cssText = baseStyles + typeStyles;

    // Contenido de la notificación
    notificationElement.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="font-size: 24px;">
          ${this.getNotificationIcon(notification.type)}
        </div>
        <div style="flex: 1;">
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">
            ${notification.title}
          </div>
          <div style="font-size: 12px; opacity: 0.9;">
            ${notification.message}
          </div>
        </div>
        <button style="
          background: none;
          border: none;
          color: white;
          font-size: 18px;
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.2s;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        " onclick="this.parentElement.parentElement.remove()">
          ×
        </button>
      </div>
      <div style="
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: rgba(255, 255, 255, 0.3);
        animation: progress ${notification.duration}ms linear forwards;
      "></div>
    `;

    // Agregar animación de progreso
    if (!document.getElementById('notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `;
      document.head.appendChild(style);
    }

    this.notificationContainer.appendChild(notificationElement);

    // Animar entrada
    requestAnimationFrame(() => {
      notificationElement.style.transform = 'translateX(0)';
      notificationElement.style.opacity = '1';
    });

    // Click para cerrar
    notificationElement.addEventListener('click', () => {
      this.removeNotification(notification.id);
    });
  }

  /**
   * Obtiene el icono para el tipo de notificación
   */
  private getNotificationIcon(type: Notification['type']): string {
    switch (type) {
      case 'achievement':
        return '🏆';
      case 'unlock':
        return '🔓';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  }

  /**
   * Remueve una notificación
   */
  private removeNotification(notificationId: string): void {
    // Remover del array
    this.notifications = this.notifications.filter(n => n.id !== notificationId);

    // Remover del DOM
    const element = document.querySelector(`[data-notification-id="${notificationId}"]`) as HTMLElement;
    if (element) {
      element.style.transform = 'translateX(100%)';
      element.style.opacity = '0';
      
      setTimeout(() => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      }, 300);
    }
  }

  /**
   * Limpia todas las notificaciones
   */
  clearAll(): void {
    this.notifications.forEach(notification => {
      this.removeNotification(notification.id);
    });
  }

  /**
   * Obtiene todas las notificaciones activas
   */
  getActiveNotifications(): Notification[] {
    return [...this.notifications];
  }
}

