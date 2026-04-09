
-- 1. Ampliamos la columna iso_code para soportar códigos más largos (como GB-ENG)
ALTER TABLE teams ALTER COLUMN iso_code TYPE VARCHAR(10);

-- 2. Limpiamos datos antiguos para empezar de cero
TRUNCATE TABLE predictions CASCADE;
TRUNCATE TABLE matches CASCADE;
TRUNCATE TABLE teams CASCADE;

-- 3. Insertamos los 48 equipos oficiales del Mundial 2026 con banderas y nombres actualizados
INSERT INTO teams (name, iso_code) VALUES
-- Grupo A
('México 🇲🇽', 'MX'), ('Sudáfrica 🇿🇦', 'ZA'), ('Corea del Sur 🇰🇷', 'KR'), ('Chequia 🇨🇿', 'CZ'),
-- Grupo B
('Canadá 🇨🇦', 'CA'), ('Bosnia y Herz. 🇧🇦', 'BA'), ('Qatar 🇶🇦', 'QA'), ('Suiza 🇨🇭', 'CH'),
-- Grupo C
('Brasil 🇧🇷', 'BR'), ('Marruecos 🇲🇦', 'MA'), ('Haití 🇭🇹', 'HT'), ('Escocia 🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'GB-SCT'),
-- Grupo D
('EE. UU. 🇺🇸', 'US'), ('Paraguay 🇵🇾', 'PY'), ('Australia 🇦🇺', 'AU'), ('Turquía 🇹🇷', 'TR'),
-- Grupo E
('Alemania 🇩🇪', 'DE'), ('Curazao 🇨🇼', 'CW'), ('Costa de Marfil 🇨🇮', 'CI'), ('Ecuador 🇪🇨', 'EC'),
-- Grupo F
('Países Bajos 🇳🇱', 'NL'), ('Japón 🇯🇵', 'JP'), ('Suecia 🇸🇪', 'SE'), ('Túnez 🇹🇳', 'TN'),
-- Grupo G
('Bélgica 🇧🇪', 'BE'), ('Egipto 🇪🇬', 'EG'), ('Irán 🇮🇷', 'IR'), ('Nueva Zelanda 🇳🇿', 'NZ'),
-- Grupo H
('España 🇪🇸', 'ES'), ('Cabo Verde 🇨🇻', 'CV'), ('Arabia Saudita 🇸🇦', 'SA'), ('Uruguay 🇺🇾', 'UY'),
-- Grupo I
('Francia 🇫🇷', 'FR'), ('Senegal 🇸🇳', 'SN'), ('Irak 🇮🇶', 'IQ'), ('Noruega 🇳🇴', 'NO'),
-- Grupo J
('Argentina 🇦🇷', 'AR'), ('Argelia 🇩🇿', 'DZ'), ('Austria 🇦🇹', 'AT'), ('Jordania 🇯🇴', 'JO'),
-- Grupo K
('Portugal 🇵🇹', 'PT'), ('R.D. Congo 🇨🇩', 'CD'), ('Uzbekistán 🇺🇿', 'UZ'), ('Colombia 🇨🇴', 'CO'),
-- Grupo L
('Inglaterra 🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'GB-ENG'), ('Croacia 🇭🇷', 'HR'), ('Ghana 🇬🇭', 'GH'), ('Panamá 🇵🇦', 'PA');

-- 4. Insertamos los 72 partidos de la Fase de Grupos
DO $$
BEGIN
    -- GRUPO A
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name LIKE 'México%'), (SELECT id FROM teams WHERE name LIKE 'Sudáfrica%'), 'A', 'group', '2026-06-11 18:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Corea del Sur%'), (SELECT id FROM teams WHERE name LIKE 'Chequia%'), 'A', 'group', '2026-06-12 21:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'México%'), (SELECT id FROM teams WHERE name LIKE 'Corea del Sur%'), 'A', 'group', '2026-06-16 18:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Chequia%'), (SELECT id FROM teams WHERE name LIKE 'Sudáfrica%'), 'A', 'group', '2026-06-17 21:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'México%'), (SELECT id FROM teams WHERE name LIKE 'Chequia%'), 'A', 'group', '2026-06-24 18:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Sudáfrica%'), (SELECT id FROM teams WHERE name LIKE 'Corea del Sur%'), 'A', 'group', '2026-06-24 21:00:00+00');

    -- GRUPO B
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name LIKE 'Canadá%'), (SELECT id FROM teams WHERE name LIKE 'Bosnia%'), 'B', 'group', '2026-06-12 18:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Suiza%'), (SELECT id FROM teams WHERE name LIKE 'Qatar%'), 'B', 'group', '2026-06-13 21:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Canadá%'), (SELECT id FROM teams WHERE name LIKE 'Suiza%'), 'B', 'group', '2026-06-18 18:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Bosnia%'), (SELECT id FROM teams WHERE name LIKE 'Qatar%'), 'B', 'group', '2026-06-18 21:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Canadá%'), (SELECT id FROM teams WHERE name LIKE 'Qatar%'), 'B', 'group', '2026-06-24 18:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Bosnia%'), (SELECT id FROM teams WHERE name LIKE 'Suiza%'), 'B', 'group', '2026-06-24 21:00:00+00');

    -- GRUPO C
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name LIKE 'Brasil%'), (SELECT id FROM teams WHERE name LIKE 'Marruecos%'), 'C', 'group', '2026-06-13 18:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Escocia%'), (SELECT id FROM teams WHERE name LIKE 'Haití%'), 'C', 'group', '2026-06-14 21:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Brasil%'), (SELECT id FROM teams WHERE name LIKE 'Haití%'), 'C', 'group', '2026-06-19 18:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Marruecos%'), (SELECT id FROM teams WHERE name LIKE 'Escocia%'), 'C', 'group', '2026-06-19 21:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Brasil%'), (SELECT id FROM teams WHERE name LIKE 'Escocia%'), 'C', 'group', '2026-06-24 18:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Haití%'), (SELECT id FROM teams WHERE name LIKE 'Marruecos%'), 'C', 'group', '2026-06-24 21:00:00+00');

    -- GRUPO D
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name LIKE 'EE. UU.%'), (SELECT id FROM teams WHERE name LIKE 'Australia%'), 'D', 'group', '2026-06-12 20:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Paraguay%'), (SELECT id FROM teams WHERE name LIKE 'Turquía%'), 'D', 'group', '2026-06-13 15:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'EE. UU.%'), (SELECT id FROM teams WHERE name LIKE 'Turquía%'), 'D', 'group', '2026-06-19 20:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Australia%'), (SELECT id FROM teams WHERE name LIKE 'Paraguay%'), 'D', 'group', '2026-06-20 15:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'EE. UU.%'), (SELECT id FROM teams WHERE name LIKE 'Paraguay%'), 'D', 'group', '2026-06-25 20:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Turquía%'), (SELECT id FROM teams WHERE name LIKE 'Australia%'), 'D', 'group', '2026-06-25 15:00:00+00');

    -- GRUPO E
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name LIKE 'Alemania%'), (SELECT id FROM teams WHERE name LIKE 'Curazao%'), 'E', 'group', '2026-06-14 18:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Ecuador%'), (SELECT id FROM teams WHERE name LIKE 'Costa de Marfil%'), 'E', 'group', '2026-06-15 21:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Alemania%'), (SELECT id FROM teams WHERE name LIKE 'Costa de Marfil%'), 'E', 'group', '2026-06-20 18:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Curazao%'), (SELECT id FROM teams WHERE name LIKE 'Ecuador%'), 'E', 'group', '2026-06-21 21:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Alemania%'), (SELECT id FROM teams WHERE name LIKE 'Ecuador%'), 'E', 'group', '2026-06-25 18:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Costa de Marfil%'), (SELECT id FROM teams WHERE name LIKE 'Curazao%'), 'E', 'group', '2026-06-25 21:00:00+00');

    -- GRUPO F
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name LIKE 'Países Bajos%'), (SELECT id FROM teams WHERE name LIKE 'Japón%'), 'F', 'group', '2026-06-14 15:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Túnez%'), (SELECT id FROM teams WHERE name LIKE 'Suecia%'), 'F', 'group', '2026-06-15 18:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Países Bajos%'), (SELECT id FROM teams WHERE name LIKE 'Suecia%'), 'F', 'group', '2026-06-20 15:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Japón%'), (SELECT id FROM teams WHERE name LIKE 'Túnez%'), 'F', 'group', '2026-06-21 18:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Países Bajos%'), (SELECT id FROM teams WHERE name LIKE 'Túnez%'), 'F', 'group', '2026-06-25 15:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Suecia%'), (SELECT id FROM teams WHERE name LIKE 'Japón%'), 'F', 'group', '2026-06-25 18:00:00+00');

    -- GRUPO G
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name LIKE 'Bélgica%'), (SELECT id FROM teams WHERE name LIKE 'Irán%'), 'G', 'group', '2026-06-15 15:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Egipto%'), (SELECT id FROM teams WHERE name LIKE 'Nueva Zelanda%'), 'G', 'group', '2026-06-16 18:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Bélgica%'), (SELECT id FROM teams WHERE name LIKE 'Nueva Zelanda%'), 'G', 'group', '2026-06-21 15:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Irán%'), (SELECT id FROM teams WHERE name LIKE 'Egipto%'), 'G', 'group', '2026-06-22 18:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Bélgica%'), (SELECT id FROM teams WHERE name LIKE 'Egipto%'), 'G', 'group', '2026-06-26 15:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Nueva Zelanda%'), (SELECT id FROM teams WHERE name LIKE 'Irán%'), 'G', 'group', '2026-06-26 18:00:00+00');

    -- GRUPO H
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name LIKE 'España%'), (SELECT id FROM teams WHERE name LIKE 'Cabo Verde%'), 'H', 'group', '2026-06-16 15:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Arabia Saudita%'), (SELECT id FROM teams WHERE name LIKE 'Uruguay%'), 'H', 'group', '2026-06-15 18:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'España%'), (SELECT id FROM teams WHERE name LIKE 'Arabia Saudita%'), 'H', 'group', '2026-06-22 15:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Uruguay%'), (SELECT id FROM teams WHERE name LIKE 'Cabo Verde%'), 'H', 'group', '2026-06-21 18:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'España%'), (SELECT id FROM teams WHERE name LIKE 'Uruguay%'), 'H', 'group', '2026-06-26 15:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Cabo Verde%'), (SELECT id FROM teams WHERE name LIKE 'Arabia Saudita%'), 'H', 'group', '2026-06-26 18:00:00+00');

    -- GRUPO I
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name LIKE 'Francia%'), (SELECT id FROM teams WHERE name LIKE 'Irak%'), 'I', 'group', '2026-06-16 18:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Senegal%'), (SELECT id FROM teams WHERE name LIKE 'Noruega%'), 'I', 'group', '2026-06-17 21:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Francia%'), (SELECT id FROM teams WHERE name LIKE 'Noruega%'), 'I', 'group', '2026-06-22 18:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Irak%'), (SELECT id FROM teams WHERE name LIKE 'Senegal%'), 'I', 'group', '2026-06-22 21:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Francia%'), (SELECT id FROM teams WHERE name LIKE 'Senegal%'), 'I', 'group', '2026-06-26 18:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Noruega%'), (SELECT id FROM teams WHERE name LIKE 'Irak%'), 'I', 'group', '2026-06-26 21:00:00+00');

    -- GRUPO J
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name LIKE 'Argentina%'), (SELECT id FROM teams WHERE name LIKE 'Argelia%'), 'J', 'group', '2026-06-16 21:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Austria%'), (SELECT id FROM teams WHERE name LIKE 'Jordania%'), 'J', 'group', '2026-06-17 18:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Argentina%'), (SELECT id FROM teams WHERE name LIKE 'Austria%'), 'J', 'group', '2026-06-22 21:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Argelia%'), (SELECT id FROM teams WHERE name LIKE 'Jordania%'), 'J', 'group', '2026-06-23 18:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Argentina%'), (SELECT id FROM teams WHERE name LIKE 'Jordania%'), 'J', 'group', '2026-06-27 21:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Austria%'), (SELECT id FROM teams WHERE name LIKE 'Argelia%'), 'J', 'group', '2026-06-27 18:00:00+00');

    -- GRUPO K
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name LIKE 'Portugal%'), (SELECT id FROM teams WHERE name LIKE 'R.D. Congo%'), 'K', 'group', '2026-06-17 15:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Uzbekistán%'), (SELECT id FROM teams WHERE name LIKE 'Colombia%'), 'K', 'group', '2026-06-18 18:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Portugal%'), (SELECT id FROM teams WHERE name LIKE 'Uzbekistán%'), 'K', 'group', '2026-06-23 15:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'R.D. Congo%'), (SELECT id FROM teams WHERE name LIKE 'Colombia%'), 'K', 'group', '2026-06-23 18:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Portugal%'), (SELECT id FROM teams WHERE name LIKE 'Colombia%'), 'K', 'group', '2026-06-27 15:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Uzbekistán%'), (SELECT id FROM teams WHERE name LIKE 'R.D. Congo%'), 'K', 'group', '2026-06-27 18:00:00+00');

    -- GRUPO L
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name LIKE 'Inglaterra%'), (SELECT id FROM teams WHERE name LIKE 'Croacia%'), 'L', 'group', '2026-06-17 18:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Panamá%'), (SELECT id FROM teams WHERE name LIKE 'Ghana%'), 'L', 'group', '2026-06-18 21:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Inglaterra%'), (SELECT id FROM teams WHERE name LIKE 'Ghana%'), 'L', 'group', '2026-06-23 18:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Croacia%'), (SELECT id FROM teams WHERE name LIKE 'Panamá%'), 'L', 'group', '2026-06-23 21:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Inglaterra%'), (SELECT id FROM teams WHERE name LIKE 'Panamá%'), 'L', 'group', '2026-06-27 18:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Ghana%'), (SELECT id FROM teams WHERE name LIKE 'Croacia%'), 'L', 'group', '2026-06-27 21:00:00+00');
END $$;
