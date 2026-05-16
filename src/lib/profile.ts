import { User } from "@/lib/api";

export const profileImageUrl = (user?: Pick<User, "profile_image_path"> | null) => {
  if (!user?.profile_image_path) return "";
  return `/static/uploads/${user.profile_image_path}`;
};

export const displayName = (user?: Pick<User, "display_name" | "username"> | null) =>
  user?.display_name?.trim() || user?.username || "User";

export const avatarInitial = (user?: Pick<User, "first_name" | "display_name" | "username"> | null) => {
  const source = user?.first_name?.trim() || user?.display_name?.trim() || user?.username || "U";
  return source[0]?.toUpperCase() || "U";
};

const cityTimezone: Record<string, string> = {
  "pakistan|karachi": "Asia/Karachi",
  "pakistan|lahore": "Asia/Karachi",
  "pakistan|islamabad": "Asia/Karachi",
  "india|delhi": "Asia/Kolkata",
  "india|mumbai": "Asia/Kolkata",
  "united states|new york": "America/New_York",
  "united states|los angeles": "America/Los_Angeles",
  "united states|chicago": "America/Chicago",
  "united kingdom|london": "Europe/London",
  "canada|toronto": "America/Toronto",
  "canada|vancouver": "America/Vancouver",
  "australia|sydney": "Australia/Sydney",
  "united arab emirates|dubai": "Asia/Dubai",
};

const countryTimezone: Record<string, string> = {
  pakistan: "Asia/Karachi",
  india: "Asia/Kolkata",
  "united states": "America/New_York",
  "united kingdom": "Europe/London",
  canada: "America/Toronto",
  australia: "Australia/Sydney",
  "united arab emirates": "Asia/Dubai",
};

export const inferTimezone = (country: string, city: string) => {
  const countryKey = country.trim().toLowerCase();
  const cityKey = city.trim().toLowerCase();
  return cityTimezone[`${countryKey}|${cityKey}`] || countryTimezone[countryKey] || "UTC";
};

export const tagsToInput = (tags?: string[] | null) => (tags || []).join(", ");

export const inputToTags = (value: string) =>
  value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 20);
