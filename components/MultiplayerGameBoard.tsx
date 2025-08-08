'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Trophy, LogOut, RotateCcw } from 'lucide-react'

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

interface SpecialCell {
  position: number
  name: string
  description: string
  effect: string
}

interface MultiplayerGameBoardProps {
  game: Game
  currentPlayer: Player
  players: Player[]
  onLeaveGame: () => void
}

const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6]

export function MultiplayerGameBoard({ game: initialGame, currentPlayer, players: initialPlayers, onLeaveGame }: MultiplayerGameBoardProps) {
  const [game, setGame] = useState(initialGame)
  const [players, setPlayers] = useState<Player[]>(initialPlayers)
  const [diceValue, setDiceValue] = useState(1)
  const [isRolling, setIsRolling] = useState(false)
  const [gameMessage, setGameMessage] = useState('')
  const [specialCells, setSpecialCells] = useState<SpecialCell[]>([])

  useEffect(() => {
    loadSpecialCells()
    
    // Suscribirse a cambios en el juego
    const gameSubscription = supabase
      .channel('game-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${game.id}`
        },
        (payload) => {
          setGame(payload.new as Game)
        }
      )
      .subscribe()

    // Suscribirse a cambios en los jugadores
    const playersSubscription = supabase
      .channel('players-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'players',
          filter: `game_id=eq.${game.id}`
        },
        async () => {
          const { data } = await supabase
            .from('players')
            .select('*')
            .eq('game_id', game.id)
            .order('created_at')
          
          if (data) {
            setPlayers(data)
          }
        }
      )
      .subscribe()

    return () => {
      gameSubscription.unsubscribe()
      playersSubscription.unsubscribe()
    }
  }, [game.id])

  const loadSpecialCells = async () => {
    const { data } = await supabase
      .from('special_cells')
      .select('*')
      .eq('game_id', game.id)
    
    if (data) {
      setSpecialCells(data)
    }
  }

  const rollDice = async () => {
    if (isRolling || game.current_player !== players.findIndex(p => p.id === currentPlayer.id)) return

    setIsRolling(true)
    setGameMessage('')

    // Animación del dado
    const rollAnimation = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1)
    }, 100)

    setTimeout(async () => {
      clearInterval(rollAnimation)
      const finalDiceValue = Math.floor(Math.random() * 6) + 1
      setDiceValue(finalDiceValue)
      
      await movePlayer(finalDiceValue)
      setIsRolling(false)
    }, 1000)
  }

  const movePlayer = async (steps: number) => {
    const playerIndex = players.findIndex(p => p.id === currentPlayer.id)
    const player = players[playerIndex]
    let newPosition = player.position + steps

    // Si se pasa de 63, rebota hacia atrás
    if (newPosition > 63) {
      newPosition = 63 - (newPosition - 63)
    }

    // Verificar si ganó
    if (newPosition === 63) {
      await supabase
        .from('games')
        .update({ 
          status: 'finished',
          winner_id: currentPlayer.id 
        })
        .eq('id', game.id)
      
      setGameMessage(`🎉 ¡${player.name} ha ganado el juego!`)
    }

    // Actualizar posición del jugador
    await supabase
      .from('players')
      .update({ position: newPosition })
      .eq('id', currentPlayer.id)

    // Verificar casilla especial
    const specialCell = specialCells.find(cell => cell.position === newPosition)
    let nextPlayer = (game.current_player + 1) % players.length

    if (specialCell) {
      const effect = await handleSpecialCell(specialCell, newPosition)
      if (effect.extraTurn) {
        nextPlayer = game.current_player // No cambiar turno
      }
    }

    // Actualizar turno
    await supabase
      .from('games')
      .update({ current_player: nextPlayer })
      .eq('id', game.id)
  }

  const handleSpecialCell = async (cell: SpecialCell, currentPosition: number) => {
    let message = `${cell.name}: ${cell.description}`
    let newPosition = currentPosition
    let extraTurn = false

    switch (cell.effect) {
      case 'go_back':
        newPosition = 0
        message += ' ¡Vuelves al inicio!'
        break
      case 'go_forward':
        newPosition = Math.min(63, currentPosition + 10)
        message += ' ¡Avanzas 10 casillas!'
        break
      case 'skip_turn':
        message += ' ¡Pierdes el siguiente turno!'
        break
      case 'extra_turn':
        message += ' ¡Juegas otra vez!'
        extraTurn = true
        break
      case 'go_to_30':
        newPosition = 30
        message += ' ¡Vas a la casilla 30!'
        break
    }

    if (newPosition !== currentPosition) {
      await supabase
        .from('players')
        .update({ position: newPosition })
        .eq('id', currentPlayer.id)
    }

    setGameMessage(message)
    return { extraTurn }
  }

  const resetGame = async () => {
    if (!currentPlayer.is_admin) return

    try {
      // Resetear posiciones de jugadores
      await supabase
        .from('players')
        .update({ position: 0 })
        .eq('game_id', game.id)

      // Resetear estado del juego
      await supabase
        .from('games')
        .update({ 
          status: 'playing',
          current_player: 0,
          winner_id: null
        })
        .eq('id', game.id)

      setGameMessage('¡Juego reiniciado!')
    } catch (error) {
      console.error('Error resetting game:', error)
    }
  }

  const currentPlayerTurn = players[game.current_player]
  const isMyTurn = currentPlayerTurn?.id === currentPlayer.id
  const DiceIcon = diceIcons[diceValue - 1]

  if (game.status === 'finished') {
    const winner = players.find(p => p.id === game.winner_id)
    return (
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <Card className="bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-300 shadow-2xl">
          <CardContent className="pt-8 pb-8">
            <div className="space-y-6">
              <div className="text-6xl animate-bounce">🏆</div>
              <h2 className="text-4xl font-bold text-amber-800">
                ¡Juego Terminado!
              </h2>
              <div className="text-2xl text-amber-700">
                🎉 <span className="font-bold">{winner?.name}</span> ha ganado 🎉
              </div>
              <div className="flex gap-4 justify-center">
                {currentPlayer.is_admin && (
                  <Button
                    onClick={resetGame}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Jugar de Nuevo
                  </Button>
                )}
                <Button
                  onClick={onLeaveGame}
                  variant="outline"
                  className="border-amber-300 text-amber-700 hover:bg-amber-50 px-6 py-3 rounded-xl"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Salir del Juego
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header del juego */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-amber-800">Juego de la Oca</h2>
          <p className="text-amber-600">Código: {game.code}</p>
        </div>
        <Button
          onClick={onLeaveGame}
          variant="outline"
          className="border-red-200 text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Salir
        </Button>
      </div>

      {/* Información del turno */}
      <Card className={`border-2 transition-all duration-300 ${
        isMyTurn 
          ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-300 shadow-xl' 
          : 'bg-white/80 border-amber-200'
      }`}>
        <CardContent className="pt-4">
          <div className="text-center">
            {isMyTurn ? (
              <div className="space-y-2">
                <p className="text-lg font-semibold text-green-800">
                  ¡Es tu turno!
                </p>
                <p className="text-green-600">Haz clic en el dado para lanzarlo</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-lg font-semibold text-amber-800">
                  Turno de {currentPlayerTurn?.avatar} {currentPlayerTurn?.name}
                </p>
                <p className="text-amber-600">Esperando su jugada...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dado */}
      <div className="text-center">
        <button
          onClick={rollDice}
          disabled={!isMyTurn || isRolling}
          className={`
            p-6 rounded-2xl transition-all duration-300 shadow-xl
            ${isMyTurn && !isRolling
              ? 'bg-gradient-to-br from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 hover:scale-110 cursor-pointer'
              : 'bg-gray-300 cursor-not-allowed opacity-50'
            }
            ${isRolling ? 'animate-spin' : ''}
          `}
        >
          <DiceIcon className="w-16 h-16 text-white" />
        </button>
        <p className="mt-2 text-amber-700 font-semibold">
          {isRolling ? 'Lanzando...' : `Dado: ${diceValue}`}
        </p>
      </div>

      {/* Mensaje del juego */}
      {gameMessage && (
        <Card className="bg-blue-100 border-blue-300">
          <CardContent className="pt-4">
            <p className="text-center text-blue-800 font-medium">{gameMessage}</p>
          </CardContent>
        </Card>
      )}

      {/* Tablero */}
      <Card className="bg-white/90 backdrop-blur-sm border-amber-200 shadow-xl">
        <CardContent className="p-6">
          <div className="grid grid-cols-8 gap-2">
            {Array.from({ length: 64 }, (_, i) => {
              const position = i
              const playersHere = players.filter(p => p.position === position)
              const specialCell = specialCells.find(cell => cell.position === position)
              
              return (
                <div
                  key={position}
                  className={`
                    relative aspect-square rounded-lg border-2 flex flex-col items-center justify-center text-xs font-semibold transition-all duration-200 hover:scale-105
                    ${position === 0 
                      ? 'bg-gradient-to-br from-green-200 to-emerald-300 border-green-400' 
                      : position === 63 
                      ? 'bg-gradient-to-br from-yellow-200 to-amber-300 border-yellow-400'
                      : specialCell
                      ? 'bg-gradient-to-br from-purple-200 to-pink-300 border-purple-400'
                      : 'bg-gradient-to-br from-amber-50 to-orange-100 border-amber-200'
                    }
                  `}
                >
                  <span className="text-amber-800 mb-1">{position}</span>
                  
                  {specialCell && (
                    <div className="absolute top-0 right-0 text-purple-600">⭐</div>
                  )}
                  
                  {playersHere.length > 0 && (
                    <div className="flex flex-wrap gap-1 justify-center">
                      {playersHere.map(player => (
                        <span
                          key={player.id}
                          className="text-lg animate-bounce"
                          title={player.name}
                        >
                          {player.avatar}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Lista de jugadores */}
      <Card className="bg-white/80 backdrop-blur-sm border-amber-200 shadow-xl">
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {players.map((player, index) => (
              <div
                key={player.id}
                className={`
                  flex items-center gap-3 p-3 rounded-xl transition-all duration-200
                  ${player.id === currentPlayer.id
                    ? 'bg-gradient-to-r from-amber-200 to-orange-200 ring-2 ring-amber-300'
                    : 'bg-amber-50'
                  }
                  ${game.current_player === index ? 'ring-2 ring-green-400' : ''}
                `}
              >
                <div className="text-2xl">{player.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-amber-900 truncate">
                    {player.name}
                  </div>
                  <div className="text-sm text-amber-600">
                    Casilla {player.position}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
