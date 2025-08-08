'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { Users, Play, Copy, Check, Crown, LogOut, Settings } from 'lucide-react'
import { MultiplayerAdminPanel } from './MultiplayerAdminPanel'

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

interface WaitingRoomProps {
  game: Game
  currentPlayer: Player
  players: Player[]
  onStartGame: () => void
  onLeaveGame: () => void
}

export function WaitingRoom({ game, currentPlayer, players: initialPlayers, onStartGame, onLeaveGame }: WaitingRoomProps) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers)
  const [copied, setCopied] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)

  useEffect(() => {
    // Load initial players
    const loadPlayers = async () => {
      try {
        const { data, error } = await supabase
          .from('players')
          .select('*')
          .eq('game_id', game.id)
          .order('created_at')
        
        if (error) {
          console.error('Error loading players:', error)
          return
        }
        
        if (data) {
          console.log('Loaded players:', data)
          setPlayers(data)
        }
      } catch (error) {
        console.error('Error in loadPlayers:', error)
      }
    }

    loadPlayers()

    // Suscribirse a cambios en los jugadores
    const playersChannel = supabase
      .channel(`players-${game.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `game_id=eq.${game.id}`
        },
        async (payload) => {
          console.log('Players change detected:', payload)
          // Recargar jugadores
          const { data, error } = await supabase
            .from('players')
            .select('*')
            .eq('game_id', game.id)
            .order('created_at')
          
          if (error) {
            console.error('Error reloading players:', error)
            return
          }
          
          if (data) {
            console.log('Reloaded players:', data)
            setPlayers(data)
          }
        }
      )
      .subscribe()

    // Suscribirse a cambios en el juego
    const gameChannel = supabase
      .channel(`game-${game.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${game.id}`
        },
        (payload) => {
          console.log('Game change detected:', payload)
          if (payload.new.status === 'playing') {
            onStartGame()
          }
        }
      )
      .subscribe()

    return () => {
      console.log('Unsubscribing from channels')
      playersChannel.unsubscribe()
      gameChannel.unsubscribe()
    }
  }, [game.id, onStartGame])

  const copyGameCode = async () => {
    try {
      await navigator.clipboard.writeText(game.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  const handleStartGame = async () => {
    if (players.length < 2) {
      alert('Se necesitan al menos 2 jugadores para comenzar')
      return
    }

    try {
      console.log('Starting game with players:', players)
      const { error } = await supabase
        .from('games')
        .update({ status: 'playing' })
        .eq('id', game.id)

      if (error) {
        console.error('Error starting game:', error)
        throw error
      }
    } catch (error) {
      console.error('Error starting game:', error)
      alert('Error al iniciar el juego')
    }
  }

  const handleLeaveGame = async () => {
    try {
      console.log('Player leaving game:', currentPlayer.id)
      // Eliminar jugador
      const { error: deleteError } = await supabase
        .from('players')
        .delete()
        .eq('id', currentPlayer.id)

      if (deleteError) {
        console.error('Error deleting player:', deleteError)
        throw deleteError
      }
      // Si era el admin y hay otros jugadores, hacer admin al siguiente
      if (currentPlayer.is_admin && players.length > 1) {
        const nextAdmin = players.find(p => p.id !== currentPlayer.id)
        if (nextAdmin) {
          const { error: adminError } = await supabase
            .from('players')
            .update({ is_admin: true })
            .eq('id', nextAdmin.id)
          
          if (adminError) {
            console.error('Error updating admin:', adminError)
          }
        }
      }

      // Si no quedan jugadores, eliminar la partida
      if (players.length <= 1) {
        const { error: gameError } = await supabase
          .from('games')
          .delete()
          .eq('id', game.id)
        
        if (gameError) {
          console.error('Error deleting game:', gameError)
        }
      }

      onLeaveGame()
    } catch (error) {
      console.error('Error leaving game:', error)
      alert('Error al salir del juego')
    }
  }

  if (showAdminPanel && currentPlayer.is_admin) {
    return (
      <MultiplayerAdminPanel
        gameId={game.id}
        onBack={() => setShowAdminPanel(false)}
      />
    )
  }

  console.log('Rendering WaitingRoom with players:', players)
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-amber-800">Sala de Espera</h2>
          <p className="text-amber-600">Esperando a que se unan más jugadores...</p>
        </div>
        <Button
          onClick={handleLeaveGame}
          variant="outline"
          className="border-red-200 text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Salir
        </Button>
      </div>

      {/* Código de la partida */}
      <Card className="bg-gradient-to-r from-amber-100 to-orange-100 border-amber-300 shadow-xl">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-amber-800">
              Código de la Partida
            </h3>
            <div className="flex items-center justify-center gap-4">
              <div className="text-4xl font-mono font-bold text-amber-900 bg-white/80 px-6 py-3 rounded-xl shadow-lg tracking-wider">
                {game.code}
              </div>
              <Button
                onClick={copyGameCode}
                variant="outline"
                size="sm"
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-sm text-amber-700">
              Comparte este código con tus amigos para que se unan
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Lista de jugadores */}
      <Card className="bg-white/80 backdrop-blur-sm border-amber-200 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <Users className="w-6 h-6" />
            Jugadores ({players.length}/6)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <div className="text-center py-8 text-amber-600">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-lg font-medium mb-2">Cargando jugadores...</p>
              <p className="text-sm">Por favor espera un momento</p>
            </div>
          ) : (
          <div className="grid gap-4">
            {players.map((player, index) => (
              <div
                key={player.id}
                className={`
                  flex items-center gap-4 p-4 rounded-xl transition-all duration-200
                  ${player.id === currentPlayer.id
                    ? 'bg-gradient-to-r from-amber-200 to-orange-200 ring-2 ring-amber-300'
                    : 'bg-amber-50 hover:bg-amber-100'
                  }
                `}
              >
                <div className="text-3xl">{player.avatar}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-amber-900">
                      {player.name}
                    </span>
                    {player.is_admin && (
                      <Crown className="w-4 h-4 text-amber-600" />
                    )}
                    {player.id === currentPlayer.id && (
                      <span className="text-xs bg-amber-600 text-white px-2 py-1 rounded-full">
                        Tú
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-amber-600">
                    Jugador {index + 1}
                  </div>
                </div>
              </div>
            ))}

            {/* Espacios vacíos */}
            {Array.from({ length: 6 - players.length }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="flex items-center gap-4 p-4 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300"
              >
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-gray-400" />
                </div>
                <div className="text-gray-500">
                  Esperando jugador...
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Controles del administrador */}
      {currentPlayer.is_admin && (
        <Card className="bg-gradient-to-r from-green-100 to-emerald-100 border-green-300 shadow-xl">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-green-800 mb-4">
                <Crown className="w-5 h-5" />
                <span className="font-semibold">Panel de Administrador</span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => setShowAdminPanel(true)}
                  variant="outline"
                  className="border-green-300 text-green-700 hover:bg-green-50"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configurar Casillas
                </Button>
                
                <Button
                  onClick={handleStartGame}
                  disabled={players.length < 2}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Iniciar Juego
                </Button>
              </div>
              
              {players.length < 2 && (
                <p className="text-sm text-green-600">
                  Se necesitan al menos 2 jugadores para comenzar
                </p>
              )}
            </div>
          )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
