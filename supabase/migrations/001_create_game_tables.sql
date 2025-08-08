-- Crear tabla de juegos
CREATE TABLE games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(6) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  current_player INTEGER DEFAULT 0,
  winner_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de jugadores
CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  avatar VARCHAR(10) NOT NULL,
  position INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de casillas especiales
CREATE TABLE special_cells (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 1 AND position <= 62),
  name VARCHAR(100) NOT NULL,
  description VARCHAR(200) NOT NULL,
  effect VARCHAR(50) NOT NULL CHECK (effect IN ('go_back', 'go_forward', 'skip_turn', 'extra_turn', 'go_to_30')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, position)
);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_players_game_id ON players(game_id);
CREATE INDEX idx_special_cells_game_id ON special_cells(game_id);
CREATE INDEX idx_games_code ON games(code);

-- Habilitar Row Level Security
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_cells ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad (permitir acceso público para el juego)
CREATE POLICY "Allow public access to games" ON games FOR ALL USING (true);
CREATE POLICY "Allow public access to players" ON players FOR ALL USING (true);
CREATE POLICY "Allow public access to special_cells" ON special_cells FOR ALL USING (true);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
