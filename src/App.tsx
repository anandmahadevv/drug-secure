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
    <div className="relative">
      <button
        onClick={() => setView('dashboard')}
        className="fixed z-50 bottom-4 right-4 bg-ayurveda-green/90 hover:bg-ayurveda-green text-white px-4 py-2 rounded-lg font-sans border border-ayurveda-leaf shadow-lg text-sm font-medium backdrop-blur-sm transition-all"
      >
        View Lab Dashboard →
      </button>
      <Landing />
    </div>
  );
}

export default App;
