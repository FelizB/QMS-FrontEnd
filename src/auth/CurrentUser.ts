import axios from "axios";

export type WorksiteInfo = {
  code?: string | null;
  name?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  [key: string]: unknown;
};

export type UserData = {
  id: number;
  email: string;
  username: string;

  initials: string;
  initials_colors: string;

  active: boolean;
  superuser: boolean;
  admin: boolean;
  approved: boolean;
  locked: boolean;

  department: string | null;
  role: string | null;
  unit: string | null;

  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  phone: string | null;
  site: string | null;
  address: string | null;
  country: string | null;
  gender: string | null;
  birthday: Date | null;
  primary_worksite: string | null;
  secondary_worksite: string | null;

  skills: string[]; 
  primary_worksite_info: WorksiteInfo; 
  secondary_worksite_info: WorksiteInfo; 
};

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

/**
 * Fetch the current user using the provided access token.
 */
export async function CurrentUser(accessToken: string): Promise<UserData> {
  const { data } = await axios.get<UserData>(`${baseURL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return data;
}