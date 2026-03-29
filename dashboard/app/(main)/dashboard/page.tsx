'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Patient, CheckInSession } from '@shared/types';
import { Flame, Inbox, TrendingUp, Clock } from 'lucide-react';
import Link from 'next/link';

export default function DashboardHome() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorName, setDoctorName] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch doctor name
      const { data: doc } = await supabase.from('doctors').select('name').eq('id', session.user.id).single();
      if (doc) setDoctorName(doc.name);

      // Fetch patients
      const { data: pts } = await supabase
        .from('patients')
        .select(`
          id, name, streak,
          check_in_sessions (
            completed_at, questions_total, questions_answered
          )
        `)
        .eq('doctor_id', session.user.id)
        .order('name');
      
      if (pts) setPatients(pts);
      setLoading(false);
    }
    loadDashboard();
  }, []);

  // Dynamic greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const totalCheckIns = patients.reduce((sum, p) => sum + (p.check_in_sessions?.length || 0), 0);
  const avgStreak = patients.length > 0
    ? Math.round(patients.reduce((sum, p) => sum + (p.streak || 0), 0) / patients.length)
    : 0;

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <h1>{greeting}, Dr. {doctorName || '...'}</h1>
        <p>Here&apos;s an overview of your patients&apos; health.</p>
      </header>

      {/* Quick Stats Row */}
      {!loading && patients.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          <div className="patient-card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 24px' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(91,163,191,0.12), rgba(91,163,191,0.05))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--glacier)'
            }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: 1 }}>
                Total Patients
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', letterSpacing: -1 }}>
                {patients.length}
              </div>
            </div>
          </div>

          <div className="patient-card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 24px' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(232,168,124,0.12), rgba(232,168,124,0.05))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--aurora)'
            }}>
              <Flame size={20} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: 1 }}>
                Avg. Streak
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', letterSpacing: -1 }}>
                {avgStreak} <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--slate)' }}>days</span>
              </div>
            </div>
          </div>

          <div className="patient-card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 24px' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(107,143,113,0.12), rgba(107,143,113,0.05))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--moss)'
            }}>
              <Clock size={20} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: 1 }}>
                Total Check-Ins
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', letterSpacing: -1 }}>
                {totalCheckIns}
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="dashboard-section">
        <h2>Patient Status</h2>
        
        {loading ? (
          <div className="loading">Loading patients...</div>
        ) : patients.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center' }}>
              <Inbox size={56} color="var(--slate)" strokeWidth={1.5} />
            </div>
            <h3>No patients yet</h3>
            <p>Go to the Patients tab to add your first patient.</p>
          </div>
        ) : (
          <div className="patient-grid">
            {patients.map((p) => {
              const sessions = p.check_in_sessions || [];
              const lastSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;
              const isActive = lastSession && (Date.now() - new Date(lastSession.completed_at).getTime()) < 86400000 * 2;
              
              return (
                <Link key={p.id} href={`/patients/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="patient-card" style={{ cursor: 'pointer' }}>
                    <div className="card-header">
                      <div className="avatar">{p.name ? p.name.charAt(0) : '?'}</div>
                      <div>
                        <h3>{p.name || 'Unnamed Patient'}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <div style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: isActive ? 'var(--moss)' : 'var(--slate)',
                            boxShadow: isActive ? '0 0 8px rgba(107,143,113,0.5)' : 'none',
                            animation: isActive ? 'breathe 2s ease-in-out infinite' : 'none',
                          }} />
                          <span style={{ fontSize: 12, color: 'var(--slate)', fontFamily: 'var(--font-mono)' }}>
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="card-stats">
                      <div className="stat">
                        <span className="label">Streak</span>
                        <span className="value" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {p.streak} days <Flame size={14} />
                        </span>
                      </div>
                      <div className="stat">
                        <span className="label">Last Check-In</span>
                        <span className="value">
                          {lastSession 
                            ? new Date(lastSession.completed_at).toLocaleDateString()
                            : 'Never'}
                        </span>
                      </div>
                      <div className="stat">
                        <span className="label">Check-Ins</span>
                        <span className="value">{sessions.length}</span>
                      </div>
                    </div>
                    <div className="view-btn">View Analytics</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
