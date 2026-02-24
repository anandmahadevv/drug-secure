import { useState } from 'react';
import Dashboard from '../dashboard/Dashboard';
import Landing from './landing/Landing';

function App() {
  const [view, setView] = useState<'landing' | 'dashboard'>('landing');

  if (view === 'dashboard') {
    return (
      <div className="w-full h-screen bg-slate-900 text-white overflow-hidden relative font-sans">
        <button
          onClick={() => setView('landing')}
          className="absolute z-50 bottom-4 right-4 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 border border-slate-600 shadow-lg text-sm font-medium transition-colors"
        >
          ← Back to Landing
        </button>
        <Dashboard />
      </div>
    );
  }

  return (
    <div>
      <Landing onNavigateToDashboard={() => setView('dashboard')} />
    </div>
  );
}

export default App;
