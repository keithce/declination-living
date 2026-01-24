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
import type * as calculations_actions from "../calculations/actions.js";
import type * as calculations_ephemeris from "../calculations/ephemeris.js";
import type * as calculations_optimizer from "../calculations/optimizer.js";
import type * as charts_mutations from "../charts/mutations.js";
import type * as charts_queries from "../charts/queries.js";
import type * as cities_queries from "../cities/queries.js";
import type * as http from "../http.js";
import type * as presets_queries from "../presets/queries.js";
import type * as presets_seed from "../presets/seed.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "calculations/actions": typeof calculations_actions;
  "calculations/ephemeris": typeof calculations_ephemeris;
  "calculations/optimizer": typeof calculations_optimizer;
  "charts/mutations": typeof charts_mutations;
  "charts/queries": typeof charts_queries;
  "cities/queries": typeof cities_queries;
  http: typeof http;
  "presets/queries": typeof presets_queries;
  "presets/seed": typeof presets_seed;
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
