import { useCallback, useState } from 'react';
import { loadPets } from '@/lib/data/localStore';
import { loadCare, loadAllWeights } from '@/lib/data/care';
import { loadGameFlags } from '@/lib/data/gameStore';
import { useLocationStore } from '@/stores/location';
import { summarize, earnedBadges, type Badge, type GameInput } from '@/lib/game';

/** Pati karnesi: puan, seviye, rozetler ve ilk adımlar (ekrana her dönüşte reload). */
export function useGame() {
  const lat = useLocationStore((s) => s.lat);
  const [input, setInput] = useState<GameInput | null>(null);
  const [fresh, setFresh] = useState<Badge[]>([]);
  const [stepsClosed, setStepsClosed] = useState(true);

  const reload = useCallback(async () => {
    const [pets, care, weights, flags] = await Promise.all([loadPets(), loadCare(), loadAllWeights(), loadGameFlags()]);
    const g: GameInput = { pets, care, weights, locationShared: lat != null, firstAidSeen: flags.firstAidSeen };
    setInput(g);
    setStepsClosed(flags.stepsClosed);
    setFresh(earnedBadges(g).filter((b) => !flags.seenBadges.includes(b.id)));
  }, [lat]);

  return { input, summary: input ? summarize(input) : null, fresh, stepsClosed, reload };
}
