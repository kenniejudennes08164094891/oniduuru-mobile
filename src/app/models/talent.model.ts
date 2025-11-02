export interface Talent {
  fullName: string;
  phone: string;
  email: string;
  password?: string; // ✅ optional now
  location: string;
  skillLevel: string;
  educationalBackground: string;
  skills: string[];
  experience: string;
  payRange: string;
}
