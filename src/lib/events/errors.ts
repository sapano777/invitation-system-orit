import type messages from "../../../messages/he.json";

// Validation error codes for the event form; each is a key in
// messages.eventForm.errors, so the client can translate it.
export type EventErrorKey = keyof (typeof messages)["eventForm"]["errors"];
