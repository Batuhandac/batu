// O an gösterilen kliniklerin bellek-içi kaydı. Detay ekranı, gömülü listede
// olmayan topluluk kliniklerini buradan okur (yeniden sorgu gerektirmez).
import type { Clinic } from '@/types';

const registry = new Map<string, Clinic>();

export function registerClinics(clinics: Clinic[]): void {
  for (const c of clinics) registry.set(c.id, c);
}

export function getRegisteredClinic(id: string): Clinic | null {
  return registry.get(id) ?? null;
}
