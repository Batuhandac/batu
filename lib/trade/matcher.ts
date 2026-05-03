import { UserCard } from '@/types';

export interface CollectorInventory {
  userId: string;
  displayName: string;
  cards: UserCard[];
}

export interface TradeOpportunity {
  fromUserId: string;
  fromDisplayName: string;
  toUserId: string;
  toDisplayName: string;
  cardKey: string;
  cardName: string;
  game: string;
  setName: string;
  setCode: string;
  number: string;
  fromSurplus: number;
}

export interface SetCompletionGap {
  setCode: string;
  setName: string;
  ownedUnique: number;
  targetTotal: number;
  missingCount: number;
  percentComplete: number;
}

export function buildCardKey(userCard: UserCard): string {
  const card = userCard.card;
  return [
    card.game,
    card.setCode,
    card.number,
    card.rarity,
    userCard.foil ? 'foil' : 'normal',
    userCard.variant ?? '',
  ].map(normalizeKeyPart).join(':');
}

export function findDuplicateCards(cards: UserCard[], minimumKeep = 1): UserCard[] {
  return cards.filter((userCard) => userCard.quantity > minimumKeep);
}

export function findMissingCardKeys(targetKeys: string[], cards: UserCard[]): string[] {
  const owned = new Set(cards.map(buildCardKey));
  return targetKeys.filter((key) => !owned.has(key));
}

export function findTradeOpportunities(
  collectors: CollectorInventory[],
  targetKeysByUser: Record<string, string[]>,
): TradeOpportunity[] {
  const missingByUser = new Map<string, Set<string>>();

  for (const collector of collectors) {
    missingByUser.set(
      collector.userId,
      new Set(findMissingCardKeys(targetKeysByUser[collector.userId] ?? [], collector.cards)),
    );
  }

  const opportunities: TradeOpportunity[] = [];

  for (const giver of collectors) {
    for (const duplicate of findDuplicateCards(giver.cards)) {
      const key = buildCardKey(duplicate);

      for (const receiver of collectors) {
        if (receiver.userId === giver.userId) continue;
        if (!missingByUser.get(receiver.userId)?.has(key)) continue;

        opportunities.push({
          fromUserId: giver.userId,
          fromDisplayName: giver.displayName,
          toUserId: receiver.userId,
          toDisplayName: receiver.displayName,
          cardKey: key,
          cardName: duplicate.card.name,
          game: duplicate.card.game,
          setName: duplicate.card.setName,
          setCode: duplicate.card.setCode,
          number: duplicate.card.number,
          fromSurplus: duplicate.quantity - 1,
        });
      }
    }
  }

  return opportunities;
}

export function summarizeSetCompletion(
  setCode: string,
  setName: string,
  targetKeys: string[],
  cards: UserCard[],
): SetCompletionGap {
  const owned = new Set(cards.map(buildCardKey));
  const ownedUnique = targetKeys.filter((key) => owned.has(key)).length;
  const targetTotal = targetKeys.length;
  const percentComplete = targetTotal > 0 ? Math.round((ownedUnique / targetTotal) * 100) : 0;

  return {
    setCode,
    setName,
    ownedUnique,
    targetTotal,
    missingCount: Math.max(0, targetTotal - ownedUnique),
    percentComplete,
  };
}

function normalizeKeyPart(value: string): string {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}
