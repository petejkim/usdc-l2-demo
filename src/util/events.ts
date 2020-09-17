import { EventEmitter } from "events";

export const BALANCE_SHOULD_UPDATE_EVENT = "balance-should-update";
export const BURN_REMOVED_EVENT = "burn-removed";

export const events = new EventEmitter();
