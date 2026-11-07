/** Reproducible randomness: every draw is a hash of the round seed and a named key. */
export type Rand = (key: string) => number;
export function randFor(seed: string): Rand {
  return (key: string) => {
    let h = 2166136261;
    const str = seed + '|' + key;
    for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
    h ^= h >>> 15; h = Math.imul(h, 2246822507); h ^= h >>> 13; h = Math.imul(h, 3266489909); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}
export function pick<X>(xs: X[], r: number): X {
  return xs[Math.min(xs.length - 1, Math.floor(r * xs.length))];
}
export function shuffled<X>(xs: X[], rand: Rand, key: string): X[] {
  return xs.map((x, i) => ({ x, k: rand(key + '|' + i) })).sort((a, b) => a.k - b.k).map((y) => y.x);
}
