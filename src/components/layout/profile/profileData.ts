// mapUserToProfile.ts
import { type UserData } from "../../../auth/CurrentUser";
import {
  getRoleText,
  getActiveText,
  getApprovedText,
  parseInitialColors,
  fullName,
} from "./user_mapping";

function formatBirthday(iso?: string | null): string {
  if (!iso) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso; // show as YYYY-MM-DD
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return String(iso);
  }
}

/**
 * Returns plain objects you can read directly.
 * No arrays, no MappedItem.
 */
export function mapUserToProfile(user?: UserData | null): {
  header: {
    username: string;
    email: string;
    role: string;
    initials: string;
    c1: string;
    c2: string;
    avatar: string;
    name: string;
    country: string;
  };
  basics: {
    username: string;
    email: string;
    role: string;
    unit:string;
    department: string;
    status: string;       // Active | Inactive | Locked | —
    approval: string;     // Approved | Not Approved | —
  };
  org: {
    department: string;
    unit: string;
    role_text: string;
  };
  contact: {
    phone: string;
    site: string;
    email: string;
    address: string;
    country: string;
    gender: string;
    birthday: string; // formatted
  };
  primary_worksites: {
    code: string;
    name: string;
    address: string;
    city: string;
    country:string;
    extra:{
      additionalProp1:{}
    }
  };
  secondary_worksites: {
    code: string;
    name: string;
    address: string;
    city: string;
    country:string;
    extra:{
      additionalProp1:{}
    }
  };
} {
  const username = user?.username ?? "—";
  const email = user?.email ?? "—";
  const role = getRoleText(user);
  const name = fullName(user);
  const initials = user?.initials ?? "—";
  const [c1, c2] = parseInitialColors(user?.initials_colors);
  const avatar = "https://i.pravatar.cc/300"; // placeholder (swap when you add user.avatar)
  const country = user?.country ?? "—";
  const unit = user?.unit?? "_";
  const department =user?.department?? "_";
  const activeText = getActiveText(user);
  const approvedText = getApprovedText(user);

  return {
    header: { username, email, role, initials, c1, c2, avatar, name, country },

    basics: {
      username,
      email,
      role,
      status: activeText,
      approval: approvedText,
      unit,
      department,
    },

    org: {
      department: user?.department ?? "—",
      unit: user?.unit ?? "—",
      role_text: role,
    },

    contact: {
      phone: user?.phone ?? "—",
      site: user?.site ?? "—",
      address: user?.address ?? "—",
      email : user?.email ?? "—",
      country: user?.country ?? "—",
      gender: (user as any)?.gender ?? "—",
      birthday: formatBirthday((user as any)?.birthday ?? null),
    },

    primary_worksites: {
      code: user?.primary_worksite_info?.code ?? "—",
      name: user?.primary_worksite_info?.name ?? "—",
      address: user?.primary_worksite_info?.address ?? "—",
      city: user?.primary_worksite_info?.city ?? "—",
      country:user?.primary_worksite_info?.country ?? "—",
      extra:{
        additionalProp1:{}
      }
    },
    secondary_worksites: {
      code: user?.secondary_worksite_info?.code ?? "—",
      name: user?.secondary_worksite_info?.name ?? "—",
      address: user?.secondary_worksite_info?.address ?? "—",
      city: user?.secondary_worksite_info?.city ?? "—",
      country:user?.secondary_worksite_info?.country ?? "—",
      extra:{
        additionalProp1:{}
      }
    },
  };
}