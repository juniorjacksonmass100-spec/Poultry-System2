const labels: Record<string, { en: string; sw: string }> = {
  indigenous_chicken: { en: 'Indigenous chicken', sw: 'Kuku wa kienyeji' },
  'kienyeji chicken': { en: 'Indigenous chicken', sw: 'Kuku wa kienyeji' },
  crossbred_chicken: { en: 'Crossbred chicken', sw: 'Kuku wa chotara' },
  'crossbred chicken': { en: 'Crossbred chicken', sw: 'Kuku wa chotara' },
  broiler: { en: 'Meat chicken', sw: 'Kuku wa nyama' },
  'broiler chicken': { en: 'Meat chicken', sw: 'Kuku wa nyama' },
  layer: { en: 'Egg-laying chicken', sw: 'Kuku wa mayai' },
  'layer chicken': { en: 'Egg-laying chicken', sw: 'Kuku wa mayai' },
  duck: { en: 'Duck', sw: 'Bata' },
  turkey: { en: 'Turkey', sw: 'Bata mzinga' },
};

/** Translate known poultry categories while preserving user-entered species names. */
export const poultryTypeLabel = (value: string, isSw: boolean): string => {
  const normalized = value.trim().toLowerCase().replace(/_/g, ' ');
  const known = labels[normalized];
  return known ? (isSw ? known.sw : known.en) : value;
};
