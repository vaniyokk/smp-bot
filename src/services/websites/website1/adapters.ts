/**
 * Data adapters for Website1 (MyMusicSheet)
 * Handles mapping between Notion data and website-specific formats
 */

/**
 * Map Notion difficulty values to website dropdown options
 */
export function mapDifficulty(difficulty?: string): string {
  if (!difficulty) return "Normal";

  const difficultyMap: { [key: string]: string } = {
    Easy: "Easy",
    Medium: "Normal",
    Hard: "Hard",
    Expert: "Expert",
    Beginner: "Beginner",
  };

  return difficultyMap[difficulty] || "Normal";
}

/**
 * Map Notion type values to website instrumentation options
 */
export function mapInstrumentation(type?: string): string {
  if (!type) return "Solo";

  const instrumentationMap: { [key: string]: string } = {
    "Piano Solo": "Solo",
    "Piano Ensemble": "Ensemble",
    "Piano Duet": "Four Hands",
    Orchestra: "Orchestra",
    Band: "Band",
  };

  return instrumentationMap[type] || "Solo";
}