CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE admin_role AS ENUM ('super_admin', 'election_administrator', 'polling_officer', 'auditor');
CREATE TYPE election_status AS ENUM ('draft', 'configured', 'active', 'ended', 'finalized');
CREATE TYPE auth_method AS ENUM ('face', 'fingerprint');
CREATE TYPE auth_outcome AS ENUM ('success', 'failure', 'lockout');
CREATE TYPE log_action AS ENUM ('create_election', 'update_election', 'register_voter', 'delete_voter', 'add_candidate', 'system_config');
CREATE TYPE tx_type AS ENUM ('deploy_contract', 'register_voter', 'cast_vote', 'tally_results', 'start_election', 'end_election');

CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role admin_role NOT NULL,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE elections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status election_status DEFAULT 'draft',
    voting_start_at TIMESTAMP WITH TIME ZONE,
    voting_end_at TIMESTAMP WITH TIME ZONE,
    contract_addresses JSONB,
    network_id VARCHAR(50),
    deployer_address VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE constituencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    election_id UUID REFERENCES elections(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    on_chain_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(election_id, code)
);

CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    election_id UUID REFERENCES elections(id) ON DELETE CASCADE,
    constituency_id UUID REFERENCES constituencies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    party VARCHAR(255),
    bio TEXT,
    on_chain_id INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE voters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voter_id VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    address TEXT,
    age INTEGER CHECK (age >= 18 AND age <= 120),
    constituency_id UUID REFERENCES constituencies(id),
    face_embedding_hash VARCHAR(255),
    fingerprint_template_hash VARCHAR(255),
    biometric_salt VARCHAR(255) NOT NULL,
    encrypted_face_embedding TEXT,
    encrypted_fingerprint_template TEXT,
    blockchain_voter_id VARCHAR(255) UNIQUE NOT NULL,
    has_voted BOOLEAN DEFAULT FALSE,
    voted_at TIMESTAMP WITH TIME ZONE,
    vote_tx_hash VARCHAR(255),
    failed_auth_count INTEGER DEFAULT 0,
    locked_out BOOLEAN DEFAULT FALSE,
    lockout_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE auth_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voter_id UUID REFERENCES voters(id),
    session_id VARCHAR(255),
    polling_station VARCHAR(255),
    auth_method auth_method,
    outcome auth_outcome,
    failure_reason TEXT,
    similarity_score FLOAT CHECK (similarity_score >= 0 AND similarity_score <= 1),
    ip_address VARCHAR(45),
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vote_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voter_id UUID REFERENCES voters(id),
    election_id UUID REFERENCES elections(id),
    session_id VARCHAR(255),
    tx_hash VARCHAR(255) UNIQUE,
    block_number INTEGER,
    gas_used INTEGER,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES admins(id),
    action log_action,
    target_table VARCHAR(100),
    target_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE blockchain_txns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    election_id UUID REFERENCES elections(id),
    tx_type tx_type,
    tx_hash VARCHAR(255) UNIQUE,
    block_number INTEGER,
    from_address VARCHAR(255),
    to_address VARCHAR(255),
    gas_used INTEGER,
    status VARCHAR(50),
    raw_event JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admins_modtime
    BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_elections_modtime
    BEFORE UPDATE ON elections
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_voters_modtime
    BEFORE UPDATE ON voters
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Prevent vote reset once cast
CREATE OR REPLACE FUNCTION prevent_vote_reset()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.has_voted = TRUE AND NEW.has_voted = FALSE THEN
        RAISE EXCEPTION 'Cannot un-vote once a vote has been cast.';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER enforce_vote_immutability
    BEFORE UPDATE ON voters
    FOR EACH ROW EXECUTE FUNCTION prevent_vote_reset();
