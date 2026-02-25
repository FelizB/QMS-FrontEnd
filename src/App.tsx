import './App.css'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import AppRoutes from "./routes/AppRoutes";


const qc = new QueryClient({
    defaultOptions: {
        queries: {
          retry: (failureCount, error: any) => {
            // Don’t retry network errors more than 1 time; avoid infinite loops
            const isNetwork = error?.code === "ECONNABORTED" || !error?.response;
            if (isNetwork) return failureCount < 1; // at most 1 retry for flaky network
            // For 4xx, usually don't retry
            const status = error?.response?.status;
            if (status && status >= 400 && status < 500) return false;
            // For 5xx, allow up to 2 retries
            return failureCount < 2;
          },
          retryDelay: (attemptIndex) => Math.min(1000 * (attemptIndex + 1), 3000), // 1s, 2s, 3s
          staleTime: 0,
        },
        mutations: {
          // For actions like login, we typically do not retry automatically
          retry: false,
        },
      },

    });
function App() {

  return (
    <QueryClientProvider client={qc}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
    </QueryClientProvider>
  );

}

export default App
