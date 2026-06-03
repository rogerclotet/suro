/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as categories from "../categories.js";
import type * as http from "../http.js";
import type * as listItems from "../listItems.js";
import type * as lists from "../lists.js";
import type * as migrations from "../migrations.js";
import type * as model_auth from "../model/auth.js";
import type * as model_colors from "../model/colors.js";
import type * as model_lists from "../model/lists.js";
import type * as model_permissions from "../model/permissions.js";
import type * as projects from "../projects.js";
import type * as templates from "../templates.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  categories: typeof categories;
  http: typeof http;
  listItems: typeof listItems;
  lists: typeof lists;
  migrations: typeof migrations;
  "model/auth": typeof model_auth;
  "model/colors": typeof model_colors;
  "model/lists": typeof model_lists;
  "model/permissions": typeof model_permissions;
  projects: typeof projects;
  templates: typeof templates;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
