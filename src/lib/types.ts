import type { Doc } from "../convex/_generated/dataModel";

export type GameSections = Doc<"user">["games"][number]["playStateSection"];
