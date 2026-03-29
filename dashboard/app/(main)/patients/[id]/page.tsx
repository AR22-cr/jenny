'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Deck, Patient, Question } from '@shared/types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Activity, Calendar, Target, CheckCircle2, Sparkles, X } from 'lucide-react';
import { useCallback } from 'react';

// Standalone tooltip component — must be outside PatientDetail for stable React identity
function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  
  const rawResponses = payload[0]?.payload?.rawResponses;
  if (!rawResponses) return null;

  const multiselects = rawResponses.filter((r: any) => 
    r.questions?.type?.startsWith('multi_') || r.questions?.type === 'yes_no'
  );

  return (
    <div style={{ backgroundColor: '#fff', padding: 16, borderRadius: 16, boxShadow: '0 8px 32px rgba(28,43,58,0.1)', border: '1px solid rgba(28,43,58,0.05)', minWidth: 220 }}>
      <p style={{ margin: '0 0 12px 0', color: 'var(--slate)', fontFamily: 'monospace', fontSize: 12 }}>{label}</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {payload.map((p: any) => (
          <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 'bold', color: p.color }}>
            <span>{p.name}</span>
            <span>{p.value}</span>
          </div>
        ))}
      </div>
      
      {multiselects.length > 0 && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed var(--ice)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {multiselects.map((ms: any) => {
            const labelStr = Array.isArray(ms.value) ? ms.value.join(', ') : ms.value.toString();
            return (
              <div key={ms.id}>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{ms.questions.text}</p>
                <p style={{ margin: '2px 0 0 0', fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{labelStr}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PatientDetail({ params }: { params: { id: string } }) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [library, setLibrary] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'deck'>('analytics');
  const [librarySearch, setLibrarySearch] = useState('');
  const [isPushing, setIsPushing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visibleMetrics, setVisibleMetrics] = useState<Record<string, boolean>>({});
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDayRange, setAiDayRange] = useState(30);
  const [aiError, setAiError] = useState<string | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const [chartReady, setChartReady] = useState(false);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  // Callback ref: fires when the chart container div mounts/unmounts
  const chartRefCallback = useCallback((node: HTMLDivElement | null) => {
    // Clean up old observer
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }
    
    chartContainerRef.current = node;
    
    if (node) {
      const measure = () => {
        const w = node.getBoundingClientRect().width;
        if (w > 0) {
          setChartWidth(w);
          setChartReady(true);
        }
      };
      // Measure immediately
      measure();
      // Also measure on future resizes
      const ro = new ResizeObserver(measure);
      ro.observe(node);
      resizeObserverRef.current = ro;
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    // 1. Load Patient
    const { data: pData } = await supabase.from('patients').select('*').eq('id', params.id).single();
    if (pData) setPatient(pData);

    // 2. Load Active Deck
    const { data: dData } = await supabase
      .from('decks')
      .select('*')
      .eq('patient_id', params.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    let currentDeck = dData && dData.length > 0 ? dData[0] : null;

    if (!currentDeck) {
      // Create one if none exists
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: newD } = await supabase.from('decks').insert([{
          patient_id: params.id,
          doctor_id: session.user.id,
          status: 'active'
        }]).select().single();
        currentDeck = newD;
      }
    }
    
    setDeck(currentDeck);

    // 3. Load Deck Questions
    if (currentDeck) {
      const { data: qData } = await supabase
        .from('questions')
        .select('*')
        .eq('deck_id', currentDeck.id)
        .order('order', { ascending: true });
      if (qData) setQuestions(qData);
    }

    // 4. Load Library
    const { data: libData } = await supabase.from('question_library').select('*');
    if (libData) setLibrary(libData);

    // 5. Load Historical Check-Ins for Analytics
    const { data: sessData } = await supabase
      .from('check_in_sessions')
      .select('*')
      .eq('patient_id', params.id)
      .order('completed_at', { ascending: true });
      
    if (sessData) setSessions(sessData);

    const { data: respData } = await supabase
      .from('responses')
      .select('*, questions(text, type)')
      .eq('patient_id', params.id);
      
    if (respData) {
      // Try to enrich with metric_key (may not exist until migration is run)
      try {
        const { data: enriched } = await supabase
          .from('responses')
          .select('*, questions(text, type, metric_key)')
          .eq('patient_id', params.id);
        if (enriched) {
          setResponses(enriched);
        } else {
          setResponses(respData);
        }
      } catch {
        setResponses(respData);
      }
    }

    setLoading(false);
  };

  // Analytics Calculations
  const quantifiableQuestions = useMemo(() => {
    const historicalQuestionIds = new Set(responses.map(r => r.question_id));
    // include questions that are currently in the deck AND are quantifiable, 
    // PLUS any questions historically answered that were quantifiable (even if removed from deck)
    const activeQuant = questions.filter(q => q.type.startsWith('scale'));
    
    // We can extract historical missing questions directly from the responses join
    const historicalQuant = responses
      .filter(r => r.questions?.type?.startsWith('scale') && !activeQuant.find(aq => aq.id === r.question_id))
      .map(r => ({
        id: r.question_id,
        text: r.questions.text,
        type: r.questions.type,
      }));
      
    // Deduplicate historical just in case
    const uniqueHistorical = [];
    const seen = new Set();
    for (const hq of historicalQuant) {
      if (!seen.has(hq.id)) {
        seen.add(hq.id);
        uniqueHistorical.push(hq as any);
      }
    }

    return [...activeQuant, ...uniqueHistorical];
  }, [questions, responses]);

  // Set default visibility when quantifiable questions load
  useEffect(() => {
    if (quantifiableQuestions.length > 0 && Object.keys(visibleMetrics).length === 0) {
      const initial: Record<string, boolean> = {};
      quantifiableQuestions.forEach(q => initial[q.id] = true);
      setVisibleMetrics(initial);
    }
  }, [quantifiableQuestions]);


  const chartData = useMemo(() => {
    return sessions.map(sess => {
      const sessResps = responses.filter(r => r.session_id === sess.id);
      
      const row: any = {
        date: new Date(sess.completed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        fullDate: new Date(sess.completed_at).toLocaleDateString(),
        rawResponses: sessResps
      };
      
      // Plot individual quantitative values
      sessResps.forEach(r => {
        if (r.questions?.type?.startsWith('scale') || typeof r.value === 'number') {
          // ensure number type
          row[r.question_id] = Number(r.value);
        }
      });
      
      return row;
    });
  }, [sessions, responses]);

  const toggleMetric = (qId: string) => {
    setVisibleMetrics(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const categoricalInsights = useMemo(() => {
    const multiselects = responses.filter(r => r.questions?.type?.startsWith('multi_') || r.questions?.type === 'yes_no');
    
    // Group outcomes structurally
    const grouped: Record<string, { text: string, type: string, frequencies: Record<string, number> }> = {};
    
    multiselects.forEach(r => {
      const qid = r.question_id;
      if (!grouped[qid]) {
        grouped[qid] = { text: r.questions.text, type: r.questions.type, frequencies: {} };
      }
      
      const val = r.value;
      const trackVal = (v: string) => {
        if (!v) return;
        const stringV = v.toString();
        grouped[qid].frequencies[stringV] = (grouped[qid].frequencies[stringV] || 0) + 1;
      };
      
      if (Array.isArray(val)) val.forEach(trackVal);
      else trackVal(val);
    });
    
    // Map object into array and aggressively sort by frequency weight
    return Object.values(grouped).map(g => {
      const freqArr = Object.entries(g.frequencies)
        .sort((a, b) => b[1] - a[1])
        .map(([k, count]) => ({ item: k, count }));
        
      return { ...g, frequencies: freqArr };
    });
  }, [responses]);

  const categoricalRows = useMemo(() => {
    const map: Record<string, { qId: string, qText: string, option: string }> = {};
    
    sessions.forEach(sess => {
       const sessResps = responses.filter(r => r.session_id === sess.id);
       sessResps.forEach(r => {
          if (r.questions?.type?.startsWith('multi_') || r.questions?.type === 'yes_no') {
             const val = r.value;
             const track = (v: string | boolean) => {
               if (v === null || v === undefined) return;
               const strVal = v.toString();
               const displayStr = r.questions.type === 'yes_no' ? (strVal === 'true' ? 'Yes' : 'No') : strVal;
               const key = `${r.question_id}::${displayStr}`;
               if (!map[key]) {
                 map[key] = { qId: r.question_id, qText: r.questions.text, option: displayStr };
               }
             };
             if (Array.isArray(val)) val.forEach(track);
             else track(val as any);
          }
       });
    });
    
    return Object.values(map).sort((a,b) => a.qText.localeCompare(b.qText) || a.option.localeCompare(b.option));
  }, [sessions, responses]);

  // CustomChartTooltip moved to top-level ChartTooltipContent for stable identity

  const COLORS = ['#6B8F71', '#9AC4A8', '#AED9E0', '#B8E1D9', '#0d9488', '#3b82f6', '#f43f5e', '#8b5cf6', '#f59e0b'];

  const addFromLibrary = async (template: any) => {
    if (!deck) return;
    const newOrder = questions.length;
    const { data: newQ } = await supabase.from('questions').insert([{
      deck_id: deck.id,
      order: newOrder,
      text: template.text,
      type: template.type,
      config: template.config,
      tags: template.tags,
      is_required: true,
      created_from: 'library'
    }]).select().single();

    if (newQ) {
      setQuestions([...questions, newQ]);
    }
  };

  const filteredLibrary = librarySearch.trim() === '' 
    ? library 
    : library.filter(t => 
        t.text.toLowerCase().includes(librarySearch.toLowerCase()) || 
        (t.category && t.category.toLowerCase().includes(librarySearch.toLowerCase())) ||
        t.type.toLowerCase().includes(librarySearch.toLowerCase())
      );

  const removeQuestion = async (qId: string) => {
    await supabase.from('questions').delete().eq('id', qId);
    setQuestions(questions.filter(q => q.id !== qId));
    // Optionally: re-order remaining
  };

  const moveQuestion = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newQuestions = [...questions];
    
    // Swap
    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[newIndex];
    newQuestions[newIndex] = temp;

    // Update state immediately for UX
    setQuestions(newQuestions.map((q, i) => ({ ...q, order: i })));

    // Sync to DB
    await Promise.all([
      supabase.from('questions').update({ order: newIndex }).eq('id', newQuestions[newIndex].id),
      supabase.from('questions').update({ order: index }).eq('id', newQuestions[index].id),
    ]);
  };

  const handlePushToApp = () => {
    setIsPushing(true);
    // The mobile app polls every 10s, so changes are automatically pulled.
    // This UX explicitly confirms that the system is live.
    setTimeout(() => setIsPushing(false), 2000);
  };

  // ── AI Analysis: n8n Webhook ──
  const runAiAnalysis = async () => {
    if (!patient) return;
    setAiLoading(true);
    setAiError(null);
    setAiInsight(null);

    try {
      // 1. Filter responses to the selected day range
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - aiDayRange);
      const cutoffISO = cutoff.toISOString();

      const rangedResponses = responses.filter(
        (r: any) => r.answered_at && r.answered_at >= cutoffISO
      );

      if (rangedResponses.length === 0) {
        setAiError('No responses found for the selected date range.');
        setAiLoading(false);
        return;
      }

      // 2. Sort chronologically and group by question text
      const sorted = [...rangedResponses].sort(
        (a: any, b: any) => new Date(a.answered_at).getTime() - new Date(b.answered_at).getTime()
      );

      // Group: { questionText -> { values: any[], dates: string[] } }
      const grouped: Record<string, { values: any[]; dates: string[] }> = {};

      sorted.forEach((r: any) => {
        const qText = r.questions?.text;
        if (!qText) return;

        // Get raw answer value (don't encode — the n8n pipeline handles encoding)
        let answer = r.value;
        if (answer === undefined || answer === null || answer === '') return;

        // For yes_no, send as string "yes"/"no" for n8n boolean encoding
        if (r.questions.type === 'yes_no') {
          answer = (answer === true || answer === 'true') ? 'yes' : 'no';
        }

        if (!grouped[qText]) {
          grouped[qText] = { values: [], dates: [] };
        }

        grouped[qText].values.push(answer);
        // Format date as YYYY-MM-DD
        const dateStr = new Date(r.answered_at).toISOString().split('T')[0];
        grouped[qText].dates.push(dateStr);
      });

      if (Object.keys(grouped).length === 0) {
        setAiError('No valid responses with question text found for the selected range.');
        setAiLoading(false);
        return;
      }

      // 3. Build the responses array — n8n QUESTION_REGISTRY format
      const webhookResponses = Object.entries(grouped).map(([questionText, data]) => ({
        question_text: questionText,
        answer: data.values[data.values.length - 1], // most recent answer
        history: data.values,
        dates: data.dates,
      }));

      // 4. Build webhook payload
      const payload = {
        patient_id: patient.id,
        responses: webhookResponses,
      };

      console.log('🧠 [AI] Sending to n8n:', JSON.stringify(payload, null, 2));

      // 5. POST to n8n webhook
      const res = await fetch('https://tarunm78.app.n8n.cloud/webhook-test/patient-health-monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Webhook returned ${res.status}: ${errBody || res.statusText}`);
      }

      const data = await res.json();
      console.log('🧠 [AI] Response:', data);

      // 6. Extract the generated summary
      const blurb = data.output || data.text || data.message || data.result || data.summary || JSON.stringify(data);
      setAiInsight(blurb);
    } catch (e: any) {
      console.error('🧠 [AI] Error:', e);
      setAiError(e.message || 'Failed to reach the AI analysis service.');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <div className="dashboard-page"><div className="loading">Loading patient data...</div></div>;
  if (!patient) return <div className="dashboard-page">Patient not found.</div>;

  return (
    <div className="dashboard-page" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <header className="page-header" style={{ flexShrink: 0, paddingBottom: 0 }}>
        <button className="text-btn" onClick={() => router.push('/dashboard')} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          ← Back to Patients
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
          <div>
            <h1 style={{ marginBottom: 4 }}>{patient.name || 'Unnamed Patient'}</h1>
            <p style={{ margin: 0 }}>Patient ID: {patient.id.substring(0, 8)}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', backgroundColor: 'var(--snow)', padding: '6px', borderRadius: '16px', border: '1px solid rgba(28,43,58,0.05)' }}>
            <button 
              onClick={() => setActiveTab('analytics')}
              style={{ padding: '8px 16px', borderRadius: '12px', border: 'none', background: activeTab === 'analytics' ? 'var(--ice)' : 'transparent', color: activeTab === 'analytics' ? 'var(--glacier)' : 'var(--slate)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              Analytics
            </button>
            <button 
              onClick={() => setActiveTab('deck')}
              style={{ padding: '8px 16px', borderRadius: '12px', border: 'none', background: activeTab === 'deck' ? 'var(--ice)' : 'transparent', color: activeTab === 'deck' ? 'var(--glacier)' : 'var(--slate)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              Deck Editor
            </button>
          </div>
        </div>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '48px' }}>
        {activeTab === 'analytics' ? (
          <div className="analytics-view" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Overview Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
              <div className="patient-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'var(--fog)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--glacier)' }}><Activity /></div>
                <div>
                  <div style={{ color: 'var(--slate)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'var(--font-mono)' }}>Active Trackers</div>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--ink)' }}>{quantifiableQuestions.length}</div>
                </div>
              </div>
              <div className="patient-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(107, 143, 113, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--moss)' }}><Target /></div>
                <div>
                  <div style={{ color: 'var(--slate)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'var(--font-mono)' }}>Active Streak</div>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--ink)' }}>{patient.streak} days</div>
                </div>
              </div>
              <div className="patient-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'var(--ice)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--glacier)' }}><CheckCircle2 /></div>
                <div>
                  <div style={{ color: 'var(--slate)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'var(--font-mono)' }}>Total Check-Ins</div>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--ink)' }}>{sessions.length}</div>
                </div>
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="patient-card" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontFamily: 'Playfair Display, serif' }}>Longitudinal Trends</h2>
              </div>
              
              {/* Visiibility Toggles Legend */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                {quantifiableQuestions.map((q, i) => {
                  const color = COLORS[i % COLORS.length];
                  const isVisible = visibleMetrics[q.id] !== false; // true by default
                  return (
                    <button
                      key={q.id}
                      onClick={() => toggleMetric(q.id)}
                      style={{
                        padding: '6px 12px', borderRadius: 16, border: `1px solid ${isVisible ? color : 'var(--ice)'}`,
                        background: isVisible ? `${color}15` : 'transparent',
                        color: isVisible ? color : 'var(--slate)',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', gap: 6
                      }}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isVisible ? color : 'var(--ice)' }} />
                      <span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {q.text}
                      </span>
                    </button>
                  );
                })}
              </div>

              {mounted && chartData.length > 0 ? (
                <div ref={chartRefCallback} style={{ width: '100%', height: 360 }}>
                  {chartReady && chartWidth > 0 ? (
                    <AreaChart width={chartWidth} height={360} data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        {quantifiableQuestions.map((q, i) => (
                          <linearGradient key={`grad-${q.id}`} id={`color-${q.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0}/>
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(28,43,58,0.06)" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--slate)', fontSize: 13, fontFamily: 'monospace' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--slate)', fontSize: 13, fontFamily: 'monospace' }} domain={[0, 'auto']} />
                      <Tooltip 
                        isAnimationActive={false}
                        contentStyle={{ 
                          borderRadius: 16, 
                          border: '1px solid rgba(28,43,58,0.05)', 
                          boxShadow: '0 8px 32px rgba(28,43,58,0.1)', 
                          padding: 16,
                          minWidth: 200,
                          backgroundColor: '#fff',
                        }}
                        labelStyle={{ color: 'var(--slate)', fontFamily: 'monospace', fontSize: 12, marginBottom: 8 }}
                        itemStyle={{ fontWeight: 'bold', fontSize: 14, padding: '2px 0' }}
                      />
                      {quantifiableQuestions.map((q, i) => {
                        if (visibleMetrics[q.id] === false) return null;
                        const color = COLORS[i % COLORS.length];
                        return (
                          <Area 
                            key={q.id}
                            type="monotone" 
                            dataKey={q.id} 
                            name={q.text}
                            stroke={color} 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill={`url(#color-${q.id})`}
                            activeDot={{ r: 6, strokeWidth: 0, fill: color }} 
                            connectNulls
                          />
                        );
                      })}
                    </AreaChart>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--slate)' }}>Loading chart...</div>
                  )}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '40px' }}>
                  <Calendar size={48} color="var(--slate)" style={{ marginBottom: 16 }} />
                  <p>No historical check-in data available to plot.</p>
                </div>
              )}
            </div>
            
            {/* Categorical Heatmap Grid */}
            {categoricalRows.length > 0 && chartData.length > 0 && (
              <div className="patient-card" style={{ padding: '32px', overflowX: 'auto' }}>
                <h2 style={{ margin: '0 0 24px 0', fontSize: 20, fontFamily: 'Playfair Display, serif' }}>Categorical Timeline</h2>
                <div style={{ minWidth: 600 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', paddingBottom: 16, width: 240, color: 'var(--slate)', fontWeight: 600 }}>Recorded Metric</th>
                        {chartData.map((d, i) => (
                          <th key={i} style={{ textAlign: 'center', paddingBottom: 16, color: 'var(--slate)', fontWeight: 500, fontSize: 11, width: 32 }}>
                            {d.date.split(' ')[1]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {categoricalRows.map((row, i) => {
                        const color = COLORS[i % COLORS.length];
                        return (
                          <tr key={i} style={{ borderTop: '1px solid rgba(28,43,58,0.05)' }}>
                            <td style={{ padding: '12px 0' }}>
                              <div style={{ fontSize: 10, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{row.qText}</div>
                              <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 14 }}>{row.option}</div>
                            </td>
                            {chartData.map((d, di) => {
                              const hasValue = d.rawResponses.some((r: any) => {
                                 if (r.question_id !== row.qId) return false;
                                 if (r.questions.type === 'yes_no') {
                                    const vStr = (r.value === 'true' || r.value === true) ? 'Yes' : 'No';
                                    return vStr === row.option;
                                 }
                                 if (Array.isArray(r.value)) return r.value.includes(row.option);
                                 return r.value.toString() === row.option;
                              });
                              
                              return (
                                <td key={di} style={{ textAlign: 'center' }}>
                                  <div style={{ 
                                    width: 14, height: 14, borderRadius: 4, margin: '0 auto',
                                    backgroundColor: hasValue ? color : 'var(--fog)',
                                    opacity: hasValue ? 1 : 0.4
                                  }} title={hasValue ? `${row.option} on ${d.fullDate}` : undefined} />
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Raw Data Log */}
            <div className="list-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Questions Answered</th>
                    <th>Recorded Metrics</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.slice().reverse().slice(0, 10).map((d, i) => {
                    // count highly actionable quant fields
                    const quantAnswers = Object.keys(d).filter(k => k !== 'date' && k !== 'fullDate' && k !== 'rawResponses');
                    return (
                      <tr key={i}>
                        <td style={{ fontWeight: 500 }}>{d.fullDate}</td>
                        <td>{d.rawResponses?.length || 0} responses</td>
                        <td>
                          <span className="badge badge-success" style={{ backgroundColor: 'var(--ice)', color: 'var(--glacier)' }}>
                            {quantAnswers.length} scale metrics
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {chartData.length === 0 && (
                    <tr><td colSpan={3} style={{ textAlign: 'center', padding: '32px', color: 'var(--slate)' }}>No entries recorded</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Categorical Insights: Frequency Bars */}
            {categoricalInsights.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <h2 style={{ margin: '0 0 24px 0', fontSize: 20, fontFamily: 'Playfair Display, serif' }}>Categorical Tracking</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                  {categoricalInsights.map((insight, i) => (
                    <div key={i} className="patient-card" style={{ backgroundColor: 'var(--snow)', padding: 24 }}>
                      <h4 style={{ margin: '0 0 20px', color: 'var(--slate)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'var(--font-mono)' }}>{insight.text}</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {insight.frequencies.map((f, fi) => {
                          const maxForThis = insight.frequencies[0]?.count || 1;
                          const ratio = (f.count / maxForThis) * 100;
                          const color = COLORS[(i + fi) % COLORS.length]; 
                          return (
                            <div key={fi}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
                                <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
                                  {insight.type === 'yes_no' ? (f.item === 'true' ? 'Yes' : 'No') : f.item}
                                </span>
                                <span style={{ color: 'var(--slate)' }}>{f.count} check-ins</span>
                              </div>
                              <div style={{ height: 6, backgroundColor: 'var(--fog)', borderRadius: 3, overflow: 'hidden' }}>
                                {/* Cap width at 100% relative to the highest frequency element for clean visualization */}
                                <div style={{ height: '100%', backgroundColor: color, width: `${Math.min(100, Math.max(5, ratio))}%`, borderRadius: 3 }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── AI Analysis Panel ── */}
            <div className="patient-card" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 20, background: 'linear-gradient(135deg, #FF6B8A, #E8568A)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={20} color="white" />
                  </div>
                  <h2 style={{ margin: 0, fontSize: 20, fontFamily: 'Playfair Display, serif' }}>AI Analysis</h2>
                </div>
              </div>

              {/* Day Range Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <span style={{ fontSize: 13, color: 'var(--slate)', fontFamily: 'var(--font-mono)' }}>Analyze last:</span>
                {[7, 14, 30, 90].map(days => (
                  <button
                    key={days}
                    onClick={() => setAiDayRange(days)}
                    style={{
                      padding: '6px 14px', borderRadius: 20, border: 'none',
                      background: aiDayRange === days ? 'var(--glacier)' : 'var(--fog)',
                      color: aiDayRange === days ? 'white' : 'var(--slate)',
                      fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    {days}d
                  </button>
                ))}
              </div>

              {/* Generate Button */}
              <button
                onClick={runAiAnalysis}
                disabled={aiLoading || responses.length === 0}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  width: '100%', padding: '14px 24px', borderRadius: 16, border: 'none',
                  background: aiLoading ? 'var(--slate)' : 'linear-gradient(135deg, #FF6B8A, #E8568A)',
                  color: 'white', fontWeight: 700, fontSize: 15, cursor: aiLoading ? 'wait' : 'pointer',
                  transition: 'all 0.3s', opacity: responses.length === 0 ? 0.4 : 1,
                  boxShadow: aiLoading ? 'none' : '0 4px 16px rgba(212, 120, 138, 0.25)'
                }}
              >
                <Sparkles size={18} />
                {aiLoading ? 'Analyzing with Gemini...' : 'Generate Insight'}
              </button>

              {/* Error State */}
              {aiError && (
                <div style={{
                  marginTop: 16, padding: '14px 18px', borderRadius: 12,
                  backgroundColor: 'rgba(212, 120, 138, 0.08)', border: '1px solid rgba(212, 120, 138, 0.2)',
                  color: 'var(--blush)', fontSize: 14
                }}>
                  {aiError}
                </div>
              )}

              {/* AI Insight Blurb */}
              {aiInsight && (
                <div style={{
                  marginTop: 20, padding: '20px 24px', borderRadius: 16,
                  backgroundColor: 'var(--fog)', border: '1px solid rgba(91, 163, 191, 0.15)',
                  lineHeight: 1.7, fontSize: 15, color: 'var(--ink)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--slate)', fontFamily: 'var(--font-mono)' }}>
                    <Sparkles size={14} />
                    Gemini Analysis · Last {aiDayRange} days
                  </div>
                  {aiInsight}
                </div>
              )}
            </div>

          </div>
        ) : (
          /* DECK EDITOR VIEW */
          <div className="deck-container" style={{ height: 'auto' }}>
            {/* Left Side: Active Questions */}
            <section className="active-deck">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ margin: 0 }}>Active Deck ({questions.length})</h2>
                <button 
                  onClick={handlePushToApp}
                  disabled={isPushing}
                  style={{ 
                    padding: '8px 16px', borderRadius: '12px', border: 'none', 
                    background: isPushing ? 'var(--moss)' : 'var(--aurora)', 
                    color: 'white', fontWeight: 600, cursor: isPushing ? 'default' : 'pointer',
                    transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  {isPushing ? <CheckCircle2 size={18} /> : null}
                  {isPushing ? 'Synced with App' : 'Push to App'}
                </button>
              </div>
              
              {questions.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px 20px' }}>
                  <h3>No questions</h3>
                  <p>Add questions from the library on the right.</p>
                </div>
              ) : (
                <div className="questions-list">
                  {questions.map((q, i) => (
                    <div key={q.id} className="question-row">
                      <div className="order-controls">
                        <button onClick={() => moveQuestion(i, 'up')} disabled={i === 0}>▲</button>
                        <button onClick={() => moveQuestion(i, 'down')} disabled={i === questions.length - 1}>▼</button>
                      </div>
                      <div className="q-content">
                        <div className="q-text">{q.text}</div>
                        <div className="q-type">{q.type.replace('_', ' ')}</div>
                      </div>
                      <button className="del-btn" onClick={() => removeQuestion(q.id)}><X size={16} /></button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Right Side: Library */}
            <section className="library-panel">
              <h2>Question Library</h2>
              <div style={{ padding: '0 20px 16px' }}>
                <input 
                  type="text" 
                  placeholder="Search questions or categories..." 
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--ice)', backgroundColor: 'var(--fog)', fontSize: '14px', outline: 'none', color: 'var(--ink)' }}
                />
              </div>
              <div className="library-list">
                {filteredLibrary.map(template => (
                  <div key={template.id} className="library-card">
                    <div className="card-top">
                      <span className="badge">{template.category}</span>
                      <button className="add-btn" onClick={() => addFromLibrary(template)}>+</button>
                    </div>
                    <div className="q-text">{template.text}</div>
                    <div className="q-type">{template.type.replace('_', ' ')}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
