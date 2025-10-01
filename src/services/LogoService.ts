/**
 * Servicio de Logos
 * Maneja el cambio automático de logos según el tema actual
 * Principio: Single Responsibility (SOLID)
 */

import type { ThemeService } from './ThemeService';

export class LogoService {
  private themeService: ThemeService;
  
  // Mapeo de logos según tema y calidad
  private readonly LOGO_MAP = {
    // Logos de alta calidad
    're-snake': {
      light: './res/re-snake.png',
      dark: './res/re-snakew.png'
    },
    // Logos de baja calidad
    're-snake2': {
      light: './res/re-snake2.png', 
      dark: './res/re-snake2w.png'
    }
  };

  constructor(themeService: ThemeService) {
    this.themeService = themeService;
  }

  /**
   * Obtiene la ruta del logo apropiado según el tema actual
   */
  getLogoSrc(logoType: 're-snake' | 're-snake2'): string {
    const theme = this.themeService.getTheme();
    return this.LOGO_MAP[logoType][theme];
  }

  /**
   * Actualiza todos los logos en el DOM según el tema actual
   */
  updateAllLogos(): void {
    // Actualizar logo del menú principal (alta calidad)
    const mainLogo = document.querySelector('.game-logo') as HTMLImageElement;
    if (mainLogo) {
      mainLogo.src = this.getLogoSrc('re-snake');
    }

    // Actualizar logos de opciones/modo/leaderboard (baja calidad)
    const optionsLogos = document.querySelectorAll('.options-logo') as NodeListOf<HTMLImageElement>;
    optionsLogos.forEach(logo => {
      logo.src = this.getLogoSrc('re-snake2');
    });

    // Actualizar logo del panel de puntuación (baja calidad)
    const scoreLogo = document.querySelector('.score-logo') as HTMLImageElement;
    if (scoreLogo) {
      scoreLogo.src = this.getLogoSrc('re-snake2');
    }
  }

  /**
   * Configura el observador de cambios de tema para actualizar logos automáticamente
   */
  setupThemeObserver(): void {
    // Observar cambios en el atributo data-theme del documento
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          this.updateAllLogos();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }

  /**
   * Inicializa el servicio de logos
   */
  initialize(): void {
    // Actualizar logos iniciales
    this.updateAllLogos();
    
    // Configurar observador para cambios futuros
    this.setupThemeObserver();
  }
}
