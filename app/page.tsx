'use client'

import { useState, useEffect } from 'react'
import { GameLobby } from '@/components/GameLobby'
import { WaitingRoom } from '@/components/WaitingRoom'
import { MultiplayerGameBoard } from '@/components/MultiplayerGameBoard'
import { PlayerJoin } from '@/components/PlayerJoin'
import { supabase } from '@/lib/supabase'
import { Dice1, Users, Crown, Settings } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui'
import { LocalGameDemo } from '@/components/LocalGameDemo'

type GameState = 'lobby' | 'joining' | 'waiting' | 'playing'

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

import { isSupabaseConfigured } from '@/lib/supabase'

export default function App() {
  const [gameState, setGameState] = useState<GameState>('lobby')
  const [currentGame, setCurrentGame] = useState<Game | null>(null)
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [showConfigWarning, setShowConfigWarning] = useState(false)

  useEffect(() => {
    // Check Supabase configuration
    if (!isSupabaseConfigured()) {
      setShowConfigWarning(true)
    }
    
    // Limpiar al cargar la página
    const cleanup = () => {
      localStorage.removeItem('currentGame')
      localStorage.removeItem('currentPlayer')
    }
    
    cleanup()
  }, [])

  // Add configuration warning component before the main content
  if (showConfigWarning) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50">
      {/* Header decorativo */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-200/20 via-amber-200/20 to-orange-200/20" />
        <div className="relative px-4 py-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
                <Dice1 className="w-8 h-8 text-amber-600" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Juego de la Oca
              </h1>
              <div className="p-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
                <Users className="w-8 h-8 text-amber-600" />
              </div>
            </div>
            <p className="text-amber-700/80 text-lg font-medium">
              Juego multijugador en tiempo real
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 pb-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="bg-white/90 backdrop-blur-sm border-amber-200 shadow-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mb-4">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-amber-800">
                Configuración de Supabase
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <p className="text-amber-700">
                  Para el modo multijugador completo, configura Supabase:
                </p>
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
                  <h3 className="font-semibold text-amber-800 mb-2">Pasos para configurar:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-amber-700">
                    <li>Haz clic en "Connect to Supabase" en la esquina superior derecha</li>
                    <li>Crea un nuevo proyecto en Supabase</li>
                    <li>Las variables de entorno se configurarán automáticamente</li>
                    <li>Ejecuta la migración SQL incluida en el proyecto</li>
                  </ol>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                  <h3 className="font-semibold text-blue-800 mb-2">Variables necesarias:</h3>
                  <li>Ve a <a href="https://supabase.com" target="_blank" className="text-blue-600 underline">supabase.com</a> y crea una cuenta</li>
                  <li>Crea un nuevo proyecto en Supabase</li>
                  <li>Ve a Settings → API y copia tu Project URL y anon key</li>
                  <li>Actualiza el archivo .env.local con tus credenciales</li>
                  <li>Ejecuta la migración SQL desde supabase/migrations/001_create_game_tables.sql</li>
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={() => setShowConfigWarning(false)}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-6 py-3 rounded-xl"
                >
                  Probar Demo Local
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Demo local del juego */}
          <LocalGameDemo />
        </div>
      </div>

      {/* Elementos decorativos flotantes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 text-4xl animate-bounce opacity-20">🎲</div>
        <div className="absolute top-40 right-20 text-3xl animate-pulse opacity-20">🏆</div>
        <div className="absolute bottom-20 left-20 text-3xl animate-bounce opacity-20 animation-delay-1000">⭐</div>
        <div className="absolute bottom-40 right-10 text-4xl animate-pulse opacity-20 animation-delay-2000">🎯</div>
      </div>
    </div>
  )
}

  const handleCreateGame = (game: Game, player: Player) => {
    setCurrentGame(game)
    setCurrentPlayer(player)
    setPlayers([player])
    setGameState('waiting')
  }

  const handleJoinGame = (game: Game, player: Player, allPlayers: Player[]) => {
    console.log('handleJoinGame called with:', { game, player, allPlayers })
    setCurrentGame(game)
    setCurrentPlayer(player)
    setPlayers(allPlayers)
    setGameState('waiting')
  }

  const handleStartGame = () => {
    setGameState('playing')
  }

  const handleLeaveGame = () => {
    setCurrentGame(null)
    setCurrentPlayer(null)
    setPlayers([])
    setGameState('lobby')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50">
      {/* Header decorativo */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-200/20 via-amber-200/20 to-orange-200/20" />
        <div className="relative px-4 py-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
                <Dice1 className="w-8 h-8 text-amber-600" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Juego de la Oca
              </h1>
              <div className="p-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
                <Users className="w-8 h-8 text-amber-600" />
              </div>
            </div>
            <p className="text-amber-700/80 text-lg font-medium">
              Juego multijugador en tiempo real
            </p>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="px-4 pb-8">
        <div className="max-w-6xl mx-auto">
          {gameState === 'lobby' && (
            <GameLobby 
              onCreateGame={handleCreateGame}
              onJoinGame={() => setGameState('joining')}
            />
          )}

          {gameState === 'joining' && (
            <PlayerJoin 
              onJoinSuccess={handleJoinGame}
              onBack={() => setGameState('lobby')}
            />
          )}

          {gameState === 'waiting' && currentGame && currentPlayer && (
            <WaitingRoom
              game={currentGame}
              currentPlayer={currentPlayer}
              players={players}
              onStartGame={handleStartGame}
              onLeaveGame={handleLeaveGame}
            />
          )}

          {gameState === 'playing' && currentGame && currentPlayer && (
            <MultiplayerGameBoard
              game={currentGame}
              currentPlayer={currentPlayer}
              players={players}
              onLeaveGame={handleLeaveGame}
            />
          )}
        </div>
      </div>

      {/* Elementos decorativos flotantes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 text-4xl animate-bounce opacity-20">🎲</div>
        <div className="absolute top-40 right-20 text-3xl animate-pulse opacity-20">🏆</div>
        <div className="absolute bottom-20 left-20 text-3xl animate-bounce opacity-20 animation-delay-1000">⭐</div>
        <div className="absolute bottom-40 right-10 text-4xl animate-pulse opacity-20 animation-delay-2000">🎯</div>
      </div>
    </div>
  )
}