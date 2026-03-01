
-- teams table
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    iso_code VARCHAR(2) NOT NULL
);

-- matches table
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    team_a_id INT REFERENCES teams(id),
    team_b_id INT REFERENCES teams(id),
    group_id VARCHAR(1),
    stage VARCHAR(20) NOT NULL, -- e.g., 'group', 'round_32', 'round_16', 'quarter_final', 'semi_final', 'final'
    start_time TIMESTAMPTZ NOT NULL,
    result_a INT,
    result_b INT,
    winner_id INT REFERENCES teams(id) -- for penalty shootouts or to indicate the classified team in knockout stages
);

-- predictions table
CREATE TABLE predictions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    match_id INT REFERENCES matches(id),
    predicted_a INT,
    predicted_b INT,
    predicted_winner_id INT REFERENCES teams(id), -- mandatory in knockout stages if there is a draw
    points_won INT
);

-- pools table
CREATE TABLE pools (
    id SERIAL PRIMARY KEY,
    creator_id UUID REFERENCES auth.users(id),
    name VARCHAR(255) NOT NULL,
    invite_code VARCHAR(20) UNIQUE,
    is_public BOOLEAN DEFAULT false,
    max_participants INT
);

-- pool_members table
CREATE TABLE pool_members (
    id SERIAL PRIMARY KEY,
    pool_id INT REFERENCES pools(id),
    user_id UUID REFERENCES auth.users(id),
    role VARCHAR(10) DEFAULT 'member' -- 'admin' or 'member'
);
