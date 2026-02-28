import React, { useMemo, useState } from "react";
import { useQuery } from '@tanstack/react-query';
import { qmsApi } from "../../../api/apiEndpoints";

import {
  MapPin,
  Star,
  MoreHorizontal,
  MessageSquare,
  UserPlus,
  Flag,
  Phone,
  Mail,
  Globe,
  Calendar,
  User as UserIcon,
  BadgeCheck,
  User,
  UserKeyIcon,
  Boxes,
  Box,
  Signature,
  ShieldCheck,
} from "lucide-react";
import { useUser } from "../../../auth/useAuthHydrate";
import { mapUserToProfile } from "./profileData";
import SkeletonLoader from "../../common/SkeletonLoader";
import { SkillBar } from "../SkillsBar";



const RatingStars: React.FC<{ value: number; size?: number; colorClass?: string }> = ({
  value,
  size = 16,
  colorClass = "text-sky-500",
}) => {
  // render up to 5 stars with partial support (0.0..5.0)
  const full = Math.floor(value);
  const hasHalf = value - full >= 0.5;
  const stars = Array.from({ length: 5 }).map((_, i) => {
    const isFull = i < full;
    const isHalf = !isFull && i === full && hasHalf;
    return (
      <span key={i} className={`${colorClass} inline-flex relative`}>
        <Star
          className={`h-[${size}px] w-[${size}px] ${
            isFull ? "fill-current" : "fill-transparent"
          }`}
        />
        {isHalf && (
          <span className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
            <Star className="h-full w-full fill-current" />
          </span>
        )}
        {/* outline on top for consistent stroke */}
        <Star className="absolute inset-0 h-full w-full stroke-current" />
      </span>
    );
  });
  return <div className="flex items-center gap-1">{stars}</div>;
};

const BadgePill: React.FC<{ children: React.ReactNode; tone?: "primary" | "secondary" }> = ({
  children,
  tone = "primary",
}) => {
  const cls =
    tone === "primary"
      ? "bg-sky-50 text-sky-600 ring-1 ring-sky-200"
      : "bg-violet-50 text-violet-600 ring-1 ring-violet-200";
  return <span className={`px-2 py-0.5 text-xs rounded-full ${cls}`}>{children}</span>;
};

const LabelValue: React.FC<{
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}> = ({ icon, label, value }) => (
  <div className="grid grid-cols-[24px_1fr] gap-3 py-2">
    <div className="text-slate-400 flex items-start justify-center">{icon}</div>
    <div>
      <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-[13px] text-slate-800 dark:text-slate-100">{value}</div>
    </div>
  </div>
);



const TabButton: React.FC<{ active?: boolean; onClick?: () => void; children: React.ReactNode }> = ({
  active,
  onClick,
  children,
}) => (
  <button
    onClick={onClick}
    className={`relative px-3 py-2 text-sm font-medium ${
      active ? "text-slate-900 dark:text-white" : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
    }`}
  >
    {children}
    {active && <span className="absolute left-2 right-2 -bottom-2 block h-[2px] bg-slate-900 dark:bg-white rounded-full" />}
  </button>
);
  


const ProfilePage: React.FC<{}> = ({}) => {

  const [tab, setTab] = useState<"Timeline" | "About">("About");
  const { user, loading } = useUser();

  const mapped = mapUserToProfile(user);
  const userId = user?.id; // number | undefined
  type UserSkillOut = {
    id: number;
    name: string;
    percent: number;
  };
  const query = useQuery<UserSkillOut[]>({
    queryKey: ["skills", userId],
    enabled: !!userId,
    queryFn: async () => {
      const res = await qmsApi.users_skills_v1_get_listSkills(userId!);
      return res.data;
    },
  });
  const skills = query.data ?? [];

  if (loading) {
    return <div className="p-4"><SkeletonLoader/></div>;
  }

  if (!userId) {
    return <div className="p-4">No user selected</div>;
  }

  


  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white via-slate-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="mx-auto max-w-8xl px-8 py-8">
        <div className="rounded-2xl border border-white/40 bg-white/70 p-6 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">

          {/* Header */}
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            {/* Left: avatar + name & meta */}
            <div className="flex items-start gap-5">
              {/* Avatar / Initials */}
              <div className="relative h-24 w-24 overflow-hidden rounded-2xl ring-4 ring-white/60 dark:ring-white/10">
                {mapped.header.avatar? (
                  <img
                    src={mapped.header.avatar}
                    alt={mapped.header.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full grid place-items-center bg-gradient-to-br from-slate-200 to-slate-50 text-3xl font-bold text-slate-600">           

                      <span className="font-bold text-[30px] leading-none">
                        {mapped.header.initials?.[0] ? <span style={{ color: mapped.header.c1 }}>{mapped.header.initials[0]}</span> : <span className="text-slate-400">—</span>}
                        {mapped.header.initials?.[1] ? <span style={{ color: mapped.header.c2 }}>{mapped.header.initials[1]}</span> : null}
                      </span>

                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{mapped.header.name}</h1>
                  <BadgeCheck className="h-5 w-5 text-sky-500" />
                </div>
                <div className="mt-1 text-sm font-semibold text-sky-600">{mapped.header.role }</div>
                <div className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                  <MapPin className="h-4 w-4" />
                  <span>{mapped.header.country}</span>
                </div>

                {/* Rankings */}
                <div className="mt-3 flex items-center gap-3">
                  <div className="text-sm text-slate-500">Rankings</div>
                  <div className="text-xl font-semibold text-slate-900 dark:text-white">
                    {5}
                  </div>
                  <RatingStars value={5} />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
                <MessageSquare className="h-4 w-4" />
                Send Message
              </button>

              <button className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-3 py-2 text-sm font-medium text-white hover:bg-sky-600">
                <UserPlus className="h-4 w-4" />
                Contacts
              </button>

              <button className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                <Flag className="h-4 w-4" />
                Report User
              </button>

              <button
                aria-label="More"
                className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/*-- end of header section ---- */}

          <div className="my-6 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/*  ---------LEFT COLUMN (Work + Skills) ----------*/}
            <aside className="lg:col-span-1">

              {/* Basics  */}
              <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="flex p-3">
                    <div className="w-full">
                      <div className="w-full border-b border-slate-100 pb-2 dark:border-slate-800">
                        <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Basic Information
                        </h4>
                      </div>
                    
                      <LabelValue
                        icon={<User className="h-4 w-4" />}
                        label= "username"
                        value={<span className="leading-relaxed">{mapped.basics.username}</span>}
                      />
                      <LabelValue
                        icon={<UserKeyIcon className="h-4 w-4" />}
                        label="Role"
                        value={<span className="leading-relaxed">{mapped.basics.role}</span>}
                      />
                      <LabelValue
                        icon={<Box className="h-4 w-4" />}
                        label="Unit"
                        value={<span className="leading-relaxed">{mapped.basics.unit}</span>}
                      />
                      <LabelValue
                        icon={<Boxes className="h-4 w-4" />}
                        label="Department"
                        value={<span className="leading-relaxed">{mapped.basics.department}</span>}
                      />
                      <LabelValue
                        icon={<Signature className="h-4 w-4" />}
                        label="Approval"
                        value={<span className={
                                  mapped.basics.approval === "Approved"
                                    ? "text-green-600 dark:text-green-400 font-medium animate-pulse drop-shadow-[0_0_8px_rgba(34,197,94,0.6)] "
                                    : "text-red-600 dark:text-red-400 font-medium animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                                }
                        >{mapped.basics.approval}</span>}
                      />
                      <LabelValue
                        icon={<ShieldCheck className="h-4 w-4" />}
                        label="Status"
                        value={<span className={
                                  mapped.basics.status === "Active"
                                    ? "text-green-600 dark:text-green-400 font-medium animate-pulse drop-shadow-[0_0_8px_rgba(34,197,94,0.6)] "
                                    : "text-red-600 dark:text-red-400 font-medium animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                                }>
                          
                          {mapped.basics.status}</span>}
                      />
                    </div>
                  </div>
              </div>

              {/* Skills */}
              <div className="mt-6 rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                <div className="border-b border-slate-100 pb-2 dark:border-slate-800">
                <div className="w-full border-b border-slate-100 pb-2 dark:border-slate-800">
                        <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                          SKILLS
                        </h4>
                      </div>
                </div>             
                <div className="mt-2">
                  {skills.map((s) => (
                    <SkillBar key={s.id} name={s.name} level={s.percent}/>
                  ))}
                  
                </div>
               
              </div>
            </aside>

            {/* --------- RIGHT COLUMN (Tabs + About) ---------- */}
            <section className="lg:col-span-2">
              <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                {/* Tabs */}
                <div className="flex items-center gap-6 border-b border-slate-100 pb-2 dark:border-slate-800">
                  <TabButton active={tab === "Timeline"} onClick={() => setTab("Timeline")}>
                    <span className="inline-flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Timeline
                    </span>
                  </TabButton>
                  <TabButton active={tab === "About"} onClick={() => setTab("About")}>
                    <span className="inline-flex items-center gap-2">
                      <UserIcon className="h-4 w-4" />
                      About
                    </span>
                  </TabButton>
                </div>

                {/* Contact information - About */}
                
                {tab === "About" ? (
                  <div className="grid grid-cols-1 gap-8 p-2 pt-4 md:grid-cols-2">
                    <div>
                         <div className="border-b border-slate-100 pb-2 dark:border-slate-800">
                      <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Contact Information
                      </h4>
                      </div>
                      <LabelValue
                        icon={<Phone className="h-4 w-4" />}
                        label= "phone"
                        value={<span className="leading-relaxed">{mapped.contact.phone}</span>}
                      />
                      <LabelValue
                        icon={<MapPin className="h-4 w-4" />}
                        label="Address"
                        value={<span className="leading-relaxed">{mapped.contact.address}</span>}
                      />
                      <LabelValue
                        icon={<Mail className="h-4 w-4" />}
                        label="E-mail"
                        value={
                          <a href={`mailto:${mapped.contact.email}`} className="text-sky-600 hover:underline">
                            {mapped.contact.email}
                          </a>
                        }
                      />
                      <LabelValue
                        icon={<Globe className="h-4 w-4" />}
                        label="Site"
                        value={
                          <a
                            href={`https://${mapped.contact.site.replace(/^https?:\/\//, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sky-600 hover:underline break-all"
                          >
                            {mapped.contact.site}
                          </a>
                        }
                      />
                    </div>

                    <div>
                     <div className="border-b border-slate-100 pb-2 dark:border-slate-800">
                      <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        More
                      </h4>
                      </div>
                      <LabelValue icon={<Calendar className="h-4 w-4" />} label="Birthday" value={mapped.contact.birthday} />
                      <LabelValue icon={<UserIcon className="h-4 w-4" />} label="Gender" value={mapped.contact.gender} />
                    </div>
                  </div>
                ) : (
                  <div className="p-2 pt-4 text-sm text-slate-500">

            {/* Placeholder timeline items */}
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="mt-1 h-2 w-2 rounded-full bg-sky-500" />
                        <div>
                          <div className="font-medium text-slate-700 dark:text-slate-200">
                            Joined the team
                          </div>
                          <div className="text-xs text-slate-400">2 years ago</div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                        <div>
                          <div className="font-medium text-slate-700 dark:text-slate-200">
                            Promoted to Product Designer
                          </div>
                          <div className="text-xs text-slate-400">1 year ago</div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="mt-1 h-2 w-2 rounded-full bg-fuchsia-500" />
                        <div>
                          <div className="font-medium text-slate-700 dark:text-slate-200">
                            Shipped v2 of mobile app
                          </div>
                          <div className="text-xs text-slate-400">6 months ago</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/*------lower section -------*/}

              <div className="rounded-xl border  mt-5 border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex  p-4 items-center justify-between ">
                  <div className="w-full border-b border-slate-100 pb-2 dark:border-slate-800">
                  <div className="border-b border-slate-100 pb-2 dark:border-slate-800">
                      <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Work
                      </h4>
                      </div>
                  </div>
                  
                </div>
                   <div className="rounded-lg border border-slate-100 p-3 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-slate-800 dark:text-slate-100">
                          {mapped.primary_worksites.name}
                          </div>
                          <BadgePill tone={"primary"}>
                            Primary
                          </BadgePill>
                      </div>
                      <div className="mt-1 whitespace-pre-line text-xs text-slate-500">
                        {mapped.primary_worksites.city}{" , "}{mapped.primary_worksites.country} 
                        {"\n"} 
                        {mapped.primary_worksites.address}{" - "}{mapped.primary_worksites.code} 
                        </div>
                    </div>

                    <div className="rounded-lg mt-3 border border-slate-100 p-3 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-slate-800 dark:text-slate-100">
                          {mapped.secondary_worksites.name}
                        </div>
                          <BadgePill tone={"secondary"}>
                            Secondary
                          </BadgePill>
                      </div>
                      <div className="mt-1 whitespace-pre-line text-xs text-slate-500">
                        {mapped.secondary_worksites.city}{" , "}{mapped.secondary_worksites.country} 
                        {"\n"} 
                        {mapped.secondary_worksites.address}{" - "}{mapped.secondary_worksites.code} 
                        </div>
                    </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;