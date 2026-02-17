import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiBase, safeJson } from '../utils/api';
import CountryCodeSelector from './CountryCodeSelector';
import './LoginRegister.css';

export default function LoginRegister({ onClose }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState('register'); // 'register' | 'verify'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);

  const handleSendCode = async () => {
    if (!phone.trim()) {
      setError('Enter phone number');
      return;
    }
    setError('');
    setSendingCode(true);
    try {
      const res = await fetch(`${getApiBase()}/api/auth/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `${countryCode}${phone}` }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || 'Failed to send code');
      setStep('verify');
    } catch (err) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      setError('Enter 6-digit verification code');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/auth/verify-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `${countryCode}${phone}`, code: verificationCode }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || 'Invalid code');
      await register(email, password, name || undefined, `${countryCode}${phone}`, countryCode);
      onClose?.();
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (mode === 'login') {
      setLoading(true);
      try {
        await login(email, password);
        onClose?.();
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    } else {
      if (step === 'register') {
        if (!email || !password || !phone.trim()) {
          setError('Fill all required fields');
          return;
        }
        await handleSendCode();
      } else if (step === 'verify') {
        await handleVerifyAndRegister();
      }
    }
  };

  const resetForm = () => {
    setMode('login');
    setStep('register');
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setCountryCode('+1');
    setVerificationCode('');
    setError('');
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="auth-modal-close" onClick={onClose} aria-label="Close">×</button>
        <h2 className="auth-modal-title">{mode === 'login' ? 'Login' : step === 'verify' ? 'Verify phone' : 'Create account'}</h2>
        <p className="auth-modal-subtitle">
          {mode === 'login' ? 'Welcome back to AITCHBEE' : step === 'verify' ? 'Enter the code sent to your phone' : 'Join the hive'}
        </p>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <p className="auth-error">{error}</p>}
          {mode === 'register' && step === 'register' && (
            <>
              <input
                type="text"
                placeholder="Name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="auth-input"
                autoComplete="name"
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                required
                autoComplete="email"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                required
                minLength={6}
                autoComplete="new-password"
              />
              <div className="auth-phone-row">
                <CountryCodeSelector value={countryCode} onChange={setCountryCode} />
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="auth-input auth-phone-input"
                  required
                  autoComplete="tel"
                />
              </div>
            </>
          )}
          {mode === 'register' && step === 'verify' && (
            <>
              <p className="auth-verify-hint">Code sent to {countryCode} {phone}</p>
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="auth-input auth-code-input"
                maxLength={6}
                required
                autoFocus
              />
              <button type="button" className="auth-resend" onClick={handleSendCode} disabled={sendingCode}>
                {sendingCode ? 'Sending...' : 'Resend code'}
              </button>
            </>
          )}
          {mode === 'login' && (
            <>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                required
                autoComplete="email"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                required
                autoComplete="current-password"
              />
            </>
          )}
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading || sendingCode}>
            {loading ? 'Please wait...' : sendingCode ? 'Sending...' : mode === 'login' ? 'Login' : step === 'verify' ? 'Verify & Register' : 'Continue'}
          </button>
          {mode === 'register' && step === 'verify' && (
            <button type="button" className="auth-back" onClick={() => setStep('register')}>
              ← Back
            </button>
          )}
        </form>
        <p className="auth-switch">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          <button
            type="button"
            className="auth-switch-btn"
            onClick={() => {
              if (mode === 'login') {
                setMode('register');
                setStep('register');
                setError('');
              } else {
                resetForm();
              }
            }}
          >
            {mode === 'login' ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}
