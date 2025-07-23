export function uniforme(rnd: number, min: number, max: number) {
  return min + rnd * (max - min);
}

export function exponencial(rnd: number, media: number) {
  return -media * Math.log(1 - rnd);
}

export function normal(rnd: number, mu: number, sigma: number) {
  return (
    Math.sqrt(-2 * Math.log(rnd)) * Math.cos(2 * Math.PI * rnd) * sigma + mu
  );
}

export function limites(resultado: number, min: number, max: number) {
  return Math.min(Math.max(resultado, min), max);
}
