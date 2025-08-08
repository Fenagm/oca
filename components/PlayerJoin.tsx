'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Users, Hash } from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/supabase'

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

interface PlayerJoinProps {
  onJoinSuccess: (game: Game, player: Player, players: Player[]) => void
  onBack: () => void
}

const avatars = ['👑', '🎭', '🎪', '🎨', '🎯', '🎲', '🏆', '⭐', '🌟', '💎', '🎊', '🎈']

export function PlayerJoin({ onJoinSuccess, onBack }: PlayerJoinProps) {
  const [playerName, setPlayerName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[1])
  const [gameCode, setGameCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState('')

  const handleJoinGame = async () => {
    if (!playerName.trim() || !gameCode.trim()) return

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      setError('Para usar el modo multijugador, necesitas configurar Supabase. Ve a supabase.com, crea un proyecto y actualiza las variables de entorno en .env.local')
      return
    }

    setIsJoining(true)
    setError('')

    try {
      console.log('Attempting to join game with code:', gameCode.toUpperCase())
      
      // Buscar la partida
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('code', gameCode.toUpperCase())
        .eq('status', 'waiting')
        .single()

      console.log('Game search result:', { gameData, gameError })
      if (gameError || !gameData) {
        setError('Código de partida no válido o la partida ya comenzó')
        return
      }

      // Verificar cuántos jugadores hay
      const { data: existingPlayers, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', gameData.id)

      console.log('Existing players:', { existingPlayers, playersError })
      if (playersError) throw playersError

      if (existingPlayers.length >= 6) {
        setError('La partida está llena (máximo 6 jugadores)')
        return
      }

      // Verificar que el nombre no esté repetido
      const nameExists = existingPlayers.some(p => p.name.toLowerCase() === playerName.trim().toLowerCase())
      if (nameExists) {
        setError('Ya existe un jugador con ese nombre en la partida')
        return
      }

      console.log('Creating new player:', {
        game_id: gameData.id,
        name: playerName.trim(),
        avatar: selectedAvatar,
        position: 0,
        is_admin: false
      })
      // Crear el jugador
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .insert({
          game_id: gameData.id,
          name: playerName.trim(),
          avatar: selectedAvatar,
          position: 0,
          is_admin: false
        })
        .select()
        .single()

      console.log('Player creation result:', { playerData, playerError })
      if (playerError) throw playerError

      // Obtener todos los jugadores actualizados
      const { data: allPlayers, error: allPlayersError } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', gameData.id)
        .order('created_at')

      console.log('All players after join:', { allPlayers, allPlayersError })
      if (allPlayersError) throw allPlayersError

      console.log('Successfully joined game, calling onJoinSuccess')
      onJoinSuccess(gameData, playerData, allPlayers)
    } catch (error) {
      console.error('Error joining game:', error)
      if (error.message?.includes('not configured')) {
        setError('Supabase no está configurado correctamente.')
      } else {
        setError('Error al unirse a la partida. Por favor intenta de nuevo.')
      }
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          onClick={onBack}
          variant="outline"
          size="sm"
          className="border-amber-200 text-amber-700 hover:bg-amber-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <h2 className="text-2xl font-bold text-amber-800">Unirse a Partida</h2>
      </div>

      {/* Formulario */}
      <Card className="bg-white/80 backdrop-blur-sm border-amber-200 shadow-xl">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl text-amber-800 flex items-center justify-center gap-2">
            <Users className="w-6 h-6" />
            Únete al Juego
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Código de partida */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-amber-700 flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Código de la partida
            </label>
            <Input
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              placeholder="Ej: ABC123"
              className="text-center text-lg font-mono tracking-wider border-amber-200 focus:border-amber-400"
              maxLength={6}
            />
          </div>

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

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-100 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Botón de unirse */}
          <Button
            onClick={handleJoinGame}
            disabled={!playerName.trim() || !gameCode.trim() || isJoining}
            className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
          >
            {isJoining ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Uniéndose...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Unirse a la Partida
              </div>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
