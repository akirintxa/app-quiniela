
-- 1. Insertar equipos "comodín" para las eliminatorias
INSERT INTO teams (name, iso_code) VALUES
('1º Grupo A', '1A'), ('2º Grupo A', '2A'),
('1º Grupo B', '1B'), ('2º Grupo B', '2B'),
('1º Grupo C', '1C'), ('2º Grupo C', '2C'),
('1º Grupo D', '1D'), ('2º Grupo D', '2D'),
('1º Grupo E', '1E'), ('2º Grupo E', '2E'),
('1º Grupo F', '1F'), ('2º Grupo F', '2F'),
('1º Grupo G', '1G'), ('2º Grupo G', '2G'),
('1º Grupo H', '1H'), ('2º Grupo H', '2H'),
('1º Grupo I', '1I'), ('2º Grupo I', '2I'),
('1º Grupo J', '1J'), ('2º Grupo J', '2J'),
('1º Grupo K', '1K'), ('2º Grupo K', '2K'),
('1º Grupo L', '1L'), ('2º Grupo L', '2L'),
('Mejor 3º (1)', '3X1'), ('Mejor 3º (2)', '3X2'), ('Mejor 3º (3)', '3X3'), ('Mejor 3º (4)', '3X4'),
('Mejor 3º (5)', '3X5'), ('Mejor 3º (6)', '3X6'), ('Mejor 3º (7)', '3X7'), ('Mejor 3º (8)', '3X8');

-- 2. Insertar algunos partidos de la Ronda de 32 (Muestra)
INSERT INTO matches (team_a_id, team_b_id, stage, start_time) VALUES
((SELECT id FROM teams WHERE iso_code = '1A'), (SELECT id FROM teams WHERE iso_code = '3X1'), 'round_32', '2026-06-28 18:00:00+00'),
((SELECT id FROM teams WHERE iso_code = '1B'), (SELECT id FROM teams WHERE iso_code = '3X2'), 'round_32', '2026-06-28 21:00:00+00'),
((SELECT id FROM teams WHERE iso_code = '1C'), (SELECT id FROM teams WHERE iso_code = '2D'), 'round_32', '2026-06-29 18:00:00+00'),
((SELECT id FROM teams WHERE iso_code = '1D'), (SELECT id FROM teams WHERE iso_code = '2C'), 'round_32', '2026-06-29 21:00:00+00');
