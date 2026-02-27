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

export const formatNutrient = (value: number | string): string => {
  if (value == null) return '0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  if (num === 0) return '0';
  if (Number.isInteger(num)) return num.toString();

  const formatted = num.toFixed(1);
  const cleaned = formatted.replace(/\.0$/, '');
  return cleaned.replace('.', ',');
};

export const formatUnit = (unit: string): string => {
  if (!unit) return '';
  return unit.toLowerCase();
};

export const formatHorario = (h: string): string => {
  if (!h) return '';
  return h.replace(/^(\d{2}:\d{2}):?\d{0,2}$/, '$1');
};
