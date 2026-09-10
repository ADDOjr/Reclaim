import type { Item, MatchResult, ScoreLabel } from '@/types';
import { imageSimilarity } from '@/lib/imageHash';

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'it', 'this', 'that', 'was', 'were',
  'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'can', 'i', 'you', 'he', 'she',
  'we', 'they', 'them', 'his', 'her', 'their', 'my', 'your', 'our', 'its',
  'me', 'him', 'us', 'as', 'if', 'then', 'than', 'so', 'no', 'not', 'too',
  'very', 'just', 'about', 'some', 'any', 'all', 'each', 'every', 'other',
  'into', 'out', 'up', 'down', 'over', 'under', 'again', 'further', 'once',
  'here', 'there', 'when', 'where', 'why', 'how', 'what', 'which', 'who',
  'lost', 'found', 'item', 'please', 'help', 'thank', 'thanks',
]);

// Synonym groups for NLP-aware keyword matching
const SYNONYM_GROUPS: string[][] = [
  ['laptop', 'notebook', 'computer', 'macbook', 'chromebook'],
  ['phone', 'mobile', 'smartphone', 'cellphone', 'iphone', 'android', 'samsung'],
  ['bag', 'backpack', 'rucksack', 'knapsack', 'bookbag'],
  ['wallet', 'purse', 'billfold', 'pocketbook'],
  ['key', 'keys', 'keychain', 'keyring'],
  ['watch', 'timepiece', 'wristwatch'],
  ['headphones', 'earbuds', 'earphones', 'airpods'],
  ['tablet', 'ipad', 'kindle'],
  ['jacket', 'coat', 'parka', 'blazer'],
  ['bottle', 'flask', 'thermos', 'tumbler'],
  ['glasses', 'sunglasses', 'spectacles'],
  ['umbrella', 'parasol'],
  ['charger', 'adapter', 'cable', 'cord'],
  ['book', 'textbook', 'novel', 'notebook'],
  ['card', 'id', 'license', 'badge', 'permit'],
  ['ring', 'bracelet', 'necklace', 'jewelry', 'jewellery'],
  ['black', 'dark'],
  ['white', 'light'],
  ['blue', 'navy'],
  ['red', 'crimson', 'maroon'],
  ['dell', 'hp', 'lenovo', 'acer', 'asus', 'apple'],
  ['nike', 'adidas', 'puma', 'reebok'],
];

const SYNONYM_MAP: Map<string, Set<string>> = new Map();
for (const group of SYNONYM_GROUPS) {
  const expanded = new Set(group);
  for (const word of group) {
    const existing = SYNONYM_MAP.get(word);
    if (existing) {
      for (const w of expanded) existing.add(w);
    } else {
      SYNONYM_MAP.set(word, new Set(expanded));
    }
  }
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1 && !STOP_WORDS.has(w))
  );
}

function expandWithSynonyms(tokens: Set<string>): Set<string> {
  const expanded = new Set<string>(tokens);
  for (const word of tokens) {
    const syns = SYNONYM_MAP.get(word);
    if (syns) {
      for (const s of syns) expanded.add(s);
    }
  }
  return expanded;
}

/**
 * NLP-enhanced Jaccard similarity with synonym expansion.
 * "Black Dell laptop" and "Dark Dell notebook computer" will share
 * tokens like dell, laptop<->notebook, computer, black<->dark.
 */
function nlpSimilarity(textA: string, textB: string): number {
  const tokensA = expandWithSynonyms(tokenize(textA));
  const tokensB = expandWithSynonyms(tokenize(textB));
  if (tokensA.size === 0 && tokensB.size === 0) return 0;
  let intersection = 0;
  for (const word of tokensA) {
    if (tokensB.has(word)) intersection += 1;
  }
  const union = tokensA.size + tokensB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function colorSimilarity(a: string, b: string): number {
  const colorMap: Record<string, string[]> = {
    navy: ['blue', 'navy'],
    blue: ['blue', 'navy'],
    gray: ['gray', 'silver', 'white'],
    silver: ['silver', 'gray', 'white'],
    beige: ['beige', 'brown', 'white'],
    brown: ['brown', 'beige'],
    gold: ['gold', 'yellow', 'orange'],
    multicolor: ['multicolor'],
  };
  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  if (al === bl) return 1;
  const group = colorMap[al];
  if (group && group.includes(bl)) return 0.85;
  const groupB = colorMap[bl];
  if (groupB && groupB.includes(al)) return 0.85;
  return 0;
}

function daysBetween(d1: Date, d2: Date): number {
  return Math.abs(d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24);
}

function locationSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const tokensA = a.toLowerCase().split(/[\s,]+/).filter((t) => t.length > 2);
  const tokensB = b.toLowerCase().split(/[\s,]+/).filter((t) => t.length > 2);
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  let matches = 0;
  for (const t of tokensA) {
    if (tokensB.includes(t)) matches += 1;
  }
  return Math.min(matches / Math.max(1, tokensB.length), 1);
}

export function scoreMatch(source: Item, candidate: Item): MatchResult {
  const weights = {
    category: 0.15,
    color: 0.1,
    brand: 0.15,
    keywords: 0.25,
    date: 0.1,
    location: 0.1,
    image: 0.15,
  };

  const categoryScore = source.category.toLowerCase() === candidate.category.toLowerCase() ? 1 : 0;
  const colorScore = colorSimilarity(source.color, candidate.color);

  let brandScore = 0;
  if (source.brand && candidate.brand) {
    const sb = source.brand.toLowerCase().trim();
    const cb = candidate.brand.toLowerCase().trim();
    if (sb === cb) brandScore = 1;
    else if (sb.includes(cb) || cb.includes(sb)) brandScore = 0.8;
  } else if (!source.brand && !candidate.brand) {
    brandScore = 0.5;
  }

  const keywordsScore = nlpSimilarity(
    `${source.title} ${source.description}`,
    `${candidate.title} ${candidate.description}`
  );

  const dateDiff = daysBetween(new Date(source.date_event), new Date(candidate.date_event));
  const dateScore = Math.max(0, 1 - dateDiff / 30);

  const locationScore = locationSimilarity(source.location, candidate.location);

  const imageScore = imageSimilarity(source.image_hash, candidate.image_hash);

  const breakdown = {
    category: categoryScore,
    color: colorScore,
    brand: brandScore,
    keywords: keywordsScore,
    date: dateScore,
    location: locationScore,
    image: imageScore,
  };

  const score = Math.round(
    (categoryScore * weights.category +
      colorScore * weights.color +
      brandScore * weights.brand +
      keywordsScore * weights.keywords +
      dateScore * weights.date +
      locationScore * weights.location +
      imageScore * weights.image) *
      100
  );

  return { item: candidate, score, breakdown };
}

export function findMatches(source: Item, candidates: Item[]): MatchResult[] {
  return candidates
    .map((c) => scoreMatch(source, c))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function scoreLabel(score: number): ScoreLabel {
  if (score >= 85) return { label: 'Excellent match', badgeClass: 'bg-emerald-100 text-emerald-700' };
  if (score >= 70) return { label: 'Strong match', badgeClass: 'bg-green-100 text-green-700' };
  if (score >= 50) return { label: 'Possible match', badgeClass: 'bg-amber-100 text-amber-700' };
  if (score >= 30) return { label: 'Weak match', badgeClass: 'bg-orange-100 text-orange-700' };
  return { label: 'Unlikely match', badgeClass: 'bg-red-100 text-red-700' };
}
