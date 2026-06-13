-- ============================================================
-- Migration V001: Create all tables, constraints, and indexes
-- Project: Othello Mobile Web (reversi)
-- Database: PostgreSQL 16
-- ============================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 4.1 Table: avatars
-- ============================================================
CREATE TABLE avatars (
    id          UUID            NOT NULL DEFAULT gen_random_uuid(),
    code        VARCHAR(50)     NOT NULL,
    name        VARCHAR(100)    NOT NULL,
    asset_key   VARCHAR(150)    NOT NULL,
    sort_order  INTEGER         NOT NULL DEFAULT 0,
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),

    CONSTRAINT pk_avatars PRIMARY KEY (id),
    CONSTRAINT ux_avatars_code UNIQUE (code),
    CONSTRAINT ck_avatars_sort_order CHECK (sort_order >= 0)
);

CREATE INDEX ix_avatars_sort_order ON avatars (sort_order);
CREATE INDEX ix_avatars_is_active ON avatars (is_active);

COMMENT ON TABLE avatars IS 'Catálogo de avatares anime pré-definidos para seleção do jogador';
COMMENT ON COLUMN avatars.id IS 'Chave primária UUID';
COMMENT ON COLUMN avatars.code IS 'Código único do avatar';
COMMENT ON COLUMN avatars.name IS 'Nome descritivo do avatar';
COMMENT ON COLUMN avatars.asset_key IS 'Chave do asset/imagem';
COMMENT ON COLUMN avatars.sort_order IS 'Ordem de exibição';
COMMENT ON COLUMN avatars.is_active IS 'Indica se o avatar pode ser selecionado';
COMMENT ON COLUMN avatars.created_at IS 'Timestamp de criação';

-- ============================================================
-- 4.2 Table: player_sessions
-- ============================================================
CREATE TABLE player_sessions (
    id                   UUID            NOT NULL DEFAULT gen_random_uuid(),
    display_name         VARCHAR(4)      NOT NULL,
    avatar_id            UUID            NOT NULL,
    session_token_hash   VARCHAR(255)    NOT NULL,
    status               VARCHAR(20)     NOT NULL DEFAULT 'active',
    last_seen_at         TIMESTAMPTZ     NOT NULL DEFAULT now(),
    created_at           TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ     NOT NULL DEFAULT now(),

    CONSTRAINT pk_player_sessions PRIMARY KEY (id),
    CONSTRAINT ux_player_sessions_session_token_hash UNIQUE (session_token_hash),
    CONSTRAINT fk_player_sessions_avatar_id FOREIGN KEY (avatar_id)
        REFERENCES avatars (id),
    CONSTRAINT ck_player_sessions_display_name CHECK (
        char_length(trim(display_name)) BETWEEN 1 AND 4
    ),
    CONSTRAINT ck_player_sessions_status CHECK (
        status IN ('active', 'waiting', 'in_match', 'disconnected', 'expired')
    )
);

CREATE INDEX ix_player_sessions_avatar_id ON player_sessions (avatar_id);
CREATE INDEX ix_player_sessions_status ON player_sessions (status);
CREATE INDEX ix_player_sessions_last_seen_at ON player_sessions (last_seen_at);

COMMENT ON TABLE player_sessions IS 'Sessão efêmera de cada jogador';
COMMENT ON COLUMN player_sessions.id IS 'Chave primária UUID';
COMMENT ON COLUMN player_sessions.display_name IS 'Nome do jogador (máx. 4 chars)';
COMMENT ON COLUMN player_sessions.avatar_id IS 'FK para avatar escolhido';
COMMENT ON COLUMN player_sessions.session_token_hash IS 'Hash do token de sessão (nunca o token puro)';
COMMENT ON COLUMN player_sessions.status IS 'Estado da sessão: active, waiting, in_match, disconnected, expired';
COMMENT ON COLUMN player_sessions.last_seen_at IS 'Última atividade observada';
COMMENT ON COLUMN player_sessions.created_at IS 'Criação da sessão';
COMMENT ON COLUMN player_sessions.updated_at IS 'Atualização da sessão';

-- ============================================================
-- 4.3 Table: matches
-- ============================================================
CREATE TABLE matches (
    id                        UUID            NOT NULL DEFAULT gen_random_uuid(),
    status                    VARCHAR(20)     NOT NULL DEFAULT 'waiting',
    host_player_session_id    UUID            NOT NULL,
    board_size                SMALLINT        NOT NULL DEFAULT 8,
    board_state               JSONB           NOT NULL,
    current_turn_color        VARCHAR(5),
    turn_deadline_at          TIMESTAMPTZ,
    winner_player_session_id  UUID,
    winner_color              VARCHAR(5),
    win_reason                VARCHAR(20),
    black_score               SMALLINT        NOT NULL DEFAULT 2,
    white_score               SMALLINT        NOT NULL DEFAULT 2,
    last_move_number          INTEGER         NOT NULL DEFAULT 0,
    started_at                TIMESTAMPTZ,
    ended_at                  TIMESTAMPTZ,
    created_at                TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ     NOT NULL DEFAULT now(),

    CONSTRAINT pk_matches PRIMARY KEY (id),
    CONSTRAINT fk_matches_host_player_session_id FOREIGN KEY (host_player_session_id)
        REFERENCES player_sessions (id),
    CONSTRAINT fk_matches_winner_player_session_id FOREIGN KEY (winner_player_session_id)
        REFERENCES player_sessions (id),
    CONSTRAINT ck_matches_status CHECK (
        status IN ('waiting', 'ready', 'in_progress', 'finished', 'abandoned', 'cancelled')
    ),
    CONSTRAINT ck_matches_board_size CHECK (board_size = 8),
    CONSTRAINT ck_matches_current_turn_color CHECK (
        current_turn_color IS NULL OR current_turn_color IN ('black', 'white')
    ),
    CONSTRAINT ck_matches_winner_color CHECK (
        winner_color IS NULL OR winner_color IN ('black', 'white')
    ),
    CONSTRAINT ck_matches_win_reason CHECK (
        win_reason IS NULL OR win_reason IN ('disc_count', 'resignation', 'timeout', 'disconnect', 'cancelled')
    ),
    CONSTRAINT ck_matches_black_score CHECK (black_score BETWEEN 0 AND 64),
    CONSTRAINT ck_matches_white_score CHECK (white_score BETWEEN 0 AND 64)
);

CREATE INDEX ix_matches_status ON matches (status);
CREATE INDEX ix_matches_host_player_session_id ON matches (host_player_session_id);
CREATE INDEX ix_matches_created_at ON matches (created_at);
CREATE INDEX ix_matches_started_at ON matches (started_at);

COMMENT ON TABLE matches IS 'Representa a partida rápida e seu estado global';
COMMENT ON COLUMN matches.id IS 'Chave primária UUID';
COMMENT ON COLUMN matches.status IS 'Estado da partida: waiting, ready, in_progress, finished, abandoned, cancelled';
COMMENT ON COLUMN matches.host_player_session_id IS 'Sessão do jogador host';
COMMENT ON COLUMN matches.board_size IS 'Tamanho do tabuleiro (8)';
COMMENT ON COLUMN matches.board_state IS 'Estado atual do tabuleiro em JSONB';
COMMENT ON COLUMN matches.current_turn_color IS 'Cor do turno atual (black/white)';
COMMENT ON COLUMN matches.turn_deadline_at IS 'Expiração do turno';
COMMENT ON COLUMN matches.winner_player_session_id IS 'Sessão vencedora';
COMMENT ON COLUMN matches.winner_color IS 'Cor vencedora (black/white)';
COMMENT ON COLUMN matches.win_reason IS 'Motivo da vitória: disc_count, resignation, timeout, disconnect, cancelled';
COMMENT ON COLUMN matches.black_score IS 'Contagem atual das peças pretas';
COMMENT ON COLUMN matches.white_score IS 'Contagem atual das peças brancas';
COMMENT ON COLUMN matches.last_move_number IS 'Último número da jogada';
COMMENT ON COLUMN matches.started_at IS 'Início da partida';
COMMENT ON COLUMN matches.ended_at IS 'Fim da partida';
COMMENT ON COLUMN matches.created_at IS 'Criação';
COMMENT ON COLUMN matches.updated_at IS 'Atualização';

-- ============================================================
-- 4.4 Table: match_players
-- ============================================================
CREATE TABLE match_players (
    id                  UUID            NOT NULL DEFAULT gen_random_uuid(),
    match_id            UUID            NOT NULL,
    player_session_id   UUID            NOT NULL,
    color               VARCHAR(5),
    is_host             BOOLEAN         NOT NULL DEFAULT FALSE,
    state               VARCHAR(20)     NOT NULL DEFAULT 'joined',
    final_piece_count   SMALLINT,
    joined_at           TIMESTAMPTZ     NOT NULL DEFAULT now(),
    ready_at            TIMESTAMPTZ,
    left_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT now(),

    CONSTRAINT pk_match_players PRIMARY KEY (id),
    CONSTRAINT fk_match_players_match_id FOREIGN KEY (match_id)
        REFERENCES matches (id),
    CONSTRAINT fk_match_players_player_session_id FOREIGN KEY (player_session_id)
        REFERENCES player_sessions (id),
    CONSTRAINT ux_match_players_match_id_player_session_id
        UNIQUE (match_id, player_session_id),
    CONSTRAINT ck_match_players_color CHECK (
        color IS NULL OR color IN ('black', 'white')
    ),
    CONSTRAINT ck_match_players_state CHECK (
        state IN ('joined', 'ready', 'playing', 'resigned', 'disconnected', 'winner', 'loser', 'draw')
    ),
    CONSTRAINT ck_match_players_final_piece_count CHECK (
        final_piece_count IS NULL OR final_piece_count BETWEEN 0 AND 64
    )
);

-- Partial unique index: only one black and one white per match
CREATE UNIQUE INDEX ux_match_players_match_id_color
    ON match_players (match_id, color)
    WHERE color IS NOT NULL;

CREATE INDEX ix_match_players_player_session_id ON match_players (player_session_id);
CREATE INDEX ix_match_players_match_id ON match_players (match_id);
CREATE INDEX ix_match_players_state ON match_players (state);

COMMENT ON TABLE match_players IS 'Associa jogadores a uma partida e registra cor/papel/resultado';
COMMENT ON COLUMN match_players.id IS 'Chave primária UUID';
COMMENT ON COLUMN match_players.match_id IS 'FK da partida';
COMMENT ON COLUMN match_players.player_session_id IS 'FK da sessão do jogador';
COMMENT ON COLUMN match_players.color IS 'black ou white';
COMMENT ON COLUMN match_players.is_host IS 'Indica se é o host';
COMMENT ON COLUMN match_players.state IS 'Estado do participante: joined, ready, playing, resigned, disconnected, winner, loser, draw';
COMMENT ON COLUMN match_players.final_piece_count IS 'Quantidade final de peças';
COMMENT ON COLUMN match_players.joined_at IS 'Momento de entrada';
COMMENT ON COLUMN match_players.ready_at IS 'Momento em que ficou pronto';
COMMENT ON COLUMN match_players.left_at IS 'Momento de saída';
COMMENT ON COLUMN match_players.created_at IS 'Criação';
COMMENT ON COLUMN match_players.updated_at IS 'Atualização';

-- ============================================================
-- 4.5 Table: match_moves
-- ============================================================
CREATE TABLE match_moves (
    id                      UUID            NOT NULL DEFAULT gen_random_uuid(),
    match_id                UUID            NOT NULL,
    move_number             INTEGER         NOT NULL,
    player_session_id       UUID            NOT NULL,
    color                   VARCHAR(5)      NOT NULL,
    row_index               SMALLINT        NOT NULL,
    col_index               SMALLINT        NOT NULL,
    flipped_count           SMALLINT        NOT NULL DEFAULT 0,
    flipped_positions       JSONB           NOT NULL DEFAULT '[]'::jsonb,
    board_snapshot_before   JSONB           NOT NULL,
    board_snapshot_after    JSONB           NOT NULL,
    turn_started_at         TIMESTAMPTZ     NOT NULL,
    turn_submitted_at       TIMESTAMPTZ     NOT NULL DEFAULT now(),
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT now(),

    CONSTRAINT pk_match_moves PRIMARY KEY (id),
    CONSTRAINT fk_match_moves_match_id FOREIGN KEY (match_id)
        REFERENCES matches (id),
    CONSTRAINT fk_match_moves_player_session_id FOREIGN KEY (player_session_id)
        REFERENCES player_sessions (id),
    CONSTRAINT ux_match_moves_match_id_move_number UNIQUE (match_id, move_number),
    CONSTRAINT ck_match_moves_color CHECK (color IN ('black', 'white')),
    CONSTRAINT ck_match_moves_row_index CHECK (row_index BETWEEN 0 AND 7),
    CONSTRAINT ck_match_moves_col_index CHECK (col_index BETWEEN 0 AND 7),
    CONSTRAINT ck_match_moves_flipped_count CHECK (flipped_count >= 1)
);

CREATE INDEX ix_match_moves_match_id ON match_moves (match_id);
CREATE INDEX ix_match_moves_player_session_id ON match_moves (player_session_id);

COMMENT ON TABLE match_moves IS 'Histórico de jogadas aplicadas em uma partida';
COMMENT ON COLUMN match_moves.id IS 'Chave primária UUID';
COMMENT ON COLUMN match_moves.match_id IS 'FK da partida';
COMMENT ON COLUMN match_moves.move_number IS 'Número sequencial da jogada';
COMMENT ON COLUMN match_moves.player_session_id IS 'Jogador que executou a jogada';
COMMENT ON COLUMN match_moves.color IS 'Cor do jogador na jogada';
COMMENT ON COLUMN match_moves.row_index IS 'Linha 0-7';
COMMENT ON COLUMN match_moves.col_index IS 'Coluna 0-7';
COMMENT ON COLUMN match_moves.flipped_count IS 'Qtde de peças viradas';
COMMENT ON COLUMN match_moves.flipped_positions IS 'Lista de posições viradas em JSONB';
COMMENT ON COLUMN match_moves.board_snapshot_before IS 'Snapshot anterior do tabuleiro';
COMMENT ON COLUMN match_moves.board_snapshot_after IS 'Snapshot posterior do tabuleiro';
COMMENT ON COLUMN match_moves.turn_started_at IS 'Início do turno';
COMMENT ON COLUMN match_moves.turn_submitted_at IS 'Envio da jogada';
COMMENT ON COLUMN match_moves.created_at IS 'Registro';

-- ============================================================
-- 4.6 Table: match_events
-- ============================================================
CREATE TABLE match_events (
    id                  UUID            NOT NULL DEFAULT gen_random_uuid(),
    match_id            UUID            NOT NULL,
    player_session_id   UUID,
    event_type          VARCHAR(50)     NOT NULL,
    payload             JSONB           NOT NULL DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT now(),

    CONSTRAINT pk_match_events PRIMARY KEY (id),
    CONSTRAINT fk_match_events_match_id FOREIGN KEY (match_id)
        REFERENCES matches (id),
    CONSTRAINT fk_match_events_player_session_id FOREIGN KEY (player_session_id)
        REFERENCES player_sessions (id),
    CONSTRAINT ck_match_events_event_type CHECK (char_length(trim(event_type)) > 0)
);

CREATE INDEX ix_match_events_match_id_created_at ON match_events (match_id, created_at);
CREATE INDEX ix_match_events_event_type ON match_events (event_type);

COMMENT ON TABLE match_events IS 'Trilha de eventos relevantes da partida para sincronização, auditoria técnica e suporte a reconexão';
COMMENT ON COLUMN match_events.id IS 'Chave primária UUID';
COMMENT ON COLUMN match_events.match_id IS 'FK da partida';
COMMENT ON COLUMN match_events.player_session_id IS 'Sessão relacionada ao evento, quando houver';
COMMENT ON COLUMN match_events.event_type IS 'Tipo do evento';
COMMENT ON COLUMN match_events.payload IS 'Dados do evento em JSONB';
COMMENT ON COLUMN match_events.created_at IS 'Data do evento';
