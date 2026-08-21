import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: "PKR" = "PKR", locale = "en-PK"){
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// i/p: formatCurrency(1500) -> o/p: Rs 1,500

export function formatDate(date: string | Date, locale = "en-PK"){
  return new Intl.DateTimeFormat(locale,{
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date))
}

export function slugify(input: string){
  return input.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}

export function truncate(text: string, length: number){
  return text.length > length ? `${text.slice(0, length-1)}...`:text
}

export function parseError(error: unknown): string{
  if (error instanceof Error) return error.message;
  if(typeof error === "string") return error;
  return "Something went wrong."
}
