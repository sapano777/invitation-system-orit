import type messages from "../../../messages/he.json";

export type RegistrationErrorKey = keyof (typeof messages)["registration"]["errors"];
