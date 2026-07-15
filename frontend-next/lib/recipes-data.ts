export type RecipeCategory =
  | "BREAKFAST"
  | "LUNCH"
  | "DINNER"
  | "BBQ"
  | "TRADITIONAL_GHANAIAN"
  | "INTERNATIONAL";

export const RECIPE_CATEGORY_LABEL: Record<RecipeCategory, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  BBQ: "BBQ",
  TRADITIONAL_GHANAIAN: "Traditional Ghanaian",
  INTERNATIONAL: "International",
};

export interface Recipe {
  slug: string;
  title: string;
  category: RecipeCategory;
  description: string;
  prepMinutes: number;
  cookMinutes: number;
  servings: number;
  ingredients: string[];
  steps: string[];
  videoUrl?: string;
}

export const RECIPES: Recipe[] = [
  {
    slug: "pork-sausage-breakfast-hash",
    title: "Pork Sausage Breakfast Hash",
    category: "BREAKFAST",
    description: "A one-pan breakfast of spiced pork sausage, potatoes, and peppers — ready in under 30 minutes.",
    prepMinutes: 10,
    cookMinutes: 20,
    servings: 2,
    ingredients: [
      "2 Adepa Spiced Pork Sausages, sliced",
      "2 medium potatoes, diced",
      "1 onion, sliced",
      "1 bell pepper, sliced",
      "2 tbsp vegetable oil",
      "Salt and black pepper to taste",
      "2 eggs (optional, for serving)",
    ],
    steps: [
      "Heat oil in a large skillet over medium heat and add the diced potatoes. Cook, stirring occasionally, for 10-12 minutes until golden and tender.",
      "Push the potatoes to one side, add the sliced sausage, onion, and pepper to the other side, and cook for 5-6 minutes until the sausage is browned through.",
      "Mix everything together, season with salt and pepper, and cook for another 2 minutes.",
      "Fry the eggs separately and serve on top, if using.",
    ],
  },
  {
    slug: "kumasi-pork-kebabs",
    title: "Kumasi-Style Pork Kebabs",
    category: "BBQ",
    description: "Skewered pork shoulder marinated in a smoky pepper spice blend and grilled over open flame.",
    prepMinutes: 20,
    cookMinutes: 15,
    servings: 4,
    ingredients: [
      "1kg Adepa Fresh Pork Shoulder, cubed",
      "3 cloves garlic, minced",
      "1 tbsp ginger, grated",
      "2 tbsp suya spice (or dried chili flakes + ground pepper)",
      "2 tbsp vegetable oil",
      "1 onion, cut into chunks",
      "1 bell pepper, cut into chunks",
      "Salt to taste",
    ],
    steps: [
      "Combine garlic, ginger, suya spice, oil, and salt in a bowl. Add the pork cubes and toss to coat evenly. Marinate for at least 2 hours, or overnight in the fridge.",
      "Thread the pork onto skewers, alternating with chunks of onion and pepper.",
      "Grill over medium-high heat (or a charcoal fire for the best flavour), turning every 3-4 minutes, until charred outside and cooked through — about 15 minutes total.",
      "Rest for 5 minutes before serving with extra suya spice on the side.",
    ],
  },
  {
    slug: "pork-belly-red-red",
    title: "Pork Belly Red-Red",
    category: "TRADITIONAL_GHANAIAN",
    description: "A pork twist on the Ghanaian classic — black-eyed beans stewed in palm oil, served with fried pork belly and ripe plantain.",
    prepMinutes: 15,
    cookMinutes: 45,
    servings: 4,
    ingredients: [
      "500g Adepa Pork Belly Slab, cut into strips",
      "2 cups black-eyed beans, soaked and boiled until tender",
      "4 tbsp palm oil",
      "1 onion, chopped",
      "2 tomatoes, blended",
      "1 tbsp ginger-garlic paste",
      "1-2 scotch bonnet peppers, to taste",
      "Salt and stock seasoning to taste",
      "2 ripe plantains, sliced and fried",
    ],
    steps: [
      "Season the pork belly strips with salt and fry in a dry pan until crisp and browned. Set aside.",
      "Heat the palm oil in a pot, add onions, and cook until soft. Add ginger-garlic paste and blended tomatoes, and cook down for 10 minutes.",
      "Add the boiled beans along with a little of their cooking liquid, the scotch bonnet, and seasoning. Simmer for 15-20 minutes until the sauce thickens.",
      "Stir the fried pork belly into the beans, or serve it on top.",
      "Serve hot with fried ripe plantain.",
    ],
  },
  {
    slug: "grilled-pork-chops-pepper-sauce",
    title: "Grilled Pork Chops with Pepper Sauce",
    category: "DINNER",
    description: "Simple grilled pork chops finished with a fiery Ghanaian-style pepper sauce (shito-adjacent, but fresh).",
    prepMinutes: 10,
    cookMinutes: 20,
    servings: 4,
    ingredients: [
      "4 Adepa Pork Chops",
      "2 tbsp oil, plus extra for the sauce",
      "Salt and black pepper",
      "3 tomatoes",
      "2 red bell peppers",
      "2 scotch bonnet peppers",
      "1 onion",
      "2 cloves garlic",
    ],
    steps: [
      "Season the pork chops with salt, pepper, and a little oil. Grill or pan-sear over medium-high heat for 4-5 minutes per side, until cooked through.",
      "Meanwhile, blend the tomatoes, bell peppers, scotch bonnet, onion, and garlic to a coarse paste.",
      "Fry the paste in oil over medium heat for 15-20 minutes, stirring occasionally, until it darkens and the oil separates.",
      "Spoon the pepper sauce generously over the grilled chops and serve.",
    ],
  },
  {
    slug: "pork-belly-ramen",
    title: "Pork Belly Ramen",
    category: "INTERNATIONAL",
    description: "Slow-braised pork belly in a rich soy-ginger broth over ramen noodles — a weekend project worth the wait.",
    prepMinutes: 20,
    cookMinutes: 120,
    servings: 4,
    ingredients: [
      "800g Adepa Pork Belly Slab",
      "4 cups chicken or pork stock",
      "1/4 cup soy sauce",
      "2 tbsp brown sugar",
      "1 thumb ginger, sliced",
      "3 cloves garlic",
      "2 spring onions",
      "4 portions ramen noodles",
      "2 soft-boiled eggs",
    ],
    steps: [
      "Sear the pork belly on all sides in a hot pot until browned.",
      "Add stock, soy sauce, brown sugar, ginger, and garlic. Bring to a simmer, cover, and cook on low heat for 2 hours until the pork is meltingly tender.",
      "Remove the pork, slice thickly, and strain the broth.",
      "Cook the ramen noodles according to package instructions and divide among bowls.",
      "Ladle over the hot broth, top with sliced pork belly, a soft-boiled egg, and spring onions.",
    ],
  },
  {
    slug: "smoked-pork-jollof",
    title: "Smoked Pork Jollof",
    category: "LUNCH",
    description: "Classic jollof rice, deepened with smoky pork for a heartier weekday lunch.",
    prepMinutes: 15,
    cookMinutes: 40,
    servings: 6,
    ingredients: [
      "300g Adepa Smoked Pork, chopped",
      "3 cups long-grain rice",
      "4 tomatoes, blended",
      "2 red bell peppers, blended",
      "1 onion, chopped",
      "3 tbsp tomato paste",
      "1/4 cup vegetable oil",
      "2 cups stock",
      "Bay leaves, curry powder, thyme, salt to taste",
    ],
    steps: [
      "Fry the chopped smoked pork in a large pot until lightly crisped. Remove and set aside, keeping the rendered fat in the pot.",
      "Add onions and cook until soft, then stir in tomato paste and fry for 2-3 minutes.",
      "Add the blended tomato-pepper mix and cook down for 15 minutes until thickened.",
      "Add stock, seasoning, and bay leaves, and bring to a boil. Stir in the rice, cover, and cook on low heat for 25-30 minutes until tender, stirring occasionally.",
      "Fold the smoked pork back in during the last 5 minutes of cooking.",
    ],
  },
];

export function getRecipesByCategory(category?: RecipeCategory) {
  return category ? RECIPES.filter((r) => r.category === category) : RECIPES;
}

export function getRecipeBySlug(slug: string) {
  return RECIPES.find((r) => r.slug === slug) ?? null;
}
