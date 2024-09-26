
// Mix two numbers together to create a new number
export function mixSeeds(inputNumber: number, iterationNumber: number): number {
  // Use BigInt to avoid overflow issues
  let a = BigInt(inputNumber);
  let b = BigInt(iterationNumber);
  
  // Prime numbers for mixing
  const prime1 = BigInt(2_147_483_647);
  const prime2 = BigInt(2_147_483_629);
  
  // Mixing algorithm
  let result = (a * prime1) ^ (b * prime2);
  result = result ^ (result >> BigInt(32));
  result = result * BigInt(0x45d9f3b) + BigInt(0x1);
  result = result ^ (result >> BigInt(32));

  // Convert back to a regular number, using modulo to keep it within safe integer range
  return Number(result % BigInt(Number.MAX_SAFE_INTEGER));
}