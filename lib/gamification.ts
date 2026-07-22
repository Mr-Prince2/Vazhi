export interface UserProgress {
  xp: number;
  level: number;
  nextLevelXp: number;
  rankTitle: string;
}

/**
 * Calculates XP earned from an individual journey log
 * @param mode Transport mode used
 * @param distanceKm Distance covered in kilometers
 */
export const calculateTripXp = (mode: string, distanceKm: number): number => {
  let basePoints = 10; // Base completion reward
  const kmPoints = Math.round(distanceKm * 2); // 2 XP per kilometer

  // Sustainability Multiplication Bonus (Rewarding Bus/Bike/Walk/Train)
  let multiplier = 1.0;
  if (mode === "Walk" || mode === "Bike") multiplier = 2.5;
  if (mode === "Bus" || mode === "Train" || mode === "Metro") multiplier = 1.8;
  if (mode === "Auto") multiplier = 1.2;

  return Math.round((basePoints + kmPoints) * multiplier);
};

/**
 * Determines current level status configurations based on aggregate cumulative XP
 * @param totalXp Cumulative points earned
 */
export const evaluateUserLevel = (totalXp: number): UserProgress => {
  let level = 1;
  let xpThreshold = 100;
  let remainingXp = totalXp;

  // Level-up curve calculation scaling dynamically
  while (remainingXp >= xpThreshold) {
    remainingXp -= xpThreshold;
    level++;
    xpThreshold = Math.round(xpThreshold * 1.5);
  }

  // NATPAC Community Rank Titles based on citizen data contributions
  let rankTitle = "Novice Pathfinder";
  if (level >= 3) rankTitle = "Green Commuter";
  if (level >= 7) rankTitle = "Eco Explorer";
  if (level >= 12) rankTitle = "Transit Champion";
  if (level >= 20) rankTitle = "NATPAC Elite Surveyor";

  return {
    xp: totalXp,
    level,
    nextLevelXp: xpThreshold,
    rankTitle,
  };
};
