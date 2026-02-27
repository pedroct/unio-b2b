export const formatFoodName = (descricao: string): string => {
  if (!descricao) return '';

  return descricao
    .replace(/\bc\/\s*/g, 'com ')
    .replace(/\bs\/\s*/g, 'sem ')
    .replace(/,\s*Brasil\s*$/i, '')
    .replace(/,\s*todas as variedades/gi, '')
    .replace(/,\s*cru\s*$/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

export const formatNutrient = (value: number): string => {
  if (value == null || isNaN(value)) return '0';
  if (value === 0) return '0';
  if (Number.isInteger(value)) return value.toString();

  const formatted = value.toFixed(1);
  const cleaned = formatted.replace(/\.0$/, '');
  return cleaned.replace('.', ',');
};

export const formatUnit = (unit: string): string => {
  if (!unit) return '';
  return unit.toLowerCase();
};
