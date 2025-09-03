export interface ClassSchedule {
  Day: string;
  Time: string;
  "Class Type": string;
  "Module Code": string;
  "Module Title": string;
  Lecturer: string;
  Group: string;
  Room: string;
}

export type DayOfWeek = "SUN" | "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT";

declare module "*.json" {
  const value: any;
  export default value;
} 