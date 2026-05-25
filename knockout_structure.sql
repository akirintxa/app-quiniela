
-- Mundial 2026: estructura completa de eliminatorias (partidos 73–104)
-- Ejecutar después de seed de grupos y equipos placeholder

-- Equipos ganador/perdedor de partidos
INSERT INTO teams (name, iso_code)
SELECT n, c FROM (VALUES
  ('Ganador Partido 73', 'W73'), ('Ganador Partido 74', 'W74'), ('Ganador Partido 75', 'W75'),
  ('Ganador Partido 76', 'W76'), ('Ganador Partido 77', 'W77'), ('Ganador Partido 78', 'W78'),
  ('Ganador Partido 79', 'W79'), ('Ganador Partido 80', 'W80'), ('Ganador Partido 81', 'W81'),
  ('Ganador Partido 82', 'W82'), ('Ganador Partido 83', 'W83'), ('Ganador Partido 84', 'W84'),
  ('Ganador Partido 85', 'W85'), ('Ganador Partido 86', 'W86'), ('Ganador Partido 87', 'W87'),
  ('Ganador Partido 88', 'W88'), ('Ganador Partido 89', 'W89'), ('Ganador Partido 90', 'W90'),
  ('Ganador Partido 91', 'W91'), ('Ganador Partido 92', 'W92'), ('Ganador Partido 93', 'W93'),
  ('Ganador Partido 94', 'W94'), ('Ganador Partido 95', 'W95'), ('Ganador Partido 96', 'W96'),
  ('Ganador Partido 97', 'W97'), ('Ganador Partido 98', 'W98'), ('Ganador Partido 99', 'W99'),
  ('Ganador Partido 100', 'W100'), ('Ganador Partido 101', 'W101'), ('Ganador Partido 102', 'W102'),
  ('Perdedor Partido 101', 'L101'), ('Perdedor Partido 102', 'L102')
) AS t(n, c)
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE iso_code = t.c);

-- Partidos eliminatorias con IDs fijos FIFA
INSERT INTO matches (id, team_a_id, team_b_id, stage, start_time, bracket_round, bracket_index) VALUES
(73, (SELECT id FROM teams WHERE iso_code='2A'), (SELECT id FROM teams WHERE iso_code='2B'), 'round_32', '2026-06-28 18:00:00+00', 0, 0),
(74, (SELECT id FROM teams WHERE iso_code='1E'), (SELECT id FROM teams WHERE iso_code='3X1'), 'round_32', '2026-06-29 18:00:00+00', 0, 1),
(75, (SELECT id FROM teams WHERE iso_code='1F'), (SELECT id FROM teams WHERE iso_code='2C'), 'round_32', '2026-06-29 21:00:00+00', 0, 2),
(76, (SELECT id FROM teams WHERE iso_code='1C'), (SELECT id FROM teams WHERE iso_code='2F'), 'round_32', '2026-06-29 18:00:00+00', 0, 3),
(77, (SELECT id FROM teams WHERE iso_code='1I'), (SELECT id FROM teams WHERE iso_code='3X2'), 'round_32', '2026-06-30 18:00:00+00', 0, 4),
(78, (SELECT id FROM teams WHERE iso_code='2E'), (SELECT id FROM teams WHERE iso_code='2I'), 'round_32', '2026-06-30 21:00:00+00', 0, 5),
(79, (SELECT id FROM teams WHERE iso_code='1A'), (SELECT id FROM teams WHERE iso_code='3X3'), 'round_32', '2026-06-30 21:00:00+00', 0, 6),
(80, (SELECT id FROM teams WHERE iso_code='1L'), (SELECT id FROM teams WHERE iso_code='3X4'), 'round_32', '2026-07-01 18:00:00+00', 0, 7),
(81, (SELECT id FROM teams WHERE iso_code='1D'), (SELECT id FROM teams WHERE iso_code='3X5'), 'round_32', '2026-07-01 21:00:00+00', 0, 8),
(82, (SELECT id FROM teams WHERE iso_code='1G'), (SELECT id FROM teams WHERE iso_code='3X6'), 'round_32', '2026-07-01 21:00:00+00', 0, 9),
(83, (SELECT id FROM teams WHERE iso_code='2K'), (SELECT id FROM teams WHERE iso_code='2L'), 'round_32', '2026-07-02 18:00:00+00', 0, 10),
(84, (SELECT id FROM teams WHERE iso_code='1H'), (SELECT id FROM teams WHERE iso_code='2J'), 'round_32', '2026-07-02 21:00:00+00', 0, 11),
(85, (SELECT id FROM teams WHERE iso_code='1B'), (SELECT id FROM teams WHERE iso_code='3X7'), 'round_32', '2026-07-02 21:00:00+00', 0, 12),
(86, (SELECT id FROM teams WHERE iso_code='1J'), (SELECT id FROM teams WHERE iso_code='2H'), 'round_32', '2026-07-03 18:00:00+00', 0, 13),
(87, (SELECT id FROM teams WHERE iso_code='1K'), (SELECT id FROM teams WHERE iso_code='3X8'), 'round_32', '2026-07-03 21:00:00+00', 0, 14),
(88, (SELECT id FROM teams WHERE iso_code='2D'), (SELECT id FROM teams WHERE iso_code='2G'), 'round_32', '2026-07-03 21:00:00+00', 0, 15),
(89, (SELECT id FROM teams WHERE iso_code='W74'), (SELECT id FROM teams WHERE iso_code='W77'), 'round_16', '2026-07-04 18:00:00+00', 1, 0),
(90, (SELECT id FROM teams WHERE iso_code='W73'), (SELECT id FROM teams WHERE iso_code='W75'), 'round_16', '2026-07-04 21:00:00+00', 1, 1),
(91, (SELECT id FROM teams WHERE iso_code='W76'), (SELECT id FROM teams WHERE iso_code='W78'), 'round_16', '2026-07-05 18:00:00+00', 1, 2),
(92, (SELECT id FROM teams WHERE iso_code='W79'), (SELECT id FROM teams WHERE iso_code='W80'), 'round_16', '2026-07-05 21:00:00+00', 1, 3),
(93, (SELECT id FROM teams WHERE iso_code='W83'), (SELECT id FROM teams WHERE iso_code='W84'), 'round_16', '2026-07-06 18:00:00+00', 1, 4),
(94, (SELECT id FROM teams WHERE iso_code='W81'), (SELECT id FROM teams WHERE iso_code='W82'), 'round_16', '2026-07-06 21:00:00+00', 1, 5),
(95, (SELECT id FROM teams WHERE iso_code='W86'), (SELECT id FROM teams WHERE iso_code='W88'), 'round_16', '2026-07-07 18:00:00+00', 1, 6),
(96, (SELECT id FROM teams WHERE iso_code='W85'), (SELECT id FROM teams WHERE iso_code='W87'), 'round_16', '2026-07-07 21:00:00+00', 1, 7),
(97, (SELECT id FROM teams WHERE iso_code='W89'), (SELECT id FROM teams WHERE iso_code='W90'), 'quarter_final', '2026-07-09 18:00:00+00', 2, 0),
(98, (SELECT id FROM teams WHERE iso_code='W93'), (SELECT id FROM teams WHERE iso_code='W94'), 'quarter_final', '2026-07-10 18:00:00+00', 2, 1),
(99, (SELECT id FROM teams WHERE iso_code='W91'), (SELECT id FROM teams WHERE iso_code='W92'), 'quarter_final', '2026-07-11 18:00:00+00', 2, 2),
(100, (SELECT id FROM teams WHERE iso_code='W95'), (SELECT id FROM teams WHERE iso_code='W96'), 'quarter_final', '2026-07-11 21:00:00+00', 2, 3),
(101, (SELECT id FROM teams WHERE iso_code='W97'), (SELECT id FROM teams WHERE iso_code='W98'), 'semi_final', '2026-07-14 18:00:00+00', 3, 0),
(102, (SELECT id FROM teams WHERE iso_code='W99'), (SELECT id FROM teams WHERE iso_code='W100'), 'semi_final', '2026-07-15 18:00:00+00', 3, 1),
(103, (SELECT id FROM teams WHERE iso_code='L101'), (SELECT id FROM teams WHERE iso_code='L102'), 'third_place', '2026-07-18 18:00:00+00', 4, 0),
(104, (SELECT id FROM teams WHERE iso_code='W101'), (SELECT id FROM teams WHERE iso_code='W102'), 'final', '2026-07-19 18:00:00+00', 4, 1)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('matches', 'id'), GREATEST((SELECT MAX(id) FROM matches), 104));
