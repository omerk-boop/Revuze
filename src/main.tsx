import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import './index.css'
import App from './App.tsx'
import DevApp from './DevApp.tsx'

const useDevAuth = import.meta.env.VITE_DEV_AUTH === 'true'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {useDevAuth ? (
      <DevApp />
    ) : (
      <Auth0Provider
        domain={import.meta.env.VITE_AUTH0_DOMAIN || 'revuze-hub.us.auth0.com'}
        clientId={import.meta.env.VITE_AUTH0_CLIENT_ID || '8QVEztsschVfIDMU28dDtsTNq5um6lAN'}
        authorizationParams={{
          redirect_uri: window.location.origin,
          audience: import.meta.env.VITE_AUTH0_AUDIENCE || 'https://revuze-hub.us.auth0.com/api/v2/',
          scope: 'openid profile email',
        }}
      >
        <App />
      </Auth0Provider>
    )}
  </StrictMode>
)
