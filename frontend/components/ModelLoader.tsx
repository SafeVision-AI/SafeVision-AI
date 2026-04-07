'use client';

import { useAppStore } from '@/lib/store';

export function ModelLoader() {
  const { aiMode, modelLoadProgress } = useAppStore();

  if (aiMode !== 'loading') return null;

  return (
    <div 
      className="animate-fade-in-up"
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(7, 19, 37, 0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center'
      }}
    >
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: 'var(--bg-card-high)',
        border: '3px solid var(--accent-purple)',
        borderTopColor: 'transparent',
        animation: 'spin 1s linear infinite',
        marginBottom: '1.5rem',
      }} />
      
      <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>
        Loading Offline AI Model
      </div>
      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '300px' }}>
        Downloading Phi-3 Mini for on-device inference. This requires ~1.5GB of initial download but works completely offline forever.
      </div>

      <div style={{ width: '100%', maxWidth: '300px', height: '6px', background: 'var(--bg-card)', borderRadius: '99px', overflow: 'hidden' }}>
        <div 
          style={{ 
            height: '100%', 
            width: `${modelLoadProgress}%`,
            background: 'var(--accent-purple)',
            transition: 'width 0.3s ease'
          }} 
        />
      </div>
      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
        {Math.round(modelLoadProgress)}%
      </div>
    </div>
  );
}
