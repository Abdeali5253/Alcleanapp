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
        id: "floor-cleaning-chemical",
        name: "Floor Cleaning Chemical",
      },
      {
        id: "multi-purpose-chemicals",
        name: "Multi Purpose Chemicals",
      },
      {
        id: "industrial-cleaning-chemicals",
        name: "Industrial Cleaning Chemicals",
      },
      {
        id: "top-cleaning-chemicals",
        name: "Top Cleaning Chemicals",
      },
      {
        id: "fabric-cleaning-chemical",
        name: "Fabric Cleaning Chemical",
      },
      {
        id: "bathroom-cleaning-chemical",
        name: "Bathroom Cleaning Solution",
      },
      {
        id: "hand-washing-cleaning",
        name: "Hand Washing Cleaning",
      },
      {
        id: "kitchen-cleaning-solution",
        name: "Kitchen Cleaning Solution",
      },
    ],
  },
  {
    id: "cleaning-equipment",
    name: "Cleaning Equipment",
    subcategories: [
      {
        id: "mop-buckets",
        name: "Mop Buckets / Wringers / Cleaning Janitorial Trolleys",
      },
      {
        id: "soap-dispenser",
        name: "Soap Dispenser",
      },
      {
        id: "tissue-rolls-dispensers",
        name: "Tissue Rolls & Dispensers",
      },
      {
        id: "top-cleaning-equipments",
        name: "Top Cleaning Equipments",
      },
      {
        id: "cleaning-tools",
        name: "CLEANING TOOLS",
      },
      {
        id: "cleaning-equipment",
        name: "Cleaning Equipment",
      },
      {
        id: "plastic-dustbin",
        name: "Plastic Dustbin Industrial / Home Use",
      },
      {
        id: "floor-cleaning-vipers",
        name: "Floor Cleaning : Vipers / Brushes / Wet Mops / Dry Mops",
      },
      {
        id: "safety-equipments",
        name: "Safety Equipments",
      },
      {
        id: "cleaning-robots",
        name: "Cleaning Robots",
      },
      {
        id: "cleaning-machines",
        name: "Vacuum / Floor / Carpet Cleaning Machines",
      },
      {
        id: "floor-cleaning-equipments",
        name: "Home Use Floor Cleaning Equipments",
      },
    ],
  },
  {
    id: "bathroom-cleaning",
    name: "Bathroom Cleaning",
    subcategories: [
      {
        id: "bathroom-cleaning-solution",
        name: "Bathroom Cleaning Solution",
      },
      {
        id: "toilet-bowl-cleaner",
        name: "Toilet Bowl Cleaner",
      },
      {
        id: "bathroom-cleaner",
        name: "Bathroom Cleaner",
      },
      {
        id: "bathroom-cleaning-chemical",
        name: "Bathroom Cleaning Chemical",
      },
    ],
  },
  {
    id: "car-washing",
    name: "Car Washing",
    subcategories: [
      {
        id: "car-cleaning-solution",
        name: "Car Cleaning Solution",
      },
    ],
  },
  {
    id: "fabric-cleaning",
    name: "Fabric Cleaning",
    subcategories: [
      {
        id: "fabric-washing",
        name: "Fabric Washing",
      },
      {
        id: "fabric-detergent",
        name: "Fabric Detergent",
      },
      {
        id: "fabric-color-bleach",
        name: "Fabric Color Bleach",
      },
      {
        id: "fabric-cleaner",
        name: "Fabric Cleaner",
      },
      {
        id: "fabric-cleaning-chemical",
        name: "Fabric Cleaning Chemical",
      },
      {
        id: "fabric-softener-enhancer",
        name: "Fabric Softener Enhancer",
      },
      {
        id: "white-cloth-bleach",
        name: "White Cloth Bleach",
      },
    ],
  },
  {
    id: "dishwashing",
    name: "Dishwashing",
    subcategories: [
      {
        id: "dish-wash-powder",
        name: "Dish Wash Powder",
      },
      {
        id: "dish-wash",
        name: "Dish Wash",
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
  {
    id: "fs-1",
    name: "Fabric Softener and Enhancer",
    subcategoryId: "fabric-washing",
  },
  { id: "fcb-1", name: "Fabric Color Bleach", subcategoryId: "fabric-washing" },
  { id: "wb-1", name: "White Cloth Bleach", subcategoryId: "fabric-washing" },
  { id: "fst-1", name: "Fabric Starch", subcategoryId: "fabric-washing" },
];

export const multiPurposeProducts: ProductItem[] = [
  {
    id: "ap-1",
    name: "Activated Phenyl",
    subcategoryId: "multi-purpose-cleaner",
  },
  { id: "sp-1", name: "Super Phenyl", subcategoryId: "multi-purpose-cleaner" },
  { id: "ml-1", name: "Mop Lotion", subcategoryId: "multi-purpose-cleaner" },
  {
    id: "sc-1",
    name: "Surface Cleaner",
    subcategoryId: "multi-purpose-cleaner",
  },
  { id: "fs-2", name: "Floor Shiner", subcategoryId: "multi-purpose-cleaner" },
];

export const kitchenProducts: ProductItem[] = [
  { id: "dw-1", name: "Dish Wash", subcategoryId: "kitchen-cleaning" },
  { id: "kd-1", name: "Kitchen De-Greaser", subcategoryId: "kitchen-cleaning" },
  {
    id: "fv-1",
    name: "Fruit & Veggie Cleaner",
    subcategoryId: "kitchen-cleaning",
  },
];

export const handWashingProducts: ProductItem[] = [
  { id: "hw-1", name: "Hand Wash", subcategoryId: "hand-washing" },
  { id: "fhw-1", name: "Foamy Hand Wash", subcategoryId: "hand-washing" },
];

export const bathroomProducts: ProductItem[] = [
  {
    id: "tbc-1",
    name: "Toilet Bowl Cleaner",
    subcategoryId: "bathroom-cleaning",
  },
  { id: "bc-1", name: "Bathroom Cleaner", subcategoryId: "bathroom-cleaning" },
];

export const carCleaningProducts: ProductItem[] = [
  { id: "ccs-1", name: "Car Cleaning Shampoo", subcategoryId: "car-cleaning" },
];

export const solarPanelProducts: ProductItem[] = [
  {
    id: "spc-1",
    name: "Solar Panel Cleaner",
    subcategoryId: "solar-panel-cleaning",
  },
];

export const industrialFloorProducts: ProductItem[] = [
  {
    id: "dmc-1",
    name: "Degreaser Multi Clean",
    subcategoryId: "industrial-floor-degreaser",
  },
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
