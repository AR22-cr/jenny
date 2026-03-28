'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

// Create a secondary client for patient auth generation that doesn't disrupt the doctor's session
const patientAuthClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add Patient Modal State
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCheckInTime, setNewCheckInTime] = useState('21:00');
  const [newTimezone, setNewTimezone] = useState('America/New_York');
  const [addError, setAddError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  const fetchPatients = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase
        .from('patients')
        .select('*')
        .eq('doctor_id', session.user.id)
        .order('created_at', { ascending: false });
      if (data) setPatients(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const removePatient = async (patientId: string) => {
    if (!window.confirm("Are you sure you want to remove this patient? They will be permanently unpaired from your dashboard. This action cannot be undone.")) return;
    try {
      // Unpair the patient
      const { error: patientErr } = await supabase.from('patients').update({ doctor_id: null }).eq('id', patientId);
      if (patientErr) throw patientErr;
      
      // Archive their active decks so they aren't stuck checking into a dead queue
      await supabase.from('decks').update({ status: 'archived' }).eq('patient_id', patientId);
      
      // Refresh
      fetchPatients();
    } catch (err: any) {
      alert("Failed to remove patient: " + err.message);
    }
  };

  const generateCode = () => {
    // Generate a random 6-digit number string between 100000 and 999999
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAddError('');
    setGeneratedCode('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const code = generateCode();

      // 1. Silently sign up the patient in Supabase Auth using the secondary client
      // Note: This requires "Confirm email" to be disabled in Supabase Auth settings!
      const { data: authData, error: authError } = await patientAuthClient.auth.signUp({
        email: `${code}@penguinpals.health`,
        password: `${code}-securepass123`,
      });

      if (authError || !authData.user) {
        throw new Error(authError?.message || 'Failed to generate patient auth');
      }

      const newPatientId = authData.user.id;

      // 2. Create the patient record tied to this auth ID
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Code valid for 7 days

      const { error: dbError } = await supabase
        .from('patients')
        .insert([{
          id: newPatientId,
          doctor_id: session.user.id,
          name: newName,
          timezone: newTimezone,
          check_in_time: newCheckInTime,
          pairing_code: code,
          pairing_code_expires_at: expiresAt.toISOString(),
        }]);

      if (dbError) throw dbError;

      // Success
      setGeneratedCode(code);
      fetchPatients();
    } catch (err: any) {
      setAddError(err.message || 'An error occurred adding the patient.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-page">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Patients</h1>
          <p>Manage your patients and generate pairing codes.</p>
        </div>
        <button className="primary-btn" onClick={() => setIsAdding(true)}>
          + Add Patient
        </button>
      </header>

      {/* Patient List */}
      <section className="dashboard-section" style={{ marginTop: '0' }}>
        {loading ? (
          <div className="loading">Loading patients...</div>
        ) : patients.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No patients found</h3>
            <p>Click "Add Patient" to generate a pairing code for a new patient.</p>
          </div>
        ) : (
          <div className="list-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Pairing Code</th>
                  <th>Status</th>
                  <th>Streak</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => {
                  const isExpired = new Date(p.pairing_code_expires_at) < new Date();
                  const isPaired = p.pairing_code === null; // In a full app, we nullify code after pairing

                  return (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.name}</strong>
                      </td>
                      <td>
                        {isPaired ? (
                          <span className="badge badge-success">Paired</span>
                        ) : isExpired ? (
                          <span className="badge badge-error">Expired</span>
                        ) : (
                          <code className="code-display">{p.pairing_code}</code>
                        )}
                      </td>
                      <td>
                        {p.check_in_time} ({p.timezone})
                      </td>
                      <td>{p.streak} days</td>
                      <td style={{ display: 'flex', gap: '8px' }}>
                        <Link href={`/patients/${p.id}`} className="text-btn">Edit Deck</Link>
                        <button onClick={() => removePatient(p.id)} className="text-btn" style={{ color: 'var(--blush)' }}>Remove</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Add Patient Modal */}
      {isAdding && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New Patient</h2>
              <button className="close-btn" onClick={() => { setIsAdding(false); setGeneratedCode(''); }}>✕</button>
            </div>
            
            {generatedCode ? (
              <div className="success-state">
                <div className="success-icon">🎉</div>
                <h3>Patient created successfully!</h3>
                <p>Give this exact 6-character code to your patient. They will enter it into the PenguinPals mobile app to pair with you.</p>
                <div className="giant-code">{generatedCode}</div>
                <p style={{ fontSize: '13px', color: 'var(--slate)' }}>The code is valid for 7 days.</p>
                <button className="primary-btn" onClick={() => { setIsAdding(false); setGeneratedCode(''); }} style={{ marginTop: '24px', width: '100%' }}>
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddPatient} className="modal-form">
                <div className="form-group">
                  <label>Patient Name (Alias)</label>
                  <input 
                    type="text" 
                    value={newName} 
                    onChange={e => setNewName(e.target.value)} 
                    placeholder="e.g. John D." 
                    required 
                  />
                  <small>For your reference only.</small>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Target Check-In Time</label>
                    <input 
                      type="time" 
                      value={newCheckInTime} 
                      onChange={e => setNewCheckInTime(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Timezone</label>
                    <select value={newTimezone} onChange={e => setNewTimezone(e.target.value)}>
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    </select>
                  </div>
                </div>

                {addError && <div className="error-message">{addError}</div>}

                <div className="modal-actions">
                  <button type="button" className="ghost-btn" onClick={() => setIsAdding(false)} disabled={isSubmitting}>Cancel</button>
                  <button type="submit" className="primary-btn" disabled={isSubmitting || !newName}>
                    {isSubmitting ? 'Generating...' : 'Generate Pairing Code'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
