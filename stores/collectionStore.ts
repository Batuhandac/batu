import { create } from 'zustand';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { Card, Condition, Folder, UserCard } from '@/types';
import { fetchCardPrice, fetchBulkPrices } from '@/lib/api/justtcg';
import { useAuthStore } from '@/stores/authStore';

function isLocalMode() {
  return !isSupabaseConfigured || useAuthStore.getState().isGuest;
}

function genLocalId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface CollectionState {
  cards: UserCard[];
  folders: Folder[];
  loading: boolean;
  totalValue: number;

  fetchCollection: (userId: string) => Promise<void>;
  fetchFolders: (userId: string) => Promise<void>;
  addCard: (userId: string, card: Card, opts?: { quantity?: number; condition?: Condition; foil?: boolean; purchasePrice?: number }) => Promise<UserCard>;
  updateCard: (id: string, updates: Partial<Pick<UserCard, 'quantity' | 'condition' | 'foil' | 'notes' | 'purchasePrice' | 'variant'>>) => Promise<void>;
  removeCard: (id: string) => Promise<void>;
  createFolder: (userId: string, name: string, opts?: { description?: string; isTradeFolder?: boolean; isPublic?: boolean }) => Promise<Folder>;
  addCardToFolder: (folderId: string, userCardId: string) => Promise<void>;
  removeCardFromFolder: (folderId: string, userCardId: string) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  refreshPrices: () => Promise<void>;
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  cards: [],
  folders: [],
  loading: false,
  totalValue: 0,

  fetchCollection: async (userId) => {
    if (isLocalMode()) {
      set({ loading: false });
      return;
    }

    set({ loading: true });
    const { data, error } = await supabase
      .from('user_cards')
      .select(`
        *,
        card:cards(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      set({ loading: false });
      throw error;
    }

    const cards: UserCard[] = (data ?? []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      card: {
        id: row.card.id,
        game: row.card.game,
        apiId: row.card.api_id,
        name: row.card.name,
        setName: row.card.set_name,
        setCode: row.card.set_code,
        number: row.card.number,
        rarity: row.card.rarity,
        imageUrl: row.card.image_url,
        supertype: row.card.supertype,
        subtypes: row.card.subtypes,
        hp: row.card.hp,
        artist: row.card.artist,
      },
      quantity: row.quantity,
      condition: row.condition,
      foil: row.foil,
      notes: row.notes,
      purchasePrice: row.purchase_price,
      purchaseCurrency: row.purchase_currency,
      acquiredAt: row.acquired_at,
      createdAt: row.created_at,
    }));

    set({ cards, loading: false });
  },

  fetchFolders: async (userId) => {
    if (isLocalMode()) return;

    const { data, error } = await supabase
      .from('folders')
      .select('*, folder_cards(count)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const folders: Folder[] = (data ?? []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      isTradeFolder: row.is_trade_folder,
      isPublic: row.is_public,
      cardCount: row.folder_cards?.[0]?.count ?? 0,
      createdAt: row.created_at,
    }));

    set({ folders });
  },

  addCard: async (userId, card, opts = {}) => {
    const { quantity = 1, condition = 'NM', foil = false, purchasePrice } = opts;

    if (isLocalMode()) {
      const now = new Date().toISOString();
      const price = await fetchCardPrice(card.game, card.apiId);
      const userCard: UserCard = {
        id: genLocalId(),
        userId,
        card: { ...card, id: card.id || genLocalId() },
        quantity,
        condition,
        foil,
        purchasePrice,
        acquiredAt: now,
        createdAt: now,
        price: price ?? undefined,
      };
      set((state) => {
        const nextCards = [userCard, ...state.cards];
        const total = nextCards.reduce((sum, uc) => sum + (uc.price?.mid ?? 0) * uc.quantity, 0);
        return { cards: nextCards, totalValue: total };
      });
      return userCard;
    }

    let cardRow = await getOrCreateCard(card);

    const { data, error } = await supabase
      .from('user_cards')
      .insert({
        user_id: userId,
        card_id: cardRow.id,
        quantity,
        condition,
        foil,
        purchase_price: purchasePrice,
      })
      .select(`*, card:cards(*)`)
      .single();

    if (error) throw error;

    const userCard: UserCard = {
      id: data.id,
      userId: data.user_id,
      card,
      quantity: data.quantity,
      condition: data.condition,
      foil: data.foil,
      notes: data.notes,
      purchasePrice: data.purchase_price,
      acquiredAt: data.acquired_at,
      createdAt: data.created_at,
    };

    set((state) => ({ cards: [userCard, ...state.cards] }));
    return userCard;
  },

  updateCard: async (id, updates) => {
    if (isLocalMode()) {
      set((state) => ({
        cards: state.cards.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      }));
      return;
    }

    const dbUpdates: Record<string, unknown> = {};
    if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
    if (updates.condition !== undefined) dbUpdates.condition = updates.condition;
    if (updates.foil !== undefined) dbUpdates.foil = updates.foil;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.purchasePrice !== undefined) dbUpdates.purchase_price = updates.purchasePrice;
    if (updates.variant !== undefined) dbUpdates.variant = updates.variant;

    const { error } = await supabase.from('user_cards').update(dbUpdates).eq('id', id);
    if (error) throw error;

    set((state) => ({
      cards: state.cards.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  },

  removeCard: async (id) => {
    if (isLocalMode()) {
      set((state) => {
        const nextCards = state.cards.filter((c) => c.id !== id);
        const total = nextCards.reduce((sum, uc) => sum + (uc.price?.mid ?? 0) * uc.quantity, 0);
        return { cards: nextCards, totalValue: total };
      });
      return;
    }

    const { error } = await supabase.from('user_cards').delete().eq('id', id);
    if (error) throw error;
    set((state) => ({ cards: state.cards.filter((c) => c.id !== id) }));
  },

  createFolder: async (userId, name, opts = {}) => {
    const { description, isTradeFolder = false, isPublic = false } = opts;

    if (isLocalMode()) {
      const folder: Folder = {
        id: genLocalId(),
        userId,
        name,
        description,
        isTradeFolder,
        isPublic,
        cardCount: 0,
        createdAt: new Date().toISOString(),
      };
      set((state) => ({ folders: [folder, ...state.folders] }));
      return folder;
    }

    const { data, error } = await supabase
      .from('folders')
      .insert({ user_id: userId, name, description, is_trade_folder: isTradeFolder, is_public: isPublic })
      .select('*')
      .single();

    if (error) throw error;

    const folder: Folder = {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      description: data.description,
      isTradeFolder: data.is_trade_folder,
      isPublic: data.is_public,
      cardCount: 0,
      createdAt: data.created_at,
    };

    set((state) => ({ folders: [folder, ...state.folders] }));
    return folder;
  },

  addCardToFolder: async (folderId, userCardId) => {
    if (isLocalMode()) return;
    const { error } = await supabase
      .from('folder_cards')
      .insert({ folder_id: folderId, user_card_id: userCardId });
    if (error) throw error;
  },

  removeCardFromFolder: async (folderId, userCardId) => {
    if (isLocalMode()) return;
    const { error } = await supabase
      .from('folder_cards')
      .delete()
      .eq('folder_id', folderId)
      .eq('user_card_id', userCardId);
    if (error) throw error;
  },

  deleteFolder: async (folderId) => {
    if (isLocalMode()) {
      set((state) => ({ folders: state.folders.filter((f) => f.id !== folderId) }));
      return;
    }
    const { error } = await supabase.from('folders').delete().eq('id', folderId);
    if (error) throw error;
    set((state) => ({ folders: state.folders.filter((f) => f.id !== folderId) }));
  },

  refreshPrices: async () => {
    const cards = get().cards;
    if (!cards.length) return;

    // Group by game for bulk fetch
    const byGame: Record<string, string[]> = {};
    for (const uc of cards) {
      if (!byGame[uc.card.game]) byGame[uc.card.game] = [];
      byGame[uc.card.game].push(uc.card.apiId);
    }

    const priceMap: Record<string, import('@/types').CardPrice> = {};
    await Promise.all(
      Object.entries(byGame).map(async ([game, ids]) => {
        const bulk = await fetchBulkPrices(game as import('@/types').Game, ids);
        Object.assign(priceMap, bulk);
      }),
    );

    const updated = cards.map((uc) => {
      const price = priceMap[uc.card.apiId];
      return price ? { ...uc, price } : uc;
    });

    const total = updated.reduce((sum, uc) => {
      const market = uc.price?.market ?? uc.price?.mid ?? 0;
      return sum + market * uc.quantity;
    }, 0);

    set({ cards: updated, totalValue: total });
  },
}));

async function getOrCreateCard(card: Card): Promise<{ id: string }> {
  const { data: existing } = await supabase
    .from('cards')
    .select('id')
    .eq('game', card.game)
    .eq('api_id', card.apiId)
    .single();

  if (existing) return existing;

  const { data, error } = await supabase
    .from('cards')
    .insert({
      game: card.game,
      api_id: card.apiId,
      name: card.name,
      set_name: card.setName,
      set_code: card.setCode,
      number: card.number,
      rarity: card.rarity,
      image_url: card.imageUrl,
      supertype: card.supertype,
      subtypes: card.subtypes,
      hp: card.hp,
      artist: card.artist,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data;
}
