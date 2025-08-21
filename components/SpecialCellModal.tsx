"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Check, Star, ArrowRight, SkipForward, RotateCcw, Target } from "lucide-react"

interface SpecialCell {
  position: number
  name: string
  description: string
  effect: string
}

interface SpecialCellModalProps {
  isOpen: boolean
  specialCell: SpecialCell | null
  playerName: string
  onConfirm: () => void
}

const getEffectIcon = (effect: string) => {
  switch (effect) {
    case "go_back":
      return <RotateCcw className="w-8 h-8 text-red-500" />
    case "go_forward":
      return <ArrowRight className="w-8 h-8 text-green-500" />
    case "skip_turn":
      return <SkipForward className="w-8 h-8 text-orange-500" />
    case "extra_turn":
      return <Star className="w-8 h-8 text-yellow-500" />
    case "go_to_30":
      return <Target className="w-8 h-8 text-blue-500" />
    default:
      return <Star className="w-8 h-8 text-purple-500" />
  }
}

const getEffectDescription = (effect: string) => {
  switch (effect) {
    case "go_back":
      return "Vuelves al inicio (casilla 0)"
    case "go_forward":
      return "Avanzas 10 casillas adicionales"
    case "skip_turn":
      return "Pierdes tu siguiente turno"
    case "extra_turn":
      return "¡Juegas otra vez!"
    case "go_to_30":
      return "Vas directamente a la casilla 30"
    default:
      return "Efecto especial"
  }
}

const getEffectColor = (effect: string) => {
  switch (effect) {
    case "go_back":
      return "from-red-100 to-red-200 border-red-300"
    case "go_forward":
      return "from-green-100 to-green-200 border-green-300"
    case "skip_turn":
      return "from-orange-100 to-orange-200 border-orange-300"
    case "extra_turn":
      return "from-yellow-100 to-yellow-200 border-yellow-300"
    case "go_to_30":
      return "from-blue-100 to-blue-200 border-blue-300"
    default:
      return "from-purple-100 to-purple-200 border-purple-300"
  }
}

export function SpecialCellModal({ isOpen, specialCell, playerName, onConfirm }: SpecialCellModalProps) {
  if (!specialCell) return null

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <div
              className={`
              w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg
              bg-gradient-to-br ${getEffectColor(specialCell.effect)}
            `}
            >
              <span className="text-2xl font-bold text-gray-700">{specialCell.position}</span>
            </div>
          </div>

          <DialogTitle className="text-2xl font-bold text-amber-800 flex items-center justify-center gap-2">
            <Star className="w-6 h-6 text-amber-500" />
            ¡Casilla Especial!
            <Star className="w-6 h-6 text-amber-500" />
          </DialogTitle>

          <DialogDescription className="text-lg text-amber-700 font-medium">
            {playerName} ha caído en una casilla especial
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información de la casilla */}
          <div
            className={`
            p-6 rounded-xl border-2 shadow-lg
            bg-gradient-to-br ${getEffectColor(specialCell.effect)}
          `}
          >
            <div className="text-center space-y-4">
              <h3 className="text-xl font-bold text-gray-800">{specialCell.name}</h3>

              <p className="text-gray-700 text-base leading-relaxed">{specialCell.description}</p>

              <div className="flex items-center justify-center gap-3 pt-2">
                {getEffectIcon(specialCell.effect)}
                <span className="text-sm font-semibold text-gray-600">{getEffectDescription(specialCell.effect)}</span>
              </div>
            </div>
          </div>

          {/* Mensaje motivacional */}
          <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-amber-800 font-medium">
              {specialCell.effect === "extra_turn"
                ? "¡Qué suerte! 🍀"
                : specialCell.effect === "go_forward"
                  ? "¡Excelente! 🚀"
                  : specialCell.effect === "go_back"
                    ? "¡No te rindas! 💪"
                    : specialCell.effect === "skip_turn"
                      ? "¡Paciencia! ⏳"
                      : "¡Sigue adelante! 🎯"}
            </p>
          </div>
        </div>

        <DialogFooter className="flex justify-center">
          <Button
            onClick={onConfirm}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Check className="w-5 h-5 mr-2" />
            Continuar Juego
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
