'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { ArrowLeft, Users, Hash, AlertCircle } from 'lucide-react'

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
    if (!playerName.trim() || !gameCode.trim()) {
      setError('Por favor completa todos los campos')
      return
    }

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      setError('Para usar el modo multijugador, necesitas configurar Supabase. Las variables de entorno no están configuradas correctamente.')
      return
    }

    setIsJoining(true)
    setError('')

    try {
      console.log('Searching for game with code:', gameCode.toUpperCase())

      // Buscar la partida
      const gameResponse = await supabase
        .from('games')
        .select('*')
        .eq('code', gameCode.toUpperCase())
        .eq('status', 'waiting')
        .single()

      console.log('Game search response:', gameResponse)

      if (gameResponse.error) {
        console.error('Game search error:', gameResponse.error)
        
        if (gameResponse.error.code === 'SUPABASE_NOT_CONFIGURED') {
          setError('Supabase no está configurado correctamente.')
          return
        }
        
        setError('Código de partida no válido o la partida ya comenzó')
        return
      }

      if (!gameResponse.data) {
        setError('Código de partida no válido o la partida ya comenzó')
        return
      }

      const gameData = gameResponse.data

      console.log('Found game:', gameData)

      // Verificar cuántos jugadores hay
      const playersResponse = await supabase
        .from('players')
        .select('*')
        .eq('game_id', gameData.id)

      console.log('Players check response:', playersResponse)

      if (playersResponse.error) {
        console.error('Players check error:', playersResponse.error)
        
        if (playersResponse.error.code === 'SUPABASE_NOT_CONFIGURED') {
          setError('Supabase no está configurado correctamente.')
          return
        }
        
        throw new Error(playersResponse.error.message || 'Error al verificar jugadores')
      }

      const existingPlayers = playersResponse.data || []

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

      console.log('Creating new player for game:', gameData.id)

      // Crear el jugador
      const playerResponse = await supabase
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

      console.log('Player creation response:', playerResponse)

      if (playerResponse.error) {
        console.error('Player creation error:', playerResponse.error)
        
        if (playerResponse.error.code === 'SUPABASE_NOT_CONFIGURED') {
          setError('Supabase no está configurado correctamente.')
          return
        }
        
        throw new Error(playerResponse.error.message || 'Error al crear el jugador')
      }

      if (!playerResponse.data) {
        throw new Error('No se recibieron datos al crear el jugador')
      }

      const playerData = playerResponse.data

      // Obtener todos los jugadores actualizados
      const allPlayersResponse = await supabase
        .from('players')
        .select('*')
        .eq('game_id', gameData.id)
        .order('created_at')

      console.log('All players response:', allPlayersResponse)

      if (allPlayersResponse.error) {
        console.error('All players fetch error:', allPlayersResponse.error)
        
        if (allPlayersResponse.error.code === 'SUPABASE_NOT_CONFIGURED') {
          setError('Supabase no está configurado correctamente.')
          return
        }
        
        throw new Error(allPlayersResponse.error.message || 'Error al obtener jugadores')
      }

      const allPlayers = allPlayersResponse.data || []

      console.log('Successfully joined game:', { gameData, playerData, allPlayers })

      onJoinSuccess(gameData, playerData, allPlayers)
    } catch (error) {
      console.error('Error in handleJoinGame:', error)
      
      let errorMessage = 'Error desconocido al unirse a la partida'
      
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      setError(`Error al unirse a la partida: ${errorMessage}`)
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
              onChange={(e) => {
                setGameCode(e.target.value.toUpperCase())
                setError('')
              }}
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
              onChange={(e) => {
                setPlayerName(e.target.value)
                setError('')
              }}
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
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">
                {error}
              </div>
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

      {/* Configuration status */}
      {!isSupabaseConfigured() && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Modo Multijugador No Disponible</p>
                <p>Para habilitar el juego multijugador en tiempo real, configura Supabase haciendo clic en "Connect to Supabase" en la esquina superior derecha.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
