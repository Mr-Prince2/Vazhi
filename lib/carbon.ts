// Environmental metric multipliers mapping estimated CO2 offsets (kg saved per km travel)
export const CARBON_OFFSETS: Record<string, number> = {
  Walk: 0.21,
  Bike: 0.21,
  Bus: 0.089,
  Auto: 0.058,
  Train: 0.041,
  Metro: 0.041,
  Car: 0.0, // Base reference point for private fossil-fuel vehicle emissions
};

/**
 * Calculates total carbon dioxide savings in kilograms
 * @param mode Transport modality utilized
 * @param distanceKm Total tracked distance in kilometers
 */
export const calculateCarbonSavings = (
  mode: string,
  distanceKm: number,
): number => {
  const multiplier = CARBON_OFFSETS[mode] ?? 0.0;
  return parseFloat((multiplier * distanceKm).toFixed(2));
};

/**
 * Maps environmental savings to real-world analogies for high-impact presentation slides
 * @param totalCo2Saved Total kilograms of CO2 offset
 */
export const getCarbonEquivalency = (totalCo2Saved: number) => {
  return {
    treesSaved: Math.round(totalCo2Saved * 0.045), // ~1 tree absorbs roughly 22kg CO2/year
    smartphoneCharges: Math.round(totalCo2Saved * 121.6), // Equivalent smartphone battery cycles
  };
};
