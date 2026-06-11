import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function textToHtml(text: string) {
  const linkPattern =
    /\b((https?:\/\/|www\.)[^'">\s]+\.[^,'">\s]+)(?=,?\s|$)(?!["<>])/;
  const linkExp = new RegExp(linkPattern, "gi");

  text = text.replaceAll(
    linkExp,
    // Links render in `primary`, matching the mobile rich-text editor.
    '<a href="$1" target="_blank" class="text-primary">$1</a>',
  );
  text = text.replaceAll("\n", "<br/>");

  return text;
}
