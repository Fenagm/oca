'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Trophy, RotateCcw, Users } from 'lucide-react'

const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6]
const avatars = ['👑', '🎭', '🎪', '🎨', '🎯', '🎲']

interface Player {
  id: string
  name: string
  avatar: string
  position: number
}

interface SpecialCell {
  position: number
  name: string
  description: string
  effect: string
}

export function LocalGameDemo() {
  const [players, setPlayers] = useState<Player[]>([])
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [diceValue, setDiceValue] = useState(1)
  const [isRolling, setIsRolling] = useState(false)
  const [gameMessage, setGameMessage] = useState('')
  const [winner, setWinner] = useState<Player | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0])

  // Casillas especiales predefinidas
  const specialCells: SpecialCell[] = [
    { position: 6, name: 'El Puente', description: 'Avanzas al puente del 12', effect: 'go_to_12' },
    { position: 12, name: 'El Puente', description: 'Avanzas al puente del 19', effect: 'go_to_19' },
    { position: 19, name: 'La Posada', description: 'Pierdes 1 turno descansando', effect: 'skip_turn' },
    { position: 31, name: 'El Pozo', description: 'Esperas hasta que otro jugador caiga aquí', effect: 'skip_turn' },
    { position: 42, name: 'El Laberinto', description: 'Retrocedes a la casilla 30', effect: 'go_to_30' },
    { position: 58, name: 'La Muerte', description: 'Vuelves al inicio', effect: 'go_back' }
  ]

  const addPlayer = () => {
    if (!newPlayerName.trim() || players.length >= 6) return
    
    const newPlayer: Player = {
      id: Date.now().toString(),
      name: newPlayerName.trim(),
      avatar: selectedAvatar,
      position: 0
    }
    
    setPlayers([...players, newPlayer])
    setNewPlayerName('')
    
    // Cambiar avatar automáticamente para el siguiente jugador
    const nextAvatarIndex = (avatars.indexOf(selectedAvatar) + 1) % avatars.length
    setSelectedAvatar(avatars[nextAvatarIndex])
  }

  const startGame = () => {
    if (players.length < 2) {
      alert('Se necesitan al menos 2 jugadores para comenzar')
      return
    }
    setGameStarted(true)
    setGameMessage(`¡Comienza ${players[0].name}!`)
  }

  const rollDice = () => {
    if (isRolling || winner) return

    setIsRolling(true)
    setGameMessage('')

    // Animación del dado
    const rollAnimation = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1)
    }, 100)

    setTimeout(() => {
      clearInterval(rollAnimation)
      const finalDiceValue = Math.floor(Math.random() * 6) + 1
      setDiceValue(finalDiceValue)
      movePlayer(finalDiceValue)
      setIsRolling(false)
    }, 1000)
  }

  const movePlayer = (steps: number) => {
    const currentPlayer = players[currentPlayerIndex]
    let newPosition = currentPlayer.position + steps

    // Si se pasa de 63, rebota hacia atrás
    if (newPosition > 63) {
      newPosition = 63 - (newPosition - 63)
    }

    // Actualizar posición
    const updatedPlayers = players.map(player =>
      player.id === currentPlayer.id
        ? { ...player, position: newPosition }
        : player
    )
    setPlayers(updatedPlayers)

    // Verificar si ganó
    if (newPosition === 63) {
      setWinner(currentPlayer)
      setGameMessage(`🎉 ¡${currentPlayer.name} ha ganado el juego!`)
      return
    }

    // Verificar casilla especial
    const specialCell = specialCells.find(cell => cell.position === newPosition)
    let nextPlayerIndex = (currentPlayerIndex + 1) % players.length

    if (specialCell) {
      handleSpecialCell(specialCell, currentPlayer, updatedPlayers)
    } else {
      setCurrentPlayerIndex(nextPlayerIndex)
      setGameMessage(`Turno de ${players[nextPlayerIndex].name}`)
    }
  }

  const handleSpecialCell = (cell: SpecialCell, player: Player, currentPlayers: Player[]) => {
    let message = `${cell.name}: ${cell.description}`
    let newPosition = player.position
    let skipTurnChange = false

    switch (cell.effect) {
      case 'go_back':
        newPosition = 0
        message += ' ¡Vuelves al inicio!'
        break
      case 'go_to_12':
        newPosition = 12
        message += ' ¡Saltas al puente!'
        break
      case 'go_to_19':
        newPosition = 19
        message += ' ¡Saltas al siguiente puente!'
        break
      case 'go_to_30':
        newPosition = 30
        message += ' ¡Retrocedes al 30!'
        break
      case 'skip_turn':
        message += ' ¡Pierdes el siguiente turno!'
        skipTurnChange = true
        break
    }

    // Actualizar posición si cambió
    if (newPosition !== player.position) {
      const updatedPlayers = currentPlayers.map(p =>
        p.id === player.id ? { ...p, position: newPosition } : p
      )
      setPlayers(updatedPlayers)
    }

    setGameMessage(message)

    // Cambiar turno (excepto en casos especiales)
    if (!skipTurnChange) {
      const nextPlayerIndex = (currentPlayerIndex + 1) % players.length
      setCurrentPlayerIndex(nextPlayerIndex)
    }
  }

  const resetGame = () => {
    setPlayers(players.map(player => ({ ...player, position: 0 })))
    setCurrentPlayerIndex(0)
    setWinner(null)
    setGameMessage(`¡Juego reiniciado! Comienza ${players[0].name}`)
    setDiceValue(1)
  }

  const DiceIcon = diceIcons[diceValue - 1]

  if (!gameStarted) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-300 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-blue-800">
              🎲 Modo Demo Local
            </CardTitle>
            <p className="text-blue-600">
              Juega localmente mientras configuras Supabase para el modo multijugador
            </p>
          </CardHeader>
        </Card>

        {/* Agregar jugadores */}
        <Card className="bg-white/80 backdrop-blur-sm border-amber-200 shadow-xl">
          <CardHeader>
            <CardTitle className="text-amber-800">
              Agregar Jugadores ({players.length}/6)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Input
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Nombre del jugador"
                className="flex-1"
                maxLength={20}
              />
              <div className="flex gap-2">
                {avatars.map((avatar) => (
                  <button
                    key={avatar}
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`
                      p-2 text-xl rounded-lg transition-all duration-200
                      ${selectedAvatar === avatar
                        ? 'bg-amber-400 scale-110 ring-2 ring-amber-300'
                        : 'bg-gray-100 hover:bg-amber-100'
                      }
                    `}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
              <Button
                onClick={addPlayer}
                disabled={!newPlayerName.trim() || players.length >= 6}
                className="bg-amber-500 hover:bg-amber-600"
              >
                Agregar
              </Button>
            </div>

            {/* Lista de jugadores */}
            {players.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-amber-800">Jugadores:</h4>
                <div className="grid gap-2">
                  {players.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg"
                    >
                      <span className="text-2xl">{player.avatar}</span>
                      <span className="font-medium text-amber-900">{player.name}</span>
                      <span className="text-sm text-amber-600">Jugador {index + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={startGame}
              disabled={players.length < 2}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 rounded-xl"
            >
              {players.length < 2 ? 'Se necesitan al menos 2 jugadores' : 'Comenzar Juego'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header del juego */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-amber-800">Juego de la Oca - Demo Local</h2>
        {winner ? (
          <div className="mt-4 space-y-4">
            <div className="text-6xl animate-bounce">🏆</div>
            <p className="text-2xl font-bold text-green-600">
              ¡{winner.name} ha ganado!
            </p>
            <Button
              onClick={resetGame}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold px-6 py-3 rounded-xl"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Jugar de Nuevo
            </Button>
          </div>
        ) : (
          <p className="text-amber-600 mt-2">
            Turno de {players[currentPlayerIndex]?.avatar} {players[currentPlayerIndex]?.name}
          </p>
        )}
      </div>

      {/* Dado */}
      {!winner && (
        <div className="text-center">
          <button
            onClick={rollDice}
            disabled={isRolling}
            className={`
              p-6 rounded-2xl transition-all duration-300 shadow-xl
              ${!isRolling
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
      )}

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
                  title={specialCell ? `${specialCell.name}: ${specialCell.description}` : `Casilla ${position}`}
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
                  ${currentPlayerIndex === index && !winner
                    ? 'bg-gradient-to-r from-green-200 to-emerald-200 ring-2 ring-green-400'
                    : 'bg-amber-50'
                  }
                  ${winner?.id === player.id ? 'bg-gradient-to-r from-yellow-200 to-amber-200 ring-2 ring-yellow-400' : ''}
                `}
              >
                <div className="text-2xl">{player.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-amber-900 truncate">
                    {player.name}
                    {winner?.id === player.id && ' 🏆'}
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
