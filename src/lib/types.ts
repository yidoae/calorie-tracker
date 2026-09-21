/** A meal as sent over the wire (dates are ISO strings). */
export interface MealDTO {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imageUrl: string | null;
  createdAt: string;
}
