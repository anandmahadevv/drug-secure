import React, { useState } from 'react';
import {
    ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    BarChart, Bar, Cell, ReferenceLine
} from 'recharts';
import { Activity, Beaker, AlertTriangle, Loader2, CheckCircle, ShieldCheck, RotateCcw, Plus, XCircle, Pencil, Trash2, Info } from 'lucide-react';
import { kmeans } from 'ml-kmeans';

// Mock Data
type ClusterId = 1 | 2 | 3;
interface Sample {
    SampleID: string;
    Brand: string;
    MoisturePct: number;
    AshContent: number;
    HeavyMetalPpm: number;
    ActiveCompoundPct: number;
    pH: number;
}

export interface AnalyzedSample extends Sample {
    Cluster: ClusterId;
}

const mockData: Sample[] = [
    // Brand A: Mostly High Quality
    { SampleID: 'S-001', Brand: 'Brand A', MoisturePct: 4.2, AshContent: 2.1, HeavyMetalPpm: 1.2, ActiveCompoundPct: 95.5, pH: 6.8 },
    { SampleID: 'S-002', Brand: 'Brand A', MoisturePct: 4.5, AshContent: 2.3, HeavyMetalPpm: 1.5, ActiveCompoundPct: 94.2, pH: 6.9 },
    { SampleID: 'S-003', Brand: 'Brand A', MoisturePct: 3.9, AshContent: 1.8, HeavyMetalPpm: 0.9, ActiveCompoundPct: 96.1, pH: 7.0 },
    { SampleID: 'S-004', Brand: 'Brand A', MoisturePct: 4.8, AshContent: 2.5, HeavyMetalPpm: 1.8, ActiveCompoundPct: 93.8, pH: 6.7 },
    { SampleID: 'S-005', Brand: 'Brand A', MoisturePct: 5.1, AshContent: 3.2, HeavyMetalPpm: 3.5, ActiveCompoundPct: 88.5, pH: 6.5 },
    { SampleID: 'S-006', Brand: 'Brand A', MoisturePct: 4.0, AshContent: 2.0, HeavyMetalPpm: 1.1, ActiveCompoundPct: 95.8, pH: 6.8 },

    // Brand B: Mixed
    { SampleID: 'S-007', Brand: 'Brand B', MoisturePct: 5.5, AshContent: 3.5, HeavyMetalPpm: 4.2, ActiveCompoundPct: 85.0, pH: 6.4 },
    { SampleID: 'S-008', Brand: 'Brand B', MoisturePct: 4.2, AshContent: 2.2, HeavyMetalPpm: 1.6, ActiveCompoundPct: 94.0, pH: 6.8 },
    { SampleID: 'S-009', Brand: 'Brand B', MoisturePct: 6.1, AshContent: 4.2, HeavyMetalPpm: 8.5, ActiveCompoundPct: 75.2, pH: 6.1 },
    { SampleID: 'S-010', Brand: 'Brand B', MoisturePct: 5.2, AshContent: 3.1, HeavyMetalPpm: 3.8, ActiveCompoundPct: 87.5, pH: 6.5 },
    { SampleID: 'S-011', Brand: 'Brand B', MoisturePct: 4.7, AshContent: 2.8, HeavyMetalPpm: 2.5, ActiveCompoundPct: 90.5, pH: 6.7 },
    { SampleID: 'S-012', Brand: 'Brand B', MoisturePct: 4.5, AshContent: 2.4, HeavyMetalPpm: 1.9, ActiveCompoundPct: 93.1, pH: 6.8 },

    // Brand C: Mostly Contaminated
    { SampleID: 'S-013', Brand: 'Brand C', MoisturePct: 6.5, AshContent: 4.8, HeavyMetalPpm: 9.5, ActiveCompoundPct: 72.1, pH: 5.9 },
    { SampleID: 'S-014', Brand: 'Brand C', MoisturePct: 7.2, AshContent: 5.5, HeavyMetalPpm: 11.2, ActiveCompoundPct: 68.5, pH: 5.7 },
    { SampleID: 'S-015', Brand: 'Brand C', MoisturePct: 5.4, AshContent: 3.4, HeavyMetalPpm: 4.8, ActiveCompoundPct: 83.2, pH: 6.3 },
    { SampleID: 'S-016', Brand: 'Brand C', MoisturePct: 5.2, AshContent: 3.1, HeavyMetalPpm: 4.1, ActiveCompoundPct: 85.5, pH: 6.4 },
    { SampleID: 'S-017', Brand: 'Brand C', MoisturePct: 6.8, AshContent: 5.1, HeavyMetalPpm: 10.5, ActiveCompoundPct: 70.2, pH: 5.8 },
    { SampleID: 'S-018', Brand: 'Brand C', MoisturePct: 6.3, AshContent: 4.5, HeavyMetalPpm: 8.8, ActiveCompoundPct: 74.5, pH: 6.0 },
];

const CLUSTER_COLORS = {
    1: '#22c55e', // Green
    2: '#f59e0b', // Amber
    3: '#ef4444', // Red
};

const CLUSTER_LABELS = {
    1: 'High Purity',
    2: 'Moderate Risk',
    3: 'Contaminated'
};

const INDUSTRY_BENCHMARKS = {
    label: 'WHO / FSSAI Guidelines',
    HeavyMetalPpm: 10,      // max acceptable: 10 ppm (WHO)
    MoisturePct: 8,          // max acceptable: 8%
    AshContent: 5,           // max acceptable: 5% (USP)
    ActiveCompoundPct: 85,   // min acceptable: 85%
    pH: { min: 5.5, max: 7.5 }
};

const computeBrandConsistency = (data: AnalyzedSample[]) => {
    const brandStats: Record<string, { total: number, highPurity: number }> = {};
    data.forEach(sample => {
        if (!brandStats[sample.Brand]) {
            brandStats[sample.Brand] = { total: 0, highPurity: 0 };
        }
        brandStats[sample.Brand].total += 1;
        if (sample.Cluster === 1) {
            brandStats[sample.Brand].highPurity += 1;
        }
    });

    return Object.entries(brandStats).map(([brand, stats]) => ({
        name: brand,
        score: Math.round((stats.highPurity / stats.total) * 100)
    }));
};

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl text-sm z-50 relative">
                <p className="font-semibold text-slate-200 mb-1">{data.Brand}</p>
                <p className="text-slate-300">Active Compound: <span className="font-mono text-indigo-400">{data.ActiveCompoundPct.toFixed(1)}%</span></p>
                <p className="text-slate-300">Heavy Metals: <span className="font-mono text-indigo-400">{data.HeavyMetalPpm.toFixed(1)} ppm</span></p>
            </div>
        );
    }
    return null;
};

export default function Dashboard() {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [hasAnalyzed, setHasAnalyzed] = useState(false);
    const [analyzedData, setAnalyzedData] = useState<AnalyzedSample[]>([]);
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
    const [customSamples, setCustomSamples] = useState<Sample[]>([]);
    const [analysisError, setAnalysisError] = useState<string>('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [newSample, setNewSample] = useState({ Brand: '', MoisturePct: '', AshContent: '', HeavyMetalPpm: '', ActiveCompoundPct: '', pH: '' });
    const [validationError, setValidationError] = useState('');
    const [editingSampleId, setEditingSampleId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<typeof newSample | null>(null);

    const handleAddSample = () => {
        const { Brand, MoisturePct, AshContent, HeavyMetalPpm, ActiveCompoundPct, pH } = newSample;
        const m = parseFloat(MoisturePct);
        const a = parseFloat(AshContent);
        const hm = parseFloat(HeavyMetalPpm);
        const ac = parseFloat(ActiveCompoundPct);
        const p = parseFloat(pH);
        if (!Brand.trim() || isNaN(m) || isNaN(a) || isNaN(hm) || isNaN(ac) || isNaN(p) || m < 0 || a < 0 || hm < 0 || ac < 0 || p < 0) {
            setValidationError('Please fill all fields correctly (non-negative numbers).');
            return;
        }
        setValidationError('');
        const newId = `C-${String(customSamples.length + 1).padStart(3, '0')}`;
        setCustomSamples([...customSamples, {
            SampleID: newId, Brand, MoisturePct: m, AshContent: a, HeavyMetalPpm: hm, ActiveCompoundPct: ac, pH: p
        }]);
        setNewSample({ Brand: '', MoisturePct: '', AshContent: '', HeavyMetalPpm: '', ActiveCompoundPct: '', pH: '' });
        setShowAddForm(false);
        setHasAnalyzed(false);
    };

    const handleReset = () => {
        setCustomSamples([]);
        setAnalyzedData([]);
        setHasAnalyzed(false);
        setAnalysisError('');
        setExpandedRowId(null);
        setValidationError('');
        setShowAddForm(false);
    };

    const handleRunAnalysis = () => {
        setAnalysisError('');
        setIsAnalyzing(true);
        setHasAnalyzed(false);
        setExpandedRowId(null);
        setTimeout(() => {
            const combinedData = [...mockData, ...customSamples];

            if (combinedData.length < 6) {
                setAnalysisError('Analysis failed: not enough sample diversity. Please add more samples.');
                setIsAnalyzing(false);
                return;
            }

            // Apply Min-Max Normalization
            const features = ['MoisturePct', 'AshContent', 'HeavyMetalPpm', 'ActiveCompoundPct', 'pH'] as const;

            const mins = {} as Record<string, number>;
            const maxs = {} as Record<string, number>;

            let noDiversity = false;
            features.forEach(f => {
                mins[f] = Math.min(...combinedData.map(d => d[f]));
                maxs[f] = Math.max(...combinedData.map(d => d[f]));
                if (mins[f] === maxs[f]) noDiversity = true;
            });

            if (noDiversity) {
                setAnalysisError('Analysis failed: not enough sample diversity. Please add more samples.');
                setIsAnalyzing(false);
                return;
            }

            const normalizedData = combinedData.map(d =>
                features.map(f => {
                    const range = maxs[f] - mins[f];
                    return range === 0 ? 0 : (d[f] - mins[f]) / range;
                })
            );

            // Run K-Means Clustering
            const result = kmeans(normalizedData, 3, { initialization: 'kmeans++', seed: 42 });

            // Map clusters
            const clusterIndices = [0, 1, 2];
            const clusterAvgActive = clusterIndices.map(clusterIdx => {
                const samplesInCluster = combinedData.filter((_, idx) => result.clusters[idx] === clusterIdx);
                const avgActive = samplesInCluster.length > 0
                    ? samplesInCluster.reduce((sum, s) => sum + s.ActiveCompoundPct, 0) / samplesInCluster.length
                    : 0;
                return { clusterIdx, avgActive };
            });

            clusterAvgActive.sort((a, b) => b.avgActive - a.avgActive);

            for (let i = 0; i < clusterAvgActive.length - 1; i++) {
                if (Math.abs(clusterAvgActive[i].avgActive - clusterAvgActive[i + 1].avgActive) <= 2.0) {
                    console.warn("Warning: cluster separation is low, mapping may be unreliable");
                    break;
                }
            }

            const indexToIdMap: Record<number, ClusterId> = {
                [clusterAvgActive[0].clusterIdx]: 1,
                [clusterAvgActive[1].clusterIdx]: 2,
                [clusterAvgActive[2].clusterIdx]: 3,
            };

            const newAnalyzedData: AnalyzedSample[] = combinedData.map((d, idx) => ({
                ...d,
                Cluster: indexToIdMap[result.clusters[idx]]
            }));

            setAnalyzedData(newAnalyzedData);
            setIsAnalyzing(false);
            setHasAnalyzed(true);
        }, 800);
    };

    // Filter data for scatter plot
    const scatterCluster1 = analyzedData.filter(d => d.Cluster === 1);
    const scatterCluster2 = analyzedData.filter(d => d.Cluster === 2);
    const scatterCluster3 = analyzedData.filter(d => d.Cluster === 3);

    const allData = [...mockData, ...customSamples];
    const dynamicBrandConsistencyData = computeBrandConsistency(analyzedData);
    const totalSamples = allData.length;
    const flaggedSamples = analyzedData.filter(s => s.Cluster === 2 || s.Cluster === 3).length;
    const cleanSamples = analyzedData.filter(s => s.Cluster === 1).length;

    const clusterStats = {
        1: { active: 0, heavy: 0 },
        2: { active: 0, heavy: 0 },
        3: { active: 0, heavy: 0 }
    };

    if (hasAnalyzed) {
        [1, 2, 3].forEach(cNum => {
            const clusterId = cNum as ClusterId;
            const samples = analyzedData.filter(s => s.Cluster === clusterId);
            if (samples.length > 0) {
                clusterStats[clusterId].active = samples.reduce((acc, s) => acc + s.ActiveCompoundPct, 0) / samples.length;
                clusterStats[clusterId].heavy = samples.reduce((acc, s) => acc + s.HeavyMetalPpm, 0) / samples.length;
            }
        });
    }

    return (
        <div className="flex flex-col h-full bg-slate-900 text-slate-100 font-sans">
            <style>{`
                @keyframes fadeSlideUp {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-slide-up {
                    animation: fadeSlideUp 0.6s ease-out forwards;
                    opacity: 0;
                }
                .delay-100 { animation-delay: 100ms; }
                .delay-200 { animation-delay: 200ms; }
                .delay-300 { animation-delay: 300ms; }
            `}</style>
            {/* Navbar */}
            <header className="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700 shadow-md">
                <div className="flex items-center gap-3">
                    <Beaker className="w-6 h-6 text-indigo-400" />
                    <h1 className="text-xl font-bold tracking-wide">DrugSecure <span className="text-slate-400 font-medium ml-2">— Lab Dashboard</span></h1>
                </div>
                <div className="flex items-center gap-4">
                    {hasAnalyzed && (
                        <div className="flex items-center gap-3 mr-2 animate-fade-slide-up">
                            <span className="bg-slate-700 text-slate-200 text-xs font-medium px-2.5 py-1 rounded-full border border-slate-600 flex items-center gap-1.5">
                                <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                                {totalSamples} Samples Analyzed
                            </span>
                            <span className="bg-blue-500/10 text-blue-400 text-xs font-medium px-2.5 py-1 rounded-full border border-blue-500/20 flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                {cleanSamples} Clean
                            </span>
                            <span className="bg-red-500/10 text-red-400 text-xs font-medium px-2.5 py-1 rounded-full border border-red-500/20 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {flaggedSamples} Flagged
                            </span>
                            <span className="bg-indigo-500/10 text-indigo-400 text-xs font-medium px-2.5 py-1 rounded-full border border-indigo-500/20 flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5" />
                                WHO/FSSAI Benchmarked
                            </span>
                        </div>
                    )}
                    <button
                        onClick={handleRunAnalysis}
                        disabled={isAnalyzing}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:text-indigo-300 text-white font-medium rounded-lg transition-colors shadow-sm"
                    >
                        {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" />}
                        {isAnalyzing ? 'Processing...' : 'Run Analysis'}
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex overflow-hidden p-6 gap-6">

                {/* Left Panel - Data Table (30%) */}
                <div className="w-[30%] bg-slate-800 rounded-xl border border-slate-700 shadow-lg flex flex-col overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-slate-200">
                            Test Samples ({mockData.length}{customSamples.length > 0 ? ` + ${customSamples.length} custom` : ''})
                        </h2>
                        <button onClick={handleReset} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-md transition-colors">
                            <RotateCcw className="w-3.5 h-3.5" />
                            Reset
                        </button>
                    </div>
                    <div className="overflow-auto flex-1 p-0">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 sticky top-0 z-10 backdrop-blur-sm">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Sample ID</th>
                                    <th className="px-4 py-3 font-medium">Brand</th>
                                    <th className="px-4 py-3 font-medium">Cluster</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {allData.map((sample) => {
                                    const analyzedState = analyzedData.find(a => a.SampleID === sample.SampleID);
                                    const cluster = analyzedState ? analyzedState.Cluster : null;
                                    const isExpanded = expandedRowId === sample.SampleID;

                                    return (
                                        <React.Fragment key={sample.SampleID}>
                                            <tr
                                                className={`hover:bg-slate-700/30 transition-colors cursor-pointer group ${isExpanded ? 'bg-slate-700/20' : ''} ${sample.SampleID.startsWith('C-') ? 'border-l-2 border-l-indigo-500' : ''}`}
                                                onClick={() => setExpandedRowId(isExpanded ? null : sample.SampleID)}
                                            >
                                                <td className="px-4 py-3 font-mono text-slate-300">{sample.SampleID}</td>
                                                <td className="px-4 py-3 text-slate-300">{sample.Brand}</td>
                                                <td className="px-4 py-3 flex items-center justify-between">
                                                    <div>
                                                        {hasAnalyzed && cluster ? (
                                                            <span className={`font-medium ${cluster === 1 ? 'text-green-500' :
                                                                cluster === 2 ? 'text-amber-500' :
                                                                    'text-red-500'
                                                                }`}>
                                                                {CLUSTER_LABELS[cluster]}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-500">Pending</span>
                                                        )}
                                                    </div>
                                                    {sample.SampleID.startsWith('C-') && (
                                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingSampleId(sample.SampleID);
                                                                    setEditValues({
                                                                        Brand: sample.Brand,
                                                                        MoisturePct: String(sample.MoisturePct),
                                                                        AshContent: String(sample.AshContent),
                                                                        HeavyMetalPpm: String(sample.HeavyMetalPpm),
                                                                        ActiveCompoundPct: String(sample.ActiveCompoundPct),
                                                                        pH: String(sample.pH)
                                                                    });
                                                                    setExpandedRowId(null);
                                                                }}
                                                                className="text-slate-400 hover:text-indigo-400 transition-colors"
                                                            >
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setCustomSamples(customSamples.filter(s => s.SampleID !== sample.SampleID));
                                                                    setHasAnalyzed(false);
                                                                }}
                                                                className="text-slate-400 hover:text-red-500 transition-colors"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                            {editingSampleId === sample.SampleID ? (
                                                <tr className="bg-slate-800/80 border-b-0">
                                                    <td colSpan={3} className="px-4 py-3 border-t-0 text-sm">
                                                        <div className="p-3 bg-slate-900/50 rounded-lg border border-indigo-500/30 space-y-2 drop-shadow-md">
                                                            <input autoFocus placeholder="Brand" value={editValues?.Brand || ''} onChange={e => setEditValues({ ...editValues!, Brand: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <input type="number" placeholder="Moisture %" value={editValues?.MoisturePct || ''} onChange={e => setEditValues({ ...editValues!, MoisturePct: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                                                                <input type="number" placeholder="Ash %" value={editValues?.AshContent || ''} onChange={e => setEditValues({ ...editValues!, AshContent: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                                                                <input type="number" placeholder="Heavy Metal ppm" value={editValues?.HeavyMetalPpm || ''} onChange={e => setEditValues({ ...editValues!, HeavyMetalPpm: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                                                                <input type="number" placeholder="Active %" value={editValues?.ActiveCompoundPct || ''} onChange={e => setEditValues({ ...editValues!, ActiveCompoundPct: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                                                                <input type="number" placeholder="pH" value={editValues?.pH || ''} onChange={e => setEditValues({ ...editValues!, pH: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors col-span-2" />
                                                            </div>
                                                            <div className="flex justify-end gap-2 mt-2">
                                                                <button onClick={() => setEditingSampleId(null)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
                                                                <button
                                                                    onClick={() => {
                                                                        if (!editValues) return;
                                                                        const { Brand, MoisturePct, AshContent, HeavyMetalPpm, ActiveCompoundPct, pH } = editValues;
                                                                        const m = parseFloat(MoisturePct);
                                                                        const a = parseFloat(AshContent);
                                                                        const hm = parseFloat(HeavyMetalPpm);
                                                                        const ac = parseFloat(ActiveCompoundPct);
                                                                        const p = parseFloat(pH);
                                                                        if (!Brand.trim() || isNaN(m) || isNaN(a) || isNaN(hm) || isNaN(ac) || isNaN(p) || m < 0 || a < 0 || hm < 0 || ac < 0 || p < 0) {
                                                                            alert('Please fill all fields correctly (non-negative numbers).');
                                                                            return;
                                                                        }
                                                                        setCustomSamples(customSamples.map(cs => cs.SampleID === sample.SampleID ? {
                                                                            ...cs, Brand, MoisturePct: m, AshContent: a, HeavyMetalPpm: hm, ActiveCompoundPct: ac, pH: p
                                                                        } : cs));
                                                                        setEditingSampleId(null);
                                                                        setEditValues(null);
                                                                        setHasAnalyzed(false);
                                                                    }}
                                                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors text-xs font-medium"
                                                                >
                                                                    Save
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : isExpanded && (
                                                <tr className="bg-slate-800/80 border-b-0">
                                                    <td colSpan={3} className="px-4 py-3 border-t-0">
                                                        <div className="grid grid-cols-5 gap-2 text-xs text-slate-400 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 shadow-inner">
                                                            <div className="flex flex-col"><span className="uppercase text-[10px] text-slate-500 font-semibold mb-0.5">Moisture</span><span className="font-mono text-slate-300">{sample.MoisturePct}%</span></div>
                                                            <div className="flex flex-col"><span className="uppercase text-[10px] text-slate-500 font-semibold mb-0.5">Ash</span><span className="font-mono text-slate-300">{sample.AshContent}%</span></div>
                                                            <div className="flex flex-col"><span className="uppercase text-[10px] text-slate-500 font-semibold mb-0.5">Heavy Metal</span><span className="font-mono text-slate-300">{sample.HeavyMetalPpm} ppm</span></div>
                                                            <div className="flex flex-col"><span className="uppercase text-[10px] text-slate-500 font-semibold mb-0.5">Active Cmpd</span><span className="font-mono text-slate-300">{sample.ActiveCompoundPct}%</span></div>
                                                            <div className="flex flex-col"><span className="uppercase text-[10px] text-slate-500 font-semibold mb-0.5">pH</span><span className="font-mono text-slate-300">{sample.pH}</span></div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-3 border-t border-slate-700 bg-slate-800/80 mt-auto">
                        {showAddForm && (
                            <div className="mb-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 space-y-2 text-sm drop-shadow-md">
                                <input placeholder="Brand" value={newSample.Brand} onChange={e => setNewSample({ ...newSample, Brand: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                                <div className="grid grid-cols-2 gap-2">
                                    <input type="number" placeholder="Moisture %" value={newSample.MoisturePct} onChange={e => setNewSample({ ...newSample, MoisturePct: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                                    <input type="number" placeholder="Ash %" value={newSample.AshContent} onChange={e => setNewSample({ ...newSample, AshContent: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                                    <input type="number" placeholder="Heavy Metal ppm" value={newSample.HeavyMetalPpm} onChange={e => setNewSample({ ...newSample, HeavyMetalPpm: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                                    <input type="number" placeholder="Active %" value={newSample.ActiveCompoundPct} onChange={e => setNewSample({ ...newSample, ActiveCompoundPct: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                                    <input type="number" placeholder="pH" value={newSample.pH} onChange={e => setNewSample({ ...newSample, pH: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors col-span-2" />
                                </div>
                                {validationError && <p className="text-red-400 text-xs mt-1">{validationError}</p>}
                                <button onClick={handleAddSample} className="mt-2 w-full bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30 rounded py-1.5 transition-colors font-medium text-xs">
                                    Add to Dataset
                                </button>
                            </div>
                        )}
                        <button
                            onClick={() => { setShowAddForm(!showAddForm); setValidationError(''); }}
                            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg transition-colors border border-dashed border-slate-700"
                        >
                            <Plus className="w-4 h-4" />
                            {showAddForm ? 'Cancel' : 'Add Sample'}
                        </button>
                    </div>
                </div>

                {/* Right Panel - Visualizations (70%) */}
                <div className="w-[70%] flex flex-col gap-6 overflow-y-auto pr-2">

                    {analysisError && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3 text-red-500 shadow-sm animate-fade-slide-up">
                            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-red-400">Analysis Failed</h4>
                                <p className="text-sm mt-0.5">{analysisError}</p>
                            </div>
                        </div>
                    )}

                    {!hasAnalyzed ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/30">
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
                                    <p className="text-lg font-medium text-slate-300">Running advanced clustering analysis...</p>
                                    <p className="text-sm mt-2 text-slate-500">Evaluating active compounds and heavy metal ppm</p>
                                </>
                            ) : (
                                <>
                                    <Beaker className="w-12 h-12 mb-4 opacity-50" />
                                    <p className="text-lg font-medium">Awaiting Analysis</p>
                                    <p className="text-sm mt-2">Click "Run Analysis" to generate insights.</p>
                                </>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Charts Row */}
                            <div className="flex flex-col gap-6">

                                {/* Scatter Plot */}
                                <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-md h-80 flex flex-col animate-fade-slide-up delay-100">
                                    <h3 className="text-md font-semibold text-slate-200 mb-1">Chemical Profile Clustering</h3>
                                    <p className="text-xs text-indigo-400/70 mb-2">Reference: WHO / FSSAI Herbal Medicine Guidelines — Heavy Metal &lt; 10 ppm, Active Compound &gt; 85%, Moisture &lt; 8%, Ash &lt; 5%</p>
                                    <div className="flex-1 w-full min-h-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ScatterChart margin={{ top: 10, right: 30, bottom: 20, left: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                                <XAxis
                                                    type="number"
                                                    dataKey="ActiveCompoundPct"
                                                    name="Active Compound (%)"
                                                    domain={[60, 100]}
                                                    stroke="#94a3b8"
                                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                    label={{ value: 'Active Compound (%)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 12 }}
                                                />
                                                <YAxis
                                                    type="number"
                                                    dataKey="HeavyMetalPpm"
                                                    name="Heavy Metals (ppm)"
                                                    stroke="#94a3b8"
                                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                    label={{ value: 'Heavy Metals (ppm)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
                                                />
                                                <RechartsTooltip
                                                    cursor={{ strokeDasharray: '3 3' }}
                                                    content={<CustomTooltip />}
                                                />
                                                <ReferenceLine x={INDUSTRY_BENCHMARKS.ActiveCompoundPct} stroke="#6366f1" strokeDasharray="4 4" label="WHO Min" />
                                                <ReferenceLine y={INDUSTRY_BENCHMARKS.HeavyMetalPpm} stroke="#6366f1" strokeDasharray="4 4" label="WHO Max" />
                                                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px', color: '#cbd5e1' }} />
                                                <Scatter name="High Purity" data={scatterCluster1} fill={CLUSTER_COLORS[1]} />
                                                <Scatter name="Moderate Risk" data={scatterCluster2} fill={CLUSTER_COLORS[2]} />
                                                <Scatter name="Contaminated" data={scatterCluster3} fill={CLUSTER_COLORS[3]} />
                                            </ScatterChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Bar Chart */}
                                <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-md h-64 flex flex-col animate-fade-slide-up delay-200">
                                    <h3 className="text-md font-semibold text-slate-200 mb-4">Brand Consistency Score (% High Purity)</h3>
                                    <div className="flex-1 w-full min-h-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={dynamicBrandConsistencyData}
                                                layout="vertical"
                                                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                                barSize={24}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                                                <XAxis
                                                    type="number"
                                                    domain={[0, 100]}
                                                    stroke="#94a3b8"
                                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                />
                                                <YAxis
                                                    type="category"
                                                    dataKey="name"
                                                    stroke="#94a3b8"
                                                    tick={{ fill: '#94a3b8', fontSize: 13 }}
                                                />
                                                <RechartsTooltip
                                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9', borderRadius: '0.5rem' }}
                                                    formatter={(value) => [`${value}%`, 'Consistency Score']}
                                                    cursor={{ fill: '#334155', opacity: 0.4 }}
                                                />
                                                <Bar
                                                    dataKey="score"
                                                    radius={[0, 4, 4, 0]}
                                                >
                                                    {dynamicBrandConsistencyData.map((entry, index) => {
                                                        const color = entry.score >= 75 ? '#22c55e' : entry.score >= 40 ? '#f59e0b' : '#ef4444';
                                                        return <Cell key={`cell-${index}`} fill={color} />;
                                                    })}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                            </div>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-4 animate-fade-slide-up delay-300">
                                {/* Cluster 1 Card */}
                                <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 border-t-4 border-t-green-500 shadow-md">
                                    <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Cluster 1</h3>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                        <span className="text-lg font-bold text-slate-100">High Purity</span>
                                    </div>
                                    <div className="space-y-1 text-sm text-slate-300">
                                        <p className="flex justify-between"><span>Avg Active:</span> <span className="font-mono text-green-400">{clusterStats[1].active.toFixed(1)}%</span></p>
                                        <p className="flex justify-between"><span>Avg Metal:</span> <span className="font-mono text-green-400">{clusterStats[1].heavy.toFixed(1)} ppm</span></p>
                                        <p className="flex justify-between items-center mt-2 pt-2 border-t border-slate-700">
                                            <span>WHO Compliant:</span>
                                            {clusterStats[1].heavy < INDUSTRY_BENCHMARKS.HeavyMetalPpm && clusterStats[1].active > INDUSTRY_BENCHMARKS.ActiveCompoundPct ? (
                                                <span className="flex items-center gap-1 text-green-400 font-medium"><CheckCircle className="w-3.5 h-3.5" /> Yes</span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-red-400 font-medium"><XCircle className="w-3.5 h-3.5" /> No</span>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {/* Cluster 2 Card */}
                                <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 border-t-4 border-t-amber-500 shadow-md">
                                    <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Cluster 2</h3>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                        <span className="text-lg font-bold text-slate-100">Moderate Risk</span>
                                    </div>
                                    <div className="space-y-1 text-sm text-slate-300">
                                        <p className="flex justify-between"><span>Avg Active:</span> <span className="font-mono text-amber-400">{clusterStats[2].active.toFixed(1)}%</span></p>
                                        <p className="flex justify-between"><span>Avg Metal:</span> <span className="font-mono text-amber-400">{clusterStats[2].heavy.toFixed(1)} ppm</span></p>
                                        <p className="flex justify-between items-center mt-2 pt-2 border-t border-slate-700">
                                            <span>WHO Compliant:</span>
                                            {clusterStats[2].heavy < INDUSTRY_BENCHMARKS.HeavyMetalPpm && clusterStats[2].active > INDUSTRY_BENCHMARKS.ActiveCompoundPct ? (
                                                <span className="flex items-center gap-1 text-green-400 font-medium"><CheckCircle className="w-3.5 h-3.5" /> Yes</span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-red-400 font-medium"><XCircle className="w-3.5 h-3.5" /> No</span>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {/* Cluster 3 Card */}
                                <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 border-t-4 border-t-red-500 shadow-md relative overflow-hidden">
                                    <AlertTriangle className="absolute -bottom-4 -right-4 w-24 h-24 text-red-500/10" />
                                    <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Cluster 3</h3>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                        <span className="text-lg font-bold text-slate-100">Contaminated</span>
                                    </div>
                                    <div className="space-y-1 text-sm text-slate-300">
                                        <p className="flex justify-between"><span>Avg Active:</span> <span className="font-mono text-red-400">{clusterStats[3].active.toFixed(1)}%</span></p>
                                        <p className="flex justify-between"><span>Avg Metal:</span> <span className="font-mono text-red-400">{clusterStats[3].heavy.toFixed(1)} ppm</span></p>
                                        <p className="flex justify-between items-center mt-2 pt-2 border-t border-slate-700">
                                            <span>WHO Compliant:</span>
                                            {clusterStats[3].heavy < INDUSTRY_BENCHMARKS.HeavyMetalPpm && clusterStats[3].active > INDUSTRY_BENCHMARKS.ActiveCompoundPct ? (
                                                <span className="flex items-center gap-1 text-green-400 font-medium"><CheckCircle className="w-3.5 h-3.5" /> Yes</span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-red-400 font-medium"><XCircle className="w-3.5 h-3.5" /> No</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                </div>

            </main>
        </div>
    );
}