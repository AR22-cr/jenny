'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, BookOpen, Settings, LogOut } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [doctorName, setDoctorName] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/');
      } else {
        supabase.from('doctors').select('name').eq('id', session.user.id).single()
          .then(({ data }) => {
            if (data) setDoctorName(data.name);
          });
      }
    });
  }, [router]);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', Icon: LayoutDashboard },
    { label: 'Patients', path: '/patients', Icon: Users },
    { label: 'Library', path: '/library', Icon: BookOpen },
    { label: 'Settings', path: '/settings', Icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-mark">
          <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="18" r="14" fill="white" opacity="0.9"/>
            <ellipse cx="20" cy="32" rx="10" ry="4" fill="white" opacity="0.3"/>
            <circle cx="16" cy="16" r="2" fill="#1C2B3A"/>
            <circle cx="24" cy="16" r="2" fill="#1C2B3A"/>
            <path d="M18 21 Q20 24 22 21" stroke="#F5A3B5" strokeWidth="2" fill="none" strokeLinecap="round"/>
          </svg>
        </div>
        <h2>Jenny</h2>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.path);
          return (
            <Link key={item.path} href={item.path} className={`nav-item ${isActive ? 'active' : ''}`}>
              <item.Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="doctor-avatar">{doctorName ? doctorName.charAt(0).toUpperCase() : 'D'}</div>
        <div className="doctor-info">
          <div className="doctor-name">Dr. {doctorName || 'Loading...'}</div>
          <button onClick={() => supabase.auth.signOut().then(() => router.replace('/'))} className="logout-btn">
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
