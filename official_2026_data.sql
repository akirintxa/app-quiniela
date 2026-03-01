
-- Clean existing data to start fresh
TRUNCATE TABLE predictions CASCADE;
TRUNCATE TABLE matches CASCADE;
TRUNCATE TABLE pool_members CASCADE;
TRUNCATE TABLE pools CASCADE;
TRUNCATE TABLE teams CASCADE;

-- Insert 48 Teams for World Cup 2026
INSERT INTO teams (name, iso_code) VALUES
-- Group A
('Mexico', 'MX'), ('South Africa', 'ZA'), ('South Korea', 'KR'), ('UEFA Playoff D Winner', 'U4'),
-- Group B
('Canada', 'CA'), ('UEFA Playoff A Winner', 'U1'), ('Qatar', 'QA'), ('Switzerland', 'CH'),
-- Group C
('Brazil', 'BR'), ('Morocco', 'MA'), ('Haiti', 'HT'), ('Scotland', 'GB'),
-- Group D
('USA', 'US'), ('Paraguay', 'PY'), ('Australia', 'AU'), ('UEFA Playoff C Winner', 'U3'),
-- Group E
('Germany', 'DE'), ('Curaçao', 'CW'), ('Ivory Coast', 'CI'), ('Ecuador', 'EC'),
-- Group F
('Netherlands', 'NL'), ('Japan', 'JP'), ('UEFA Playoff B Winner', 'U2'), ('Tunisia', 'TN'),
-- Group G
('Belgium', 'BE'), ('Egypt', 'EG'), ('Iran', 'IR'), ('New Zealand', 'NZ'),
-- Group H
('Spain', 'ES'), ('Cape Verde', 'CV'), ('Saudi Arabia', 'SA'), ('Uruguay', 'UY'),
-- Group I
('France', 'FR'), ('Senegal', 'SN'), ('Intercontinental Playoff 2 Winner', 'P2'), ('Norway', 'NO'),
-- Group J
('Argentina', 'AR'), ('Algeria', 'DZ'), ('Austria', 'AT'), ('Jordan', 'JO'),
-- Group K
('Portugal', 'PT'), ('Intercontinental Playoff 1 Winner', 'P1'), ('Uzbekistan', 'UZ'), ('Colombia', 'CO'),
-- Group L
('England', 'GB'), ('Croatia', 'HR'), ('Ghana', 'GH'), ('Panama', 'PA');

-- Insert Matches (Opening Games & Sample Schedule)
-- Group A
INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
((SELECT id FROM teams WHERE iso_code = 'MX'), (SELECT id FROM teams WHERE iso_code = 'ZA'), 'A', 'group', '2026-06-11 18:00:00+00'),
((SELECT id FROM teams WHERE iso_code = 'KR'), (SELECT id FROM teams WHERE iso_code = 'U4'), 'A', 'group', '2026-06-12 21:00:00+00');

-- Group B
INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
((SELECT id FROM teams WHERE iso_code = 'CA'), (SELECT id FROM teams WHERE iso_code = 'U1'), 'B', 'group', '2026-06-12 18:00:00+00'),
((SELECT id FROM teams WHERE iso_code = 'QA'), (SELECT id FROM teams WHERE iso_code = 'CH'), 'B', 'group', '2026-06-13 21:00:00+00');

-- Group C
INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
((SELECT id FROM teams WHERE iso_code = 'BR'), (SELECT id FROM teams WHERE iso_code = 'MA'), 'C', 'group', '2026-06-13 18:00:00+00'),
((SELECT id FROM teams WHERE iso_code = 'HT'), (SELECT id FROM teams WHERE iso_code = 'GB' AND name = 'Scotland'), 'C', 'group', '2026-06-14 21:00:00+00');

-- Group D
INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
((SELECT id FROM teams WHERE iso_code = 'US'), (SELECT id FROM teams WHERE iso_code = 'PY'), 'D', 'group', '2026-06-12 20:00:00+00'),
((SELECT id FROM teams WHERE iso_code = 'AU'), (SELECT id FROM teams WHERE iso_code = 'U3'), 'D', 'group', '2026-06-13 15:00:00+00');

-- Group J (Argentina's Opener)
INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
((SELECT id FROM teams WHERE iso_code = 'AR'), (SELECT id FROM teams WHERE iso_code = 'DZ'), 'J', 'group', '2026-06-15 18:00:00+00');

-- Group L (England's Opener)
INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
((SELECT id FROM teams WHERE iso_code = 'GB' AND name = 'England'), (SELECT id FROM teams WHERE iso_code = 'HR'), 'L', 'group', '2026-06-16 18:00:00+00');
