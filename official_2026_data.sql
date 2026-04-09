
-- Clean existing data to start fresh
TRUNCATE TABLE predictions CASCADE;
TRUNCATE TABLE matches CASCADE;
TRUNCATE TABLE teams CASCADE;

-- Insert 48 Teams for World Cup 2026 (Official Groups as of April 2026)
INSERT INTO teams (name, iso_code) VALUES
('México 🇲🇽', 'MX'), ('Sudáfrica 🇿🇦', 'ZA'), ('Corea del Sur 🇰🇷', 'KR'), ('Chequia 🇨🇿', 'CZ'),
('Canadá 🇨🇦', 'CA'), ('Bosnia y Herz. 🇧🇦', 'BA'), ('Qatar 🇶🇦', 'QA'), ('Suiza 🇨🇭', 'CH'),
('Brasil 🇧🇷', 'BR'), ('Marruecos 🇲🇦', 'MA'), ('Haití 🇭🇹', 'HT'), ('Escocia 🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'GB-SCT'),
('EE. UU. 🇺🇸', 'US'), ('Paraguay 🇵🇾', 'PY'), ('Australia 🇦🇺', 'AU'), ('Turquía 🇹🇷', 'TR'),
('Alemania 🇩🇪', 'DE'), ('Curazao 🇨🇼', 'CW'), ('Costa de Marfil 🇨🇮', 'CI'), ('Ecuador 🇪🇨', 'EC'),
('Países Bajos 🇳🇱', 'NL'), ('Japón 🇯🇵', 'JP'), ('Suecia 🇸🇪', 'SE'), ('Túnez 🇹🇳', 'TN'),
('Bélgica 🇧🇪', 'BE'), ('Egipto 🇪🇬', 'EG'), ('Irán 🇮🇷', 'IR'), ('Nueva Zelanda 🇳🇿', 'NZ'),
('España 🇪🇸', 'ES'), ('Cabo Verde 🇨🇻', 'CV'), ('Arabia Saudita 🇸🇦', 'SA'), ('Uruguay 🇺🇾', 'UY'),
('Francia 🇫🇷', 'FR'), ('Senegal 🇸🇳', 'SN'), ('Irak 🇮🇶', 'IQ'), ('Noruega 🇳🇴', 'NO'),
('Argentina 🇦🇷', 'AR'), ('Argelia 🇩🇿', 'DZ'), ('Austria 🇦🇹', 'AT'), ('Jordania 🇯🇴', 'JO'),
('Portugal 🇵🇹', 'PT'), ('R.D. Congo 🇨🇩', 'CD'), ('Uzbekistán 🇺🇿', 'UZ'), ('Colombia 🇨🇴', 'CO'),
('Inglaterra 🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'GB-ENG'), ('Croacia 🇭🇷', 'HR'), ('Ghana 🇬🇭', 'GH'), ('Panamá 🇵🇦', 'PA');

-- Sample matches
INSERT INTO matches (team_a_id, team_b_id, group_id, stage, start_time) VALUES
((SELECT id FROM teams WHERE iso_code = 'MX'), (SELECT id FROM teams WHERE iso_code = 'ZA'), 'A', 'group', '2026-06-11 18:00:00+00'),
((SELECT id FROM teams WHERE iso_code = 'CA'), (SELECT id FROM teams WHERE iso_code = 'BA'), 'B', 'group', '2026-06-12 18:00:00+00'),
((SELECT id FROM teams WHERE iso_code = 'US'), (SELECT id FROM teams WHERE iso_code = 'AU'), 'D', 'group', '2026-06-12 20:00:00+00'),
((SELECT id FROM teams WHERE iso_code = 'BR'), (SELECT id FROM teams WHERE iso_code = 'MA'), 'C', 'group', '2026-06-13 18:00:00+00'),
((SELECT id FROM teams WHERE iso_code = 'AR'), (SELECT id FROM teams WHERE iso_code = 'DZ'), 'J', 'group', '2026-06-16 21:00:00+00'),
((SELECT id FROM teams WHERE iso_code = 'GB-ENG'), (SELECT id FROM teams WHERE iso_code = 'HR'), 'L', 'group', '2026-06-17 18:00:00+00');
