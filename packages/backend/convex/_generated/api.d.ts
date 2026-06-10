/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ResendOTP from "../ResendOTP.js";
import type * as auth from "../auth.js";
import type * as categories from "../categories.js";
import type * as events from "../events.js";
import type * as expenses from "../expenses.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as listItems from "../listItems.js";
import type * as lists from "../lists.js";
import type * as migrations from "../migrations.js";
import type * as model_auth from "../model/auth.js";
import type * as model_colors from "../model/colors.js";
import type * as model_expenses from "../model/expenses.js";
import type * as model_ics from "../model/ics.js";
import type * as model_lists from "../model/lists.js";
import type * as model_pdfThumbnail from "../model/pdfThumbnail.js";
import type * as model_permissions from "../model/permissions.js";
import type * as model_pushI18n from "../model/pushI18n.js";
import type * as notes from "../notes.js";
import type * as pdfThumbnails from "../pdfThumbnails.js";
import type * as projects from "../projects.js";
import type * as push from "../push.js";
import type * as pushTokens from "../pushTokens.js";
import type * as templates from "../templates.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ResendOTP: typeof ResendOTP;
  auth: typeof auth;
  categories: typeof categories;
  events: typeof events;
  expenses: typeof expenses;
  files: typeof files;
  http: typeof http;
  listItems: typeof listItems;
  lists: typeof lists;
  migrations: typeof migrations;
  "model/auth": typeof model_auth;
  "model/colors": typeof model_colors;
  "model/expenses": typeof model_expenses;
  "model/ics": typeof model_ics;
  "model/lists": typeof model_lists;
  "model/pdfThumbnail": typeof model_pdfThumbnail;
  "model/permissions": typeof model_permissions;
  "model/pushI18n": typeof model_pushI18n;
  notes: typeof notes;
  pdfThumbnails: typeof pdfThumbnails;
  projects: typeof projects;
  push: typeof push;
  pushTokens: typeof pushTokens;
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
