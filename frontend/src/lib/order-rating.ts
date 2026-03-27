export interface OrderRating {
  orderId: string;
  stars: number;
  review: string;
  submittedAt: string;
}

const ORDER_RATINGS_KEY = "alclean_order_ratings";

function readRatings(): Record<string, OrderRating> {
  try {
    const raw = localStorage.getItem(ORDER_RATINGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error("[OrderRating] Failed to read ratings:", error);
    return {};
  }
}

function saveRatings(ratings: Record<string, OrderRating>) {
  try {
    localStorage.setItem(ORDER_RATINGS_KEY, JSON.stringify(ratings));
  } catch (error) {
    console.error("[OrderRating] Failed to save ratings:", error);
  }
}

export const orderRatingService = {
  getAll(): Record<string, OrderRating> {
    return readRatings();
  },

  get(orderId: string): OrderRating | null {
    return readRatings()[orderId] || null;
  },

  save(orderId: string, stars: number, review: string): OrderRating {
    const ratings = readRatings();
    const nextRating: OrderRating = {
      orderId,
      stars,
      review: review.trim(),
      submittedAt: new Date().toISOString(),
    };

    ratings[orderId] = nextRating;
    saveRatings(ratings);
    return nextRating;
  },
};
