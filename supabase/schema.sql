-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free','premium','pro_starter','pro_growth','pro_enterprise')),
  scan_count_month INTEGER NOT NULL DEFAULT 0,
  scan_count_reset DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Card catalog (shared across users)
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game TEXT NOT NULL CHECK (game IN ('pokemon','yugioh','onepiece','mtg','lorcana')),
  api_id TEXT NOT NULL,
  name TEXT NOT NULL,
  set_name TEXT,
  set_code TEXT,
  number TEXT,
  rarity TEXT,
  image_url TEXT,
  supertype TEXT,
  subtypes TEXT[],
  hp INTEGER,
  artist TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (game, api_id)
);

CREATE INDEX idx_cards_game ON cards (game);
CREATE INDEX idx_cards_name ON cards (name);

-- User inventory
CREATE TABLE user_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  condition TEXT NOT NULL DEFAULT 'NM' CHECK (condition IN ('NM','LP','MP','HP','DMG')),
  foil BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  purchase_price DECIMAL(10,2),
  purchase_currency TEXT DEFAULT 'TRY',
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_cards_user ON user_cards (user_id);
ALTER TABLE user_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own cards" ON user_cards USING (auth.uid() = user_id);

-- Folders / collections
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_trade_folder BOOLEAN NOT NULL DEFAULT FALSE,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own folders" ON folders USING (auth.uid() = user_id);
CREATE POLICY "Public folders viewable" ON folders FOR SELECT USING (is_public = TRUE);

-- Cards in folders
CREATE TABLE folder_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  user_card_id UUID NOT NULL REFERENCES user_cards(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (folder_id, user_card_id)
);

ALTER TABLE folder_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own folder cards" ON folder_cards
  USING (folder_id IN (SELECT id FROM folders WHERE user_id = auth.uid()));

-- Price cache
CREATE TABLE price_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  price_low DECIMAL(10,2),
  price_mid DECIMAL(10,2),
  price_high DECIMAL(10,2),
  price_market DECIMAL(10,2),
  currency TEXT NOT NULL DEFAULT 'USD',
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (card_id, source)
);

CREATE INDEX idx_price_cache_card ON price_cache (card_id);

-- Scan history
CREATE TABLE scan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_id UUID REFERENCES cards(id),
  confidence DECIMAL(5,4),
  raw_response JSONB,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own scan history" ON scan_history USING (auth.uid() = user_id);

-- Friends
CREATE TABLE friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, friend_id)
);

ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own friends" ON friends USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Channel integrations (Shopify, ikas, eBay, etc.)
CREATE TABLE channel_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('ikas','shopify','ebay','trendyol','hepsiburada')),
  name TEXT NOT NULL,
  access_token TEXT NOT NULL,
  store_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE channel_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own channels" ON channel_configs USING (auth.uid() = user_id);

-- Listing pushes log
CREATE TABLE listing_pushes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_card_id UUID NOT NULL REFERENCES user_cards(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channel_configs(id) ON DELETE CASCADE,
  external_listing_id TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'TRY',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','sold','cancelled')),
  pushed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE listing_pushes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own listings" ON listing_pushes USING (auth.uid() = user_id);

-- Helper function: auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE PLPGSQL SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
