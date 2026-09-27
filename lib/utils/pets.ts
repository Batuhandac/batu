// Pet türü etiketleri — kayıtta 'dog' | 'cat' | 'other' saklanır.
export function speciesLabel(species: string | null | undefined, possessive = false): string {
  switch (species) {
    case 'dog':
      return possessive ? 'Köpeğim' : 'Köpek';
    case 'cat':
      return possessive ? 'Kedim' : 'Kedi';
    case 'other':
    case null:
    case undefined:
    case '':
      return possessive ? 'Evcil hayvanım' : 'Evcil hayvan';
    default:
      return possessive ? `${species}` : species;
  }
}

export function speciesEmoji(species: string | null | undefined): string {
  return species === 'cat' ? '🐱' : species === 'dog' ? '🐶' : '🐾';
}
