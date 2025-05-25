
/**
 * Utilities for consolidating ingredient quantities
 */

/**
 * Consolidate similar quantities for better readability
 */
export function consolidateQuantities(quantities: string[]): string {
  if (quantities.length === 0) return "";
  if (quantities.length === 1) return quantities[0];
  
  // Group similar units
  const numericValues: number[] = [];
  const units = new Set<string>();
  
  // Extract numeric values and units
  quantities.forEach(qty => {
    const match = qty.match(/^([\d\/\.]+)\s*(.*)$/);
    if (match) {
      // Convert fractions to decimals
      let value = match[1];
      if (value.includes('/')) {
        const [numerator, denominator] = value.split('/');
        value = (parseFloat(numerator) / parseFloat(denominator)).toString();
      }
      numericValues.push(parseFloat(value));
      if (match[2]) units.add(match[2]);
    }
  });
  
  // If we have numeric values and consistent units
  if (numericValues.length > 0 && units.size === 1) {
    const totalValue = numericValues.reduce((sum, val) => sum + val, 0);
    return `${totalValue} ${Array.from(units)[0]}`;
  }
  
  // If consolidation isn't possible, join with plus signs
  return quantities.join(" + ");
}
