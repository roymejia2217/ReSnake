/**
 * Servicio de Internacionalización (i18n)
 * Maneja traducciones globalizadas con soporte extensible
 * Principio: Single Responsibility, Open/Closed (SOLID)
 */

export type Language = 'es' | 'en' | 'it';

interface Translations {
  [key: string]: string | Translations;
}

interface LanguagePack {
  es: Translations;
  en: Translations;
  it: Translations;
}

const translations: LanguagePack = {
  es: {
    menu: {
      title: 'Snake Game',
      play: 'Jugar',
      options: 'Opciones',
      leaderboard: 'Mejores Puntuaciones',
    },
    gameMode: {
      title: 'Seleccionar Modo de Juego',
      classic: 'Clásico',
      classicDesc: 'Modo tradicional con atravesar paredes',
      speed: 'Velocidad',
      speedDesc: 'La velocidad aumenta con cada manzana',
      wall: 'Pared',
      wallDesc: 'Game over al tocar las paredes',
      back: 'Volver',
    },
    playerName: {
      title: 'Ingresa tu Nombre',
      placeholder: 'Nombre del jugador',
      start: 'Comenzar Partida',
      back: 'Volver',
      error: 'El nombre debe tener entre 2 y 20 caracteres',
    },
    options: {
      title: 'Opciones',
      sound: 'Sonido',
      soundOn: 'Activado',
      soundOff: 'Desactivado',
      theme: 'Tema',
      themeLight: 'Claro',
      themeDark: 'Oscuro',
      language: 'Idioma',
      languageEs: 'Español',
      languageEn: 'English',
      languageIt: 'Italiano',
      back: 'Volver',
    },
    leaderboard: {
      title: 'Mejores Puntuaciones',
      local: 'Locales',
      online: 'En línea',
      position: 'Pos',
      player: 'Jugador',
      score: 'Puntos',
      mode: 'Modo',
      noScores: 'No hay puntuaciones registradas',
      back: 'Volver',
    },
    game: {
      score: 'Puntuación',
      record: 'Récord',
      paused: 'Pausado',
      pauseMessage: 'Presiona el botón de pausa para continuar',
      gameOver: 'Juego Terminado',
      finalScore: 'Puntuación final',
      restart: 'Reiniciar',
      menu: 'Menú Principal',
      pause: 'Pausar juego',
      resume: 'Reanudar juego',
      exitConfirm: {
        title: '¿Salir del Juego?',
        message: '¿Estás seguro de que quieres salir? Se perderá el progreso actual.',
        yes: 'Sí, Salir',
        no: 'Cancelar',
      },
    },
    modes: {
      classic: 'Clásico',
      speed: 'Velocidad',
      wall: 'Pared',
    },
  },
  en: {
    menu: {
      title: 'Snake Game',
      play: 'Play',
      options: 'Options',
      leaderboard: 'Leaderboard',
    },
    gameMode: {
      title: 'Select Game Mode',
      classic: 'Classic',
      classicDesc: 'Traditional mode with wall wrapping',
      speed: 'Speed',
      speedDesc: 'Speed increases with each apple',
      wall: 'Wall',
      wallDesc: 'Game over when hitting walls',
      back: 'Back',
    },
    playerName: {
      title: 'Enter Your Name',
      placeholder: 'Player name',
      start: 'Start Game',
      back: 'Back',
      error: 'Name must be between 2 and 20 characters',
    },
    options: {
      title: 'Options',
      sound: 'Sound',
      soundOn: 'On',
      soundOff: 'Off',
      theme: 'Theme',
      themeLight: 'Light',
      themeDark: 'Dark',
      language: 'Language',
      languageEs: 'Español',
      languageEn: 'English',
      languageIt: 'Italiano',
      back: 'Back',
    },
    leaderboard: {
      title: 'Leaderboard',
      local: 'Local',
      online: 'Online',
      position: 'Pos',
      player: 'Player',
      score: 'Score',
      mode: 'Mode',
      noScores: 'No scores registered',
      back: 'Back',
    },
    game: {
      score: 'Score',
      record: 'Record',
      paused: 'Paused',
      pauseMessage: 'Press pause button to continue',
      gameOver: 'Game Over',
      finalScore: 'Final score',
      restart: 'Restart',
      menu: 'Main Menu',
      pause: 'Pause game',
      resume: 'Resume game',
      exitConfirm: {
        title: 'Exit Game?',
        message: 'Are you sure you want to exit? Current progress will be lost.',
        yes: 'Yes, Exit',
        no: 'Cancel',
      },
    },
    modes: {
      classic: 'Classic',
      speed: 'Speed',
      wall: 'Wall',
    },
  },
  it: {
    menu: {
      title: 'Snake Game',
      play: 'Gioca',
      options: 'Opzioni',
      leaderboard: 'Classifica',
    },
    gameMode: {
      title: 'Seleziona Modalità di Gioco',
      classic: 'Classico',
      classicDesc: 'Modalità tradizionale con attraversamento muri',
      speed: 'Velocità',
      speedDesc: 'La velocità aumenta con ogni mela',
      wall: 'Muro',
      wallDesc: 'Game over quando si toccano i muri',
      back: 'Indietro',
    },
    playerName: {
      title: 'Inserisci il Tuo Nome',
      placeholder: 'Nome giocatore',
      start: 'Inizia Partita',
      back: 'Indietro',
      error: 'Il nome deve essere tra 2 e 20 caratteri',
    },
    options: {
      title: 'Opzioni',
      sound: 'Suono',
      soundOn: 'Attivato',
      soundOff: 'Disattivato',
      theme: 'Tema',
      themeLight: 'Chiaro',
      themeDark: 'Scuro',
      language: 'Lingua',
      languageEs: 'Español',
      languageEn: 'English',
      languageIt: 'Italiano',
      back: 'Indietro',
    },
    leaderboard: {
      title: 'Classifica',
      local: 'Locale',
      online: 'Online',
      position: 'Pos',
      player: 'Giocatore',
      score: 'Punteggio',
      mode: 'Modalità',
      noScores: 'Nessun punteggio registrato',
      back: 'Indietro',
    },
    game: {
      score: 'Punteggio',
      record: 'Record',
      paused: 'In Pausa',
      pauseMessage: 'Premi il pulsante pausa per continuare',
      gameOver: 'Game Over',
      finalScore: 'Punteggio finale',
      restart: 'Ricomincia',
      menu: 'Menu Principale',
      pause: 'Metti in pausa',
      resume: 'Riprendi gioco',
      exitConfirm: {
        title: 'Uscire dal Gioco?',
        message: 'Sei sicuro di voler uscire? Il progresso attuale andrà perso.',
        yes: 'Sì, Esci',
        no: 'Annulla',
      },
    },
    modes: {
      classic: 'Classico',
      speed: 'Velocità',
      wall: 'Muro',
    },
  },
};

export class I18nService {
  private currentLanguage: Language = 'es';
  private readonly STORAGE_KEY = 'snake-language';
  private onLanguageChangeCallbacks: Array<(lang: Language) => void> = [];

  constructor() {
    this.loadPreference();
  }

  /**
   * Obtiene el idioma actual
   */
  getLanguage(): Language {
    return this.currentLanguage;
  }

  /**
   * Establece un nuevo idioma
   */
  setLanguage(language: Language): void {
    if (!this.isValidLanguage(language)) {
      console.warn(`Invalid language: ${language}`);
      return;
    }

    this.currentLanguage = language;
    this.savePreference();
    this.notifyLanguageChange();
  }

  /**
   * Traduce una clave usando notación de punto (e.g., 'menu.play')
   */
  t(key: string): string {
    const keys = key.split('.');
    let value: any = translations[this.currentLanguage];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  }

  /**
   * Registra un callback para cambios de idioma
   */
  onLanguageChange(callback: (lang: Language) => void): void {
    this.onLanguageChangeCallbacks.push(callback);
  }

  /**
   * Notifica a todos los listeners sobre el cambio de idioma
   */
  private notifyLanguageChange(): void {
    this.onLanguageChangeCallbacks.forEach(callback => callback(this.currentLanguage));
  }

  /**
   * Valida si un idioma es soportado
   */
  private isValidLanguage(lang: string): lang is Language {
    return ['es', 'en', 'it'].includes(lang);
  }

  /**
   * Carga la preferencia desde localStorage
   */
  private loadPreference(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved && this.isValidLanguage(saved)) {
      this.currentLanguage = saved;
    }
  }

  /**
   * Guarda la preferencia en localStorage
   */
  private savePreference(): void {
    localStorage.setItem(this.STORAGE_KEY, this.currentLanguage);
  }

  /**
   * Obtiene todos los idiomas disponibles
   */
  getAvailableLanguages(): Language[] {
    return ['es', 'en', 'it'];
  }
}
