export const π = Math.PI;
export const τ = 2 * π;

// Fix the modulo operator (no negative return values)
export const mod = m => n => {
  const v = n % m;
  return v >= 0 ? v : v + m;
};

// normalize an angle 0 <= a < τ
export const normalAngle = mod(τ);

// center an angle -π <= a < π
export const centeredAngle = a => normalAngle(a + π) - π;

export const degrees = a => a * 180 / π;

// An array of numbers from start .. end-1
export const range = (end, start=0) =>
  [...Array(end - start)].map((v, i) => i + start);

// Convert a number to a fixed-point (3-decimal digit) string
export const fixed3 = num => num.toFixed(3);

/**
 * `flatten` accepts one argument, which must be an array. This does not recurse;
 * it only flattens one level of nesting.
 */
export const flatten = arr => [].concat(...arr);

/**
 * The arguments to unnest can be any combination of scalars and
 * arrays. This recurses until a flat array of scalars obtains.
 */
export const unnest = (...arr) =>
  arr.length === 1 ? (
    !Array.isArray(arr[0]) ? [arr[0]] : unnest(...arr[0])
  ) :
  flatten(arr.map(item => unnest(item)));
