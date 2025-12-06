import { useState } from 'react'
import ShowHidePassword from './components/ShowHidePassword'
import './App.css'

function App() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  return (
    <div className="app">
      <div className="container">
        <header>
          <h1>Show / Hide Password</h1>
          <p className="subtitle">Toggle password visibility with smooth GSAP animations</p>
        </header>

        <div className="form-container">
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <ShowHidePassword
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password">Confirm Password</label>
            <ShowHidePassword
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
            />
          </div>

          <div className="info-box">
            <p>💡 Click the eye icon to toggle password visibility</p>
            <p>✨ Smooth animations powered by GSAP</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

