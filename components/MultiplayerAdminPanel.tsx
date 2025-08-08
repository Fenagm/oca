'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Save, Trash2, Plus, Settings } from 'lucide-react'

interface SpecialCell {
  id?: string
  position: number
  name: string
  description: string
  effect: string
}

interface MultiplayerAdminPanelProps {
  gameId: string
  onBack: () => void
}

const effectOptions = [
  { value: 'go_back', label: 'Volver al inicio', description: 'El jugador vuelve a la casilla 0' },
  { value: 'go_forward', label: 'Avanzar 10 casillas', description: 'El jugador avanza 10 posiciones' },
  { value: 'skip_turn', label: 'Perder turno', description: 'El jugador pierde su siguiente turno' },
  { value: 'extra_turn', label: 'Turno extra', description: 'El jugador juega otra vez' },
  { value: 'go_to_30', label: 'Ir a casilla 30', description: 'El jugador va directamente a la casilla 30' }
]

export function MultiplayerAdminPanel({ gameId, onBack }: MultiplayerAdminPanelProps) {
  const [specialCells, setSpecialCells] = useState<SpecialCell[]>([])
  const [editingCell, setEditingCell] = useState<SpecialCell | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadSpecialCells()
  }, [gameId])

  const loadSpecialCells = async () => {
    const { data, error } = await supabase
      .from('special_cells')
      .select('*')
      .eq('game_id', gameId)
      .order('position')

    if (error) {
      console.error('Error loading special cells:', error)
      return
    }

    setSpecialCells(data || [])
  }

  const handleSaveCell = async () => {
    if (!editingCell || !editingCell.name.trim() || !editingCell.description.trim()) {
      alert('Por favor completa todos los campos')
      return
    }

    if (editingCell.position < 1 || editingCell.position > 62) {
      alert('La posición debe estar entre 1 y 62')
      return
    }

    setIsLoading(true)

    try {
      if (editingCell.id) {
        // Actualizar casilla existente
        const { error } = await supabase
          .from('special_cells')
          .update({
            position: editingCell.position,
            name: editingCell.name,
            description: editingCell.description,
            effect: editingCell.effect
          })
          .eq('id', editingCell.id)

        if (error) throw error
      } else {
        // Crear nueva casilla
        const { error } = await supabase
          .from('special_cells')
          .insert({
            game_id: gameId,
            position: editingCell.position,
            name: editingCell.name,
            description: editingCell.description,
            effect: editingCell.effect
          })

        if (error) throw error
      }

      await loadSpecialCells()
      setEditingCell(null)
    } catch (error) {
      console.error('Error saving special cell:', error)
      alert('Error al guardar la casilla especial')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCell = async (cellId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta casilla especial?')) {
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('special_cells')
        .delete()
        .eq('id', cellId)

      if (error) throw error

      await loadSpecialCells()
    } catch (error) {
      console.error('Error deleting special cell:', error)
      alert('Error al eliminar la casilla especial')
    } finally {
      setIsLoading(false)
    }
  }

  const startNewCell = () => {
    setEditingCell({
      position: 1,
      name: '',
      description: '',
      effect: 'go_back'
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          onClick={onBack}
          variant="outline"
          className="border-amber-200 text-amber-700 hover:bg-amber-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <div>
          <h2 className="text-3xl font-bold text-amber-800 flex items-center gap-2">
            <Settings className="w-8 h-8" />
            Panel de Administración
          </h2>
          <p className="text-amber-600">Configura las casillas especiales del tablero</p>
        </div>
      </div>

      {/* Formulario de edición */}
      {editingCell && (
        <Card className="bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-300 shadow-xl">
          <CardHeader>
            <CardTitle className="text-blue-800">
              {editingCell.id ? 'Editar Casilla Especial' : 'Nueva Casilla Especial'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-blue-700">
                  Posición (1-62)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="62"
                  value={editingCell.position}
                  onChange={(e) => setEditingCell({
                    ...editingCell,
                    position: parseInt(e.target.value) || 1
                  })}
                  className="border-blue-200 focus:border-blue-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-blue-700">
                  Nombre de la casilla
                </label>
                <Input
                  value={editingCell.name}
                  onChange={(e) => setEditingCell({
                    ...editingCell,
                    name: e.target.value
                  })}
                  placeholder="Ej: La Posada"
                  className="border-blue-200 focus:border-blue-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-blue-700">
                Descripción
              </label>
              <Input
                value={editingCell.description}
                onChange={(e) => setEditingCell({
                  ...editingCell,
                  description: e.target.value
                })}
                placeholder="Ej: Descansas en la posada"
                className="border-blue-200 focus:border-blue-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-blue-700">
                Efecto
              </label>
              <Select
                value={editingCell.effect}
                onValueChange={(value) => setEditingCell({
                  ...editingCell,
                  effect: value
                })}
              >
                <SelectTrigger className="border-blue-200 focus:border-blue-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {effectOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSaveCell}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button
                onClick={() => setEditingCell(null)}
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de casillas especiales */}
      <Card className="bg-white/80 backdrop-blur-sm border-amber-200 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-amber-800">
            Casillas Especiales ({specialCells.length})
          </CardTitle>
          <Button
            onClick={startNewCell}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Casilla
          </Button>
        </CardHeader>
        <CardContent>
          {specialCells.length === 0 ? (
            <div className="text-center py-8 text-amber-600">
              <div className="text-4xl mb-4">🎯</div>
              <p className="text-lg font-medium mb-2">No hay casillas especiales configuradas</p>
              <p className="text-sm">Haz clic en "Nueva Casilla" para agregar efectos especiales al tablero</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {specialCells.map((cell) => {
                const effectOption = effectOptions.find(opt => opt.value === cell.effect)
                return (
                  <div
                    key={cell.id}
                    className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200 hover:bg-amber-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {cell.position}
                        </div>
                        <div>
                          <h4 className="font-semibold text-amber-900">{cell.name}</h4>
                          <p className="text-sm text-amber-700">{cell.description}</p>
                        </div>
                      </div>
                      <div className="text-xs text-amber-600 bg-amber-200 px-2 py-1 rounded-full inline-block">
                        {effectOption?.label}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setEditingCell(cell)}
                        size="sm"
                        variant="outline"
                        className="border-amber-300 text-amber-700 hover:bg-amber-50"
                      >
                        Editar
                      </Button>
                      <Button
                        onClick={() => cell.id && handleDeleteCell(cell.id)}
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información sobre efectos */}
      <Card className="bg-gradient-to-r from-purple-100 to-pink-100 border-purple-300">
        <CardHeader>
          <CardTitle className="text-purple-800">Efectos Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {effectOptions.map((option) => (
              <div key={option.value} className="flex items-start gap-3 p-3 bg-white/60 rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <div className="font-medium text-purple-900">{option.label}</div>
                  <div className="text-sm text-purple-700">{option.description}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
