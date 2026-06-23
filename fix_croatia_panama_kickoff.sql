-- Fix: Croacia vs Panamá estaba un día tarde (24/06 en vez de 23/06).
-- Horario oficial FIFA: 2026-06-23 23:00 UTC (19:00 Toronto / 19:00 Caracas).

UPDATE matches m
SET start_time = '2026-06-23 23:00:00+00'::timestamptz
FROM teams ta, teams tb
WHERE m.stage = 'group'
  AND m.team_a_id = ta.id
  AND m.team_b_id = tb.id
  AND ta.name LIKE 'Croacia%'
  AND tb.name LIKE 'Panamá%';
