export type CampusOption = {
  id: number;
  name: string;
  shortName: string;
  code: string;
  address: string;
  description: string;
  themeKey: "blue" | "emerald" | "violet" | "sunset" | "teal";
};

export const CAMPUS_OPTIONS = [
  {
    id: 1,
    name: "Laguna State Polytechnic University - Siniloan Host Campus",
    shortName: "Siniloan Host Campus",
    code: "LSPU-SHC",
    address: "Siniloan, Laguna",
    description: "Host Campus of Laguna State Polytechnic University",
    themeKey: "blue",
  },
] as const satisfies readonly CampusOption[];