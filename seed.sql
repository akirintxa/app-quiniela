
-- Insert Teams
INSERT INTO teams (name, iso_code) VALUES
('Argentina', 'AR'),
('Brazil', 'BR'),
('Canada', 'CA'),
('Mexico', 'MX'),
('United States', 'US'),
('England', 'EN'),
('France', 'FR'),
('Germany', 'DE'),
('Japan', 'JP'),
('South Korea', 'KR'),
('Australia', 'AU'),
('Morocco', 'MA'),
('Senegal', 'SN'),
('Uruguay', 'UY'),
('Colombia', 'CO'),
('New Zealand', 'NZ');

-- Insert Matches (Fictional Schedule)
-- Group A
INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
((SELECT id FROM teams WHERE iso_code = 'MX'), (SELECT id FROM teams WHERE iso_code = 'AU'), 'A', 'group', '2026-06-12 18:00:00+00'),
((SELECT id FROM teams WHERE iso_code = 'AR'), (SELECT id FROM teams WHERE iso_code = 'NZ'), 'A', 'group', '2026-06-13 21:00:00+00');

-- Group B
INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
((SELECT id FROM teams WHERE iso_code = 'CA'), (SELECT id FROM teams WHERE iso_code = 'JP'), 'B', 'group', '2026-06-13 18:00:00+00'),
((SELECT id FROM teams WHERE iso_code = 'EN'), (SELECT id FROM teams WHERE iso_code = 'MA'), 'B', 'group', '2026-06-14 21:00:00+00');

-- Group C
INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
((SELECT id FROM teams WHERE iso_code = 'US'), (SELECT id FROM teams WHERE iso_code = 'KR'), 'C', 'group', '2026-06-14 18:00:00+00'),
((SELECT id FROM teams WHERE iso_code = 'BR'), (SELECT id FROM teams WHERE iso_code = 'SN'), 'C', 'group', '2026-06-15 21:00:00+00');

-- Group D
INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
((SELECT id FROM teams WHERE iso_code = 'FR'), (SELECT id FROM teams WHERE iso_code = 'UY'), 'D', 'group', '2026-06-15 18:00:00+00'),
((SELECT id FROM teams WHERE iso_code = 'DE'), (SELECT id FROM teams WHERE iso_code = 'CO'), 'D', 'group', '2026-06-16 21:00:00+00');

-- Knockout Stage Match (Fictional) - for testing winner_id
INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
((SELECT id FROM teams WHERE iso_code = 'MX'), (SELECT id FROM teams WHERE iso_code = 'AR'), NULL, 'round_32', '2026-06-28 20:00:00+00');
