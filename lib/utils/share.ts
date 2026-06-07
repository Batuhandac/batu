import { Share, Linking } from 'react-native';
import type { Pet } from '@/types';

export function buildPetCardText(pet: Pet): string {
  const lines: string[] = [`🐾 ${pet.name}`];
  const meta: string[] = [];
  if (pet.species) meta.push(pet.species);
  if (pet.breed) meta.push(pet.breed);
  if (pet.age_years) meta.push(`${pet.age_years} yaş`);
  if (pet.weight_kg) meta.push(`${pet.weight_kg} kg`);
  if (meta.length) lines.push(meta.join(' / '));
  if (pet.allergies) lines.push(`Alerji: ${pet.allergies}`);
  if (pet.chronic_conditions) lines.push(`Kronik: ${pet.chronic_conditions}`);
  if (pet.medications) lines.push(`İlaçlar: ${pet.medications}`);
  if (pet.last_vaccine_date) lines.push(`Son aşı: ${pet.last_vaccine_date}`);
  if (pet.last_parasite_date) lines.push(`Son parazit: ${pet.last_parasite_date}`);
  if (pet.emergency_note) lines.push(`⚠️ Acil not: ${pet.emergency_note}`);
  if (pet.owner_name || pet.owner_phone) {
    lines.push(`Sahip: ${[pet.owner_name, pet.owner_phone].filter(Boolean).join(' — ')}`);
  }
  return lines.join('\n');
}

export async function sharePetCard(pet: Pet) {
  const text = buildPetCardText(pet);
  await Share.share({ message: text });
}

export async function shareViaWhatsApp(pet: Pet) {
  const text = encodeURIComponent(buildPetCardText(pet));
  const url = `whatsapp://send?text=${text}`;
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  } else {
    await sharePetCard(pet);
  }
}
