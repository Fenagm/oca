-- Crear tabla de plantillas de configuración
CREATE TABLE special_cell_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(200),
  created_by VARCHAR(100) NOT NULL, -- Nombre del creador
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de casillas especiales para plantillas
CREATE TABLE template_special_cells (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES special_cell_templates(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 1 AND position <= 62),
  name VARCHAR(100) NOT NULL,
  description VARCHAR(200) NOT NULL,
  effect VARCHAR(50) NOT NULL CHECK (effect IN ('go_back', 'go_forward', 'skip_turn', 'extra_turn', 'go_to_30')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(template_id, position)
);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_template_special_cells_template_id ON template_special_cells(template_id);
CREATE INDEX idx_special_cell_templates_created_by ON special_cell_templates(created_by);
CREATE INDEX idx_special_cell_templates_public ON special_cell_templates(is_public);

-- Habilitar Row Level Security
ALTER TABLE special_cell_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_special_cells ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad (permitir acceso público para las plantillas)
CREATE POLICY "Allow public access to templates" ON special_cell_templates FOR ALL USING (true);
CREATE POLICY "Allow public access to template cells" ON template_special_cells FOR ALL USING (true);

-- Trigger para actualizar updated_at en plantillas
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON special_cell_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar algunas plantillas predeterminadas
INSERT INTO special_cell_templates (name, description, created_by, is_public) VALUES
('Clásico Juego de la Oca', 'Configuración tradicional del juego de la oca con casillas clásicas', 'Sistema', true),
('Aventura Épica', 'Configuración con más desafíos y sorpresas para una experiencia emocionante', 'Sistema', true),
('Modo Rápido', 'Configuración con más turnos extra para partidas más dinámicas', 'Sistema', true);

-- Insertar casillas para la plantilla clásica
INSERT INTO template_special_cells (template_id, position, name, description, effect) 
SELECT 
  (SELECT id FROM special_cell_templates WHERE name = 'Clásico Juego de la Oca'),
  6, 'El Puente', 'Cruzas el puente y avanzas rápidamente', 'go_to_30'
UNION ALL SELECT 
  (SELECT id FROM special_cell_templates WHERE name = 'Clásico Juego de la Oca'),
  19, 'La Posada', 'Te detienes a descansar en la posada', 'skip_turn'
UNION ALL SELECT 
  (SELECT id FROM special_cell_templates WHERE name = 'Clásico Juego de la Oca'),
  31, 'El Pozo', 'Caes en el pozo y debes esperar', 'skip_turn'
UNION ALL SELECT 
  (SELECT id FROM special_cell_templates WHERE name = 'Clásico Juego de la Oca'),
  42, 'La Muerte', 'La muerte te envía de vuelta al inicio', 'go_back'
UNION ALL SELECT 
  (SELECT id FROM special_cell_templates WHERE name = 'Clásico Juego de la Oca'),
  58, 'Casi Meta', '¡Estás muy cerca! Juegas otra vez', 'extra_turn';

-- Insertar casillas para la plantilla de aventura épica
INSERT INTO template_special_cells (template_id, position, name, description, effect) 
SELECT 
  (SELECT id FROM special_cell_templates WHERE name = 'Aventura Épica'),
  8, 'Teletransporte', 'Un portal mágico te lleva lejos', 'go_to_30'
UNION ALL SELECT 
  (SELECT id FROM special_cell_templates WHERE name = 'Aventura Épica'),
  15, 'Trampa de Arena', 'Quedas atrapado y pierdes un turno', 'skip_turn'
UNION ALL SELECT 
  (SELECT id FROM special_cell_templates WHERE name = 'Aventura Épica'),
  23, 'Poción de Velocidad', 'Una poción te da energía extra', 'go_forward'
UNION ALL SELECT 
  (SELECT id FROM special_cell_templates WHERE name = 'Aventura Épica'),
  35, 'Dragón Dormido', 'Despiertas al dragón y huyes al inicio', 'go_back'
UNION ALL SELECT 
  (SELECT id FROM special_cell_templates WHERE name = 'Aventura Épica'),
  45, 'Cofre del Tesoro', 'Encuentras un tesoro y juegas de nuevo', 'extra_turn'
UNION ALL SELECT 
  (SELECT id FROM special_cell_templates WHERE name = 'Aventura Épica'),
  52, 'Hechizo de Confusión', 'Un hechizo te confunde y retrocedes', 'go_back';

-- Insertar casillas para el modo rápido
INSERT INTO template_special_cells (template_id, position, name, description, effect) 
SELECT 
  (SELECT id FROM special_cell_templates WHERE name = 'Modo Rápido'),
  10, 'Turbo Boost', 'Aceleras y juegas otra vez', 'extra_turn'
UNION ALL SELECT 
  (SELECT id FROM special_cell_templates WHERE name = 'Modo Rápido'),
  20, 'Super Salto', 'Das un gran salto hacia adelante', 'go_forward'
UNION ALL SELECT 
  (SELECT id FROM special_cell_templates WHERE name = 'Modo Rápido'),
  30, 'Energía Extra', 'Tienes energía para otro turno', 'extra_turn'
UNION ALL SELECT 
  (SELECT id FROM special_cell_templates WHERE name = 'Modo Rápido'),
  40, 'Impulso Final', 'Un último impulso te da ventaja', 'go_forward'
UNION ALL SELECT 
  (SELECT id FROM special_cell_templates WHERE name = 'Modo Rápido'),
  50, 'Racha de Suerte', 'La suerte está de tu lado', 'extra_turn';
