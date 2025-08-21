'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Users, Play, RotateCcw, Trophy } from 'lucide-react'

interface LocalPlayer {
  id: string
  name: string
  avatar: string
  position: number
}

const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6]
const avatars = ['👑', '🎭', '🎪', '🎨', '🎯', '🎲', '🏆', '⭐', '🌟', '💎', '🎊', '🎈']

export function LocalGameDemo() {
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'finished'>('setup')
  const [players, setPlayers] = useState<LocalPlayer[]>([])
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [diceValue, setDiceValue] = useState(1)
  const [isRolling, setIsRolling] = useState(false)
  const [gameMessage, setGameMessage] = useState('')
  const [winner, setWinner] = useState<LocalPlayer | null>(null)
  
  // Formulario para agregar jugadores
  const [newPlayerName, setNewPlayerName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0])

  const addPlayer = () => {
    if (!newPlayerName.trim() || players.length >= 6) return
    
    const newPlayer: LocalPlayer = {
      id: Date.now().toString(),
      name: newPlayerName.trim(),
      avatar: selectedAvatar,
      position: 0
    }
    
    setPlayers([...players, newPlayer])
    setNewPlayerName('')
    
    // Cambiar al siguiente avatar disponible
    const currentIndex = avatars.indexOf(selectedAvatar)
    const nextIndex = (currentIndex + 1) % avatars.length
    setSelectedAvatar(avatars[nextIndex])
  }

  const removePlayer = (playerId: string) => {
    setPlayers(players.filter(p => p.id !== playerId))
  }

  const startGame = () => {
    if (players.length < 2) return
    setGameState('playing')
    setCurrentPlayerIndex(0)
    setGameMessage(`¡Turno de ${players[0].name}!`)
  }

  const rollDice = () => {
    if (isRolling) return
    
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

    // Actualizar la posición del jugador
    const updatedPlayers = players.map(player => 
      player.id === currentPlayer.id 
        ? { ...player, position: newPosition }
        : player
    )
    setPlayers(updatedPlayers)

    // Verificar si ganó
    if (newPosition === 63) {
      setWinner(currentPlayer)
      setGameState('finished')
      setGameMessage(`🎉 ¡${currentPlayer.name} ha ganado!`)
      return
    }

    // Casillas especiales simples
    let message = ''
    let nextPlayerIndex = (currentPlayerIndex + 1) % players.length

    // Algunas casillas especiales básicas
    switch (newPosition) {
      case 6:
        message = '🌉 El Puente: ¡Avanza a la casilla 12!'
        const bridgePlayers = updatedPlayers.map(player => 
          player.id === currentPlayer.id 
            ? { ...player, position: 12 }
            : player
        )
        setPlayers(bridgePlayers)
        break
      case 19:
        message = '🏨 La Posada: ¡Pierdes un turno!'
        // El jugador actual pierde el turno, así que avanzamos dos posiciones
        nextPlayerIndex = (currentPlayerIndex + 2) % players.length
        break
      case 31:
        message = '🕳️ El Pozo: ¡Espera hasta que otro jugador caiga aquí!'
        // En una versión completa, esto sería más complejo
        break
      case 42:
        message = '💀 La Muerte: ¡Vuelves al inicio!'
        const deathPlayers = updatedPlayers.map(player => 
          player.id === currentPlayer.id 
            ? { ...player, position: 0 }
            : player
        )
        setPlayers(deathPlayers)
        break
      case 58:
        message = '🎯 ¡Casi llegas! ¡Muy cerca de la meta!'
        break
    }

    if (message) {
      setGameMessage(message)
    } else {
      setGameMessage(`${currentPlayer.name} avanzó ${steps} casillas`)
    }

    // Cambiar al siguiente jugador
    setTimeout(() => {
      setCurrentPlayerIndex(nextPlayerIndex)
      if (!message.includes('Vuelves al inicio') && !message.includes('Pierdes un turno')) {
        setGameMessage(`¡Turno de ${players[nextPlayerIndex].name}!`)
      } else {
        setTimeout(() => {
          setGameMessage(`¡Turno de ${players[nextPlayerIndex].name}!`)
        }, 2000)
      }
    }, 1500)
  }

  const resetGame = () => {
    setPlayers(players.map(player => ({ ...player, position: 0 })))
    setCurrentPlayerIndex(0)
    setGameState('playing')
    setWinner(null)
    setGameMessage(`¡Turno de ${players[0].name}!`)
  }

  const backToSetup = () => {
    setGameState('setup')
    setPlayers([])
    setCurrentPlayerIndex(0)
    setWinner(null)
    setGameMessage('')
  }

  const DiceIcon = diceIcons[diceValue - 1]

  if (gameState === 'setup') {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-amber-200 shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center mb-4">
            <Play className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-amber-800">
            Demo Local del Juego
          </CardTitle>
          <p className="text-amber-600">
            Juega localmente en un solo dispositivo (sin multijugador)
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Agregar jugador */}
          <div className="space-y-4">
            <h3 className="font-semibold text-amber-800">Agregar Jugadores</h3>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="Nombre del jugador"
                  maxLength={20}
                />
              </div>
              
              <div className="flex gap-2">
                {avatars.slice(0, 6).map((avatar) => (
                  <button
                    key={avatar}
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`
                      p-2 text-xl rounded-lg transition-all duration-200
                      ${selectedAvatar === avatar
                        ? 'bg-amber-400 scale-110 ring-2 ring-amber-300'
                        : 'bg-amber-100 hover:bg-amber-200'
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
          </div>

          {/* Lista de jugadores */}
          {players.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-amber-800">
                Jugadores ({players.length}/6)
              </h3>
              <div className="space-y-2">
                {players.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg"
                  >
                    <span className="text-2xl">{player.avatar}</span>
                    <span className="font-medium text-amber-900">{player.name}</span>
                    <span className="text-xs text-amber-600">Jugador {index + 1}</span>
                    <Button
                      onClick={() => removePlayer(player.id)}
                      variant="outline"
                      size="sm"
                      className="ml-auto text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Quitar
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botón iniciar */}
          <div className="text-center">
            <Button
              onClick={startGame}
              disabled={players.length < 2}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold px-8 py-3 rounded-xl"
            >
              <Play className="w-5 h-5 mr-2" />
              Iniciar Juego Local
            </Button>
            {players.length < 2 && (
              <p className="text-sm text-amber-600 mt-2">
                Se necesitan al menos 2 jugadores
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (gameState === 'finished' && winner) {
    return (
      <div className="space-y-6">
        <Card className="bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-300 shadow-2xl">
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-6">
              <div className="text-6xl animate-bounce">🏆</div>
              <h2 className="text-4xl font-bold text-amber-800">
                ¡Juego Terminado!
              </h2>
              <div className="text-2xl text-amber-700">
                🎉 <span className="font-bold">{winner.name}</span> ha ganado 🎉
              </div>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={resetGame}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold px-6 py-3 rounded-xl"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Jugar de Nuevo
                </Button>
                <Button
                  onClick={backToSetup}
                  variant="outline"
                  className="border-amber-300 text-amber-700 hover:bg-amber-50 px-6 py-3 rounded-xl"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Cambiar Jugadores
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Estado de juego
  const currentPlayer = players[currentPlayerIndex]

  return (
    <div className="space-y-6">
      {/* Header del juego */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-amber-800">Demo Local - Juego de la Oca</h2>
          <p className="text-amber-600">Juego local para un dispositivo</p>
        </div>
        <Button
          onClick={backToSetup}
          variant="outline"
          className="border-amber-200 text-amber-700 hover:bg-amber-50"
        >
          <Users className="w-4 h-4 mr-2" />
          Cambiar Jugadores
        </Button>
      </div>

      {/* Información del turno */}
      <Card className="bg-gradient-to-r from-green-100 to-emerald-100 border-green-300 shadow-xl">
        <CardContent className="pt-4">
          <div className="text-center">
            <p className="text-lg font-semibold text-green-800">
              Turno de {currentPlayer.avatar} {currentPlayer.name}
            </p>
            <p className="text-green-600">Haz clic en el dado para lanzarlo</p>
          </div>
        </CardContent>
      </Card>

      {/* Dado */}
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
              
              // Casillas especiales
              const isSpecial = [6, 19, 31, 42, 58].includes(position)
              
              return (
                <div
                  key={position}
                  className={`
                    relative aspect-square rounded-lg border-2 flex flex-col items-center justify-center text-xs font-semibold transition-all duration-200
                    ${position === 0 
                      ? 'bg-gradient-to-br from-green-200 to-emerald-300 border-green-400' 
                      : position === 63 
                      ? 'bg-gradient-to-br from-yellow-200 to-amber-300 border-yellow-400'
                      : isSpecial
                      ? 'bg-gradient-to-br from-purple-200 to-pink-300 border-purple-400'
                      : 'bg-gradient-to-br from-amber-50 to-orange-100 border-amber-200'
                    }
                  `}
                >
                  <span className="text-amber-800 mb-1">{position}</span>
                  
                  {isSpecial && (
                    <div className="absolute top-0 right-0 text-purple-600">⭐</div>
                  )}
                  
                  {/* Iconos especiales */}
                  {position === 6 && <span className="text-xs">🌉</span>}
                  {position === 19 && <span className="text-xs">🏨</span>}
                  {position === 31 && <span className="text-xs">🕳️</span>}
                  {position === 42 && <span className="text-xs">💀</span>}
                  {position === 58 && <span className="text-xs">🎯</span>}
                  
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
                  ${index === currentPlayerIndex
                    ? 'bg-gradient-to-r from-green-200 to-emerald-200 ring-2 ring-green-400'
                    : 'bg-amber-50'
                  }
                `}
              >
                <div className="text-2xl">{player.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-amber-900 truncate">
                    {player.name}
                    {index === currentPlayerIndex && (
                      <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                        Turno
                      </span>
                    )}
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
