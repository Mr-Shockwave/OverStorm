/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agentDb from "../agentDb.js";
import type * as agentWorkflow from "../agentWorkflow.js";
import type * as agents from "../agents.js";
import type * as dashboard from "../dashboard.js";
import type * as discoveryWorkflow from "../discoveryWorkflow.js";
import type * as opportunities from "../opportunities.js";
import type * as opportunityDb from "../opportunityDb.js";
import type * as seed from "../seed.js";
import type * as services_fiber from "../services/fiber.js";
import type * as services_openai from "../services/openai.js";
import type * as services_orangeSlice from "../services/orangeSlice.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agentDb: typeof agentDb;
  agentWorkflow: typeof agentWorkflow;
  agents: typeof agents;
  dashboard: typeof dashboard;
  discoveryWorkflow: typeof discoveryWorkflow;
  opportunities: typeof opportunities;
  opportunityDb: typeof opportunityDb;
  seed: typeof seed;
  "services/fiber": typeof services_fiber;
  "services/openai": typeof services_openai;
  "services/orangeSlice": typeof services_orangeSlice;
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
