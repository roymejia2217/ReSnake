/**
 * Servicio de Skins
 * Gestiona el desbloqueo, selección y persistencia de skins
 * Principio: Single Responsibility (SOLID)
 */

import { SKIN_CONFIG } from '@/config/constants';
import type { GameMode } from '@/core/gameTypes';

export interface Skin {
  id: string;
  name: string;
  description: string;
  unlockRequirement: {
    score: number;
    mode: GameMode;
  };
  color: string;
}

export interface UnlockedSkin {
  skinId: string;
  unlockedAt: number;
  unlockedWithScore: number;
  unlockedInMode: GameMode;
}

export class SkinService {
  private readonly STORAGE_KEY = 'snake-unlocked-skins';
  private readonly NOTIFICATION_KEY = 'skin-notifications-shown';
  private unlockedSkins: UnlockedSkin[] = [];
  private shownNotifications: Set<string> = new Set();
  private currentSkin: string = SKIN_CONFIG.DEFAULT_SKIN;

  constructor() {
    this.loadUnlockedSkins();
    this.loadShownNotifications();
  }

  /**
   * Verifica si una skin está desbloqueada
   */
  isSkinUnlocked(skinId: string): boolean {
    return this.unlockedSkins.some(unlocked => unlocked.skinId === skinId);
  }

  /**
   * Obtiene todas las skins disponibles
   */
  getAvailableSkins(): readonly Skin[] {
    return SKIN_CONFIG.AVAILABLE_SKINS;
  }

  /**
   * Obtiene todas las skins desbloqueadas
   */
  getUnlockedSkins(): UnlockedSkin[] {
    return [...this.unlockedSkins];
  }

  /**
   * Obtiene los IDs de todas las skins disponibles para el usuario (incluye default + desbloqueadas)
   */
  getAvailableSkinIds(): string[] {
    const availableIds: string[] = [SKIN_CONFIG.DEFAULT_SKIN]; // Siempre incluir default
    
    // Agregar skins desbloqueadas dinámicamente
    this.unlockedSkins.forEach(unlocked => {
      if (!availableIds.includes(unlocked.skinId)) {
        availableIds.push(unlocked.skinId);
      }
    });
    
    return availableIds;
  }

  /**
   * Obtiene la skin actualmente activa
   */
  getCurrentSkin(): string {
    return this.currentSkin;
  }

  /**
   * Establece la skin activa (solo si está desbloqueada)
   */
  setCurrentSkin(skinId: string): boolean {
    if (skinId === SKIN_CONFIG.DEFAULT_SKIN || this.isSkinUnlocked(skinId)) {
      this.currentSkin = skinId;
      this.saveCurrentSkin();
      return true;
    }
    return false;
  }

  /**
   * Verifica y desbloquea skins basado en puntuación y modo
   */
  checkAndUnlockSkins(score: number, mode: GameMode): string[] {
    const newlyUnlocked: string[] = [];
    
    SKIN_CONFIG.AVAILABLE_SKINS.forEach(skin => {
      // ✅ CORREGIDO: No desbloquear skin default (siempre está desbloqueada)
      if (skin.id !== SKIN_CONFIG.DEFAULT_SKIN && 
          !this.isSkinUnlocked(skin.id) && 
          skin.unlockRequirement.score <= score && 
          skin.unlockRequirement.mode === mode) {
        
        this.unlockSkin(skin.id, score, mode);
        newlyUnlocked.push(skin.id);
      }
    });

    if (newlyUnlocked.length > 0) {
      this.saveUnlockedSkins();
    }

    return newlyUnlocked;
  }

  /**
   * Desbloquea una skin específica
   */
  private unlockSkin(skinId: string, score: number, mode: GameMode): void {
    const unlockedSkin: UnlockedSkin = {
      skinId,
      unlockedAt: Date.now(),
      unlockedWithScore: score,
      unlockedInMode: mode
    };

    this.unlockedSkins.push(unlockedSkin);
  }

  /**
   * Verifica si debe mostrar notificación para una skin
   */
  shouldShowNotification(skinId: string): boolean {
    return this.isSkinUnlocked(skinId) && !this.shownNotifications.has(skinId);
  }

  /**
   * Marca una notificación como mostrada
   */
  markNotificationShown(skinId: string): void {
    this.shownNotifications.add(skinId);
    this.saveShownNotifications();
  }

  /**
   * Obtiene información de una skin por ID
   */
  getSkinInfo(skinId: string): Skin | undefined {
    return SKIN_CONFIG.AVAILABLE_SKINS.find(skin => skin.id === skinId);
  }

  /**
   * Obtiene el progreso de desbloqueo para una skin
   */
  getUnlockProgress(skinId: string, currentScore: number, mode: GameMode): { current: number; required: number; percentage: number } {
    const skin = this.getSkinInfo(skinId);
    if (!skin || skin.unlockRequirement.mode !== mode) {
      return { current: 0, required: 0, percentage: 0 };
    }

    const current = Math.min(currentScore, skin.unlockRequirement.score);
    const required = skin.unlockRequirement.score;
    const percentage = Math.min((current / required) * 100, 100);

    return { current, required, percentage };
  }

  /**
   * Carga las skins desbloqueadas desde localStorage
   */
  private loadUnlockedSkins(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        this.unlockedSkins = JSON.parse(saved) as UnlockedSkin[];
      }
    } catch (error) {
      console.error('Error loading unlocked skins:', error);
      this.unlockedSkins = [];
    }
  }

  /**
   * Guarda las skins desbloqueadas en localStorage
   */
  private saveUnlockedSkins(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.unlockedSkins));
    } catch (error) {
      console.error('Error saving unlocked skins:', error);
    }
  }

  /**
   * Carga las notificaciones mostradas desde localStorage
   */
  private loadShownNotifications(): void {
    try {
      const saved = localStorage.getItem(this.NOTIFICATION_KEY);
      if (saved) {
        const notifications = JSON.parse(saved) as string[];
        this.shownNotifications = new Set(notifications);
      }
    } catch (error) {
      console.error('Error loading shown notifications:', error);
      this.shownNotifications = new Set();
    }
  }

  /**
   * Guarda las notificaciones mostradas en localStorage
   */
  private saveShownNotifications(): void {
    try {
      const notifications = Array.from(this.shownNotifications);
      localStorage.setItem(this.NOTIFICATION_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving shown notifications:', error);
    }
  }

  /**
   * Guarda la skin actual en localStorage
   */
  private saveCurrentSkin(): void {
    try {
      localStorage.setItem('snake-current-skin', this.currentSkin);
    } catch (error) {
      console.error('Error saving current skin:', error);
    }
  }


  /**
   * Reinicia el servicio (útil para testing)
   */
  reset(): void {
    this.unlockedSkins = [];
    this.shownNotifications = new Set();
    this.currentSkin = SKIN_CONFIG.DEFAULT_SKIN;
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.NOTIFICATION_KEY);
    localStorage.removeItem('snake-current-skin');
  }
}
