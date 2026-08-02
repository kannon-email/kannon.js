import { create } from "@bufbuild/protobuf";
import {
  TrackingMode as ProtoTrackingMode,
  type TrackingPolicy as ProtoTrackingPolicy,
  TrackingPolicySchema,
} from "./proto/kannon/tracking/types/tracking_pb.js";

/**
 * How much of one engagement channel may be observed.
 *
 * The scale is ordered by increasing collection: `off` collects nothing and
 * `full` collects the most. A policy stated closer to the recipient may only
 * restrict what the level above allows, never widen it.
 */
export type TrackingMode =
  /** The channel is not observed at all. */
  | "off"
  /** Counted in aggregate only; nothing retained that isolates one recipient. */
  | "anonymous"
  /**
   * Linkable within a single batch, carrying no recipient identity.
   *
   * @deprecated Reserved by the server: selecting it rejects the recipient with
   * reason `unsupported_tracking_mode`.
   */
  | "pseudonymous"
  /** Attributed to the recipient. */
  | "identified"
  /** Attributed, plus the IP address and user agent of the request. */
  | "full";

/**
 * A pair of tracking modes, one governing opens and one governing links.
 *
 * Can be stated per batch (in `SendOptions`) and per recipient. An omitted axis
 * states nothing and imposes no restriction of its own, leaving the domain
 * ceiling configured on the server to decide.
 *
 * A batch asking for more than its domain allows fails the whole call; a
 * recipient asking for more is rejected on its own, with reason
 * `tracking_above_ceiling`, while the rest of the batch proceeds.
 */
export interface TrackingPolicy {
  /** How link clicks may be observed. */
  links?: TrackingMode;
  /** How opens may be observed. */
  opens?: TrackingMode;
}

const TRACKING_MODES: Record<TrackingMode, ProtoTrackingMode> = {
  anonymous: ProtoTrackingMode.ANONYMOUS,
  full: ProtoTrackingMode.FULL,
  identified: ProtoTrackingMode.IDENTIFIED,
  off: ProtoTrackingMode.OFF,
  pseudonymous: ProtoTrackingMode.PSEUDONYMOUS,
};

function parseTrackingMode(mode: TrackingMode | undefined): ProtoTrackingMode {
  return mode ? TRACKING_MODES[mode] : ProtoTrackingMode.UNSPECIFIED;
}

export function parseTrackingPolicy(
  policy: TrackingPolicy | undefined
): ProtoTrackingPolicy | undefined {
  if (!policy) {
    return;
  }
  return create(TrackingPolicySchema, {
    links: parseTrackingMode(policy.links),
    opens: parseTrackingMode(policy.opens),
  });
}
