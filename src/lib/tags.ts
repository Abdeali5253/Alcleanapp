export function extractCategory(tags: string[]): string {
  if (!tags) return "other";

  if (tags.includes("Bathroom Cleaner")) return "bathroom";
  if (tags.includes("Car Wash Shampoo")) return "car-wash";
  if (tags.includes("Fabric Washing")) return "fabric";
  if (tags.includes("Floor Cleaner")) return "floor";
  if (tags.includes("Cleaning Chemicals")) return "cleaning-chemicals";
  if (tags.includes("Cleaning Equipment")) return "cleaning-equipment";

  return "other";
}

export function extractSubcategory(tags: string[]): string {
  if (!tags) return "general";

  return tags[0]?.toLowerCase().replace(/\s+/g, "-") || "general";
}
