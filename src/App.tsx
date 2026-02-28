import './App.css'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { useSyncSdkAuth } from './api/useSyncSdkAuth';

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        const isNetwork = error?.code === "ECONNABORTED" || !error?.response;
        if (isNetwork) return failureCount < 1; // at most 1 retry for flaky network
        const status = error?.response?.status;
        if (status && status >= 400 && status < 500) return false; // don't retry 4xx
        return failureCount < 2; // allow up to 2 retries for 5xx
      },
      retryDelay: (attemptIndex) => Math.min(1000 * (attemptIndex + 1), 3000),
      staleTime: 0,
    },
    mutations: { retry: false },
  },
});

function App() {
  useSyncSdkAuth();
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        {/* Root theme wrapper */}
        <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
          <AppRoutes />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;