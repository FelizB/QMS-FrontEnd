import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthContext.tsx'
import { UserProvider } from './auth/useAuthHydrate.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <UserProvider>
          <App />
      </UserProvider>
    </AuthProvider>
  </StrictMode>
)
