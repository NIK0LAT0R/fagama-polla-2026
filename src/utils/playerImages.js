
const PLAYER_IMAGE_ALIASES = {
  'Aura C': 'AURA_C',
  'Bianca Padilla': 'BIANCA_PADILLA',
  'Clemencia Gamboa': 'CLEMENCIA_GAMBOA',
  'Dinara Gamboa': 'DINARA_GAMBOA',
  'Gabriela Gamboa': 'GABRIELA_GAMBOA',
  'Gordito': 'GORDITO',
  'Julian Gutierrez': 'JULIAN_GUTIERREZ',
  'Julio Padilla': 'JULIO_PADILLA',
  'Leonardo Padilla': 'LEONARDO_PADILLA',
  'Linda Patarroyo': 'LINDA_PATARROYO',
  'Ofelia Morales': 'OFELIA_MORALES',
  'Sandra Acero': 'SANDRA_ACERO',
  'Valentina Acero': 'VALENTINA_ACERO',
  'Tochi': 'TOCHI',

  // aliases útiles por si algunos nombres de la app están abreviados
  'Aura C.': 'AURA_C',
  'Sra. Sandra': 'SANDRA_ACERO',
  'Sandra': 'SANDRA_ACERO',
  'Linda': 'LINDA_PATARROYO',
};

function normalizeName(name = '') {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes
    .replace(/\./g, '') // quita puntos
    .trim()
    .replace(/\s+/g, '_')
    .toUpperCase();
}

export function getPlayerImageSrc(name) {
  const fileBase = PLAYER_IMAGE_ALIASES[name] ?? normalizeName(name);
  return `/players/${fileBase}.png`;
}

export function getPlayerInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
