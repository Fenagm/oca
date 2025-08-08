'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Users, Sparkles, Crown } from 'lucide-react'

import { supabase, isSupabaseConfigured } from '@/lib/supabase'

interface Player {
  id: string
  name: string
  avatar: string
  position: number
  is_admin: boolean
}

interface Game {
  id: string
  code: string
  status: 'waiting' | 'playing' | 'finished'
  current_player: number
  winner_id?: string
}

interface GameLobbyProps {
  onCreateGame: (game: Game, player: Player) => void
  onJoinGame: () => void
}

const avatars = ['👑', '🎭', '🎪', '🎨', '🎯', '🎲', '🏆', '⭐', '🌟', '💎', '🎊', '🎈']

export function GameLobby({ onCreateGame, onJoinGame }: GameLobbyProps) {
  const [playerName, setPlayerName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0])
  const [isCreating, setIsCreating] = useState(false)

  const generateGameCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const handleCreateGame = async () => {
    if (!playerName.trim()) return

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      alert('Para usar el modo multijugador, necesitas configurar Supabase. Haz clic en "Connect to Supabase" en la esquina superior derecha.')
      return
    }

    setIsCreating(true)
    try {
      const gameCode = generateGameCode()
      
      // Crear la partida
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .insert({
          code: gameCode,
          status: 'waiting',
          current_player: 0
        })
        .select()
        .single()

      if (gameError) throw gameError

      // Crear el jugador administrador
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .insert({
          game_id: gameData.id,
          name: playerName.trim(),
          avatar: selectedAvatar,
          position: 0,
          is_admin: true
        })
        .select()
        .single()

      if (playerError) throw playerError

      onCreateGame(gameData, playerData)
    } catch (error) {
      console.error('Error creating game:', error)
      if (error.message?.includes('not configured')) {
        alert('Supabase no está configurado correctamente. Por favor verifica tu configuración.')
      } else {
        alert('Error al crear la partida. Por favor intenta de nuevo.')
      }
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Configuración del jugador */}
      <Card className="bg-white/80 backdrop-blur-sm border-amber-200 shadow-xl">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl text-amber-800 flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6" />
            Configura tu Jugador
            <Sparkles className="w-6 h-6" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Nombre del jugador */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-amber-700">
              Tu nombre
            </label>
            <Input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Escribe tu nombre..."
              className="text-center text-lg font-medium border-amber-200 focus:border-amber-400"
              maxLength={20}
            />
          </div>

          {/* Selección de avatar */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-amber-700">
              Elige tu avatar
            </label>
            <div className="grid grid-cols-6 gap-3">
              {avatars.map((avatar) => (
                <button
                  key={avatar}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`
                    p-3 text-2xl rounded-xl transition-all duration-200
                    ${selectedAvatar === avatar
                      ? 'bg-gradient-to-br from-amber-400 to-orange-400 shadow-lg scale-110 ring-2 ring-amber-300'
                      : 'bg-white/60 hover:bg-amber-100 hover:scale-105'
                    }
                  `}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Opciones de juego */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Crear partida */}
        <Card className="bg-gradient-to-br from-amber-100 to-orange-100 border-amber-300 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-xl text-amber-800">
              Crear Partida
            </CardTitle>
            <p className="text-sm text-amber-600">
              Sé el administrador y configura el juego
            </p>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleCreateGame}
              disabled={!playerName.trim() || isCreating}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Crear Partida
                </div>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Unirse a partida */}
        <Card className="bg-gradient-to-br from-yellow-100 to-amber-100 border-yellow-300 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-xl text-amber-800">
              Unirse a Partida
            </CardTitle>
            <p className="text-sm text-amber-600">
              Únete con el código de la partida
            </p>
          </CardHeader>
          <CardContent>
            <Button
              onClick={onJoinGame}
              disabled={!playerName.trim()}
              className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Unirse a Partida
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Información del juego */}
      <Card className="bg-white/60 backdrop-blur-sm border-amber-200">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-amber-800">¿Cómo jugar?</h3>
            <p className="text-sm text-amber-700">
              • Hasta 6 jugadores pueden unirse a cada partida<br/>
              • El administrador puede configurar casillas especiales<br/>
              • Cada jugador juega desde su propio dispositivo<br/>
              • ¡El primero en llegar a la casilla 63 gana!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
