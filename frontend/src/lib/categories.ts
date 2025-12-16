export interface SubCategory {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  subcategories: SubCategory[];
}

export const categories: Category[] = [
  {
    id: "cleaning-chemicals",
    name: "Cleaning Chemicals",
    subcategories: [
      {
        id: "fabric-washing",
        name: "Fabric Washing",
      },
      {
        id: "multi-purpose-cleaner",
        name: "Multi Purpose Cleaner",
      },
      {
        id: "kitchen-cleaning",
        name: "Kitchen Cleaning Solution",
      },
      {
        id: "hand-washing",
        name: "Hand Washing Chemical",
      },
      {
        id: "bathroom-cleaning",
        name: "Bathroom Cleaning Solution",
      },
      {
        id: "car-cleaning",
        name: "Car Cleaning Solution",
      },
      {
        id: "solar-panel-cleaning",
        name: "Solar Panel Cleaning Solution",
      },
      {
        id: "industrial-floor-degreaser",
        name: "Industrial Floor Degreaser",
      },
      {
        id: "food-grade-cleaning",
        name: "Food Grade Cleaning Solution",
      },
    ],
  },
  {
    id: "cleaning-equipment",
    name: "Cleaning Equipment",
    subcategories: [
      {
        id: "bathroom-equipment",
        name: "Bathroom Cleaning Equipment",
      },
      {
        id: "cleaning-robot",
        name: "Cleaning Robot",
      },
      {
        id: "cleaning-tools",
        name: "Cleaning Tools",
      },
      {
        id: "floor-cleaning-vipers",
        name: "Floor Cleaning Vipers / Brushes / Wet Mops / Dry Mops",
      },
      {
        id: "mop-buckets",
        name: "Mop Buckets / Wringers / Cleaning Janitorial Trolleys",
      },
      {
        id: "plastic-dustbin",
        name: "Plastic Dustbin Industrial / Home Use",
      },
      {
        id: "safety-equipment",
        name: "Safety Equipments",
      },
      {
        id: "solar-window-equipment",
        name: "Solar Panel / Glass / Window Cleaning Equipments",
      },
      {
        id: "stainless-dustbin",
        name: "Stainless Steel Dustbin Industrial & Home Use",
      },
      {
        id: "tissue-dispensers",
        name: "Tissue Rolls & Dispensers",
      },
      {
        id: "industrial-cleaning",
        name: "Industrial Cleaning Solution",
      },
    ],
  },
];

export interface ProductItem {
  id: string;
  name: string;
  subcategoryId: string;
}

export const fabricWashingProducts: ProductItem[] = [
  { id: "fd-1", name: "Fabric Detergent", subcategoryId: "fabric-washing" },
  { id: "fc-1", name: "Fabric Cleaner", subcategoryId: "fabric-washing" },
  { id: "fs-1", name: "Fabric Softener and Enhancer", subcategoryId: "fabric-washing" },
  { id: "fcb-1", name: "Fabric Color Bleach", subcategoryId: "fabric-washing" },
  { id: "wb-1", name: "White Cloth Bleach", subcategoryId: "fabric-washing" },
  { id: "fst-1", name: "Fabric Starch", subcategoryId: "fabric-washing" },
];

export const multiPurposeProducts: ProductItem[] = [
  { id: "ap-1", name: "Activated Phenyl", subcategoryId: "multi-purpose-cleaner" },
  { id: "sp-1", name: "Super Phenyl", subcategoryId: "multi-purpose-cleaner" },
  { id: "ml-1", name: "Mop Lotion", subcategoryId: "multi-purpose-cleaner" },
  { id: "sc-1", name: "Surface Cleaner", subcategoryId: "multi-purpose-cleaner" },
  { id: "fs-2", name: "Floor Shiner", subcategoryId: "multi-purpose-cleaner" },
];

export const kitchenProducts: ProductItem[] = [
  { id: "dw-1", name: "Dish Wash", subcategoryId: "kitchen-cleaning" },
  { id: "kd-1", name: "Kitchen De-Greaser", subcategoryId: "kitchen-cleaning" },
  { id: "fv-1", name: "Fruit & Veggie Cleaner", subcategoryId: "kitchen-cleaning" },
];

export const handWashingProducts: ProductItem[] = [
  { id: "hw-1", name: "Hand Wash", subcategoryId: "hand-washing" },
  { id: "fhw-1", name: "Foamy Hand Wash", subcategoryId: "hand-washing" },
];

export const bathroomProducts: ProductItem[] = [
  { id: "tbc-1", name: "Toilet Bowl Cleaner", subcategoryId: "bathroom-cleaning" },
  { id: "bc-1", name: "Bathroom Cleaner", subcategoryId: "bathroom-cleaning" },
];

export const carCleaningProducts: ProductItem[] = [
  { id: "ccs-1", name: "Car Cleaning Shampoo", subcategoryId: "car-cleaning" },
];

export const solarPanelProducts: ProductItem[] = [
  { id: "spc-1", name: "Solar Panel Cleaner", subcategoryId: "solar-panel-cleaning" },
];

export const industrialFloorProducts: ProductItem[] = [
  { id: "dmc-1", name: "Degreaser Multi Clean", subcategoryId: "industrial-floor-degreaser" },
];

export const foodGradeProducts: ProductItem[] = [
  { id: "cip-1", name: "CIP Cleaner", subcategoryId: "food-grade-cleaning" },
];

export const allChemicalProducts = [
  ...fabricWashingProducts,
  ...multiPurposeProducts,
  ...kitchenProducts,
  ...handWashingProducts,
  ...bathroomProducts,
  ...carCleaningProducts,
  ...solarPanelProducts,
  ...industrialFloorProducts,
  ...foodGradeProducts,
];
