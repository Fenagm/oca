"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, LogOut, RotateCcw } from "lucide-react"
import { SpecialCellModal } from "./SpecialCellModal"

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
  status: "waiting" | "playing" | "finished"
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

export function MultiplayerGameBoard({
  game: initialGame,
  currentPlayer,
  players: initialPlayers,
  onLeaveGame,
}: MultiplayerGameBoardProps) {
  const [game, setGame] = useState(initialGame)
  const [players, setPlayers] = useState<Player[]>(initialPlayers)
  const [diceValue, setDiceValue] = useState(1)
  const [isRolling, setIsRolling] = useState(false)
  const [gameMessage, setGameMessage] = useState("")
  const [specialCells, setSpecialCells] = useState<SpecialCell[]>([])

  // Estados para el modal de casilla especial
  const [showSpecialCellModal, setShowSpecialCellModal] = useState(false)
  const [currentSpecialCell, setCurrentSpecialCell] = useState<SpecialCell | null>(null)
  const [pendingGameUpdate, setPendingGameUpdate] = useState<any>(null)

  useEffect(() => {
    console.log("MultiplayerGameBoard: Setting up subscriptions for game:", game.id)

    // Función para cargar datos
    const loadGameData = async () => {
      try {
        // Cargar jugadores
        const { data: playersData, error: playersError } = await supabase
          .from("players")
          .select("*")
          .eq("game_id", game.id)
          .order("created_at")

        if (playersError) {
          console.error("Error loading players:", playersError)
        } else if (playersData) {
          console.log("MultiplayerGameBoard: Loaded players:", playersData)
          setPlayers(playersData)
        }

        // Cargar juego actualizado
        const { data: gameData, error: gameError } = await supabase.from("games").select("*").eq("id", game.id).single()

        if (gameError) {
          console.error("Error loading game:", gameError)
        } else if (gameData) {
          console.log("MultiplayerGameBoard: Loaded game:", gameData)
          setGame(gameData)
        }

        // Cargar casillas especiales
        const { data: cellsData, error: cellsError } = await supabase
          .from("special_cells")
          .select("*")
          .eq("game_id", game.id)

        if (cellsError) {
          console.error("Error loading special cells:", cellsError)
        } else if (cellsData) {
          console.log("MultiplayerGameBoard: Loaded special cells:", cellsData)
          setSpecialCells(cellsData)
        }
      } catch (error) {
        console.error("Error loading game data:", error)
      }
    }

    // Cargar datos inicialmente
    loadGameData()

    // Suscripción a cambios en el juego con nombre único
    const gameChannelName = `game-board-updates-${game.id}-${Date.now()}`
    const gameSubscription = supabase
      .channel(gameChannelName)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${game.id}`,
        },
        (payload) => {
          console.log("MultiplayerGameBoard: Game update received:", payload)
          if (payload.new) {
            setGame(payload.new as Game)
          }
        },
      )
      .subscribe((status) => {
        console.log("MultiplayerGameBoard: Game subscription status:", status)
      })

    // Suscripción a cambios en jugadores con nombre único
    const playersChannelName = `players-board-updates-${game.id}-${Date.now()}`
    const playersSubscription = supabase
      .channel(playersChannelName)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "players",
          filter: `game_id=eq.${game.id}`,
        },
        (payload) => {
          console.log("MultiplayerGameBoard: Player update received:", payload)
          loadGameData() // Recargar todos los datos cuando hay cambios en jugadores
        },
      )
      .subscribe((status) => {
        console.log("MultiplayerGameBoard: Players subscription status:", status)
      })

    return () => {
      console.log("MultiplayerGameBoard: Cleaning up subscriptions")
      gameSubscription.unsubscribe()
      playersSubscription.unsubscribe()
    }
  }, [game.id])

  const rollDice = async () => {
    const currentPlayerIndex = players.findIndex((p) => p.id === currentPlayer.id)

    console.log("MultiplayerGameBoard: Roll dice attempt", {
      isRolling,
      currentPlayerIndex,
      gameCurrentPlayer: game.current_player,
      isMyTurn: game.current_player === currentPlayerIndex,
    })

    if (isRolling || game.current_player !== currentPlayerIndex) {
      console.log("MultiplayerGameBoard: Cannot roll - not my turn or already rolling")
      return
    }

    setIsRolling(true)
    setGameMessage("")

    // Animación del dado
    const rollAnimation = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1)
    }, 100)

    setTimeout(async () => {
      clearInterval(rollAnimation)
      const finalDiceValue = Math.floor(Math.random() * 6) + 1
      setDiceValue(finalDiceValue)

      console.log("MultiplayerGameBoard: Dice rolled:", finalDiceValue)
      await movePlayer(finalDiceValue)
      setIsRolling(false)
    }, 1000)
  }

  const movePlayer = async (steps: number) => {
    const playerIndex = players.findIndex((p) => p.id === currentPlayer.id)
    const player = players[playerIndex]
    let newPosition = player.position + steps

    console.log("MultiplayerGameBoard: Moving player", {
      playerName: player.name,
      oldPosition: player.position,
      steps,
      newPosition,
    })

    // Si se pasa de 63, rebota hacia atrás
    if (newPosition > 63) {
      newPosition = 63 - (newPosition - 63)
      console.log("MultiplayerGameBoard: Bounced back to:", newPosition)
    }

    let gameUpdateData: any = {}

    // Verificar si ganó
    if (newPosition === 63) {
      console.log("MultiplayerGameBoard: Player won!")
      gameUpdateData = {
        status: "finished",
        winner_id: currentPlayer.id,
      }
      setGameMessage(`🎉 ¡${player.name} ha ganado el juego!`)
    }

    // Actualizar posición del jugador
    const { error: playerError } = await supabase
      .from("players")
      .update({ position: newPosition })
      .eq("id", currentPlayer.id)

    if (playerError) {
      console.error("Error updating player position:", playerError)
      return
    }

    // Verificar casilla especial
    const specialCell = specialCells.find((cell) => cell.position === newPosition)

    if (specialCell) {
      console.log("MultiplayerGameBoard: Hit special cell:", specialCell)

      // Mostrar modal y guardar la actualización pendiente
      setCurrentSpecialCell(specialCell)
      setShowSpecialCellModal(true)

      // Preparar la actualización del juego para después del modal
      let extraTurn = false
      if (specialCell.effect === "extra_turn") {
        extraTurn = true
      }

      let nextPlayer = game.current_player
      if (!extraTurn && game.status !== "finished") {
        nextPlayer = (game.current_player + 1) % players.length
      }

      setPendingGameUpdate({
        ...gameUpdateData,
        current_player: nextPlayer,
        specialCell: specialCell,
      })
    } else {
      // No hay casilla especial, continuar normalmente
      await finalizeTurn(gameUpdateData)
    }
  }

  const finalizeTurn = async (gameUpdateData: any) => {
    // Calcular siguiente jugador si no hay turno extra
    const nextPlayer = (game.current_player + 1) % players.length

    const finalGameUpdate = {
      ...gameUpdateData,
      current_player: nextPlayer,
    }

    if (Object.keys(finalGameUpdate).length > 0) {
      const { error: gameError } = await supabase.from("games").update(finalGameUpdate).eq("id", game.id)

      if (gameError) {
        console.error("Error updating game:", gameError)
      } else {
        console.log("MultiplayerGameBoard: Game updated successfully:", finalGameUpdate)
      }
    }
  }

  const handleSpecialCellConfirm = async () => {
    if (!currentSpecialCell || !pendingGameUpdate) return

    console.log("MultiplayerGameBoard: Handling special cell effect:", currentSpecialCell.effect)

    // Aplicar el efecto de la casilla especial
    await handleSpecialCellEffect(currentSpecialCell)

    // Actualizar el estado del juego
    const finalGameUpdate = { ...pendingGameUpdate }
    delete finalGameUpdate.specialCell // Remover datos temporales

    if (Object.keys(finalGameUpdate).length > 0) {
      const { error: gameError } = await supabase.from("games").update(finalGameUpdate).eq("id", game.id)

      if (gameError) {
        console.error("Error updating game:", gameError)
      } else {
        console.log("MultiplayerGameBoard: Game updated after special cell:", finalGameUpdate)
      }
    }

    // Cerrar modal y limpiar estados
    setShowSpecialCellModal(false)
    setCurrentSpecialCell(null)
    setPendingGameUpdate(null)
  }

  const handleSpecialCellEffect = async (cell: SpecialCell) => {
    let message = `${cell.name}: ${cell.description}`
    let newPosition = players.find((p) => p.id === currentPlayer.id)?.position || 0

    switch (cell.effect) {
      case "go_back":
        newPosition = 0
        message += " ¡Vuelves al inicio!"
        break
      case "go_forward":
        newPosition = Math.min(63, newPosition + 10)
        message += " ¡Avanzas 10 casillas!"
        break
      case "skip_turn":
        message += " ¡Pierdes el siguiente turno!"
        break
      case "extra_turn":
        message += " ¡Juegas otra vez!"
        break
      case "go_to_30":
        newPosition = 30
        message += " ¡Vas a la casilla 30!"
        break
    }

    // Actualizar posición si cambió
    const currentPosition = players.find((p) => p.id === currentPlayer.id)?.position || 0
    if (newPosition !== currentPosition) {
      console.log("MultiplayerGameBoard: Special cell changed position to:", newPosition)
      const { error } = await supabase.from("players").update({ position: newPosition }).eq("id", currentPlayer.id)

      if (error) {
        console.error("Error updating position after special cell:", error)
      }
    }

    setGameMessage(message)
  }

  const resetGame = async () => {
    if (!currentPlayer.is_admin) return

    try {
      console.log("MultiplayerGameBoard: Resetting game")

      // Resetear posiciones de jugadores
      const { error: playersError } = await supabase.from("players").update({ position: 0 }).eq("game_id", game.id)

      if (playersError) {
        console.error("Error resetting player positions:", playersError)
        return
      }

      // Resetear estado del juego
      const { error: gameError } = await supabase
        .from("games")
        .update({
          status: "playing",
          current_player: 0,
          winner_id: null,
        })
        .eq("id", game.id)

      if (gameError) {
        console.error("Error resetting game state:", gameError)
        return
      }

      setGameMessage("¡Juego reiniciado!")
      console.log("MultiplayerGameBoard: Game reset successfully")
    } catch (error) {
      console.error("Error resetting game:", error)
    }
  }

  // Asegurar que tenemos jugadores actualizados
  const sortedPlayers = [...players].sort(
    (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime(),
  )

  const currentPlayerTurn = sortedPlayers[game.current_player]
  const isMyTurn = currentPlayerTurn?.id === currentPlayer.id
  const DiceIcon = diceIcons[diceValue - 1]

  console.log("MultiplayerGameBoard: Render state", {
    gameCurrentPlayer: game.current_player,
    currentPlayerTurn: currentPlayerTurn?.name,
    isMyTurn,
    playersCount: sortedPlayers.length,
  })

  if (game.status === "finished") {
    const winner = sortedPlayers.find((p) => p.id === game.winner_id)
    return (
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <Card className="bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-300 shadow-2xl">
          <CardContent className="pt-8 pb-8">
            <div className="space-y-6">
              <div className="text-6xl animate-bounce">🏆</div>
              <h2 className="text-4xl font-bold text-amber-800">¡Juego Terminado!</h2>
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
                  className="border-amber-300 text-amber-700 hover:bg-amber-50 px-6 py-3 rounded-xl bg-transparent"
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
      {/* Modal de casilla especial */}
      <SpecialCellModal
        isOpen={showSpecialCellModal}
        specialCell={currentSpecialCell}
        playerName={currentPlayer.name}
        onConfirm={handleSpecialCellConfirm}
      />

      {/* Header del juego */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-amber-800">Juego de la Oca</h2>
          <p className="text-amber-600">Código: {game.code}</p>
        </div>
        <Button
          onClick={onLeaveGame}
          variant="outline"
          className="border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Salir
        </Button>
      </div>

      {/* Información del turno */}
      <Card
        className={`border-2 transition-all duration-300 ${
          isMyTurn
            ? "bg-gradient-to-r from-green-100 to-emerald-100 border-green-300 shadow-xl"
            : "bg-white/80 border-amber-200"
        }`}
      >
        <CardContent className="pt-4">
          <div className="text-center">
            {isMyTurn ? (
              <div className="space-y-2">
                <p className="text-lg font-semibold text-green-800">¡Es tu turno!</p>
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
        <div className="relative">
          <button
            onClick={rollDice}
            disabled={!isMyTurn || isRolling || showSpecialCellModal}
            className={`
              relative p-8 rounded-3xl transition-all duration-300 shadow-2xl border-4
              ${
                isMyTurn && !isRolling && !showSpecialCellModal
                  ? "bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 hover:from-yellow-500 hover:via-orange-500 hover:to-red-500 hover:scale-110 cursor-pointer border-yellow-300 animate-pulse"
                  : "bg-gradient-to-br from-gray-300 to-gray-400 cursor-not-allowed opacity-50 border-gray-400"
              }
              ${isRolling ? "animate-spin" : ""}
            `}
          >
            <DiceIcon className="w-20 h-20 text-white drop-shadow-lg" />

            {/* Sparkles around dice when it's player's turn */}
            {isMyTurn && !isRolling && !showSpecialCellModal && (
              <>
                <div className="absolute -top-2 -left-2 text-2xl animate-bounce">✨</div>
                <div className="absolute -top-2 -right-2 text-2xl animate-bounce" style={{ animationDelay: "0.2s" }}>
                  ⭐
                </div>
                <div className="absolute -bottom-2 -left-2 text-2xl animate-bounce" style={{ animationDelay: "0.4s" }}>
                  🌟
                </div>
                <div className="absolute -bottom-2 -right-2 text-2xl animate-bounce" style={{ animationDelay: "0.6s" }}>
                  💫
                </div>
              </>
            )}
          </button>
        </div>

        <div className="mt-4 bg-white/90 rounded-2xl px-6 py-3 shadow-lg border-2 border-gray-200">
          <p className="text-xl font-bold text-amber-700">
            {isRolling ? "🎲 ¡Rodando...!" : `🎯 Resultado: ${diceValue}`}
          </p>
        </div>
      </div>

      {/* Tablero */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-rainbow shadow-2xl">
        <CardContent className="p-8">
          <div className="grid grid-cols-8 gap-3 max-w-5xl mx-auto">
            {Array.from({ length: 64 }, (_, i) => {
              const position = i
              const playersHere = sortedPlayers.filter((p) => p.position === position)
              const specialCell = specialCells.find((cell) => cell.position === position)
              const isSpecial = specialCell !== undefined

              // Fun emojis for different positions
              const getPositionEmoji = (pos: number) => {
                if (pos === 0) return "🏠"
                if (pos === 63) return "🏆"
                if (pos % 9 === 0 && pos > 0) return "🌟"
                if (pos === 6) return "🌉"
                if (pos === 19) return "🏨"
                if (pos === 31) return "🕳️"
                if (pos === 42) return "💀"
                if (pos === 58) return "🎯"
                if (isSpecial) return "✨"

                // Random fun emojis for regular positions
                const funEmojis = ["🌸", "🦋", "🌈", "🍀", "🎈", "🎪", "🎨", "🎭", "🎪", "🎠"]
                return funEmojis[pos % funEmojis.length]
              }

              return (
                <div
                  key={position}
                  className={`
                    relative w-16 h-16 rounded-2xl border-3 flex flex-col items-center justify-center text-sm font-bold transition-all duration-300 hover:scale-105 cursor-pointer shadow-lg
                    ${
                      position === 0
                        ? "bg-gradient-to-br from-green-300 to-green-400 border-green-500 shadow-green-200"
                        : position === 63
                          ? "bg-gradient-to-br from-yellow-300 to-yellow-400 border-yellow-500 shadow-yellow-200"
                          : isSpecial
                            ? "bg-gradient-to-br from-purple-300 to-pink-400 border-purple-500 shadow-purple-200 animate-pulse"
                            : position % 2 === 0
                              ? "bg-gradient-to-br from-blue-200 to-blue-300 border-blue-400 shadow-blue-100"
                              : "bg-gradient-to-br from-orange-200 to-orange-300 border-orange-400 shadow-orange-100"
                    }
                  `}
                  title={specialCell ? `${specialCell.name}: ${specialCell.description}` : `Casilla ${position}`}
                >
                  {/* Position number */}
                  <div className="absolute -top-2 -left-2 bg-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-gray-700 border-2 border-gray-300 shadow-sm">
                    {position}
                  </div>

                  {/* Position emoji */}
                  <div className="text-2xl mb-1">{getPositionEmoji(position)}</div>

                  {/* Special cell indicator */}
                  {isSpecial && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full animate-bounce">
                      <div className="w-full h-full rounded-full bg-white/30"></div>
                    </div>
                  )}

                  {/* Players on this cell */}
                  {playersHere.length > 0 && (
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                      {playersHere.map((player) => (
                        <div
                          key={player.id}
                          className="text-2xl animate-bounce bg-white rounded-full p-1 shadow-lg border-2 border-gray-200"
                          title={player.name}
                          style={{ animationDelay: `${Math.random() * 0.5}s` }}
                        >
                          {player.avatar}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Fun legend */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-4 bg-white/80 rounded-2xl px-6 py-3 shadow-lg border-2 border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏠</span>
                <span className="text-sm font-medium text-gray-700">Inicio</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                <span className="text-sm font-medium text-gray-700">Meta</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">✨</span>
                <span className="text-sm font-medium text-gray-700">¡Sorpresa!</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de jugadores */}
      <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-blue-200 shadow-2xl">
        <CardContent className="pt-6">
          <h3 className="text-2xl font-bold text-center mb-6 text-purple-700">🎮 Jugadores 🎮</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={`
                  relative p-6 rounded-2xl border-3 transition-all duration-300 hover:scale-105 shadow-xl
                  ${
                    index === game.current_player
                      ? "bg-gradient-to-br from-green-300 to-emerald-400 border-green-500 shadow-green-200 animate-pulse"
                      : "bg-gradient-to-br from-blue-200 to-purple-300 border-blue-400 shadow-blue-100"
                  }
                `}
              >
                {/* Crown for current player */}
                {index === game.current_player && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-3xl animate-bounce">👑</div>
                )}

                <div className="flex items-center gap-4">
                  <div className="text-4xl bg-white rounded-full p-3 shadow-lg border-2 border-gray-200">
                    {player.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-lg text-gray-800 flex items-center gap-2">
                      {player.name}
                      {index === game.current_player && (
                        <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold animate-bounce">
                          ¡Tu turno! 🎯
                        </span>
                      )}
                      {player.id === currentPlayer.id && (
                        <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                          Eres tú 😊
                        </span>
                      )}
                    </div>
                    <div className="text-lg font-semibold text-gray-700 mt-1">📍 Casilla {player.position}/63</div>

                    {/* Progress bar */}
                    <div className="mt-2 bg-white/50 rounded-full h-3 overflow-hidden border border-gray-300">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-500 rounded-full"
                        style={{ width: `${(player.position / 63) * 100}%` }}
                      ></div>
                    </div>
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
