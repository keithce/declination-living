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
import type * as cache_analysisCache from "../cache/analysisCache.js";
import type * as calculations_acg_actions from "../calculations/acg/actions.js";
import type * as calculations_acg_index from "../calculations/acg/index.js";
import type * as calculations_acg_line_solver from "../calculations/acg/line_solver.js";
import type * as calculations_acg_zenith from "../calculations/acg/zenith.js";
import type * as calculations_actions from "../calculations/actions.js";
import type * as calculations_coordinates_geocentric from "../calculations/coordinates/geocentric.js";
import type * as calculations_coordinates_hour_angle from "../calculations/coordinates/hour_angle.js";
import type * as calculations_coordinates_index from "../calculations/coordinates/index.js";
import type * as calculations_coordinates_sda from "../calculations/coordinates/sda.js";
import type * as calculations_coordinates_topocentric from "../calculations/coordinates/topocentric.js";
import type * as calculations_coordinates_transform from "../calculations/coordinates/transform.js";
import type * as calculations_core_constants from "../calculations/core/constants.js";
import type * as calculations_core_index from "../calculations/core/index.js";
import type * as calculations_core_math from "../calculations/core/math.js";
import type * as calculations_core_types from "../calculations/core/types.js";
import type * as calculations_dignity_calculator from "../calculations/dignity/calculator.js";
import type * as calculations_dignity_decans from "../calculations/dignity/decans.js";
import type * as calculations_dignity_index from "../calculations/dignity/index.js";
import type * as calculations_dignity_tables from "../calculations/dignity/tables.js";
import type * as calculations_dignity_terms from "../calculations/dignity/terms.js";
import type * as calculations_enhanced_actions from "../calculations/enhanced_actions.js";
import type * as calculations_ephemeris from "../calculations/ephemeris.js";
import type * as calculations_ephemeris_index from "../calculations/ephemeris/index.js";
import type * as calculations_ephemeris_julian from "../calculations/ephemeris/julian.js";
import type * as calculations_ephemeris_oob from "../calculations/ephemeris/oob.js";
import type * as calculations_ephemeris_oobCalculator from "../calculations/ephemeris/oobCalculator.js";
import type * as calculations_ephemeris_speed from "../calculations/ephemeris/speed.js";
import type * as calculations_ephemeris_swissephService from "../calculations/ephemeris/swissephService.js";
import type * as calculations_geospatial_grid from "../calculations/geospatial/grid.js";
import type * as calculations_geospatial_index from "../calculations/geospatial/index.js";
import type * as calculations_geospatial_search from "../calculations/geospatial/search.js";
import type * as calculations_index from "../calculations/index.js";
import type * as calculations_optimizer from "../calculations/optimizer.js";
import type * as calculations_parans_index from "../calculations/parans/index.js";
import type * as calculations_parans_solver from "../calculations/parans/solver.js";
import type * as calculations_phase2_actions from "../calculations/phase2_actions.js";
import type * as calculations_safety_filter from "../calculations/safety/filter.js";
import type * as calculations_safety_index from "../calculations/safety/index.js";
import type * as calculations_validators from "../calculations/validators.js";
import type * as calculations_vibes_index from "../calculations/vibes/index.js";
import type * as calculations_vibes_translator from "../calculations/vibes/translator.js";
import type * as charts_mutations from "../charts/mutations.js";
import type * as charts_queries from "../charts/queries.js";
import type * as cities_queries from "../cities/queries.js";
import type * as http from "../http.js";
import type * as presets_queries from "../presets/queries.js";
import type * as presets_seed from "../presets/seed.js";
import type * as users_anonymous from "../users/anonymous.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "cache/analysisCache": typeof cache_analysisCache;
  "calculations/acg/actions": typeof calculations_acg_actions;
  "calculations/acg/index": typeof calculations_acg_index;
  "calculations/acg/line_solver": typeof calculations_acg_line_solver;
  "calculations/acg/zenith": typeof calculations_acg_zenith;
  "calculations/actions": typeof calculations_actions;
  "calculations/coordinates/geocentric": typeof calculations_coordinates_geocentric;
  "calculations/coordinates/hour_angle": typeof calculations_coordinates_hour_angle;
  "calculations/coordinates/index": typeof calculations_coordinates_index;
  "calculations/coordinates/sda": typeof calculations_coordinates_sda;
  "calculations/coordinates/topocentric": typeof calculations_coordinates_topocentric;
  "calculations/coordinates/transform": typeof calculations_coordinates_transform;
  "calculations/core/constants": typeof calculations_core_constants;
  "calculations/core/index": typeof calculations_core_index;
  "calculations/core/math": typeof calculations_core_math;
  "calculations/core/types": typeof calculations_core_types;
  "calculations/dignity/calculator": typeof calculations_dignity_calculator;
  "calculations/dignity/decans": typeof calculations_dignity_decans;
  "calculations/dignity/index": typeof calculations_dignity_index;
  "calculations/dignity/tables": typeof calculations_dignity_tables;
  "calculations/dignity/terms": typeof calculations_dignity_terms;
  "calculations/enhanced_actions": typeof calculations_enhanced_actions;
  "calculations/ephemeris": typeof calculations_ephemeris;
  "calculations/ephemeris/index": typeof calculations_ephemeris_index;
  "calculations/ephemeris/julian": typeof calculations_ephemeris_julian;
  "calculations/ephemeris/oob": typeof calculations_ephemeris_oob;
  "calculations/ephemeris/oobCalculator": typeof calculations_ephemeris_oobCalculator;
  "calculations/ephemeris/speed": typeof calculations_ephemeris_speed;
  "calculations/ephemeris/swissephService": typeof calculations_ephemeris_swissephService;
  "calculations/geospatial/grid": typeof calculations_geospatial_grid;
  "calculations/geospatial/index": typeof calculations_geospatial_index;
  "calculations/geospatial/search": typeof calculations_geospatial_search;
  "calculations/index": typeof calculations_index;
  "calculations/optimizer": typeof calculations_optimizer;
  "calculations/parans/index": typeof calculations_parans_index;
  "calculations/parans/solver": typeof calculations_parans_solver;
  "calculations/phase2_actions": typeof calculations_phase2_actions;
  "calculations/safety/filter": typeof calculations_safety_filter;
  "calculations/safety/index": typeof calculations_safety_index;
  "calculations/validators": typeof calculations_validators;
  "calculations/vibes/index": typeof calculations_vibes_index;
  "calculations/vibes/translator": typeof calculations_vibes_translator;
  "charts/mutations": typeof charts_mutations;
  "charts/queries": typeof charts_queries;
  "cities/queries": typeof cities_queries;
  http: typeof http;
  "presets/queries": typeof presets_queries;
  "presets/seed": typeof presets_seed;
  "users/anonymous": typeof users_anonymous;
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
