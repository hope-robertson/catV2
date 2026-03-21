import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Auth0Provider } from '@auth0/auth0-react'
import App from './App.js'
import './index.css'

const queryClient = new QueryClient()

// 🛰️ BIO-SIGN DIAGNOSTICS
// Open your browser console (Cmd + Option + J on Mac) to verify these load!
console.log('--- 🛡️ Frontend Auth0 Diagnostic ---')
console.log('Vite Domain:', import.meta.env.VITE_AUTH0_DOMAIN)
console.log('Vite Client ID:', import.meta.env.VITE_AUTH0_CLIENT_ID)
console.log('Vite Audience:', import.meta.env.VITE_AUTH0_AUDIENCE)
console.log('------------------------------------')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Auth0Provider
        domain={import.meta.env.VITE_AUTH0_DOMAIN}
        clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
        authorizationParams={{
          redirect_uri: window.location.origin,
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        }}
      >
        <App />
      </Auth0Provider>
    </QueryClientProvider>
  </React.StrictMode>,
)
