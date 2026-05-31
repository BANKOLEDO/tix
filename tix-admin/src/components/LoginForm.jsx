import { useState } from 'react'

export default function LoginForm({ onLogin, error }) {
  const [secret, setSecret] = useState('')
  const [apiUrl, setApiUrl] = useState(import.meta.env.VITE_API_URL || 'http://localhost:8080')

  function handleSubmit(e) {
    e.preventDefault()
    onLogin(secret, apiUrl)
  }

  return (
    <form className="login-card card" onSubmit={handleSubmit}>
      <h1>tix <span>admin</span></h1>
      <p className="login-hint">set <code>ADMIN_SECRET</code> on the server</p>
      <input type="password" placeholder="admin secret" value={secret}
        onChange={e => setSecret(e.target.value)} autoFocus />
      <input type="text" placeholder="http://localhost:8080" value={apiUrl}
        onChange={e => setApiUrl(e.target.value)} />
      <button className="btn btn-accent" type="submit">unlock</button>
      {error && <p className="error">{error}</p>}
    </form>
  )
}
