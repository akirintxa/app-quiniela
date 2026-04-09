
-- 1. Ampliamos la columna iso_code para soportar códigos más largos (como GB-ENG)
ALTER TABLE teams ALTER COLUMN iso_code TYPE VARCHAR(10);

-- 2. Limpiamos datos antiguos para empezar de cero
TRUNCATE TABLE predictions CASCADE;
TRUNCATE TABLE matches CASCADE;
TRUNCATE TABLE teams CASCADE;

-- 3. Insertamos los 48 equipos oficiales del Mundial 2026 (según datos de Abril 2026)
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

-- 4. Insertamos los equipos "comodín" para las eliminatorias (Ronda de 32 en adelante)
INSERT INTO teams (name, iso_code) VALUES
('1º Grupo A', '1A'), ('2º Grupo A', '2A'), ('1º Grupo B', '1B'), ('2º Grupo B', '2B'),
('1º Grupo C', '1C'), ('2º Grupo C', '2C'), ('1º Grupo D', '1D'), ('2º Grupo D', '2D'),
('1º Grupo E', '1E'), ('2º Grupo E', '2E'), ('1º Grupo F', '1F'), ('2º Grupo F', '2F'),
('1º Grupo G', '1G'), ('2º Grupo G', '2G'), ('1º Grupo H', '1H'), ('2º Grupo H', '2H'),
('1º Grupo I', '1I'), ('2º Grupo I', '2I'), ('1º Grupo J', '1J'), ('2º Grupo J', '2J'),
('1º Grupo K', '1K'), ('2º Grupo K', '2K'), ('1º Grupo L', '1L'), ('2º Grupo L', '2L'),
('Mejor 3º (1)', '3X1'), ('Mejor 3º (2)', '3X2'), ('Mejor 3º (3)', '3X3'), ('Mejor 3º (4)', '3X4'),
('Mejor 3º (5)', '3X5'), ('Mejor 3º (6)', '3X6'), ('Mejor 3º (7)', '3X7'), ('Mejor 3º (8)', '3X8');

-- 5. Insertamos los 104 partidos del Mundial 2026 con los grupos oficiales
DO $$
BEGIN
    -- GRUPO A
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE iso_code = 'MX'), (SELECT id FROM teams WHERE iso_code = 'ZA'), 'A', 'group', '2026-06-11 18:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'KR'), (SELECT id FROM teams WHERE iso_code = 'CZ'), 'A', 'group', '2026-06-12 21:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'MX'), (SELECT id FROM teams WHERE iso_code = 'KR'), 'A', 'group', '2026-06-16 18:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'CZ'), (SELECT id FROM teams WHERE iso_code = 'ZA'), 'A', 'group', '2026-06-17 21:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'MX'), (SELECT id FROM teams WHERE iso_code = 'CZ'), 'A', 'group', '2026-06-24 18:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'ZA'), (SELECT id FROM teams WHERE iso_code = 'KR'), 'A', 'group', '2026-06-24 21:00:00+00');

    -- GRUPO B
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE iso_code = 'CA'), (SELECT id FROM teams WHERE iso_code = 'BA'), 'B', 'group', '2026-06-12 18:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'CH'), (SELECT id FROM teams WHERE iso_code = 'QA'), 'B', 'group', '2026-06-13 21:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'CA'), (SELECT id FROM teams WHERE iso_code = 'CH'), 'B', 'group', '2026-06-18 18:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'BA'), (SELECT id FROM teams WHERE iso_code = 'QA'), 'B', 'group', '2026-06-18 21:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'CA'), (SELECT id FROM teams WHERE iso_code = 'QA'), 'B', 'group', '2026-06-24 18:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'BA'), (SELECT id FROM teams WHERE iso_code = 'CH'), 'B', 'group', '2026-06-24 21:00:00+00');

    -- GRUPO C
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE iso_code = 'BR'), (SELECT id FROM teams WHERE iso_code = 'MA'), 'C', 'group', '2026-06-13 18:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'GB-SCT'), (SELECT id FROM teams WHERE iso_code = 'HT'), 'C', 'group', '2026-06-14 21:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'BR'), (SELECT id FROM teams WHERE iso_code = 'HT'), 'C', 'group', '2026-06-19 18:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'MA'), (SELECT id FROM teams WHERE iso_code = 'GB-SCT'), 'C', 'group', '2026-06-19 21:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'BR'), (SELECT id FROM teams WHERE iso_code = 'GB-SCT'), 'C', 'group', '2026-06-24 18:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'HT'), (SELECT id FROM teams WHERE iso_code = 'MA'), 'C', 'group', '2026-06-24 21:00:00+00');

    -- GRUPO D
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE iso_code = 'US'), (SELECT id FROM teams WHERE iso_code = 'AU'), 'D', 'group', '2026-06-12 20:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'PY'), (SELECT id FROM teams WHERE iso_code = 'TR'), 'D', 'group', '2026-06-13 15:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'US'), (SELECT id FROM teams WHERE iso_code = 'TR'), 'D', 'group', '2026-06-19 20:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'AU'), (SELECT id FROM teams WHERE iso_code = 'PY'), 'D', 'group', '2026-06-20 15:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'US'), (SELECT id FROM teams WHERE iso_code = 'PY'), 'D', 'group', '2026-06-25 20:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'TR'), (SELECT id FROM teams WHERE iso_code = 'AU'), 'D', 'group', '2026-06-25 15:00:00+00');

    -- GRUPO E
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE iso_code = 'DE'), (SELECT id FROM teams WHERE iso_code = 'CW'), 'E', 'group', '2026-06-14 18:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'EC'), (SELECT id FROM teams WHERE iso_code = 'CI'), 'E', 'group', '2026-06-15 21:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'DE'), (SELECT id FROM teams WHERE iso_code = 'CI'), 'E', 'group', '2026-06-20 18:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'CW'), (SELECT id FROM teams WHERE iso_code = 'EC'), 'E', 'group', '2026-06-21 21:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'DE'), (SELECT id FROM teams WHERE iso_code = 'EC'), 'E', 'group', '2026-06-25 18:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'CI'), (SELECT id FROM teams WHERE iso_code = 'CW'), 'E', 'group', '2026-06-25 21:00:00+00');

    -- GRUPO F
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE iso_code = 'NL'), (SELECT id FROM teams WHERE iso_code = 'JP'), 'F', 'group', '2026-06-14 15:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'TN'), (SELECT id FROM teams WHERE iso_code = 'SE'), 'F', 'group', '2026-06-15 18:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'NL'), (SELECT id FROM teams WHERE iso_code = 'SE'), 'F', 'group', '2026-06-20 15:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'JP'), (SELECT id FROM teams WHERE iso_code = 'TN'), 'F', 'group', '2026-06-21 18:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'NL'), (SELECT id FROM teams WHERE iso_code = 'TN'), 'F', 'group', '2026-06-25 15:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'SE'), (SELECT id FROM teams WHERE iso_code = 'JP'), 'F', 'group', '2026-06-25 18:00:00+00');

    -- GRUPO G
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE iso_code = 'BE'), (SELECT id FROM teams WHERE iso_code = 'IR'), 'G', 'group', '2026-06-15 15:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'EG'), (SELECT id FROM teams WHERE iso_code = 'NZ'), 'G', 'group', '2026-06-16 18:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'BE'), (SELECT id FROM teams WHERE iso_code = 'NZ'), 'G', 'group', '2026-06-21 15:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'IR'), (SELECT id FROM teams WHERE iso_code = 'EG'), 'G', 'group', '2026-06-22 18:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'BE'), (SELECT id FROM teams WHERE iso_code = 'EG'), 'G', 'group', '2026-06-26 15:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'NZ'), (SELECT id FROM teams WHERE iso_code = 'IR'), 'G', 'group', '2026-06-26 18:00:00+00');

    -- GRUPO H
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE iso_code = 'ES'), (SELECT id FROM teams WHERE iso_code = 'CV'), 'H', 'group', '2026-06-16 15:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'SA'), (SELECT id FROM teams WHERE iso_code = 'UY'), 'H', 'group', '2026-06-15 18:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'ES'), (SELECT id FROM teams WHERE iso_code = 'SA'), 'H', 'group', '2026-06-22 15:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'UY'), (SELECT id FROM teams WHERE iso_code = 'CV'), 'H', 'group', '2026-06-21 18:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'ES'), (SELECT id FROM teams WHERE iso_code = 'UY'), 'H', 'group', '2026-06-26 15:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'CV'), (SELECT id FROM teams WHERE iso_code = 'SA'), 'H', 'group', '2026-06-26 18:00:00+00');

    -- GRUPO I
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE iso_code = 'FR'), (SELECT id FROM teams WHERE iso_code = 'IQ'), 'I', 'group', '2026-06-16 18:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'SN'), (SELECT id FROM teams WHERE iso_code = 'NO'), 'I', 'group', '2026-06-17 21:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'FR'), (SELECT id FROM teams WHERE iso_code = 'NO'), 'I', 'group', '2026-06-22 18:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'IQ'), (SELECT id FROM teams WHERE iso_code = 'SN'), 'I', 'group', '2026-06-22 21:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'FR'), (SELECT id FROM teams WHERE iso_code = 'SN'), 'I', 'group', '2026-06-26 18:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'NO'), (SELECT id FROM teams WHERE iso_code = 'IQ'), 'I', 'group', '2026-06-26 21:00:00+00');

    -- GRUPO J
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE iso_code = 'AR'), (SELECT id FROM teams WHERE iso_code = 'DZ'), 'J', 'group', '2026-06-16 21:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'AT'), (SELECT id FROM teams WHERE iso_code = 'JO'), 'J', 'group', '2026-06-17 18:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'AR'), (SELECT id FROM teams WHERE iso_code = 'AT'), 'J', 'group', '2026-06-22 21:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'DZ'), (SELECT id FROM teams WHERE iso_code = 'JO'), 'J', 'group', '2026-06-23 18:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'AR'), (SELECT id FROM teams WHERE iso_code = 'JO'), 'J', 'group', '2026-06-27 21:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'AT'), (SELECT id FROM teams WHERE iso_code = 'DZ'), 'J', 'group', '2026-06-27 18:00:00+00');

    -- GRUPO K
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE iso_code = 'PT'), (SELECT id FROM teams WHERE iso_code = 'CD'), 'K', 'group', '2026-06-17 15:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'UZ'), (SELECT id FROM teams WHERE iso_code = 'CO'), 'K', 'group', '2026-06-18 18:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'PT'), (SELECT id FROM teams WHERE iso_code = 'UZ'), 'K', 'group', '2026-06-23 15:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'CD'), (SELECT id FROM teams WHERE iso_code = 'CO'), 'K', 'group', '2026-06-23 18:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'PT'), (SELECT id FROM teams WHERE iso_code = 'CO'), 'K', 'group', '2026-06-27 15:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'UZ'), (SELECT id FROM teams WHERE iso_code = 'CD'), 'K', 'group', '2026-06-27 18:00:00+00');

    -- GRUPO L
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE iso_code = 'GB-ENG'), (SELECT id FROM teams WHERE iso_code = 'HR'), 'L', 'group', '2026-06-17 18:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'GH'), (SELECT id FROM teams WHERE iso_code = 'PA'), 'L', 'group', '2026-06-18 21:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'GB-ENG'), (SELECT id FROM teams WHERE iso_code = 'GH'), 'L', 'group', '2026-06-23 18:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'HR'), (SELECT id FROM teams WHERE iso_code = 'PA'), 'L', 'group', '2026-06-23 21:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'GB-ENG'), (SELECT id FROM teams WHERE iso_code = 'PA'), 'L', 'group', '2026-06-27 18:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = 'GH'), (SELECT id FROM teams WHERE iso_code = 'HR'), 'L', 'group', '2026-06-27 21:00:00+00');

    -- RONDA DE 32
    INSERT INTO matches (team_a_id, team_b_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE iso_code = '1A'), (SELECT id FROM teams WHERE iso_code = '3X1'), 'round_32', '2026-06-28 18:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = '1B'), (SELECT id FROM teams WHERE iso_code = '3X2'), 'round_32', '2026-06-28 21:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = '1C'), (SELECT id FROM teams WHERE iso_code = '2D'), 'round_32', '2026-06-29 18:00:00+00'),
    ((SELECT id FROM teams WHERE iso_code = '1D'), (SELECT id FROM teams WHERE iso_code = '2C'), 'round_32', '2026-06-29 21:00:00+00');
END $$;
