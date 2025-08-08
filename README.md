# Juego de la Oca - Multiplayer Game

Un juego multijugador en tiempo real del clásico "Juego de la Oca" construido con Next.js y Supabase.

## Características

- 🎲 Juego multijugador en tiempo real (hasta 6 jugadores)
- 🎮 Modo demo local para probar sin configuración
- ⚙️ Panel de administración para configurar casillas especiales
- 🎨 Interfaz moderna y responsive
- 🔄 Sincronización en tiempo real entre jugadores

## Configuración

### 1. Configurar Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Ve a Settings → API y copia:
   - Project URL
   - anon/public key

### 2. Variables de Entorno

Actualiza el archivo `.env.local` con tus credenciales:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
```

### 3. Base de Datos

Ejecuta la migración SQL en tu proyecto de Supabase:
- Ve a SQL Editor en tu dashboard de Supabase
- Copia y ejecuta el contenido de `supabase/migrations/001_create_game_tables.sql`

## Instalación y Desarrollo

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
```

## Cómo Jugar

1. **Crear Partida**: Un jugador crea una partida y recibe un código
2. **Unirse**: Otros jugadores se unen usando el código
3. **Configurar**: El administrador puede configurar casillas especiales
4. **Jugar**: Los jugadores toman turnos lanzando el dado
5. **Ganar**: El primer jugador en llegar a la casilla 63 gana

## Tecnologías Utilizadas

- **Next.js 15** - Framework de React
- **Supabase** - Base de datos y tiempo real
- **Tailwind CSS** - Estilos
- **TypeScript** - Tipado estático
- **Lucide React** - Iconos

## Estructura del Proyecto

```
├── app/                    # Páginas de Next.js
├── components/            # Componentes React
│   ├── GameLobby.tsx     # Lobby principal
│   ├── WaitingRoom.tsx   # Sala de espera
│   ├── MultiplayerGameBoard.tsx # Tablero de juego
│   └── LocalGameDemo.tsx # Demo local
├── lib/                  # Utilidades
├── supabase/            # Migraciones de base de datos
└── utils/               # Clientes de Supabase
```

## Modo Demo

Si no tienes Supabase configurado, puedes usar el modo demo local que permite jugar en el mismo dispositivo con múltiples jugadores.
