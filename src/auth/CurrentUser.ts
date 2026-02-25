import axios from "axios";

export type UserData = {
    id: number,
    email: string,
    username: string,
    active: boolean,
    superuser: boolean,
    admin: boolean,
    approved: boolean,
    locked: boolean,
    department: string,
    role: string,
    unit: string,
    first_name: string,
    middle_name: string,
    last_name: string
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