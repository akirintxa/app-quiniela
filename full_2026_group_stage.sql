-- 1. Ampliamos la columna iso_code para soportar códigos más largos (como GB-ENG)
ALTER TABLE teams ALTER COLUMN iso_code TYPE VARCHAR(10);

-- 2. Limpiamos datos antiguos para empezar de cero
TRUNCATE TABLE predictions CASCADE;
TRUNCATE TABLE matches CASCADE;
TRUNCATE TABLE teams CASCADE;

-- 3. Insertamos los 48 equipos oficiales del Mundial 2026
INSERT INTO teams (name, iso_code) VALUES
('Mexico', 'MX'), ('South Africa', 'ZA'), ('South Korea', 'KR'), ('UEFA Playoff D Winner', 'U4'),
('Canada', 'CA'), ('UEFA Playoff A Winner', 'U1'), ('Qatar', 'QA'), ('Switzerland', 'CH'),
('Brazil', 'BR'), ('Morocco', 'MA'), ('Haiti', 'HT'), ('Scotland', 'GB-SCT'),
('USA', 'US'), ('Paraguay', 'PY'), ('Australia', 'AU'), ('UEFA Playoff C Winner', 'U3'),
('Germany', 'DE'), ('Curaçao', 'CW'), ('Ivory Coast', 'CI'), ('Ecuador', 'EC'),
('Netherlands', 'NL'), ('Japan', 'JP'), ('UEFA Playoff B Winner', 'U2'), ('Tunisia', 'TN'),
('Belgium', 'BE'), ('Egypt', 'EG'), ('Iran', 'IR'), ('New Zealand', 'NZ'),
('Spain', 'ES'), ('Cape Verde', 'CV'), ('Saudi Arabia', 'SA'), ('Uruguay', 'UY'),
('France', 'FR'), ('Senegal', 'SN'), ('Intercontinental Playoff 2 Winner', 'P2'), ('Norway', 'NO'),
('Argentina', 'AR'), ('Algeria', 'DZ'), ('Austria', 'AT'), ('Jordan', 'JO'),
('Portugal', 'PT'), ('Intercontinental Playoff 1 Winner', 'P1'), ('Uzbekistan', 'UZ'), ('Colombia', 'CO'),
('England', 'GB-ENG'), ('Croatia', 'HR'), ('Ghana', 'GH'), ('Panama', 'PA'),
('Nigeria', 'NG'), ('Iraq', 'IQ'), ('Mali', 'ML'), ('Denmark', 'DK'), ('Costa Rica', 'CR');

-- 4. Insertamos los 72 partidos de la Fase de Grupos
DO $$
BEGIN
    -- GROUP A
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name = 'Mexico'), (SELECT id FROM teams WHERE name = 'South Africa'), 'A', 'group', '2026-06-11 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'South Korea'), (SELECT id FROM teams WHERE name = 'UEFA Playoff D Winner'), 'A', 'group', '2026-06-12 21:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Mexico'), (SELECT id FROM teams WHERE name = 'South Korea'), 'A', 'group', '2026-06-16 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'UEFA Playoff D Winner'), (SELECT id FROM teams WHERE name = 'South Africa'), 'A', 'group', '2026-06-17 21:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Mexico'), (SELECT id FROM teams WHERE name = 'UEFA Playoff D Winner'), 'A', 'group', '2026-06-24 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'South Africa'), (SELECT id FROM teams WHERE name = 'South Korea'), 'A', 'group', '2026-06-24 21:00:00+00');

    -- GROUP B
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name = 'Canada'), (SELECT id FROM teams WHERE name = 'UEFA Playoff A Winner'), 'B', 'group', '2026-06-12 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Switzerland'), (SELECT id FROM teams WHERE name = 'Qatar'), 'B', 'group', '2026-06-13 21:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Canada'), (SELECT id FROM teams WHERE name = 'Switzerland'), 'B', 'group', '2026-06-18 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'UEFA Playoff A Winner'), (SELECT id FROM teams WHERE name = 'Qatar'), 'B', 'group', '2026-06-18 21:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Canada'), (SELECT id FROM teams WHERE name = 'Qatar'), 'B', 'group', '2026-06-24 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'UEFA Playoff A Winner'), (SELECT id FROM teams WHERE name = 'Switzerland'), 'B', 'group', '2026-06-24 21:00:00+00');

    -- GROUP C
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name = 'Brazil'), (SELECT id FROM teams WHERE name = 'Morocco'), 'C', 'group', '2026-06-13 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Scotland'), (SELECT id FROM teams WHERE name = 'Haiti'), 'C', 'group', '2026-06-14 21:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Brazil'), (SELECT id FROM teams WHERE name = 'Haiti'), 'C', 'group', '2026-06-19 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Morocco'), (SELECT id FROM teams WHERE name = 'Scotland'), 'C', 'group', '2026-06-19 21:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Brazil'), (SELECT id FROM teams WHERE name = 'Scotland'), 'C', 'group', '2026-06-24 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Haiti'), (SELECT id FROM teams WHERE name = 'Morocco'), 'C', 'group', '2026-06-24 21:00:00+00');

    -- GROUP D
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name = 'USA'), (SELECT id FROM teams WHERE name = 'Australia'), 'D', 'group', '2026-06-12 20:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Paraguay'), (SELECT id FROM teams WHERE name = 'UEFA Playoff C Winner'), 'D', 'group', '2026-06-13 15:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'USA'), (SELECT id FROM teams WHERE name = 'UEFA Playoff C Winner'), 'D', 'group', '2026-06-19 20:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Australia'), (SELECT id FROM teams WHERE name = 'Paraguay'), 'D', 'group', '2026-06-20 15:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'USA'), (SELECT id FROM teams WHERE name = 'Paraguay'), 'D', 'group', '2026-06-25 20:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'UEFA Playoff C Winner'), (SELECT id FROM teams WHERE name = 'Australia'), 'D', 'group', '2026-06-25 15:00:00+00');

    -- GROUP E
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name = 'Germany'), (SELECT id FROM teams WHERE name = 'Curaçao'), 'E', 'group', '2026-06-14 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Ecuador'), (SELECT id FROM teams WHERE name = 'Ivory Coast'), 'E', 'group', '2026-06-15 21:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Germany'), (SELECT id FROM teams WHERE name = 'Ivory Coast'), 'E', 'group', '2026-06-20 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Curaçao'), (SELECT id FROM teams WHERE name = 'Ecuador'), 'E', 'group', '2026-06-21 21:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Germany'), (SELECT id FROM teams WHERE name = 'Ecuador'), 'E', 'group', '2026-06-25 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Ivory Coast'), (SELECT id FROM teams WHERE name = 'Curaçao'), 'E', 'group', '2026-06-25 21:00:00+00');

    -- GROUP F
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name = 'Netherlands'), (SELECT id FROM teams WHERE name = 'Japan'), 'F', 'group', '2026-06-14 15:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Tunisia'), (SELECT id FROM teams WHERE name = 'UEFA Playoff B Winner'), 'F', 'group', '2026-06-15 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Netherlands'), (SELECT id FROM teams WHERE name = 'UEFA Playoff B Winner'), 'F', 'group', '2026-06-20 15:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Japan'), (SELECT id FROM teams WHERE name = 'Tunisia'), 'F', 'group', '2026-06-21 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Netherlands'), (SELECT id FROM teams WHERE name = 'Tunisia'), 'F', 'group', '2026-06-25 15:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'UEFA Playoff B Winner'), (SELECT id FROM teams WHERE name = 'Japan'), 'F', 'group', '2026-06-25 18:00:00+00');

    -- GROUP G
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name = 'Belgium'), (SELECT id FROM teams WHERE name = 'Iran'), 'G', 'group', '2026-06-15 15:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Egypt'), (SELECT id FROM teams WHERE name = 'New Zealand'), 'G', 'group', '2026-06-16 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Belgium'), (SELECT id FROM teams WHERE name = 'New Zealand'), 'G', 'group', '2026-06-21 15:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Iran'), (SELECT id FROM teams WHERE name = 'Egypt'), 'G', 'group', '2026-06-22 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Belgium'), (SELECT id FROM teams WHERE name = 'Egypt'), 'G', 'group', '2026-06-26 15:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'New Zealand'), (SELECT id FROM teams WHERE name = 'Iran'), 'G', 'group', '2026-06-26 18:00:00+00');

    -- GROUP H
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name = 'Spain'), (SELECT id FROM teams WHERE name = 'Cape Verde'), 'H', 'group', '2026-06-16 15:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Saudi Arabia'), (SELECT id FROM teams WHERE name = 'Uruguay'), 'H', 'group', '2026-06-15 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Spain'), (SELECT id FROM teams WHERE name = 'Saudi Arabia'), 'H', 'group', '2026-06-22 15:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Uruguay'), (SELECT id FROM teams WHERE name = 'Cape Verde'), 'H', 'group', '2026-06-21 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Spain'), (SELECT id FROM teams WHERE name = 'Uruguay'), 'H', 'group', '2026-06-26 15:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Cape Verde'), (SELECT id FROM teams WHERE name = 'Saudi Arabia'), 'H', 'group', '2026-06-26 18:00:00+00');

    -- GROUP I
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name = 'France'), (SELECT id FROM teams WHERE name = 'Intercontinental Playoff 2 Winner'), 'I', 'group', '2026-06-16 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Nigeria'), (SELECT id FROM teams WHERE name = 'Iraq'), 'I', 'group', '2026-06-17 21:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'France'), (SELECT id FROM teams WHERE name = 'Iraq'), 'I', 'group', '2026-06-22 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Intercontinental Playoff 2 Winner'), (SELECT id FROM teams WHERE name = 'Nigeria'), 'I', 'group', '2026-06-22 21:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'France'), (SELECT id FROM teams WHERE name = 'Nigeria'), 'I', 'group', '2026-06-26 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Iraq'), (SELECT id FROM teams WHERE name = 'Intercontinental Playoff 2 Winner'), 'I', 'group', '2026-06-26 21:00:00+00');

    -- GROUP J
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name = 'Argentina'), (SELECT id FROM teams WHERE name = 'Mali'), 'J', 'group', '2026-06-16 21:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Denmark'), (SELECT id FROM teams WHERE name = 'Costa Rica'), 'J', 'group', '2026-06-17 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Argentina'), (SELECT id FROM teams WHERE name = 'Costa Rica'), 'J', 'group', '2026-06-22 21:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Mali'), (SELECT id FROM teams WHERE name = 'Denmark'), 'J', 'group', '2026-06-23 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Argentina'), (SELECT id FROM teams WHERE name = 'Denmark'), 'J', 'group', '2026-06-27 21:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Costa Rica'), (SELECT id FROM teams WHERE name = 'Mali'), 'J', 'group', '2026-06-27 18:00:00+00');

    -- GROUP K
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name = 'Portugal'), (SELECT id FROM teams WHERE name = 'Intercontinental Playoff 1 Winner'), 'K', 'group', '2026-06-17 15:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Colombia'), (SELECT id FROM teams WHERE name = 'Uzbekistan'), 'K', 'group', '2026-06-18 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Portugal'), (SELECT id FROM teams WHERE name = 'Uzbekistan'), 'K', 'group', '2026-06-23 15:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Intercontinental Playoff 1 Winner'), (SELECT id FROM teams WHERE name = 'Colombia'), 'K', 'group', '2026-06-23 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Portugal'), (SELECT id FROM teams WHERE name = 'Colombia'), 'K', 'group', '2026-06-27 15:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Uzbekistan'), (SELECT id FROM teams WHERE name = 'Intercontinental Playoff 1 Winner'), 'K', 'group', '2026-06-27 18:00:00+00');

    -- GROUP L
    INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
    ((SELECT id FROM teams WHERE name = 'England'), (SELECT id FROM teams WHERE name = 'Croatia'), 'L', 'group', '2026-06-17 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Panama'), (SELECT id FROM teams WHERE name = 'Ghana'), 'L', 'group', '2026-06-18 21:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'England'), (SELECT id FROM teams WHERE name = 'Ghana'), 'L', 'group', '2026-06-23 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Croatia'), (SELECT id FROM teams WHERE name = 'Panama'), 'L', 'group', '2026-06-23 21:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'England'), (SELECT id FROM teams WHERE name = 'Panama'), 'L', 'group', '2026-06-27 18:00:00+00'),
    ((SELECT id FROM teams WHERE name = 'Ghana'), (SELECT id FROM teams WHERE name = 'Croatia'), 'L', 'group', '2026-06-27 21:00:00+00');
END $$;
