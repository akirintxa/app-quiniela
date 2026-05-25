-- 1. Limpieza inicial: Borramos las tablas existentes para empezar de cero
-- Esto evita el error "relation already exists" al re-ejecutar el script.
DROP VIEW IF EXISTS match_prediction_state;
DROP TABLE IF EXISTS predictions CASCADE;
DROP TABLE IF EXISTS pool_members CASCADE;
DROP TABLE IF EXISTS pools CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

-- 2. Tabla de equipos oficiales del Mundial 2026
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    iso_code VARCHAR(10) NOT NULL -- Soporta códigos como 'GB-ENG' o 'MX'
);

-- 3. Tabla de partidos (Fase de Grupos y Eliminatorias)
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    team_a_id INT REFERENCES teams(id),
    team_b_id INT REFERENCES teams(id),
    group_id VARCHAR(1), -- 'A', 'B', etc. (NULL en eliminatorias)
    stage VARCHAR(20) NOT NULL, -- 'group', 'round_32', 'round_16', 'quarter_final', 'semi_final', 'third_place', 'final'
    start_time TIMESTAMPTZ NOT NULL,
    result_a INT, -- Marcador real equipo A
    result_b INT, -- Marcador real equipo B
    winner_id INT REFERENCES teams(id), -- Para indicar quién pasa en caso de empate en eliminatorias
    is_locked BOOLEAN DEFAULT false, -- Bloquea predicciones cuando el partido inicia
    is_finished BOOLEAN DEFAULT false, -- Indica si el partido terminó y se han calculado los puntos
    bracket_round SMALLINT, -- Orden visual en el árbol (0 = dieciseisavos)
    bracket_index SMALLINT -- Índice dentro de la ronda
);

-- 4. Tabla de predicciones de los usuarios
-- Nota: requiere que exista public.profiles (ejecutar create_profiles_table.sql antes si es instalación nueva)
CREATE TABLE predictions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    match_id INT REFERENCES matches(id),
    predicted_a INT, -- Goles predichos equipo A
    predicted_b INT, -- Goles predichos equipo B
    predicted_winner_id INT REFERENCES teams(id), -- Obligatorio en eliminatorias si hay empate predicho
    points_won INT, -- Puntos obtenidos tras el fin del partido
    UNIQUE(user_id, match_id) -- RESTRICCIÓN CRÍTICA: Evita predicciones duplicadas para un mismo partido
);

-- Vista opcional: estado real vs predicción por partido (después de crear predictions)
CREATE OR REPLACE VIEW match_prediction_state AS
SELECT
    m.id AS match_id,
    m.stage,
    m.result_a AS real_a,
    m.result_b AS real_b,
    m.winner_id AS real_winner_id,
    p.predicted_a,
    p.predicted_b,
    p.predicted_winner_id,
    p.points_won,
    m.is_finished
FROM matches m
LEFT JOIN predictions p ON p.match_id = m.id;

-- 5. Tabla de Ligas Privadas (Pools)
CREATE TABLE pools (
    id SERIAL PRIMARY KEY,
    creator_id UUID REFERENCES auth.users(id),
    name VARCHAR(255) NOT NULL,
    invite_code VARCHAR(20) UNIQUE,
    is_public BOOLEAN DEFAULT false,
    max_participants INT
);

-- 6. Tabla de miembros de las Ligas
CREATE TABLE pool_members (
    id SERIAL PRIMARY KEY,
    pool_id INT REFERENCES pools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    role VARCHAR(10) DEFAULT 'member', -- 'admin' o 'member'
    UNIQUE(pool_id, user_id) -- Evita que un usuario se una dos veces a la misma liga
);
