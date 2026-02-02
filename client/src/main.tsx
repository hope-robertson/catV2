// client/src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Auth0Provider } from '@auth0/auth0-react' // 👈 Add this import
import App from './App.js'
import './index.css'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* 👇 Add the Auth0Provider wrapper here */}
      <Auth0Provider
        domain="dev-sjiibctd2brp4c18.us.auth0.com"
        clientId="ILF1odE5uE2kb4r44PXdZURlIB6zlKJQ"
        authorizationParams={{
          redirect_uri: window.location.origin,
          audience: 'https://rosscatv2.api',
        }}
      >
        <App />
      </Auth0Provider>
    </QueryClientProvider>
  </React.StrictMode>,
)
