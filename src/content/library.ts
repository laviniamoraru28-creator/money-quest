import { firstMoneyBook, type OriginalBook } from "./original-books";
import { enterpriseBook, teamworkBook } from "./more-original-books";
import { familyOriginalBooks } from "./family-original-books";
export const originalBooks: OriginalBook[] = [firstMoneyBook, teamworkBook, enterpriseBook, ...familyOriginalBooks];
