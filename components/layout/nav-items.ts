// Live sections link to real routes; planned ones render as "coming soon" labels, so the shell
// never points visitors at routes that do not exist yet.
export const liveNavItems = [{ key: "jobs", href: "/jobs" }] as const;
export const plannedNavItems = ["employers", "skills"] as const;
