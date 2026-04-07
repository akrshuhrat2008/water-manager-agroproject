import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Объединяет классы с помощью clsx и tailwind-merge
 * Используется для условных классов и предотвращения конфликтов Tailwind
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
