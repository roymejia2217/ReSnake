/**
 * Servicio de Easter Egg Romántico
 * Detecta nombres especiales y muestra mensajes motivacionales animados
 * Principio: Single Responsibility (SOLID)
 */

export interface RomanticMessage {
  text: string;
  emoji: string;
  duration: number; // Duración en ms
}

// ===== CONFIGURACIÓN GLOBAL DE MENSAJES =====

// Nombres especiales para activar el easter egg
const SPECIAL_NAMES = [
  'jame', 'jey', 'jeyfack', 'jeyfack69', 'jessica', 'foyolo', 'Jey', 'Jeyfack', 'Jeyfack69', 'Jessica', 'Foyolo'
];

// Mensajes románticos principales (uno por partida)
const ROMANTIC_MESSAGES: RomanticMessage[] = [
  {
    text: "Vamos mi negrita hermosa, tu puedes",
    emoji: "💕",
    duration: 4000
  },
  {
    text: "Mi corazón, claro que habría una función en tu honor",
    emoji: "❤️",
    duration: 4500
  },
  {
    text: "Eres increíble en todo, sé que para este juego también lo serás",
    emoji: "💖",
    duration: 5000
  },
  {
    text: "Estás haciendo un trabajo increíble mi amada Jessica",
    emoji: "💕",
    duration: 4500
  },
  {
    text: "Tu constancia me inspira diariamente",
    emoji: "💝",
    duration: 4000
  },
  {
    text: "Nada es imposible para ti mi cielo",
    emoji: "💗",
    duration: 4000
  },
  {
    text: "Eres mi solecito calido y encantador",
    emoji: "✨💕",
    duration: 4000
  },
  {
    text: "Tu pasión por superarte es admirable",
    emoji: "💖",
    duration: 4500
  },
  {
    text: "Cada uno de tus logros me llena de orgullo",
    emoji: "💝",
    duration: 4000
  },
  {
    text: "Sigue así mi tesoro",
    emoji: "💕",
    duration: 4000
  }
];

// Mensajes especiales para eventos (con múltiples variaciones)
const SPECIAL_MESSAGES = {
  score: [
    {
      text: "¡Tu esfuerzo tiene su recompensa!",
      emoji: "💖",
      duration: 3000
    },
    {
      text: "¡Eso es! ¡Sigue así mi amor!",
      emoji: "💕",
      duration: 3000
    },
    {
      text: "¡Vas muy bien mi cielo!",
      emoji: "💝",
      duration: 3000
    },
    {
      text: "¡Excelente mi bombón!",
      emoji: "💗",
      duration: 3000
    },
    {
      text: "¡Lo estas haciendo increible mi bebé!",
      emoji: "✨💕",
      duration: 3000
    }
  ],
  record: [
    {
      text: "¡Es un buen puntaje, sigue así!",
      emoji: "💝",
      duration: 4000
    },
    {
      text: "¡Estoy tan orgulloso de ti!",
      emoji: "💖",
      duration: 4000
    },
    {
      text: "¡Un increible nuevo récord!",
      emoji: "💕",
      duration: 4000
    },
    {
      text: "¡Superaste tu marca mi tesoro!",
      emoji: "💗",
      duration: 4000
    },
    {
      text: "¡Que buen puntaje!",
      emoji: "✨💕",
      duration: 4000
    }
  ],
  gameStart: [
    {
      text: "¡Tú puedes con todo mi tesoro!",
      emoji: "💕",
      duration: 4000
    },
    {
      text: "¡Vamos mi hermosa! ¡Tú puedes!",
      emoji: "💖",
      duration: 4000
    },
    {
      text: "¡Dale mi amor! ¡Eres increíble!",
      emoji: "💝",
      duration: 4000
    },
    {
      text: "¡Suerte mi cielo, tú puedes!",
      emoji: "💗",
      duration: 4000
    },
    {
      text: "¡Vamos mi lindura, vas excelente!",
      emoji: "✨💕",
      duration: 4000
    }
  ]
};

export class RomanticEasterEggService {
  private isActive = false;
  private messageInterval?: number;
  private currentMessage: RomanticMessage | null = null;
  private messageStartTime = 0;
  private hasShownRomanticMessage = false; // Control para mostrar solo un mensaje romántico por partida
  
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
    
    console.log('💕 Easter Egg Romántico Activado 💕');
  }
  
  /**
   * Desactiva el easter egg
   */
  deactivate(): void {
    this.isActive = false;
    this.stopMessageRotation();
    this.currentMessage = null;
    this.hasShownRomanticMessage = false; // Reset al desactivar
    
    console.log('💕 Easter Egg Romántico Desactivado 💕');
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
    
    console.log(`💕 Mensaje romántico mostrado: "${this.currentMessage.text}" 💕`);
  }
  
  /**
   * Obtiene un mensaje especial para eventos específicos (con variaciones)
   */
  getSpecialMessage(event: 'score' | 'record' | 'gameStart'): RomanticMessage | null {
    if (!this.isActive) return null;
    
    const messages = SPECIAL_MESSAGES[event];
    if (!messages || messages.length === 0) return null;
    
    // Seleccionar un mensaje aleatorio de las variaciones
    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
  }
  
  /**
   * Muestra un mensaje especial temporalmente
   */
  showSpecialMessage(event: 'score' | 'record' | 'gameStart'): void {
    if (!this.isActive) return;
    
    const specialMessage = this.getSpecialMessage(event);
    if (!specialMessage) return;
    
    // Muestra el mensaje especial
    this.currentMessage = specialMessage;
    this.messageStartTime = performance.now();
    
    // Después de la duración del mensaje especial, no mostrar nada más
    // (ya que solo queremos un mensaje romántico por partida)
    setTimeout(() => {
      if (this.isActive) {
        this.currentMessage = null;
      }
    }, specialMessage.duration);
  }
}
