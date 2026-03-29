'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let authError;
    
    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      authError = error;
      if (!error && data.user) {
        // Create initial doctor profile
        await supabase.from('doctors').insert([{ id: data.user.id, email, name: email.split('@')[0] }]);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      authError = error;
    }

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <main className="dashboard-login">
      <div className="login-card">
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px', marginBottom: '8px' }}>Jenny</h1>
        <p>Doctor Dashboard Protocol</p>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '32px' }}>
          <input
            type="email"
            placeholder="Doctor Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--slate)', backgroundColor: 'var(--midnight)', color: 'white' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--slate)', backgroundColor: 'var(--midnight)', color: 'white' }}
          />
          
          {error && <div style={{ color: 'var(--blush)', fontSize: '14px', textAlign: 'left' }}>{error}</div>}
          
          <button type="submit" disabled={loading} style={{ marginTop: '16px' }}>
            {loading ? 'Authenticating...' : (isSignUp ? 'Create Doctor Account' : 'Sign In')}
          </button>
        </form>

        <button 
          onClick={() => setIsSignUp(!isSignUp)}
          style={{ background: 'none', border: 'none', color: 'var(--slate)', marginTop: '24px', cursor: 'pointer', fontSize: '14px' }}
        >
          {isSignUp ? 'Already have an account? Sign In' : 'New doctor? Create an account'}
        </button>
      </div>
    </main>
  );
}
