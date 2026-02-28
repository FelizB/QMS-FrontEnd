// colors.ts
export const GRADIENTS = {
  low: [
    'from-slate-400 to-slate-300',
    'from-zinc-400 to-neutral-300',
    'from-gray-400 to-gray-300',
    'from-stone-400 to-stone-300',
  ],
  mid: [
    'from-amber-400 to-yellow-300',
    'from-lime-400 to-green-300',
    'from-teal-400 to-emerald-300',
    'from-sky-400 to-cyan-300',
  ],
  high: [
    'from-emerald-500 to-teal-400',
    'from-sky-500 to-cyan-400',
    'from-indigo-500 to-blue-400',
    'from-violet-500 to-purple-400',
  ],
  elite: [
    'from-fuchsia-500 to-pink-400',
    'from-rose-500 to-red-400',
    'from-orange-500 to-amber-400',
    'from-blue-600 to-indigo-500',
  ],
} as const;

export type GradientClass = (typeof GRADIENTS)[keyof typeof GRADIENTS][number];