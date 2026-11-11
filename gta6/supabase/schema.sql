-- Leonida Codes content schema. Public read, writes only via service role (dashboard / scripts).
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE content_status AS ENUM ('verified','unverified','rumor','debunked');
CREATE TYPE game_id AS ENUM ('gta6','gta5');

CREATE TABLE cheats (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  game game_id NOT NULL DEFAULT 'gta6',
  title JSONB NOT NULL,            -- {"tr":"...","en":"..."}
  category TEXT NOT NULL CHECK (category IN ('player','weapon','vehicle','world','misc')),
  effect JSONB NOT NULL,
  codes JSONB NOT NULL DEFAULT '{}'::jsonb,  -- {"ps5":"...","xbox":"...","pc":"...","phone":"..."}
  status content_status NOT NULL DEFAULT 'unverified',
  notes JSONB,
  source TEXT,
  verified_at TIMESTAMPTZ,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE missions (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  game game_id NOT NULL DEFAULT 'gta6',
  order_no INTEGER NOT NULL DEFAULT 0,
  title JSONB NOT NULL,
  chapter JSONB NOT NULL,
  protagonist TEXT NOT NULL DEFAULT 'unknown' CHECK (protagonist IN ('jason','lucia','both','unknown')),
  summary JSONB NOT NULL,
  gold_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  skip_tips JSONB NOT NULL DEFAULT '[]'::jsonb,
  tips JSONB NOT NULL DEFAULT '[]'::jsonb,
  status content_status NOT NULL DEFAULT 'unverified',
  published BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE guides (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  game game_id NOT NULL DEFAULT 'gta6',
  title JSONB NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('money','weapons','vehicles','side','tricks','launch')),
  summary JSONB NOT NULL,
  body JSONB NOT NULL DEFAULT '[]'::jsonb,   -- [{"tr":"...","en":"..."}]
  status content_status NOT NULL DEFAULT 'unverified',
  published BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE locations (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name JSONB NOT NULL,
  type TEXT NOT NULL,
  area TEXT,
  x NUMERIC(5,2) NOT NULL,
  y NUMERIC(5,2) NOT NULL,
  description JSONB NOT NULL,
  status content_status NOT NULL DEFAULT 'unverified',
  published BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE updates (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('cheat','mission','guide','map','news')),
  title JSONB NOT NULL,
  body JSONB NOT NULL,
  href TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE push_tokens (
  token TEXT PRIMARY KEY,
  lang TEXT NOT NULL DEFAULT 'en',
  platform TEXT,
  os TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: anon can read published content and register its own push token. No anon writes to content.
ALTER TABLE cheats ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read cheats" ON cheats FOR SELECT USING (published);
CREATE POLICY "public read missions" ON missions FOR SELECT USING (published);
CREATE POLICY "public read guides" ON guides FOR SELECT USING (published);
CREATE POLICY "public read locations" ON locations FOR SELECT USING (published);
CREATE POLICY "public read updates" ON updates FOR SELECT USING (TRUE);
CREATE POLICY "anon upsert own token" ON push_tokens FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "anon update own token" ON push_tokens FOR UPDATE USING (TRUE);
CREATE POLICY "anon delete own token" ON push_tokens FOR DELETE USING (TRUE);

CREATE INDEX idx_cheats_status ON cheats (status);
CREATE INDEX idx_cheats_game ON cheats (game);
CREATE INDEX idx_updates_created ON updates (created_at DESC);
