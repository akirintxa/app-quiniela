
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
-- Horarios oficiales FIFA (UTC). La app los muestra en America/Caracas (UTC-4).
DO $$
BEGIN
    -- GRUPO A
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name LIKE 'México%'), (SELECT id FROM teams WHERE name LIKE 'Sudáfrica%'), 'A', 'group', '2026-06-11 19:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Corea del Sur%'), (SELECT id FROM teams WHERE name LIKE 'Chequia%'), 'A', 'group', '2026-06-12 02:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'México%'), (SELECT id FROM teams WHERE name LIKE 'Corea del Sur%'), 'A', 'group', '2026-06-19 01:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Chequia%'), (SELECT id FROM teams WHERE name LIKE 'Sudáfrica%'), 'A', 'group', '2026-06-18 16:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'México%'), (SELECT id FROM teams WHERE name LIKE 'Chequia%'), 'A', 'group', '2026-06-25 01:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Sudáfrica%'), (SELECT id FROM teams WHERE name LIKE 'Corea del Sur%'), 'A', 'group', '2026-06-25 01:00:00+00');

    -- GRUPO B
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name LIKE 'Canadá%'), (SELECT id FROM teams WHERE name LIKE 'Bosnia%'), 'B', 'group', '2026-06-12 19:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Suiza%'), (SELECT id FROM teams WHERE name LIKE 'Qatar%'), 'B', 'group', '2026-06-13 19:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Canadá%'), (SELECT id FROM teams WHERE name LIKE 'Suiza%'), 'B', 'group', '2026-06-24 19:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Bosnia%'), (SELECT id FROM teams WHERE name LIKE 'Qatar%'), 'B', 'group', '2026-06-24 19:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Canadá%'), (SELECT id FROM teams WHERE name LIKE 'Qatar%'), 'B', 'group', '2026-06-18 22:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Bosnia%'), (SELECT id FROM teams WHERE name LIKE 'Suiza%'), 'B', 'group', '2026-06-18 19:00:00+00');

    -- GRUPO C
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name LIKE 'Brasil%'), (SELECT id FROM teams WHERE name LIKE 'Marruecos%'), 'C', 'group', '2026-06-13 22:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Escocia%'), (SELECT id FROM teams WHERE name LIKE 'Haití%'), 'C', 'group', '2026-06-14 01:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Brasil%'), (SELECT id FROM teams WHERE name LIKE 'Haití%'), 'C', 'group', '2026-06-20 00:30:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Marruecos%'), (SELECT id FROM teams WHERE name LIKE 'Escocia%'), 'C', 'group', '2026-06-19 22:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Brasil%'), (SELECT id FROM teams WHERE name LIKE 'Escocia%'), 'C', 'group', '2026-06-24 22:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Haití%'), (SELECT id FROM teams WHERE name LIKE 'Marruecos%'), 'C', 'group', '2026-06-24 22:00:00+00');

    -- GRUPO D
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name LIKE 'EE. UU.%'), (SELECT id FROM teams WHERE name LIKE 'Australia%'), 'D', 'group', '2026-06-19 19:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Paraguay%'), (SELECT id FROM teams WHERE name LIKE 'Turquía%'), 'D', 'group', '2026-06-20 03:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'EE. UU.%'), (SELECT id FROM teams WHERE name LIKE 'Turquía%'), 'D', 'group', '2026-06-26 02:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Australia%'), (SELECT id FROM teams WHERE name LIKE 'Paraguay%'), 'D', 'group', '2026-06-26 02:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'EE. UU.%'), (SELECT id FROM teams WHERE name LIKE 'Paraguay%'), 'D', 'group', '2026-06-13 01:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Turquía%'), (SELECT id FROM teams WHERE name LIKE 'Australia%'), 'D', 'group', '2026-06-14 04:00:00+00');

    -- GRUPO E
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name LIKE 'Alemania%'), (SELECT id FROM teams WHERE name LIKE 'Curazao%'), 'E', 'group', '2026-06-14 17:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Ecuador%'), (SELECT id FROM teams WHERE name LIKE 'Costa de Marfil%'), 'E', 'group', '2026-06-14 23:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Alemania%'), (SELECT id FROM teams WHERE name LIKE 'Costa de Marfil%'), 'E', 'group', '2026-06-20 20:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Curazao%'), (SELECT id FROM teams WHERE name LIKE 'Ecuador%'), 'E', 'group', '2026-06-21 03:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Alemania%'), (SELECT id FROM teams WHERE name LIKE 'Ecuador%'), 'E', 'group', '2026-06-25 20:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Costa de Marfil%'), (SELECT id FROM teams WHERE name LIKE 'Curazao%'), 'E', 'group', '2026-06-25 20:00:00+00');

    -- GRUPO F
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name LIKE 'Países Bajos%'), (SELECT id FROM teams WHERE name LIKE 'Japón%'), 'F', 'group', '2026-06-14 20:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Túnez%'), (SELECT id FROM teams WHERE name LIKE 'Suecia%'), 'F', 'group', '2026-06-15 02:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Países Bajos%'), (SELECT id FROM teams WHERE name LIKE 'Suecia%'), 'F', 'group', '2026-06-20 17:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Japón%'), (SELECT id FROM teams WHERE name LIKE 'Túnez%'), 'F', 'group', '2026-06-21 04:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Países Bajos%'), (SELECT id FROM teams WHERE name LIKE 'Túnez%'), 'F', 'group', '2026-06-25 23:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Suecia%'), (SELECT id FROM teams WHERE name LIKE 'Japón%'), 'F', 'group', '2026-06-25 23:00:00+00');

    -- GRUPO G
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name LIKE 'Bélgica%'), (SELECT id FROM teams WHERE name LIKE 'Irán%'), 'G', 'group', '2026-06-21 19:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Egipto%'), (SELECT id FROM teams WHERE name LIKE 'Nueva Zelanda%'), 'G', 'group', '2026-06-22 01:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Bélgica%'), (SELECT id FROM teams WHERE name LIKE 'Nueva Zelanda%'), 'G', 'group', '2026-06-27 03:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Irán%'), (SELECT id FROM teams WHERE name LIKE 'Egipto%'), 'G', 'group', '2026-06-27 03:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Bélgica%'), (SELECT id FROM teams WHERE name LIKE 'Egipto%'), 'G', 'group', '2026-06-15 19:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Nueva Zelanda%'), (SELECT id FROM teams WHERE name LIKE 'Irán%'), 'G', 'group', '2026-06-16 01:00:00+00');

    -- GRUPO H
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name LIKE 'España%'), (SELECT id FROM teams WHERE name LIKE 'Cabo Verde%'), 'H', 'group', '2026-06-15 16:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Arabia Saudita%'), (SELECT id FROM teams WHERE name LIKE 'Uruguay%'), 'H', 'group', '2026-06-15 22:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'España%'), (SELECT id FROM teams WHERE name LIKE 'Arabia Saudita%'), 'H', 'group', '2026-06-21 16:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Uruguay%'), (SELECT id FROM teams WHERE name LIKE 'Cabo Verde%'), 'H', 'group', '2026-06-21 22:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'España%'), (SELECT id FROM teams WHERE name LIKE 'Uruguay%'), 'H', 'group', '2026-06-27 00:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Cabo Verde%'), (SELECT id FROM teams WHERE name LIKE 'Arabia Saudita%'), 'H', 'group', '2026-06-27 00:00:00+00');

    -- GRUPO I
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name LIKE 'Francia%'), (SELECT id FROM teams WHERE name LIKE 'Irak%'), 'I', 'group', '2026-06-22 21:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Senegal%'), (SELECT id FROM teams WHERE name LIKE 'Noruega%'), 'I', 'group', '2026-06-23 00:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Francia%'), (SELECT id FROM teams WHERE name LIKE 'Noruega%'), 'I', 'group', '2026-06-26 19:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Irak%'), (SELECT id FROM teams WHERE name LIKE 'Senegal%'), 'I', 'group', '2026-06-26 19:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Francia%'), (SELECT id FROM teams WHERE name LIKE 'Senegal%'), 'I', 'group', '2026-06-16 19:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Noruega%'), (SELECT id FROM teams WHERE name LIKE 'Irak%'), 'I', 'group', '2026-06-16 22:00:00+00');

    -- GRUPO J
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name LIKE 'Argentina%'), (SELECT id FROM teams WHERE name LIKE 'Argelia%'), 'J', 'group', '2026-06-17 01:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Austria%'), (SELECT id FROM teams WHERE name LIKE 'Jordania%'), 'J', 'group', '2026-06-17 04:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Argentina%'), (SELECT id FROM teams WHERE name LIKE 'Austria%'), 'J', 'group', '2026-06-22 17:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Argelia%'), (SELECT id FROM teams WHERE name LIKE 'Jordania%'), 'J', 'group', '2026-06-23 03:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Argentina%'), (SELECT id FROM teams WHERE name LIKE 'Jordania%'), 'J', 'group', '2026-06-28 02:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Austria%'), (SELECT id FROM teams WHERE name LIKE 'Argelia%'), 'J', 'group', '2026-06-28 02:00:00+00');

    -- GRUPO K
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name LIKE 'Portugal%'), (SELECT id FROM teams WHERE name LIKE 'R.D. Congo%'), 'K', 'group', '2026-06-17 17:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Uzbekistán%'), (SELECT id FROM teams WHERE name LIKE 'Colombia%'), 'K', 'group', '2026-06-18 02:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Portugal%'), (SELECT id FROM teams WHERE name LIKE 'Uzbekistán%'), 'K', 'group', '2026-06-23 17:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'R.D. Congo%'), (SELECT id FROM teams WHERE name LIKE 'Colombia%'), 'K', 'group', '2026-06-24 02:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Portugal%'), (SELECT id FROM teams WHERE name LIKE 'Colombia%'), 'K', 'group', '2026-06-27 23:30:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Uzbekistán%'), (SELECT id FROM teams WHERE name LIKE 'R.D. Congo%'), 'K', 'group', '2026-06-27 23:30:00+00');

    -- GRUPO L
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name LIKE 'Inglaterra%'), (SELECT id FROM teams WHERE name LIKE 'Croacia%'), 'L', 'group', '2026-06-17 20:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Panamá%'), (SELECT id FROM teams WHERE name LIKE 'Ghana%'), 'L', 'group', '2026-06-17 23:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Inglaterra%'), (SELECT id FROM teams WHERE name LIKE 'Ghana%'), 'L', 'group', '2026-06-23 20:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Croacia%'), (SELECT id FROM teams WHERE name LIKE 'Panamá%'), 'L', 'group', '2026-06-24 23:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Inglaterra%'), (SELECT id FROM teams WHERE name LIKE 'Panamá%'), 'L', 'group', '2026-06-27 21:00:00+00'),
    ((SELECT id FROM teams WHERE name LIKE 'Ghana%'), (SELECT id FROM teams WHERE name LIKE 'Croacia%'), 'L', 'group', '2026-06-27 21:00:00+00');
END $$;
