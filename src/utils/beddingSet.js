const CONTENTS_TITLE = /^(?:комплектация|состав комплекта|что входит в комплект)\s*:?$/i;
const LIST_MARKER = /^[▸►•▪–—-]\s*/;
const PIECE_LABEL = /^(?:одеял[оа]|пододеяльник(?:а|и|ов)?|наволочк[аи]|простын[яиь]|покрывал[оа])(?:\s*[:–—-]\s*|\s+)(.+)$/i;
const MEASUREMENTS = /^\d{2,3}\s*[×xх]\s*\d{2,3}(?:\s*(?:см|мм))?(?:\s*\([1-9]\d*\)|(?:\s+|\s*[-–—]\s*)[1-9]\d*\s*шт\.?)?$/i;
const PIECE_COUNT = /^[1-9]\d*\s*шт\.?$/i;
const NO_SHEET = /^(?:без простыни|простыня (?:не входит(?: в комплект)?|не включена))[.!]?$/i;

function normalizeSizeLabel(value) {
  const label = String(value || '')
    .trim()
    .toLowerCase()
    .replaceAll('ё', 'е')
    .replace(/[\s‐‑–—-]+/g, ' ');

  if (/^(?:1[.,]5(?:\s*спальн(?:ый|ое))?|полуторн(?:ый|ое))$/.test(label)) return '1,5';
  if (/^(?:2(?:\s*спальн(?:ый|ое))?|двуспальн(?:ый|ое))$/.test(label)) return '2';
  if (/^(?:семейн(?:ый|ое)|дуэт)$/.test(label)) return 'семейный';
  return label;
}

function readContentsGroups(section) {
  const groups = [{ size: '', lines: [] }];
  let group = groups[0];

  for (const rawLine of String(section.description || '').split(/\r?\n/)) {
    const line = rawLine.trim().replace(LIST_MARKER, '');
    if (!line) continue;
    if (line.endsWith(':')) {
      group = { size: normalizeSizeLabel(line.slice(0, -1)), lines: [] };
      groups.push(group);
    } else {
      group.lines.push(line);
    }
  }

  for (const { label, value } of section.items) {
    if (label && value) groups[0].lines.push(`${label.trim()} ${String(value).trim()}`);
  }

  return groups;
}

function readPiece(line) {
  if (NO_SHEET.test(line)) return 'Без простыни';

  const facts = line.match(PIECE_LABEL)?.[1];
  if (!facts || (!MEASUREMENTS.test(facts) && !PIECE_COUNT.test(facts))) return '';

  return line
    .replace(/\s*[xх×]\s*(?=\d)/gi, '×')
    .replace(/\s*\(([1-9]\d*)\)$/, ' · $1 шт.')
    .replace(/^./, (letter) => letter.toUpperCase());
}

export function getBeddingSetContents(specificationSections, selectedVariant, variantCount) {
  if (!selectedVariant) return [];

  const selectedSizes = [selectedVariant.sizeLabel, selectedVariant.sizeCode, selectedVariant.name]
    .map(normalizeSizeLabel)
    .filter(Boolean);
  const groups = specificationSections
    .filter(({ title }) => CONTENTS_TITLE.test(String(title || '').trim()))
    .flatMap(readContentsGroups);
  const hasSizeGroups = groups.some(({ size }) => size);
  const matching = hasSizeGroups
    ? groups.filter(({ size }) => selectedSizes.includes(size))
    : groups.filter(({ lines }) => variantCount === 1 && lines.length > 0);

  if (matching.length !== 1) return [];

  const pieces = [...new Set(matching[0].lines.map(readPiece))];
  if (pieces.includes('')) return [];
  if (pieces.includes('Без простыни') && pieces.some((piece) => /^Простын/i.test(piece))) return [];
  return pieces;
}
