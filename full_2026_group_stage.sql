-- 1. Ampliamos la columna iso_code para soportar códigos más largos (como GB-ENG)
ALTER TABLE teams ALTER COLUMN iso_code TYPE VARCHAR(10);

-- 2. Limpiamos datos antiguos para empezar de cero
TRUNCATE TABLE predictions CASCADE;
TRUNCATE TABLE matches CASCADE;
TRUNCATE TABLE teams CASCADE;

-- 3. Insertamos los 48 equipos oficiales del Mundial 2026 en ESPAÑOL
INSERT INTO teams (name, iso_code) VALUES
('México', 'MX'), ('Sudáfrica', 'ZA'), ('Corea del Sur', 'KR'), ('Ganador Playoff D UEFA', 'U4'),
('Canadá', 'CA'), ('Ganador Playoff A UEFA', 'U1'), ('Qatar', 'QA'), ('Suiza', 'CH'),
('Brasil', 'BR'), ('Marruecos', 'MA'), ('Haití', 'HT'), ('Escocia', 'GB-SCT'),
('EE. UU.', 'US'), ('Paraguay', 'PY'), ('Australia', 'AU'), ('Ganador Playoff C UEFA', 'U3'),
('Alemania', 'DE'), ('Curazao', 'CW'), ('Costa de Marfil', 'CI'), ('Ecuador', 'EC'),
('Países Bajos', 'NL'), ('Japón', 'JP'), ('Ganador Playoff B UEFA', 'U2'), ('Túnez', 'TN'),
('Bélgica', 'BE'), ('Egipto', 'EG'), ('Irán', 'IR'), ('Nueva Zelanda', 'NZ'),
('España', 'ES'), ('Cabo Verde', 'CV'), ('Arabia Saudita', 'SA'), ('Uruguay', 'UY'),
('Francia', 'FR'), ('Senegal', 'SN'), ('Ganador Playoff Intercontinental 2', 'P2'), ('Noruega', 'NO'),
('Argentina', 'AR'), ('Argelia', 'DZ'), ('Austria', 'AT'), ('Jordania', 'JO'),
('Portugal', 'PT'), ('Ganador Playoff Intercontinental 1', 'P1'), ('Uzbekistán', 'UZ'), ('Colombia', 'CO'),
('Inglaterra', 'GB-ENG'), ('Croacia', 'HR'), ('Ghana', 'GH'), ('Panamá', 'PA'),
('Nigeria', 'NG'), ('Irak', 'IQ'), ('Malí', 'ML'), ('Dinamarca', 'DK'), ('Costa Rica', 'CR');

-- 4. Insertamos los 72 partidos de la Fase de Grupos
DO $$
BEGIN
    -- GROUP A
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name = 'México'), (SELECT id FROM teams WHERE name = 'Sudáfrica'), 'A', 'group', '2026-06-11 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Corea del Sur'), (SELECT id FROM teams WHERE name = 'Ganador Playoff D UEFA'), 'A', 'group', '2026-06-12 21:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'México'), (SELECT id FROM teams WHERE name = 'Corea del Sur'), 'A', 'group', '2026-06-16 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Ganador Playoff D UEFA'), (SELECT id FROM teams WHERE name = 'Sudáfrica'), 'A', 'group', '2026-06-17 21:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'México'), (SELECT id FROM teams WHERE name = 'Ganador Playoff D UEFA'), 'A', 'group', '2026-06-24 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Sudáfrica'), (SELECT id FROM teams WHERE name = 'Corea del Sur'), 'A', 'group', '2026-06-24 21:00:00+00');

    -- GROUP B
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name = 'Canadá'), (SELECT id FROM teams WHERE name = 'Ganador Playoff A UEFA'), 'B', 'group', '2026-06-12 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Suiza'), (SELECT id FROM teams WHERE name = 'Qatar'), 'B', 'group', '2026-06-13 21:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Canadá'), (SELECT id FROM teams WHERE name = 'Suiza'), 'B', 'group', '2026-06-18 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Ganador Playoff A UEFA'), (SELECT id FROM teams WHERE name = 'Qatar'), 'B', 'group', '2026-06-18 21:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Canadá'), (SELECT id FROM teams WHERE name = 'Qatar'), 'B', 'group', '2026-06-24 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Ganador Playoff A UEFA'), (SELECT id FROM teams WHERE name = 'Suiza'), 'B', 'group', '2026-06-24 21:00:00+00');

    -- GROUP C
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name = 'Brasil'), (SELECT id FROM teams WHERE name = 'Marruecos'), 'C', 'group', '2026-06-13 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Escocia'), (SELECT id FROM teams WHERE name = 'Haití'), 'C', 'group', '2026-06-14 21:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Brasil'), (SELECT id FROM teams WHERE name = 'Haití'), 'C', 'group', '2026-06-19 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Marruecos'), (SELECT id FROM teams WHERE name = 'Escocia'), 'C', 'group', '2026-06-19 21:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Brasil'), (SELECT id FROM teams WHERE name = 'Escocia'), 'C', 'group', '2026-06-24 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Haití'), (SELECT id FROM teams WHERE name = 'Marruecos'), 'C', 'group', '2026-06-24 21:00:00+00');

    -- GROUP D
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name = 'EE. UU.'), (SELECT id FROM teams WHERE name = 'Australia'), 'D', 'group', '2026-06-12 20:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Paraguay'), (SELECT id FROM teams WHERE name = 'Ganador Playoff C UEFA'), 'D', 'group', '2026-06-13 15:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'EE. UU.'), (SELECT id FROM teams WHERE name = 'Ganador Playoff C UEFA'), 'D', 'group', '2026-06-19 20:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Australia'), (SELECT id FROM teams WHERE name = 'Paraguay'), 'D', 'group', '2026-06-20 15:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'EE. UU.'), (SELECT id FROM teams WHERE name = 'Paraguay'), 'D', 'group', '2026-06-25 20:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Ganador Playoff C UEFA'), (SELECT id FROM teams WHERE name = 'Australia'), 'D', 'group', '2026-06-25 15:00:00+00');

    -- GROUP E
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name = 'Alemania'), (SELECT id FROM teams WHERE name = 'Curazao'), 'E', 'group', '2026-06-14 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Ecuador'), (SELECT id FROM teams WHERE name = 'Costa de Marfil'), 'E', 'group', '2026-06-15 21:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Alemania'), (SELECT id FROM teams WHERE name = 'Costa de Marfil'), 'E', 'group', '2026-06-20 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Curazao'), (SELECT id FROM teams WHERE name = 'Ecuador'), 'E', 'group', '2026-06-21 21:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Alemania'), (SELECT id FROM teams WHERE name = 'Ecuador'), 'E', 'group', '2026-06-25 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Costa de Marfil'), (SELECT id FROM teams WHERE name = 'Curazao'), 'E', 'group', '2026-06-25 21:00:00+00');

    -- GROUP F
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name = 'Países Bajos'), (SELECT id FROM teams WHERE name = 'Japón'), 'F', 'group', '2026-06-14 15:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Túnez'), (SELECT id FROM teams WHERE name = 'Ganador Playoff B UEFA'), 'F', 'group', '2026-06-15 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Países Bajos'), (SELECT id FROM teams WHERE name = 'Ganador Playoff B UEFA'), 'F', 'group', '2026-06-20 15:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Japón'), (SELECT id FROM teams WHERE name = 'Túnez'), 'F', 'group', '2026-06-21 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Países Bajos'), (SELECT id FROM teams WHERE name = 'Túnez'), 'F', 'group', '2026-06-25 15:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Ganador Playoff B UEFA'), (SELECT id FROM teams WHERE name = 'Japón'), 'F', 'group', '2026-06-25 18:00:00+00');

    -- GROUP G
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name = 'Bélgica'), (SELECT id FROM teams WHERE name = 'Irán'), 'G', 'group', '2026-06-15 15:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Egipto'), (SELECT id FROM teams WHERE name = 'Nueva Zelanda'), 'G', 'group', '2026-06-16 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Bélgica'), (SELECT id FROM teams WHERE name = 'Nueva Zelanda'), 'G', 'group', '2026-06-21 15:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Irán'), (SELECT id FROM teams WHERE name = 'Egipto'), 'G', 'group', '2026-06-22 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Bélgica'), (SELECT id FROM teams WHERE name = 'Egipto'), 'G', 'group', '2026-06-26 15:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Nueva Zelanda'), (SELECT id FROM teams WHERE name = 'Irán'), 'G', 'group', '2026-06-26 18:00:00+00');

    -- GROUP H
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name = 'España'), (SELECT id FROM teams WHERE name = 'Cabo Verde'), 'H', 'group', '2026-06-16 15:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Arabia Saudita'), (SELECT id FROM teams WHERE name = 'Uruguay'), 'H', 'group', '2026-06-15 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'España'), (SELECT id FROM teams WHERE name = 'Arabia Saudita'), 'H', 'group', '2026-06-22 15:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Uruguay'), (SELECT id FROM teams WHERE name = 'Cabo Verde'), 'H', 'group', '2026-06-21 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'España'), (SELECT id FROM teams WHERE name = 'Uruguay'), 'H', 'group', '2026-06-26 15:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Cabo Verde'), (SELECT id FROM teams WHERE name = 'Arabia Saudita'), 'H', 'group', '2026-06-26 18:00:00+00');

    -- GROUP I
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name = 'Francia'), (SELECT id FROM teams WHERE name = 'Ganador Playoff Intercontinental 2'), 'I', 'group', '2026-06-16 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Nigeria'), (SELECT id FROM teams WHERE name = 'Irak'), 'I', 'group', '2026-06-17 21:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Francia'), (SELECT id FROM teams WHERE name = 'Irak'), 'I', 'group', '2026-06-22 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Ganador Playoff Intercontinental 2'), (SELECT id FROM teams WHERE name = 'Nigeria'), 'I', 'group', '2026-06-22 21:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Francia'), (SELECT id FROM teams WHERE name = 'Nigeria'), 'I', 'group', '2026-06-26 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Irak'), (SELECT id FROM teams WHERE name = 'Ganador Playoff Intercontinental 2'), 'I', 'group', '2026-06-26 21:00:00+00');

    -- GROUP J
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name = 'Argentina'), (SELECT id FROM teams WHERE name = 'Malí'), 'J', 'group', '2026-06-16 21:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Dinamarca'), (SELECT id FROM teams WHERE name = 'Costa Rica'), 'J', 'group', '2026-06-17 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Argentina'), (SELECT id FROM teams WHERE name = 'Costa Rica'), 'J', 'group', '2026-06-22 21:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Malí'), (SELECT id FROM teams WHERE name = 'Dinamarca'), 'J', 'group', '2026-06-23 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Argentina'), (SELECT id FROM teams WHERE name = 'Dinamarca'), 'J', 'group', '2026-06-27 21:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Costa Rica'), (SELECT id FROM teams WHERE name = 'Malí'), 'J', 'group', '2026-06-27 18:00:00+00');

    -- GROUP K
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name = 'Portugal'), (SELECT id FROM teams WHERE name = 'Ganador Playoff Intercontinental 1'), 'K', 'group', '2026-06-17 15:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Colombia'), (SELECT id FROM teams WHERE name = 'Uzbekistán'), 'K', 'group', '2026-06-18 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Portugal'), (SELECT id FROM teams WHERE name = 'Uzbekistán'), 'K', 'group', '2026-06-23 15:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Ganador Playoff Intercontinental 1'), (SELECT id FROM teams WHERE name = 'Colombia'), 'K', 'group', '2026-06-23 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Portugal'), (SELECT id FROM teams WHERE name = 'Colombia'), 'K', 'group', '2026-06-27 15:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Uzbekistán'), (SELECT id FROM teams WHERE name = 'Ganador Playoff Intercontinental 1'), 'K', 'group', '2026-06-27 18:00:00+00');

    -- GROUP L
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name = 'Inglaterra'), (SELECT id FROM teams WHERE name = 'Croacia'), 'L', 'group', '2026-06-17 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Panamá'), (SELECT id FROM teams WHERE name = 'Ghana'), 'L', 'group', '2026-06-18 21:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Inglaterra'), (SELECT id FROM teams WHERE name = 'Ghana'), 'L', 'group', '2026-06-23 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Croacia'), (SELECT id FROM teams WHERE name = 'Panamá'), 'L', 'group', '2026-06-23 21:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Inglaterra'), (SELECT id FROM teams WHERE name = 'Panamá'), 'L', 'group', '2026-06-27 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Ghana'), (SELECT id FROM teams WHERE name = 'Croacia'), 'L', 'group', '2026-06-27 21:00:00+00');
END $$;
