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
import type * as debates from "../debates.js";
import type * as http from "../http.js";
import type * as lib_access from "../lib/access.js";
import type * as lib_authRedirect from "../lib/authRedirect.js";
import type * as lib_presentation from "../lib/presentation.js";
import type * as migration from "../migration.js";
import type * as results from "../results.js";
import type * as users from "../users.js";
import type * as verification from "../verification.js";
import type * as votes from "../votes.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  debates: typeof debates;
  http: typeof http;
  "lib/access": typeof lib_access;
  "lib/authRedirect": typeof lib_authRedirect;
  "lib/presentation": typeof lib_presentation;
  migration: typeof migration;
  results: typeof results;
  users: typeof users;
  verification: typeof verification;
  votes: typeof votes;
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
