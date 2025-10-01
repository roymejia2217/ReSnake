/**
 * Servicio de Easter Egg Romántico
 * Detecta nombres especiales y muestra mensajes motivacionales animados
 * REFACTORIZADO: Sistema de eventos semánticamente correcto
 * Principio: Single Responsibility (SOLID)
 */

export interface RomanticMessage {
  text: string;
  emoji: string;
  duration: number; // Duración en ms
}

// Tipos de eventos semánticamente correctos
export type RomanticEventType = 
  | 'score'           // Cuando se consigue puntos (durante juego)
  | 'gameStart'       // Al iniciar partida (durante juego)
  | 'worldRecord'     // SOLO para récord mundial verdadero (game over)
  | 'personalRecord'  // SOLO para récord personal sin ser mundial (game over)
  | 'goodScore';      // Para puntajes buenos pero sin récord (game over)

// Tipo para el objeto de mensajes especiales
type SpecialMessagesMap = Record<RomanticEventType, RomanticMessage[]>;

// ===== CONFIGURACIÓN GLOBAL DE MENSAJES =====

// Nombres especiales para activar el easter egg
const SPECIAL_NAMES = [
  'jame', 'jey', 'jeyfack', 'jeyfack69', 'jessica', 'foyolo', 'Jey', 'Jeyfack', 'Jeyfack69', 'Jessica', 'Foyolo', 'jamefack', 'jamefack69', 'Jamefack69', 'Jamefack', 'Jessica Chabla'
];

// Mensajes románticos principales (uno por partida)
const ROMANTIC_MESSAGES: RomanticMessage[] = [
  {
    text: "Vamos mi negrita hermosa, tú puedes (⁠ ⁠ꈍ⁠ᴗ⁠ꈍ⁠)",
    emoji: "💕",
    duration: 4000
  },
  {
    text: "Mi corazón, claro que habría una función en tu honor (⁠≧⁠▽⁠≦⁠)",
    emoji: "❤️",
    duration: 4500
  },
  {
    text: "Eres increíble en todo, sé que para este juego también lo serás (⁠ ⁠ꈍ⁠ᴗ⁠ꈍ⁠)",
    emoji: "💖",
    duration: 5000
  },
  {
    text: "Estás haciendo un trabajo increíble mi amada Jessica (⁠≧⁠▽⁠≦⁠)",
    emoji: "💕",
    duration: 4500
  },
  {
    text: "Tu constancia me inspira diariamente (⁠ ⁠ꈍ⁠ᴗ⁠ꈍ⁠)",
    emoji: "💝",
    duration: 4000
  },
  {
    text: "Nada es imposible para ti mi cielo (⁠≧⁠▽⁠≦⁠)",
    emoji: "💗",
    duration: 4000
  },
  {
    text: "Eres mi solecito cálido y encantador (⁠ ⁠ꈍ⁠ᴗ⁠ꈍ⁠)",
    emoji: "✨💕",
    duration: 4000
  },
  {
    text: "Tu pasión por superarte es admirable (⁠≧⁠▽⁠≦⁠)",
    emoji: "💖",
    duration: 4500
  },
  {
    text: "Cada uno de tus logros me llena de orgullo (⁠ ⁠ꈍ⁠ᴗ⁠ꈍ⁠)",
    emoji: "💝",
    duration: 4000
  },
  {
    text: "Sigue así mi tesoro (⁠≧⁠▽⁠≦⁠)",
    emoji: "💕",
    duration: 4000
  }
];

// Mensajes especiales para eventos (semánticamente correctos)
const SPECIAL_MESSAGES: SpecialMessagesMap = {
  score: [
    {
      text: "¡Cada punto que obtienes significa que te amo mucho más! (⁠ ⁠ꈍ⁠ᴗ⁠ꈍ⁠)",
      emoji: "💖",
      duration: 3000
    },
    {
      text: "¡Eso es, sigue así mi lindura! (⁠≧⁠▽⁠≦⁠)",
      emoji: "💕",
      duration: 3000
    },
    {
      text: "¡Vas muy bien mi cielo! (⁠ ⁠ꈍ⁠ᴗ⁠ꈍ⁠)",
      emoji: "💝",
      duration: 3000
    },
    {
      text: "¡Excelente mi bombón! (⁠≧⁠▽⁠≦⁠)",
      emoji: "💗",
      duration: 3000
    },
    {
      text: "¡Lo estás haciendo increíble mi bebé! (⁠ ⁠ꈍ⁠ᴗ⁠ꈍ⁠)",
      emoji: "✨💕",
      duration: 3000
    }
  ],
  
  gameStart: [
    {
      text: "¡Tú puedes con todo mi tesoro! (⁠≧⁠▽⁠≦⁠)",
      emoji: "💕",
      duration: 4000
    },
    {
      text: "¡Vamos mi negrita linda, tú puedes! (⁠ ⁠ꈍ⁠ᴗ⁠ꈍ⁠)",
      emoji: "💖",
      duration: 4000
    },
    {
      text: "¡Dale mi amor, que maravilla! (⁠≧⁠▽⁠≦⁠)",
      emoji: "💝",
      duration: 4000
    },
    {
      text: "¡Suerte mi cielo, tú puedes! (⁠ ⁠ꈍ⁠ᴗ⁠ꈍ⁠)",
      emoji: "💗",
      duration: 4000
    },
    {
      text: "¡Vamos mi lindura, vas excelente! (⁠≧⁠▽⁠≦⁠)",
      emoji: "✨💕",
      duration: 4000
    }
  ],
  
  worldRecord: [
    {
      text: "¡UN RÉCORD MUNDIAL! ¡Eres increíble mi amor! (⁠≧⁠▽⁠≦⁠)",
      emoji: "🏆💕",
      duration: 5000
    },
    {
      text: "¡La mejor del mundo! ¡Estoy tan orgulloso de ti! (⁠ ⁠ꈍ⁠ᴗ⁠ꈍ⁠)",
      emoji: "👑💖",
      duration: 5000
    },
    {
      text: "¡RÉCORD MUNDIAL! ¡Sabía que lo lograrías mi cielo! (⁠≧⁠▽⁠≦⁠)",
      emoji: "🌟💝",
      duration: 5000
    },
    {
      text: "¡Eres la número uno del mundo mi tesoro! (⁠ ⁠ꈍ⁠ᴗ⁠ꈍ⁠)",
      emoji: "🥇💗",
      duration: 5000
    },
    {
      text: "¡Wow mi negrita hermosa, récord mundial! (⁠≧⁠▽⁠≦⁠)",
      emoji: "✨👑",
      duration: 5000
    }
  ],
  
  personalRecord: [
    {
      text: "¡Superaste tu marca mi tesoro! (⁠ ⁠ꈍ⁠ᴗ⁠ꈍ⁠)",
      emoji: "💗",
      duration: 4000
    },
    {
      text: "¡Un nuevo récord personal mi amor! (⁠≧⁠▽⁠≦⁠)",
      emoji: "⭐💕",
      duration: 4000
    },
    {
      text: "¡Cada vez mejor mi cielo! (⁠ ⁠ꈍ⁠ᴗ⁠ꈍ⁠)",
      emoji: "💖",
      duration: 4000
    },
    {
      text: "¡Sigue mejorando así mi lindura! (⁠≧⁠▽⁠≦⁠)",
      emoji: "💝",
      duration: 4000
    },
    {
      text: "¡Estoy orgulloso de tu progreso mi bebé! (⁠ ⁠ꈍ⁠ᴗ⁠ꈍ⁠)",
      emoji: "✨💕",
      duration: 4000
    }
  ],
  
  goodScore: [
    {
      text: "¡Buen intento mi amor! (⁠ ⁠ꈍ⁠ᴗ⁠ꈍ⁠)",
      emoji: "💕",
      duration: 3500
    },
    {
      text: "¡Estuviste muy cerca mi cielo! (⁠≧⁠▽⁠≦⁠)",
      emoji: "💖",
      duration: 3500
    },
    {
      text: "¡Sigue así, vas mejorando mi tesoro! (⁠ ⁠ꈍ⁠ᴗ⁠ꈍ⁠)",
      emoji: "💝",
      duration: 3500
    },
    {
      text: "¡La próxima será el récord mi lindura! (⁠≧⁠▽⁠≦⁠)",
      emoji: "✨💕",
      duration: 3500
    },
    {
      text: "¡Buen puntaje mi negrita hermosa! (⁠ ⁠ꈍ⁠ᴗ⁠ꈍ⁠)",
      emoji: "💗",
      duration: 3500
    }
  ]
};

export class RomanticEasterEggService {
  private isActive = false;
  private messageInterval?: number;
  private currentMessage: RomanticMessage | null = null;
  private messageStartTime = 0;
  private hasShownRomanticMessage = false; // Control para mostrar solo un mensaje romántico por partida
  private messageTimeout?: number; // Timeout del mensaje actual para poder cancelarlo
  
  /**
   * Verifica si un nombre de jugador debe activar el easter egg
   */
  shouldActivateForPlayer(playerName: string): boolean {
    if (!playerName || typeof playerName !== 'string') {
      return false;
    }
    
    const normalizedName = playerName.toLowerCase().trim();
    
    return SPECIAL_NAMES.some(specialName => 
      normalizedName.includes(specialName.toLowerCase())
    );
  }
  
  /**
   * Activa el easter egg romántico
   */
  activate(): void {
    if (this.isActive) return;
    
    this.isActive = true;
    this.hasShownRomanticMessage = false; // Reset para nueva partida
    this.startMessageRotation();
    
    // Easter Egg Romántico Activado
  }
  
  /**
   * Desactiva el easter egg
   */
  deactivate(): void {
    this.isActive = false;
    this.stopMessageRotation();
    this.currentMessage = null;
    this.hasShownRomanticMessage = false; // Reset al desactivar
    
    // Limpia el timeout del mensaje actual
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
      this.messageTimeout = undefined;
    }
    
    // Easter Egg Romántico Desactivado
  }
  
  /**
   * Verifica si el easter egg está activo
   */
  isEasterEggActive(): boolean {
    return this.isActive;
  }
  
  /**
   * Obtiene el mensaje actual para renderizar
   */
  getCurrentMessage(): RomanticMessage | null {
    if (!this.isActive || !this.currentMessage) {
      return null;
    }
    
    // Verifica si el mensaje actual ha expirado
    const currentTime = performance.now();
    const messageAge = currentTime - this.messageStartTime;
    
    if (messageAge >= this.currentMessage.duration) {
      // Si ya mostró un mensaje romántico, no mostrar más
      if (this.hasShownRomanticMessage) {
        this.currentMessage = null;
        return null;
      }
    }
    
    return this.currentMessage;
  }
  
  /**
   * Inicia la rotación de mensajes (solo un mensaje romántico por partida)
   */
  private startMessageRotation(): void {
    // Mostrar un mensaje romántico aleatorio al inicio
    this.showRandomRomanticMessage();
    
    // No programar rotación automática - solo un mensaje por partida
    // Los mensajes especiales (score, record, gameStart) se mostrarán cuando corresponda
  }
  
  /**
   * Detiene la rotación de mensajes
   */
  private stopMessageRotation(): void {
    if (this.messageInterval) {
      clearInterval(this.messageInterval);
      this.messageInterval = undefined;
    }
  }
  
  /**
   * Muestra un mensaje romántico aleatorio (solo una vez por partida)
   */
  private showRandomRomanticMessage(): void {
    if (ROMANTIC_MESSAGES.length === 0 || this.hasShownRomanticMessage) return;
    
    // Seleccionar un mensaje aleatorio
    const randomIndex = Math.floor(Math.random() * ROMANTIC_MESSAGES.length);
    this.currentMessage = ROMANTIC_MESSAGES[randomIndex];
    this.messageStartTime = performance.now();
    this.hasShownRomanticMessage = true;
    
    // Mensaje romántico mostrado
  }
  
  /**
   * Obtiene un mensaje especial para eventos específicos
   * REFACTORIZADO: Ahora acepta los nuevos tipos de eventos semánticamente correctos
   */
  getSpecialMessage(event: RomanticEventType): RomanticMessage | null {
    if (!this.isActive) return null;
    
    const messages = SPECIAL_MESSAGES[event];
    if (!messages || messages.length === 0) return null;
    
    // Seleccionar un mensaje aleatorio de las variaciones
    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
  }
  
  /**
   * Muestra un mensaje especial temporalmente
   * REFACTORIZADO: Ahora acepta los nuevos tipos de eventos
   */
  showSpecialMessage(event: RomanticEventType): void {
    if (!this.isActive) return;
    
    const specialMessage = this.getSpecialMessage(event);
    if (!specialMessage) return;
    
    // Cancela el timeout del mensaje anterior si existe
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
      this.messageTimeout = undefined;
    }
    
    // Reemplaza el mensaje actual y resetea el temporizador
    this.currentMessage = specialMessage;
    this.messageStartTime = performance.now();
    
    // Programa el ocultamiento del mensaje
    this.messageTimeout = window.setTimeout(() => {
      if (this.isActive) {
        this.currentMessage = null;
        this.messageTimeout = undefined;
      }
    }, specialMessage.duration);
    
    // Mensaje especial mostrado
  }
  
  /**
   * NUEVO: Método unificado para obtener mensaje según tipo de logro en game over
   * Encapsula la lógica de decisión y elimina código duplicado (DRY)
   * Principio: Single Responsibility - determina qué mensaje mostrar según el contexto
   */
  getGameOverMessage(
    isWorldRecord: boolean, 
    isPersonalRecord: boolean, 
    hasGoodScore: boolean = false
  ): RomanticMessage | null {
    if (!this.isActive) return null;
    
    // Prioridad: Récord Mundial > Récord Personal > Buen Puntaje
    if (isWorldRecord) {
      return this.getSpecialMessage('worldRecord');
    } else if (isPersonalRecord) {
      return this.getSpecialMessage('personalRecord');
    } else if (hasGoodScore) {
      return this.getSpecialMessage('goodScore');
    }
    
    return null;
  }
}
