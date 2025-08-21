"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { Save, Download, Trash2, Plus, Star, Globe, User, Check, AlertCircle } from "lucide-react"

interface SpecialCell {
  id?: string
  position: number
  name: string
  description: string
  effect: string
}

interface Template {
  id: string
  name: string
  description: string
  created_by: string
  is_public: boolean
  created_at: string
  cell_count?: number
}

interface TemplateManagerProps {
  gameId: string
  currentCells: SpecialCell[]
  onLoadTemplate: (cells: SpecialCell[]) => void
  onBack: () => void
}

export function TemplateManager({ gameId, currentCells, onLoadTemplate, onBack }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [templateDescription, setTemplateDescription] = useState("")
  const [creatorName, setCreatorName] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error">("success")

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setIsLoading(true)
    try {
      const { data: templatesData, error } = await supabase
        .from("special_cell_templates")
        .select(`
          *,
          template_special_cells(count)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Procesar los datos para incluir el conteo de casillas
      const processedTemplates =
        templatesData?.map((template) => ({
          ...template,
          cell_count: template.template_special_cells?.length || 0,
        })) || []

      setTemplates(processedTemplates)
    } catch (error) {
      console.error("Error loading templates:", error)
      showMessage("Error al cargar las plantillas", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => setMessage(""), 3000)
  }

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !creatorName.trim()) {
      showMessage("Por favor completa el nombre de la plantilla y tu nombre", "error")
      return
    }

    if (currentCells.length === 0) {
      showMessage("No hay casillas especiales para guardar", "error")
      return
    }

    setIsLoading(true)
    try {
      // Crear la plantilla
      const { data: templateData, error: templateError } = await supabase
        .from("special_cell_templates")
        .insert({
          name: templateName.trim(),
          description: templateDescription.trim() || "Configuración personalizada",
          created_by: creatorName.trim(),
          is_public: isPublic,
        })
        .select()
        .single()

      if (templateError) throw templateError

      // Guardar las casillas especiales
      const cellsToInsert = currentCells.map((cell) => ({
        template_id: templateData.id,
        position: cell.position,
        name: cell.name,
        description: cell.description,
        effect: cell.effect,
      }))

      const { error: cellsError } = await supabase.from("template_special_cells").insert(cellsToInsert)

      if (cellsError) throw cellsError

      showMessage(`Plantilla "${templateName}" guardada exitosamente`, "success")
      setShowSaveForm(false)
      setTemplateName("")
      setTemplateDescription("")
      setCreatorName("")
      setIsPublic(false)
      loadTemplates()
    } catch (error) {
      console.error("Error saving template:", error)
      showMessage("Error al guardar la plantilla", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadTemplate = async (templateId: string) => {
    setIsLoading(true)
    try {
      const { data: cellsData, error } = await supabase
        .from("template_special_cells")
        .select("*")
        .eq("template_id", templateId)
        .order("position")

      if (error) throw error

      const cells: SpecialCell[] =
        cellsData?.map((cell) => ({
          position: cell.position,
          name: cell.name,
          description: cell.description,
          effect: cell.effect,
        })) || []

      onLoadTemplate(cells)
      showMessage("Plantilla cargada exitosamente", "success")
    } catch (error) {
      console.error("Error loading template:", error)
      showMessage("Error al cargar la plantilla", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la plantilla "${templateName}"?`)) {
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.from("special_cell_templates").delete().eq("id", templateId)

      if (error) throw error

      showMessage("Plantilla eliminada exitosamente", "success")
      loadTemplates()
    } catch (error) {
      console.error("Error deleting template:", error)
      showMessage("Error al eliminar la plantilla", "error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-amber-800">Gestión de Plantillas</h2>
          <p className="text-amber-600">Guarda y reutiliza configuraciones de casillas especiales</p>
        </div>
        <Button
          onClick={onBack}
          variant="outline"
          className="border-amber-200 text-amber-700 hover:bg-amber-50 bg-transparent"
        >
          Volver al Panel
        </Button>
      </div>

      {/* Mensaje de estado */}
      {message && (
        <Card className={`${messageType === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              {messageType === "success" ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              <span className={`${messageType === "success" ? "text-green-700" : "text-red-700"}`}>{message}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Guardar configuración actual */}
      <Card className="bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-300 shadow-xl">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <Save className="w-6 h-6" />
            Guardar Configuración Actual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 font-medium">Casillas especiales actuales: {currentCells.length}</p>
              <p className="text-sm text-blue-600">
                Guarda la configuración actual como plantilla para futuras partidas
              </p>
            </div>
            <Button
              onClick={() => setShowSaveForm(!showSaveForm)}
              disabled={currentCells.length === 0}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              {showSaveForm ? "Cancelar" : "Guardar Como Plantilla"}
            </Button>
          </div>

          {showSaveForm && (
            <div className="grid gap-4 p-4 bg-white/80 rounded-lg border border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-blue-700">Nombre de la plantilla *</label>
                  <Input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Ej: Mi configuración épica"
                    className="border-blue-200 focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-blue-700">Tu nombre *</label>
                  <Input
                    value={creatorName}
                    onChange={(e) => setCreatorName(e.target.value)}
                    placeholder="Ej: Juan Pérez"
                    className="border-blue-200 focus:border-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-blue-700">Descripción (opcional)</label>
                <Input
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Describe tu configuración..."
                  className="border-blue-200 focus:border-blue-400"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded border-blue-300"
                />
                <label htmlFor="isPublic" className="text-sm text-blue-700">
                  Hacer pública (otros jugadores podrán usar esta plantilla)
                </label>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSaveTemplate}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? "Guardando..." : "Guardar Plantilla"}
                </Button>
                <Button
                  onClick={() => setShowSaveForm(false)}
                  variant="outline"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de plantillas */}
      <Card className="bg-white/80 backdrop-blur-sm border-amber-200 shadow-xl">
        <CardHeader>
          <CardTitle className="text-amber-800 flex items-center gap-2">
            <Star className="w-6 h-6" />
            Plantillas Disponibles ({templates.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-amber-600">Cargando plantillas...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-amber-600">
              <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No hay plantillas disponibles</p>
              <p className="text-sm">Crea tu primera plantilla guardando la configuración actual</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200 hover:bg-amber-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-amber-900">{template.name}</h4>
                      <div className="flex items-center gap-2">
                        {template.is_public ? (
                          <div className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            <Globe className="w-3 h-3" />
                            Pública
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            <User className="w-3 h-3" />
                            Privada
                          </div>
                        )}
                        <span className="text-xs bg-amber-200 text-amber-700 px-2 py-1 rounded-full">
                          {template.cell_count} casillas
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-amber-700 mb-1">{template.description}</p>
                    <p className="text-xs text-amber-600">
                      Por {template.created_by} • {new Date(template.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleLoadTemplate(template.id)}
                      size="sm"
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Cargar
                    </Button>
                    {!template.is_public && (
                      <Button
                        onClick={() => handleDeleteTemplate(template.id, template.name)}
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
