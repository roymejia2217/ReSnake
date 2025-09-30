# ReSnake

<div align="center">
  <img src="public/res/re-snake.png" alt="ReSnake Logo" width="300" height="auto">
  
  **Implementación moderna del clásico juego Snake**
  
  *Desarrollada con TypeScript y Vite, utilizando una arquitectura ECS (Entity-Component-System) profesional*
  
  [![Demo en Vivo](https://img.shields.io/badge/🎮_Demo_En_Vivo-Visitar-blue?style=for-the-badge&logo=github)](https://roymejia2217.github.io/ReSnake/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
</div>

## Descripción del Proyecto

Este juego Snake ha sido diseñado desde cero siguiendo las mejores prácticas de ingeniería de software. La arquitectura ECS separa claramente los datos (componentes), la lógica (sistemas) y las entidades del juego, facilitando la escalabilidad y el mantenimiento del código.

El proyecto incluye características modernas como animaciones fluidas, diseño responsivo completo para dispositivos móviles y desktop, sistema de pausa integrado, y persistencia de puntuaciones. Todo el código está escrito en TypeScript con tipado estricto para garantizar robustez y detectar errores en tiempo de desarrollo.

## ✨ Características Principales

### 🏗️ Arquitectura y Código

**Arquitectura ECS Profesional**  
El juego utiliza el patrón Entity-Component-System, donde las entidades (serpiente, comida) están compuestas por componentes reutilizables (posición, velocidad, renderizado), y los sistemas (movimiento, colisión, renderizado) procesan estas entidades de forma independiente. Esta separación permite modificar y extender funcionalidades sin afectar otras partes del código.

**Principios de Diseño**  
Se aplicaron estrictamente los principios SOLID, especialmente Single Responsibility (cada clase tiene una única responsabilidad) y Dependency Inversion (los módulos dependen de abstracciones, no de implementaciones concretas). El código evita duplicaciones siguiendo DRY y mantiene soluciones simples siguiendo KISS.

### 🎮 Funcionalidades del Juego

**Diseño Visual Moderno**  
El juego cuenta con renderizado en Canvas API utilizando gradientes radiales, sombras dinámicas y efectos visuales suaves. La serpiente tiene segmentos conectados con ojos que siguen la dirección del movimiento, mientras que la comida incluye animaciones de pulsación y efectos de aparición/desaparición.

**Sistema de Pausa Completo**  
Implementación robusta de pausa que detiene completamente el game loop, deshabilita todos los controles de entrada (teclado, táctil y gestos), y muestra una interfaz visual clara. Se puede activar mediante un botón en pantalla o usando las teclas Espacio o P.

**Responsividad Total**  
El juego se adapta automáticamente a cualquier tamaño de pantalla, desde móviles pequeños hasta pantallas de escritorio grandes. En dispositivos móviles, se proporcionan controles táctiles con botones direccionales y soporte completo para gestos de deslizamiento (swipe). El layout se reorganiza en modo horizontal para aprovechar mejor el espacio disponible.

**Persistencia de Datos**  
Las puntuaciones más altas se guardan automáticamente en localStorage del navegador, permitiendo que los jugadores vean su récord personal incluso después de cerrar y volver a abrir el juego.

**Mecánicas de Juego**  
La serpiente utiliza un sistema de wrap-around donde, al cruzar un borde del tablero, aparece del lado opuesto en lugar de colisionar. El sistema de colisión detecta tanto colisiones con el propio cuerpo como la recolección de comida. Las animaciones de crecimiento utilizan interpolación easing para transiciones suaves.

## 🎮 Demo en Vivo

Puedes probar el juego desplegado en GitHub Pages:

**👉 [Jugar ReSnake Online](https://roymejia2217.github.io/ReSnake/)**

O visita directamente: `https://roymejia2217.github.io/ReSnake/`


## Instalación y Configuración Local

### Requisitos Previos

- Node.js versión 16 o superior
- npm o yarn como gestor de paquetes
- Git para clonar el repositorio

### Pasos de Instalación

Clona el repositorio en tu máquina local:

```bash
git clone https://github.com/roymejia2217/ReSnake.git
```

Navega al directorio del proyecto:

```bash
cd ReSnake
```

Instala todas las dependencias necesarias:

```bash
npm install
```

Inicia el servidor de desarrollo con hot module replacement:

```bash
npm run dev
```

El juego estará disponible en `http://localhost:3000`. Cualquier cambio en el código se reflejará automáticamente en el navegador.

## Scripts Disponibles

El proyecto incluye los siguientes scripts de npm:

**Desarrollo**
```bash
npm run dev
```
Inicia el servidor de desarrollo de Vite en el puerto 3000 con recarga automática en caliente (HMR).

**Build de Producción**
```bash
npm run build
```
Ejecuta la verificación de tipos de TypeScript y genera un build optimizado en la carpeta `dist/`. Los archivos se minifican y optimizan para producción.

**Preview del Build**
```bash
npm run preview
```
Sirve localmente el build de producción para verificar que todo funciona correctamente antes de desplegar.

## Controles del Juego

### En Computadoras de Escritorio

**Movimiento de la Serpiente**  
Utiliza las flechas del teclado (arriba, abajo, izquierda, derecha) para cambiar la dirección de la serpiente. El juego previene movimientos en dirección opuesta para evitar colisiones inmediatas.

**Pausa del Juego**  
Presiona la tecla Espacio o la tecla P para pausar o reanudar el juego. También puedes hacer clic en el botón de pausa circular ubicado en el panel de puntuación.

### En Dispositivos Móviles y Tablets

**Movimiento de la Serpiente**  
Puedes controlar la serpiente de dos formas: usando los botones direccionales que aparecen en la parte inferior de la pantalla, o deslizando el dedo sobre el canvas en la dirección deseada. Los gestos de swipe se reconocen con un umbral mínimo para evitar cambios accidentales.

**Pausa del Juego**  
Toca el botón de pausa ubicado en el panel de puntuación. El botón cambia su ícono entre pausa y play según el estado actual del juego.

## Arquitectura del Proyecto

### Estructura de Directorios

El código fuente está organizado en módulos lógicos dentro de la carpeta `src/`:

```
src/
├── components/     Componentes reutilizables del patrón ECS
│   ├── Position.ts       Maneja coordenadas X,Y en el tablero
│   ├── Velocity.ts       Gestiona dirección y velocidad de movimiento
│   ├── Renderable.ts     Define propiedades de renderizado (color, etc.)
│   └── Collidable.ts     Marca entidades que pueden colisionar
│
├── core/          Motor del juego y tipos base
│   ├── Engine.ts         Game loop principal con requestAnimationFrame
│   └── types.ts          Interfaces y tipos TypeScript compartidos
│
├── entities/      Entidades del juego
│   ├── Entity.ts         Clase base para todas las entidades
│   ├── Snake.ts          Lógica específica de la serpiente
│   └── Food.ts           Lógica específica de la comida
│
├── systems/       Sistemas que procesan entidades
│   ├── InputSystem.ts    Maneja entradas de teclado y táctiles
│   ├── MovementSystem.ts Procesa movimiento con wrapping
│   ├── CollisionSystem.ts Detecta colisiones y comida
│   └── RenderSystem.ts   Dibuja entidades en el canvas
│
├── services/      Servicios auxiliares
│   ├── ScoreService.ts   Gestiona puntuación actual y récord
│   └── StorageService.ts Abstracción de localStorage
│
├── config/        Configuración del juego
│   └── constants.ts      Constantes globales (colores, tamaño, velocidad)
│
├── utils/         Utilidades y funciones helper
│   ├── helpers.ts        Funciones auxiliares generales
│   └── AnimationHelper.ts Interpolación y easing para animaciones
│
└── styles/        Estilos CSS
    └── main.css          Estilos responsivos y animaciones
```

### Patrón Entity-Component-System

Este patrón arquitectónico separa claramente tres conceptos:

**Entidades**  
Contenedores simples identificados por un ID único. Ejemplos: la serpiente y la comida. Las entidades no contienen lógica, solo agrupan componentes.

**Componentes**  
Estructuras de datos puros que representan aspectos específicos de una entidad. Por ejemplo, Position almacena coordenadas, Velocity almacena dirección de movimiento, Renderable almacena información de color. Los componentes no tienen comportamiento, solo datos.

**Sistemas**  
Contienen toda la lógica del juego. Cada sistema procesa entidades que tienen ciertos componentes. Por ejemplo, MovementSystem procesa entidades con Position y Velocity para moverlas, mientras que RenderSystem procesa entidades con Position y Renderable para dibujarlas.

Esta separación permite agregar nuevas funcionalidades fácilmente. Por ejemplo, para agregar power-ups, solo necesitarías crear un nuevo componente PowerUp, una nueva entidad, y un nuevo sistema PowerUpSystem, sin modificar el código existente.

### Principios de Diseño Aplicados

**SOLID**

- Single Responsibility: Cada clase tiene una única razón para cambiar. InputSystem solo maneja entrada, RenderSystem solo renderizado.
- Open/Closed: El código está abierto a extensión (puedes agregar nuevos componentes/sistemas) pero cerrado a modificación (no necesitas cambiar sistemas existentes).
- Liskov Substitution: Las entidades heredan de una clase base común y pueden usarse intercambiablemente.
- Interface Segregation: Los componentes son interfaces pequeñas y específicas.
- Dependency Inversion: Los sistemas dependen de abstracciones (interfaces Component, Entity) no de implementaciones concretas.

**DRY (Don't Repeat Yourself)**

El código evita duplicación mediante funciones reutilizables. Por ejemplo, las funciones de interpolación en AnimationHelper se usan en múltiples lugares, y los helpers de generación de posiciones se centralizan en un solo módulo.

**KISS (Keep It Simple, Stupid)**

Las soluciones implementadas son directas y comprensibles. Se evita la sobre-ingeniería y la complejidad innecesaria. Por ejemplo, el sistema de pausa simplemente cambia el estado del motor en lugar de implementar un sistema complejo de estados.

**Composition over Inheritance**

En lugar de usar jerarquías de herencia profundas, las entidades se componen agregando los componentes que necesitan. Esto proporciona mayor flexibilidad que la herencia tradicional.

## Despliegue a GitHub Pages

El proyecto incluye configuración completa para despliegue automático mediante GitHub Actions.

### Configuración Inicial

Primero, asegúrate de que tu repositorio esté en GitHub. Si es un proyecto nuevo, inicializa git y sube el código:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/roymejia2217/ReSnake.git
git push -u origin main
```

### Activar GitHub Pages

1. Accede a tu repositorio en GitHub
2. Ve a la sección Settings (Configuración)
3. En el menú lateral, selecciona Pages
4. En "Source", elige "GitHub Actions"
5. Guarda los cambios

### Proceso de Despliegue Automático

Una vez configurado, cada vez que hagas push a la rama main:

1. GitHub Actions detectará el cambio
2. Ejecutará el workflow definido en `.github/workflows/static.yml`
3. Instalará las dependencias del proyecto
4. Compilará TypeScript a JavaScript
5. Generará el build de producción optimizado
6. Desplegará automáticamente a GitHub Pages

El proceso completo toma aproximadamente 2-3 minutos. Puedes monitorear el progreso en la pestaña Actions de tu repositorio.

### Configuración del Base Path

Si tu repositorio tiene un nombre diferente a "ReSnake", debes actualizar la configuración base en `vite.config.ts`:

```typescript
export default defineConfig({
  base: '/nombre-exacto-de-tu-repositorio/',
  // ... resto de configuración
});
```

**Nota:** Para este proyecto, la configuración ya está correctamente establecida como `base: '/ReSnake/'`. Es importante que el nombre coincida exactamente con el nombre del repositorio, incluyendo mayúsculas y minúsculas. El path debe comenzar y terminar con una barra diagonal.

## Personalización

### Modificar Colores

Los colores del juego están centralizados en `src/config/constants.ts`. Puedes modificar el esquema de colores editando el objeto COLORS:

```typescript
export const GAME_CONFIG = {
  COLORS: {
    BACKGROUND: '#222222',  // Color de fondo del canvas
    SNAKE: '#99cc00',       // Color de la serpiente
    FOOD: '#ff5a5f',        // Color de la comida
    TEXT: '#ffffff'         // Color del texto (no utilizado actualmente)
  }
}
```

Los valores deben estar en formato hexadecimal. Los cambios se aplicarán automáticamente en todo el juego gracias a que el sistema de renderizado lee estos valores.

### Ajustar Velocidad y Dimensiones

En el mismo archivo de configuración puedes modificar parámetros del gameplay:

```typescript
export const GAME_CONFIG = {
  BOARD_SIZE: 20,        // Número de celdas del tablero (20x20 por defecto)
  CELL_SIZE: 20,         // Tamaño de cada celda en píxeles (se ajusta responsive)
  INITIAL_SPEED: 200,    // Velocidad inicial en milisegundos entre movimientos
  SPEED_INCREMENT: 10,   // Incremento de velocidad (funcionalidad futura)
}
```

Valores más bajos en INITIAL_SPEED hacen el juego más rápido y difícil. El BOARD_SIZE determina el tamaño del área de juego, donde valores más grandes dan más espacio pero hacen el juego más largo.

### Modificar Controles

Para cambiar los mapeos de teclas, edita `src/config/constants.ts`:

```typescript
export const KEY_MAPPINGS = {
  ArrowUp: 'UP',
  ArrowDown: 'DOWN',
  ArrowLeft: 'LEFT',
  ArrowRight: 'RIGHT'
} as const;
```

Puedes agregar teclas alternativas como WASD agregando más entradas a este objeto.

## Stack Tecnológico

### TypeScript

El proyecto utiliza TypeScript 5.3+ con configuración estricta. Esto proporciona:

- Detección de errores en tiempo de desarrollo
- Autocompletado inteligente en editores
- Refactorización segura del código
- Documentación implícita mediante tipos

La configuración en `tsconfig.json` activa todas las verificaciones estrictas, incluyendo `noUnusedLocals`, `noImplicitReturns`, y `noFallthroughCasesInSwitch`.

### Vite

Vite es el build tool utilizado, ofreciendo:

- Servidor de desarrollo extremadamente rápido con HMR
- Build de producción optimizado con tree-shaking
- Soporte nativo para TypeScript y módulos ES
- Configuración mínima necesaria

La compilación de producción genera archivos minificados de aproximadamente 8 KB total (gzipped), incluyendo HTML, CSS y JavaScript.

### Canvas API

El renderizado se realiza completamente con la API nativa de Canvas del navegador. Esto permite:

- Renderizado de gráficos 2D de alto rendimiento
- Control total sobre cada píxel dibujado
- Efectos visuales complejos (gradientes, sombras, transformaciones)
- Compatibilidad universal con navegadores modernos

### CSS3

Los estilos utilizan características modernas de CSS:

- Flexbox y Grid para layouts responsivos
- Media queries para diferentes tamaños de pantalla
- Animaciones CSS para transiciones suaves
- Variables CSS para tematización consistente

### LocalStorage

La persistencia de datos utiliza la API de localStorage:

- Almacenamiento permanente en el navegador del cliente
- No requiere servidor ni base de datos
- Acceso síncrono y simple
- Abstracción mediante StorageService para facilitar cambios futuros

## Build de Producción

El build de producción genera archivos altamente optimizados:

**Optimizaciones Aplicadas**

- Minificación de JavaScript mediante esbuild
- Eliminación de código muerto (tree-shaking)
- Optimización de importaciones dinámicas
- Compresión gzip de assets

**Estadísticas del Build**

El tamaño total del proyecto compilado es aproximadamente:

- HTML: 1.12 KB (gzipped)
- CSS: 1.60 KB (gzipped)
- JavaScript: 5.32 KB (gzipped)
- Total: ~8 KB (gzipped)

Este tamaño reducido garantiza carga instantánea incluso en conexiones lentas.

## Navegadores Soportados

El juego funciona en todos los navegadores modernos que soporten ES2022:

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

En dispositivos móviles, se ha probado en:

- iOS Safari 14+
- Chrome Mobile
- Samsung Internet

## Licencia

Este proyecto está licenciado bajo la Licencia MIT. Esto significa que puedes:

- Usar el código comercialmente
- Modificar el código según tus necesidades
- Distribuir versiones modificadas
- Usar el código en proyectos privados
- Sublicenciar si es necesario

La única condición es incluir el aviso de copyright y la licencia en cualquier copia o porción sustancial del software.

## Contribuciones

Las contribuciones al proyecto son bienvenidas y apreciadas. Si deseas contribuir:

### Proceso de Contribución

1. Haz un fork del repositorio
2. Crea una rama para tu funcionalidad: `git checkout -b feature/nueva-funcionalidad`
3. Realiza tus cambios siguiendo las convenciones de código existentes
4. Asegúrate de que el código compile sin errores: `npm run build`
5. Commit tus cambios con mensajes descriptivos: `git commit -m 'Agregar nueva funcionalidad X'`
6. Push a tu rama: `git push origin feature/nueva-funcionalidad`
7. Abre un Pull Request explicando tus cambios

### Guías de Estilo

Por favor, mantén la consistencia con el código existente:

- Usa TypeScript con tipado estricto
- Sigue los principios SOLID y DRY
- Documenta funciones y clases con comentarios JSDoc
- Usa nombres descriptivos para variables y funciones
- Mantén las funciones pequeñas y enfocadas
- Escribe código auto-documentado cuando sea posible

## Posibles Mejoras Futuras

Algunas ideas para extender el proyecto:

- Sistema de niveles con aumento progresivo de velocidad
- Power-ups (ralentización, invencibilidad temporal, puntos dobles)
- Diferentes modos de juego (clásico, sin bordes, con obstáculos)
- Tabla de clasificación online con backend
- Efectos de sonido y música de fondo
- Soporte para modo multijugador
- Temas visuales alternativos
- Progressive Web App (PWA) con instalación offline
- Sistema de logros y estadísticas
