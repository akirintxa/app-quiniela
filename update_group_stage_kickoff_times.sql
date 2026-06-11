-- Actualiza horarios de fase de grupos al calendario oficial FIFA (UTC).
-- La app muestra estos instantes en America/Caracas (UTC-4).
-- Ejecutar en Supabase SQL Editor (no borra predicciones ni resultados).

WITH kickoffs (team_a_like, team_b_like, start_time) AS (
  VALUES
    -- Grupo A
    ('México%', 'Sudáfrica%', '2026-06-11 19:00:00+00'::timestamptz),
    ('Corea del Sur%', 'Chequia%', '2026-06-12 02:00:00+00'::timestamptz),
    ('México%', 'Corea del Sur%', '2026-06-19 01:00:00+00'::timestamptz),
    ('Chequia%', 'Sudáfrica%', '2026-06-18 16:00:00+00'::timestamptz),
    ('México%', 'Chequia%', '2026-06-25 01:00:00+00'::timestamptz),
    ('Sudáfrica%', 'Corea del Sur%', '2026-06-25 01:00:00+00'::timestamptz),
    -- Grupo B
    ('Canadá%', 'Bosnia%', '2026-06-12 19:00:00+00'::timestamptz),
    ('Suiza%', 'Qatar%', '2026-06-13 19:00:00+00'::timestamptz),
    ('Canadá%', 'Suiza%', '2026-06-24 19:00:00+00'::timestamptz),
    ('Bosnia%', 'Qatar%', '2026-06-24 19:00:00+00'::timestamptz),
    ('Canadá%', 'Qatar%', '2026-06-18 22:00:00+00'::timestamptz),
    ('Bosnia%', 'Suiza%', '2026-06-18 19:00:00+00'::timestamptz),
    -- Grupo C
    ('Brasil%', 'Marruecos%', '2026-06-13 22:00:00+00'::timestamptz),
    ('Escocia%', 'Haití%', '2026-06-14 01:00:00+00'::timestamptz),
    ('Brasil%', 'Haití%', '2026-06-20 00:30:00+00'::timestamptz),
    ('Marruecos%', 'Escocia%', '2026-06-19 22:00:00+00'::timestamptz),
    ('Brasil%', 'Escocia%', '2026-06-24 22:00:00+00'::timestamptz),
    ('Haití%', 'Marruecos%', '2026-06-24 22:00:00+00'::timestamptz),
    -- Grupo D
    ('EE. UU.%', 'Australia%', '2026-06-19 19:00:00+00'::timestamptz),
    ('Paraguay%', 'Turquía%', '2026-06-20 03:00:00+00'::timestamptz),
    ('EE. UU.%', 'Turquía%', '2026-06-26 02:00:00+00'::timestamptz),
    ('Australia%', 'Paraguay%', '2026-06-26 02:00:00+00'::timestamptz),
    ('EE. UU.%', 'Paraguay%', '2026-06-13 01:00:00+00'::timestamptz),
    ('Turquía%', 'Australia%', '2026-06-14 04:00:00+00'::timestamptz),
    -- Grupo E
    ('Alemania%', 'Curazao%', '2026-06-14 17:00:00+00'::timestamptz),
    ('Ecuador%', 'Costa de Marfil%', '2026-06-14 23:00:00+00'::timestamptz),
    ('Alemania%', 'Costa de Marfil%', '2026-06-20 20:00:00+00'::timestamptz),
    ('Curazao%', 'Ecuador%', '2026-06-21 03:00:00+00'::timestamptz),
    ('Alemania%', 'Ecuador%', '2026-06-25 20:00:00+00'::timestamptz),
    ('Costa de Marfil%', 'Curazao%', '2026-06-25 20:00:00+00'::timestamptz),
    -- Grupo F
    ('Países Bajos%', 'Japón%', '2026-06-14 20:00:00+00'::timestamptz),
    ('Túnez%', 'Suecia%', '2026-06-15 02:00:00+00'::timestamptz),
    ('Países Bajos%', 'Suecia%', '2026-06-20 17:00:00+00'::timestamptz),
    ('Japón%', 'Túnez%', '2026-06-21 04:00:00+00'::timestamptz),
    ('Países Bajos%', 'Túnez%', '2026-06-25 23:00:00+00'::timestamptz),
    ('Suecia%', 'Japón%', '2026-06-25 23:00:00+00'::timestamptz),
    -- Grupo G
    ('Bélgica%', 'Irán%', '2026-06-21 19:00:00+00'::timestamptz),
    ('Egipto%', 'Nueva Zelanda%', '2026-06-22 01:00:00+00'::timestamptz),
    ('Bélgica%', 'Nueva Zelanda%', '2026-06-27 03:00:00+00'::timestamptz),
    ('Irán%', 'Egipto%', '2026-06-27 03:00:00+00'::timestamptz),
    ('Bélgica%', 'Egipto%', '2026-06-15 19:00:00+00'::timestamptz),
    ('Nueva Zelanda%', 'Irán%', '2026-06-16 01:00:00+00'::timestamptz),
    -- Grupo H
    ('España%', 'Cabo Verde%', '2026-06-15 16:00:00+00'::timestamptz),
    ('Arabia Saudita%', 'Uruguay%', '2026-06-15 22:00:00+00'::timestamptz),
    ('España%', 'Arabia Saudita%', '2026-06-21 16:00:00+00'::timestamptz),
    ('Uruguay%', 'Cabo Verde%', '2026-06-21 22:00:00+00'::timestamptz),
    ('España%', 'Uruguay%', '2026-06-27 00:00:00+00'::timestamptz),
    ('Cabo Verde%', 'Arabia Saudita%', '2026-06-27 00:00:00+00'::timestamptz),
    -- Grupo I
    ('Francia%', 'Irak%', '2026-06-22 21:00:00+00'::timestamptz),
    ('Senegal%', 'Noruega%', '2026-06-23 00:00:00+00'::timestamptz),
    ('Francia%', 'Noruega%', '2026-06-26 19:00:00+00'::timestamptz),
    ('Irak%', 'Senegal%', '2026-06-26 19:00:00+00'::timestamptz),
    ('Francia%', 'Senegal%', '2026-06-16 19:00:00+00'::timestamptz),
    ('Noruega%', 'Irak%', '2026-06-16 22:00:00+00'::timestamptz),
    -- Grupo J
    ('Argentina%', 'Argelia%', '2026-06-17 01:00:00+00'::timestamptz),
    ('Austria%', 'Jordania%', '2026-06-17 04:00:00+00'::timestamptz),
    ('Argentina%', 'Austria%', '2026-06-22 17:00:00+00'::timestamptz),
    ('Argelia%', 'Jordania%', '2026-06-23 03:00:00+00'::timestamptz),
    ('Argentina%', 'Jordania%', '2026-06-28 02:00:00+00'::timestamptz),
    ('Austria%', 'Argelia%', '2026-06-28 02:00:00+00'::timestamptz),
    -- Grupo K
    ('Portugal%', 'R.D. Congo%', '2026-06-17 17:00:00+00'::timestamptz),
    ('Uzbekistán%', 'Colombia%', '2026-06-18 02:00:00+00'::timestamptz),
    ('Portugal%', 'Uzbekistán%', '2026-06-23 17:00:00+00'::timestamptz),
    ('R.D. Congo%', 'Colombia%', '2026-06-24 02:00:00+00'::timestamptz),
    ('Portugal%', 'Colombia%', '2026-06-27 23:30:00+00'::timestamptz),
    ('Uzbekistán%', 'R.D. Congo%', '2026-06-27 23:30:00+00'::timestamptz),
    -- Grupo L
    ('Inglaterra%', 'Croacia%', '2026-06-17 20:00:00+00'::timestamptz),
    ('Panamá%', 'Ghana%', '2026-06-17 23:00:00+00'::timestamptz),
    ('Inglaterra%', 'Ghana%', '2026-06-23 20:00:00+00'::timestamptz),
    ('Croacia%', 'Panamá%', '2026-06-24 23:00:00+00'::timestamptz),
    ('Inglaterra%', 'Panamá%', '2026-06-27 21:00:00+00'::timestamptz),
    ('Ghana%', 'Croacia%', '2026-06-27 21:00:00+00'::timestamptz)
)
UPDATE matches m
SET start_time = k.start_time
FROM kickoffs k
JOIN teams ta ON ta.name LIKE k.team_a_like
JOIN teams tb ON tb.name LIKE k.team_b_like
WHERE m.stage = 'group'
  AND m.team_a_id = ta.id
  AND m.team_b_id = tb.id;
