import { Zap } from "lucide-react";

export default function AuthCard({ children, onRegisterClick }: {
  children: React.ReactNode;
  onRegisterClick?: () => void;
}) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center  bg-slate-100 dark:bg-slate-900 p-4">
      <div className="relative w-full max-w-4xl shadow-2xl">
        {/* Card */}
        <div className="grid overflow-hidden rounded-2xl bg-white  md:grid-cols-2">
          
          {/* LEFT PANEL */}
          <div
            className="

              relative flex flex-col items-center justify-center
              bg-blue-800/90 text-white
              p-8 md:p-10

              /* Mobile: curved bottom only */
              rounded-none rounded-b-[100px]

              /* Desktop: remove bottom curve, add BOTH top-right & bottom-right curves */
              md:rounded-none md:rounded-tr-[140px] md:rounded-br-[140px]

            "
          >
            <div className="w-full max-w-sm text-center md:text-left">

              <h1 className="text-3xl font-extrabold tracking-tight">Hello there, Welcome!</h1>
              <p className="mt-2 text-white/90">What a wonderful day!</p>
             

             {/*}
              <div className="mt-6 flex justify-center md:justify-start">
                <button
                  onClick={onRegisterClick}
                  className="inline-flex items-center justify-center rounded-lg border border-white/70 px-5 py-2 font-medium text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  Register
                </button>
              </div>

              */}
            </div>
          </div>

          {/* RIGHT PANEL — put your existing login JSX here */}
          <div className="flex items-center justify-center p-6 md:p-10 bg-white">
            <div className="w-full max-w-sm">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
