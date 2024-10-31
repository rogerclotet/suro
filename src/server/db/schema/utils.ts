import { getRandomValues } from "node:crypto";
import { pgTableCreator } from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `f_${name}`);

function dec2hex(dec: number) {
  return dec.toString(16).padStart(2, "0");
}

export function randomId() {
  const len = 6;
  const arr = new Uint8Array(len / 2);
  getRandomValues(arr);
  return Array.from(arr, dec2hex).join("");
}
