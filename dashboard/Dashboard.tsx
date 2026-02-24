import React, { useState, useRef, useMemo } from 'react';
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

    // Clustering features (numerical)
    MoisturePct: number;
    TotalAsh: number;
    AcidInsolAsh: number;
    HeavyMetalPpm: number;
    ActiveCompoundPct: number;
    WaterExtractPct: number;
    AlcoholExtractPct: number;
    BulkDensity: number;
    TapDensity: number;
    pH: number;

    // Display-only metadata (optional)
    Color?: string;
    Odor?: string;
    Taste?: string;
    ForeignMatter?: number;
    HPTLCRf?: number;
    Alkaloids?: 'Pass' | 'Fail' | '';
    Flavonoids?: 'Pass' | 'Fail' | '';
    Steroids?: 'Pass' | 'Fail' | '';
    Polyphenols?: 'Pass' | 'Fail' | '';
    Saponins?: 'Pass' | 'Fail' | '';
    Sugars?: 'Pass' | 'Fail' | '';
}

export interface AnalyzedSample extends Sample {
    Cluster: ClusterId;
}

const mockData: Sample[] = [
    // Brand A: Mostly High Quality
    { SampleID: 'S-001', Brand: 'Brand A', MoisturePct: 4.2, TotalAsh: 2.1, AcidInsolAsh: 0.4, HeavyMetalPpm: 1.2, ActiveCompoundPct: 95.5, WaterExtractPct: 21.2, AlcoholExtractPct: 14.1, BulkDensity: 0.46, TapDensity: 0.53, pH: 6.8, Color: 'Light Yellow', Odor: 'Characteristic', Taste: 'Slightly Bitter', Alkaloids: 'Pass', Flavonoids: 'Pass', Steroids: 'Pass', Polyphenols: 'Pass', Saponins: 'Pass', Sugars: 'Pass' },
    { SampleID: 'S-002', Brand: 'Brand A', MoisturePct: 4.5, TotalAsh: 2.3, AcidInsolAsh: 0.5, HeavyMetalPpm: 1.5, ActiveCompoundPct: 94.2, WaterExtractPct: 20.5, AlcoholExtractPct: 13.8, BulkDensity: 0.47, TapDensity: 0.54, pH: 6.9, Color: 'Light Yellow', Odor: 'Characteristic', Taste: 'Slightly Bitter', Alkaloids: 'Pass', Flavonoids: 'Pass', Steroids: 'Pass', Polyphenols: 'Pass', Saponins: 'Pass', Sugars: 'Pass' },
    { SampleID: 'S-003', Brand: 'Brand A', MoisturePct: 3.9, TotalAsh: 1.8, AcidInsolAsh: 0.3, HeavyMetalPpm: 0.9, ActiveCompoundPct: 96.1, WaterExtractPct: 22.1, AlcoholExtractPct: 14.8, BulkDensity: 0.45, TapDensity: 0.52, pH: 7.0, Color: 'Light Yellow', Odor: 'Characteristic', Taste: 'Slightly Bitter', Alkaloids: 'Pass', Flavonoids: 'Pass', Steroids: 'Pass', Polyphenols: 'Pass', Saponins: 'Pass', Sugars: 'Pass' },
    { SampleID: 'S-004', Brand: 'Brand A', MoisturePct: 4.8, TotalAsh: 2.5, AcidInsolAsh: 0.5, HeavyMetalPpm: 1.8, ActiveCompoundPct: 93.8, WaterExtractPct: 19.8, AlcoholExtractPct: 13.2, BulkDensity: 0.48, TapDensity: 0.55, pH: 6.7, Color: 'Light Yellow', Odor: 'Characteristic', Taste: 'Slightly Bitter', Alkaloids: 'Pass', Flavonoids: 'Pass', Steroids: 'Pass', Polyphenols: 'Pass', Saponins: 'Pass', Sugars: 'Pass' },
    { SampleID: 'S-005', Brand: 'Brand A', MoisturePct: 5.1, TotalAsh: 3.2, AcidInsolAsh: 0.8, HeavyMetalPpm: 3.5, ActiveCompoundPct: 88.5, WaterExtractPct: 17.2, AlcoholExtractPct: 11.5, BulkDensity: 0.50, TapDensity: 0.58, pH: 6.5, Color: 'Yellow', Odor: 'Characteristic', Taste: 'Bitter', Alkaloids: 'Pass', Flavonoids: 'Pass', Steroids: 'Pass', Polyphenols: 'Pass', Saponins: 'Pass', Sugars: 'Pass' },
    { SampleID: 'S-006', Brand: 'Brand A', MoisturePct: 4.0, TotalAsh: 2.0, AcidInsolAsh: 0.4, HeavyMetalPpm: 1.1, ActiveCompoundPct: 95.8, WaterExtractPct: 21.5, AlcoholExtractPct: 14.3, BulkDensity: 0.46, TapDensity: 0.53, pH: 6.8, Color: 'Light Yellow', Odor: 'Characteristic', Taste: 'Slightly Bitter', Alkaloids: 'Pass', Flavonoids: 'Pass', Steroids: 'Pass', Polyphenols: 'Pass', Saponins: 'Pass', Sugars: 'Pass' },

    // Brand B: Mixed
    { SampleID: 'S-007', Brand: 'Brand B', MoisturePct: 5.5, TotalAsh: 3.5, AcidInsolAsh: 1.1, HeavyMetalPpm: 4.2, ActiveCompoundPct: 85.0, WaterExtractPct: 15.5, AlcoholExtractPct: 10.2, BulkDensity: 0.51, TapDensity: 0.62, pH: 6.4, Color: 'Yellowish Brown', Odor: 'Faint', Taste: 'Bitter', Alkaloids: 'Pass', Flavonoids: 'Pass', Steroids: 'Fail', Polyphenols: 'Pass', Saponins: 'Pass', Sugars: 'Pass' },
    { SampleID: 'S-008', Brand: 'Brand B', MoisturePct: 4.2, TotalAsh: 2.2, AcidInsolAsh: 0.5, HeavyMetalPpm: 1.6, ActiveCompoundPct: 94.0, WaterExtractPct: 20.1, AlcoholExtractPct: 13.5, BulkDensity: 0.47, TapDensity: 0.54, pH: 6.8, Color: 'Light Yellow', Odor: 'Characteristic', Taste: 'Slightly Bitter', Alkaloids: 'Pass', Flavonoids: 'Pass', Steroids: 'Pass', Polyphenols: 'Pass', Saponins: 'Pass', Sugars: 'Pass' },
    { SampleID: 'S-009', Brand: 'Brand B', MoisturePct: 6.1, TotalAsh: 4.2, AcidInsolAsh: 1.8, HeavyMetalPpm: 8.5, ActiveCompoundPct: 75.2, WaterExtractPct: 11.2, AlcoholExtractPct: 7.5, BulkDensity: 0.55, TapDensity: 0.68, pH: 6.1, Color: 'Brown', Odor: 'Musty', Taste: 'Acrid', Alkaloids: 'Fail', Flavonoids: 'Pass', Steroids: 'Fail', Polyphenols: 'Fail', Saponins: 'Pass', Sugars: 'Pass' },
    { SampleID: 'S-010', Brand: 'Brand B', MoisturePct: 5.2, TotalAsh: 3.1, AcidInsolAsh: 1.0, HeavyMetalPpm: 3.8, ActiveCompoundPct: 87.5, WaterExtractPct: 16.0, AlcoholExtractPct: 10.8, BulkDensity: 0.52, TapDensity: 0.63, pH: 6.5, Color: 'Yellowish Brown', Odor: 'Faint', Taste: 'Bitter', Alkaloids: 'Pass', Flavonoids: 'Pass', Steroids: 'Pass', Polyphenols: 'Pass', Saponins: 'Fail', Sugars: 'Pass' },
    { SampleID: 'S-011', Brand: 'Brand B', MoisturePct: 4.7, TotalAsh: 2.8, AcidInsolAsh: 0.7, HeavyMetalPpm: 2.5, ActiveCompoundPct: 90.5, WaterExtractPct: 18.2, AlcoholExtractPct: 12.1, BulkDensity: 0.49, TapDensity: 0.58, pH: 6.7, Color: 'Yellow', Odor: 'Characteristic', Taste: 'Slightly Bitter', Alkaloids: 'Pass', Flavonoids: 'Pass', Steroids: 'Pass', Polyphenols: 'Pass', Saponins: 'Pass', Sugars: 'Pass' },
    { SampleID: 'S-012', Brand: 'Brand B', MoisturePct: 4.5, TotalAsh: 2.4, AcidInsolAsh: 0.6, HeavyMetalPpm: 1.9, ActiveCompoundPct: 93.1, WaterExtractPct: 19.5, AlcoholExtractPct: 13.0, BulkDensity: 0.48, TapDensity: 0.56, pH: 6.8, Color: 'Light Yellow', Odor: 'Characteristic', Taste: 'Slightly Bitter', Alkaloids: 'Pass', Flavonoids: 'Pass', Steroids: 'Pass', Polyphenols: 'Pass', Saponins: 'Pass', Sugars: 'Pass' },

    // Brand C: Mostly Contaminated
    { SampleID: 'S-013', Brand: 'Brand C', MoisturePct: 6.5, TotalAsh: 4.8, AcidInsolAsh: 2.5, HeavyMetalPpm: 9.5, ActiveCompoundPct: 72.1, WaterExtractPct: 10.2, AlcoholExtractPct: 6.1, BulkDensity: 0.58, TapDensity: 0.74, pH: 5.9, Color: 'Dark Brown', Odor: 'Musty', Taste: 'Acrid', Alkaloids: 'Fail', Flavonoids: 'Fail', Steroids: 'Fail', Polyphenols: 'Fail', Saponins: 'Pass', Sugars: 'Pass' },
    { SampleID: 'S-014', Brand: 'Brand C', MoisturePct: 7.2, TotalAsh: 5.5, AcidInsolAsh: 3.2, HeavyMetalPpm: 11.2, ActiveCompoundPct: 68.5, WaterExtractPct: 9.1, AlcoholExtractPct: 5.2, BulkDensity: 0.61, TapDensity: 0.79, pH: 5.7, Color: 'Dark Brown', Odor: 'Rancid', Taste: 'Acrid', Alkaloids: 'Fail', Flavonoids: 'Fail', Steroids: 'Fail', Polyphenols: 'Fail', Saponins: 'Fail', Sugars: 'Pass' },
    { SampleID: 'S-015', Brand: 'Brand C', MoisturePct: 5.4, TotalAsh: 3.4, AcidInsolAsh: 1.2, HeavyMetalPpm: 4.8, ActiveCompoundPct: 83.2, WaterExtractPct: 14.5, AlcoholExtractPct: 9.8, BulkDensity: 0.52, TapDensity: 0.64, pH: 6.3, Color: 'Yellowish Brown', Odor: 'Faint', Taste: 'Bitter', Alkaloids: 'Pass', Flavonoids: 'Pass', Steroids: 'Fail', Polyphenols: 'Pass', Saponins: 'Pass', Sugars: 'Pass' },
    { SampleID: 'S-016', Brand: 'Brand C', MoisturePct: 5.2, TotalAsh: 3.1, AcidInsolAsh: 1.0, HeavyMetalPpm: 4.1, ActiveCompoundPct: 85.5, WaterExtractPct: 15.2, AlcoholExtractPct: 10.1, BulkDensity: 0.51, TapDensity: 0.62, pH: 6.4, Color: 'Yellowish Brown', Odor: 'Faint', Taste: 'Bitter', Alkaloids: 'Pass', Flavonoids: 'Pass', Steroids: 'Fail', Polyphenols: 'Pass', Saponins: 'Pass', Sugars: 'Pass' },
    { SampleID: 'S-017', Brand: 'Brand C', MoisturePct: 6.8, TotalAsh: 5.1, AcidInsolAsh: 2.9, HeavyMetalPpm: 10.5, ActiveCompoundPct: 70.2, WaterExtractPct: 9.8, AlcoholExtractPct: 5.8, BulkDensity: 0.60, TapDensity: 0.77, pH: 5.8, Color: 'Dark Brown', Odor: 'Musty', Taste: 'Acrid', Alkaloids: 'Fail', Flavonoids: 'Fail', Steroids: 'Fail', Polyphenols: 'Fail', Saponins: 'Pass', Sugars: 'Pass' },
    { SampleID: 'S-018', Brand: 'Brand C', MoisturePct: 6.3, TotalAsh: 4.5, AcidInsolAsh: 2.2, HeavyMetalPpm: 8.8, ActiveCompoundPct: 74.5, WaterExtractPct: 10.8, AlcoholExtractPct: 6.5, BulkDensity: 0.57, TapDensity: 0.72, pH: 6.0, Color: 'Dark Brown', Odor: 'Musty', Taste: 'Acrid', Alkaloids: 'Fail', Flavonoids: 'Fail', Steroids: 'Fail', Polyphenols: 'Fail', Saponins: 'Pass', Sugars: 'Pass' },
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
    label: 'WHO / FSSAI / IP Guidelines',
    HeavyMetalPpm: 10,
    MoisturePct: 8,
    TotalAsh: 5,
    AcidInsolAsh: 1.0,
    ActiveCompoundPct: 85,
    WaterExtractPct: 15,
    AlcoholExtractPct: 10,
    pH: { min: 5.5, max: 7.5 },
    CarrsIndex: 25,
    HausnersRatio: 1.35
};

const isCompliant = (stats: { active: number, heavy: number, waterExtract: number, alcoholExtract: number }) =>
    stats.heavy < INDUSTRY_BENCHMARKS.HeavyMetalPpm &&
    stats.active > INDUSTRY_BENCHMARKS.ActiveCompoundPct &&
    stats.waterExtract > INDUSTRY_BENCHMARKS.WaterExtractPct &&
    stats.alcoholExtract > INDUSTRY_BENCHMARKS.AlcoholExtractPct;

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


const CustomDot = (props: any) => {
    const { cx, cy, fill, payload } = props;
    const isCustom = payload?.SampleID?.startsWith('C-');
    if (isCustom) {
        return <polygon points={`${cx},${cy - 6} ${cx + 5},${cy + 4} ${cx - 5},${cy + 4}`} fill={fill} stroke="white" strokeWidth={1.5} />;
    }
    return <circle cx={cx} cy={cy} r={5} fill={fill} />;
};

const SampleDetailPanel = ({ sample }: { sample: Sample }) => {
    return (
        <div className="flex flex-col gap-3 text-xs text-slate-400 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 shadow-inner">
            {/* Section A: Physicochemical */}
            <div>
                <h4 className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider mb-2 pb-1 border-b border-slate-700/50">Physicochemical Parameters</h4>
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5"><span className="w-32">Moisture %:</span><span className="font-mono text-slate-300">{sample.MoisturePct}</span>{sample.MoisturePct <= INDUSTRY_BENCHMARKS.MoisturePct ? <CheckCircle className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500" />}</div>
                    <div className="flex items-center gap-1.5"><span className="w-32">Total Ash %:</span><span className="font-mono text-slate-300">{sample.TotalAsh}</span>{sample.TotalAsh <= INDUSTRY_BENCHMARKS.TotalAsh ? <CheckCircle className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500" />}</div>
                    <div className="flex items-center gap-1.5"><span className="w-32">Acid Insol. Ash %:</span><span className="font-mono text-slate-300">{sample.AcidInsolAsh}</span>{sample.AcidInsolAsh <= INDUSTRY_BENCHMARKS.AcidInsolAsh ? <CheckCircle className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500" />}</div>
                    <div className="flex items-center gap-1.5"><span className="w-32">Heavy Metal ppm:</span><span className="font-mono text-slate-300">{sample.HeavyMetalPpm}</span>{sample.HeavyMetalPpm <= INDUSTRY_BENCHMARKS.HeavyMetalPpm ? <CheckCircle className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500" />}</div>
                    <div className="flex items-center gap-1.5"><span className="w-32">Active Compound %:</span><span className="font-mono text-slate-300">{sample.ActiveCompoundPct}</span>{sample.ActiveCompoundPct >= INDUSTRY_BENCHMARKS.ActiveCompoundPct ? <CheckCircle className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500" />}</div>
                    <div className="flex items-center gap-1.5"><span className="w-32">Water Extract %:</span><span className="font-mono text-slate-300">{sample.WaterExtractPct}</span>{sample.WaterExtractPct >= INDUSTRY_BENCHMARKS.WaterExtractPct ? <CheckCircle className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500" />}</div>
                    <div className="flex items-center gap-1.5"><span className="w-32">Alcohol Extract %:</span><span className="font-mono text-slate-300">{sample.AlcoholExtractPct}</span>{sample.AlcoholExtractPct >= INDUSTRY_BENCHMARKS.AlcoholExtractPct ? <CheckCircle className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500" />}</div>
                    <div className="flex items-center gap-1.5"><span className="w-32">pH:</span><span className="font-mono text-slate-300">{sample.pH}</span>{sample.pH >= INDUSTRY_BENCHMARKS.pH.min && sample.pH <= INDUSTRY_BENCHMARKS.pH.max ? <CheckCircle className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500" />}</div>
                </div>
            </div>

            {/* Section B: Powder Flow */}
            <div>
                <h4 className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider mb-2 pb-1 border-b border-slate-700/50">Powder Flow</h4>
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1"><span className="w-32">Bulk Density:</span><span className="font-mono text-slate-300">{sample.BulkDensity} <span className="text-slate-500 text-[10px]">g/mL</span></span></div>
                    <div className="flex items-center gap-1"><span className="w-32">Tap Density:</span><span className="font-mono text-slate-300">{sample.TapDensity} <span className="text-slate-500 text-[10px]">g/mL</span></span></div>
                    <div className="flex items-center gap-1"><span className="w-32">Carr's Index:</span>
                        {(() => {
                            const ci = ((sample.TapDensity - sample.BulkDensity) / sample.TapDensity) * 100;
                            const ciVal = ci.toFixed(1);
                            let color = 'text-green-400';
                            let label = 'Excellent/Good';
                            if (ci >= 15 && ci <= 25) { color = 'text-amber-400'; label = 'Passable'; }
                            else if (ci > 25) { color = 'text-red-400'; label = 'Poor'; }
                            return <span className={`font-mono ${color}`}>{ciVal}% <span className="text-slate-500 text-[10px]">({label})</span></span>;
                        })()}
                    </div>
                    <div className="flex items-center gap-1"><span className="w-32">Hausner's Ratio:</span>
                        {(() => {
                            const hr = sample.TapDensity / sample.BulkDensity;
                            const hrVal = hr.toFixed(2);
                            let color = 'text-green-400';
                            if (hr >= 1.2 && hr <= 1.35) color = 'text-amber-400';
                            else if (hr > 1.35) color = 'text-red-400';
                            return <span className={`font-mono ${color}`}>{hrVal}</span>;
                        })()}
                    </div>
                </div>
            </div>

            {/* Section C: Qualitative */}
            {(sample.Color || sample.Odor || sample.Taste || sample.ForeignMatter !== undefined || sample.HPTLCRf !== undefined || sample.Alkaloids || sample.Flavonoids || sample.Steroids || sample.Polyphenols || sample.Saponins || sample.Sugars) && (
                <div>
                    <h4 className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider mb-2 pb-1 border-b border-slate-700/50">Qualitative Profile</h4>
                    <div className="mb-2 text-slate-300">
                        {sample.Color && <span className="mr-3">Color: <span className="text-white">{sample.Color}</span></span>}
                        {sample.Odor && <span className="mr-3">Odor: <span className="text-white">{sample.Odor}</span></span>}
                        {sample.Taste && <span className="mr-3">Taste: <span className="text-white">{sample.Taste}</span></span>}
                        {sample.ForeignMatter !== undefined && <span className="mr-3">Foreign Matter: <span className="text-white">{sample.ForeignMatter}%</span></span>}
                        {sample.HPTLCRf !== undefined && <span>HPTLC Rf: <span className="text-white">{sample.HPTLCRf}</span></span>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {['Alkaloids', 'Flavonoids', 'Steroids', 'Polyphenols', 'Saponins', 'Sugars'].map(test => {
                            const val = (sample as any)[test];
                            if (!val) return <span key={test} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 border border-slate-700">{test}: —</span>;
                            return (
                                <span key={test} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] border ${val === 'Pass' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                    {test}: {val}
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const ClusterSummaryCard = ({ clusterId, label, color, topColor, stats, isCompliantStatus }: { clusterId: ClusterId, label: string, color: string, topColor: string, stats: { active: number, heavy: number, waterExtract: number, alcoholExtract: number }, isCompliantStatus: boolean }) => {
    return (
        <div className={`bg-slate-800 p-5 rounded-xl border border-slate-700 border-t-4 ${topColor} shadow-md relative overflow-hidden`}>
            {clusterId === 3 && <AlertTriangle className="absolute -bottom-4 -right-4 w-24 h-24 text-red-500/10" />}
            <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Cluster {clusterId}</h3>
            <div className="flex items-center gap-2 mb-3">
                <div className={`w-3 h-3 rounded-full bg-${color}-500`}></div>
                <span className="text-lg font-bold text-slate-100">{label}</span>
            </div>
            <div className="space-y-1 text-sm text-slate-300">
                <p className="flex justify-between"><span>Avg Active:</span> <span className={`font-mono text-${color}-400`}>{stats.active.toFixed(1)}%</span></p>
                <p className="flex justify-between"><span>Avg Metal:</span> <span className={`font-mono text-${color}-400`}>{stats.heavy.toFixed(1)} ppm</span></p>
                <p className="flex justify-between"><span>Avg Water Ext:</span> <span className={`font-mono text-${color}-400`}>{stats.waterExtract.toFixed(1)}%</span></p>
                <p className="flex justify-between"><span>Avg Alcohol Ext:</span> <span className={`font-mono text-${color}-400`}>{stats.alcoholExtract.toFixed(1)}%</span></p>
                <p className="flex justify-between items-center mt-2 pt-2 border-t border-slate-700">
                    <span>WHO Compliant:</span>
                    {isCompliantStatus ? (
                        <span className="flex items-center gap-1 text-green-400 font-medium"><CheckCircle className="w-3.5 h-3.5" /> Yes</span>
                    ) : (
                        <span className="flex items-center gap-1 text-red-400 font-medium"><XCircle className="w-3.5 h-3.5" /> No</span>
                    )}
                </p>
            </div>
        </div>
    );
};

const AddSampleForm = ({ onAdd, nextId }: { onAdd: (sample: Sample) => void, nextId: () => string }) => {
    const [pasteInput, setPasteInput] = useState('');
    const [pasteError, setPasteError] = useState('');
    const [newSample, setNewSample] = useState({
        Brand: '', MoisturePct: '', TotalAsh: '', AcidInsolAsh: '', HeavyMetalPpm: '',
        ActiveCompoundPct: '', WaterExtractPct: '', AlcoholExtractPct: '', BulkDensity: '', TapDensity: '', pH: '',
        Color: '', Odor: '', Taste: '', ForeignMatter: '', HPTLCRf: '',
        Alkaloids: '', Flavonoids: '', Steroids: '', Polyphenols: '', Saponins: '', Sugars: ''
    });
    const [validationError, setValidationError] = useState('');
    const [showQualitative, setShowQualitative] = useState(false);

    const parsePastedData = (raw: string) => {
        const parts = raw.split(/[\t,]/).map(p => p.trim()).filter(p => p !== '');
        if (parts.length >= 11) {
            setNewSample({
                ...newSample,
                Brand: parts[0],
                MoisturePct: parts[1],
                TotalAsh: parts[2],
                AcidInsolAsh: parts[3],
                HeavyMetalPpm: parts[4],
                ActiveCompoundPct: parts[5],
                WaterExtractPct: parts[6],
                AlcoholExtractPct: parts[7],
                BulkDensity: parts[8],
                TapDensity: parts[9],
                pH: parts[10],
            });
            setPasteError('');
            setPasteInput('');
        } else {
            setPasteError(`Expected at least 11 values, got ${parts.length}. Check format.`);
        }
    };

    const handleAdd = () => {
        const { Brand, MoisturePct, TotalAsh, AcidInsolAsh, HeavyMetalPpm, ActiveCompoundPct, WaterExtractPct, AlcoholExtractPct, BulkDensity, TapDensity, pH, Color, Odor, Taste, ForeignMatter, HPTLCRf, Alkaloids, Flavonoids, Steroids, Polyphenols, Saponins, Sugars } = newSample;
        const m = parseFloat(MoisturePct);
        const a = parseFloat(TotalAsh);
        const aia = parseFloat(AcidInsolAsh);
        const hm = parseFloat(HeavyMetalPpm);
        const ac = parseFloat(ActiveCompoundPct);
        const we = parseFloat(WaterExtractPct);
        const ae = parseFloat(AlcoholExtractPct);
        const bd = parseFloat(BulkDensity);
        const td = parseFloat(TapDensity);
        const p = parseFloat(pH);

        if (!Brand.trim() || isNaN(m) || isNaN(a) || isNaN(aia) || isNaN(hm) || isNaN(ac) || isNaN(we) || isNaN(ae) || isNaN(bd) || isNaN(td) || isNaN(p) || m < 0 || a < 0 || aia < 0 || hm < 0 || ac < 0 || we < 0 || ae < 0 || bd <= 0 || td <= 0 || p < 0) {
            setValidationError('Please fill all 10 numerical fields correctly (non-negative numbers).');
            return;
        }
        setValidationError('');
        const newId = nextId();

        const customData: Sample = {
            SampleID: newId, Brand, MoisturePct: m, TotalAsh: a, AcidInsolAsh: aia, HeavyMetalPpm: hm,
            ActiveCompoundPct: ac, WaterExtractPct: we, AlcoholExtractPct: ae, BulkDensity: bd, TapDensity: td, pH: p
        };
        if (Color) customData.Color = Color;
        if (Odor) customData.Odor = Odor;
        if (Taste) customData.Taste = Taste;
        if (ForeignMatter) customData.ForeignMatter = parseFloat(ForeignMatter);
        if (HPTLCRf) customData.HPTLCRf = parseFloat(HPTLCRf);
        if (Alkaloids) customData.Alkaloids = Alkaloids as any;
        if (Flavonoids) customData.Flavonoids = Flavonoids as any;
        if (Steroids) customData.Steroids = Steroids as any;
        if (Polyphenols) customData.Polyphenols = Polyphenols as any;
        if (Saponins) customData.Saponins = Saponins as any;
        if (Sugars) customData.Sugars = Sugars as any;

        onAdd(customData);
        setNewSample({
            Brand: '', MoisturePct: '', TotalAsh: '', AcidInsolAsh: '', HeavyMetalPpm: '',
            ActiveCompoundPct: '', WaterExtractPct: '', AlcoholExtractPct: '', BulkDensity: '', TapDensity: '', pH: '',
            Color: '', Odor: '', Taste: '', ForeignMatter: '', HPTLCRf: '',
            Alkaloids: '', Flavonoids: '', Steroids: '', Polyphenols: '', Saponins: '', Sugars: ''
        });
    };

    return (
        <div className="mb-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 space-y-2 text-sm drop-shadow-md overflow-hidden">
            <div className="mb-3 pb-3 border-b border-slate-700/50 flex flex-col gap-2">
                <h4 className="text-xs text-indigo-400 font-medium tracking-wide font-mono uppercase">Smart Paste Parser</h4>
                <textarea
                    placeholder="Paste tab/comma separated numerical values here..."
                    value={pasteInput}
                    onChange={(e) => setPasteInput(e.target.value)}
                    className="w-full h-16 bg-slate-800 border border-slate-700 rounded p-2 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors text-xs resize-none"
                />
                <div className="flex justify-between items-center gap-2">
                    {pasteError ? <span className="text-red-400 text-[10px] leading-tight flex-1">{pasteError}</span> : <span className="text-slate-500 text-[10px] leading-tight flex-1">Expected: Brand, Moisture, TotalAsh, AcidInsolAsh, HeavyMetal, Active, WaterExt, AlcExt, BulkD, TapD, pH</span>}
                    <button onClick={() => parsePastedData(pasteInput)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-[10px] font-medium transition-colors shrink-0">Parse Data</button>
                </div>
            </div>
            <input placeholder="Brand" value={newSample.Brand} onChange={e => setNewSample({ ...newSample, Brand: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
            <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Moisture %" value={newSample.MoisturePct} onChange={e => setNewSample({ ...newSample, MoisturePct: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                <input type="number" placeholder="Total Ash %" value={newSample.TotalAsh} onChange={e => setNewSample({ ...newSample, TotalAsh: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                <input type="number" placeholder="Acid Insol. Ash %" value={newSample.AcidInsolAsh} onChange={e => setNewSample({ ...newSample, AcidInsolAsh: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                <input type="number" placeholder="Heavy Metal ppm" value={newSample.HeavyMetalPpm} onChange={e => setNewSample({ ...newSample, HeavyMetalPpm: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                <input type="number" placeholder="Active Compound %" value={newSample.ActiveCompoundPct} onChange={e => setNewSample({ ...newSample, ActiveCompoundPct: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                <input type="number" placeholder="Water Extract %" value={newSample.WaterExtractPct} onChange={e => setNewSample({ ...newSample, WaterExtractPct: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                <input type="number" placeholder="Alcohol Extract %" value={newSample.AlcoholExtractPct} onChange={e => setNewSample({ ...newSample, AlcoholExtractPct: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                <input type="number" placeholder="Bulk Density" value={newSample.BulkDensity} onChange={e => setNewSample({ ...newSample, BulkDensity: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                <input type="number" placeholder="Tap Density" value={newSample.TapDensity} onChange={e => setNewSample({ ...newSample, TapDensity: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                <input type="number" placeholder="pH" value={newSample.pH} onChange={e => setNewSample({ ...newSample, pH: e.target.value })} className="col-span-2 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
            </div>
            <button onClick={() => setShowQualitative(!showQualitative)} className="text-[10px] text-slate-500 hover:text-slate-300 link mt-1 w-full text-left">
                {showQualitative ? '－ Hide qualitative data' : '＋ Add qualitative data (optional)'}
            </button>
            {showQualitative && (
                <div className="grid grid-cols-2 gap-2 border-t border-slate-700/50 pt-2 mt-2">
                    <input placeholder="Color" value={newSample.Color} onChange={e => setNewSample({ ...newSample, Color: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                    <input placeholder="Odor" value={newSample.Odor} onChange={e => setNewSample({ ...newSample, Odor: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                    <input placeholder="Taste" value={newSample.Taste} onChange={e => setNewSample({ ...newSample, Taste: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                    <input type="number" placeholder="HPTLC Rf Value" value={newSample.HPTLCRf} onChange={e => setNewSample({ ...newSample, HPTLCRf: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                    <input type="number" placeholder="Foreign Matter %" value={newSample.ForeignMatter} onChange={e => setNewSample({ ...newSample, ForeignMatter: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors col-span-2" />
                    {['Alkaloids', 'Flavonoids', 'Steroids', 'Polyphenols', 'Saponins', 'Sugars'].map(f => (
                        <select key={f} value={(newSample as any)[f]} onChange={e => setNewSample({ ...newSample, [f]: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 outline-none focus:border-indigo-500 transition-colors">
                            <option value="">{f}: —</option>
                            <option value="Pass">Pass</option>
                            <option value="Fail">Fail</option>
                        </select>
                    ))}
                </div>
            )}
            {validationError && <p className="text-red-400 text-xs mt-1">{validationError}</p>}
            <button onClick={handleAdd} className="mt-2 w-full bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30 rounded py-1.5 transition-colors font-medium text-xs">
                Add to Dataset
            </button>
        </div>
    );
};

const EditSampleForm = ({ sample, onSave, onCancel }: { sample: Sample, onSave: (updated: Sample) => void, onCancel: () => void }) => {
    const [editValues, setEditValues] = useState<any>({
        Brand: sample.Brand,
        MoisturePct: String(sample.MoisturePct),
        TotalAsh: String(sample.TotalAsh),
        AcidInsolAsh: String(sample.AcidInsolAsh),
        HeavyMetalPpm: String(sample.HeavyMetalPpm),
        ActiveCompoundPct: String(sample.ActiveCompoundPct),
        WaterExtractPct: String(sample.WaterExtractPct),
        AlcoholExtractPct: String(sample.AlcoholExtractPct),
        BulkDensity: String(sample.BulkDensity),
        TapDensity: String(sample.TapDensity),
        pH: String(sample.pH),
        Color: sample.Color || '',
        Odor: sample.Odor || '',
        Taste: sample.Taste || '',
        ForeignMatter: sample.ForeignMatter !== undefined ? String(sample.ForeignMatter) : '',
        HPTLCRf: sample.HPTLCRf !== undefined ? String(sample.HPTLCRf) : '',
        Alkaloids: sample.Alkaloids || '',
        Flavonoids: sample.Flavonoids || '',
        Steroids: sample.Steroids || '',
        Polyphenols: sample.Polyphenols || '',
        Saponins: sample.Saponins || '',
        Sugars: sample.Sugars || ''
    });
    const [validationError, setValidationError] = useState('');
    const [showQualitativeEdit, setShowQualitativeEdit] = useState(false);

    const handleSave = () => {
        const { Brand, MoisturePct, TotalAsh, AcidInsolAsh, HeavyMetalPpm, ActiveCompoundPct, WaterExtractPct, AlcoholExtractPct, BulkDensity, TapDensity, pH, Color, Odor, Taste, ForeignMatter, HPTLCRf, Alkaloids, Flavonoids, Steroids, Polyphenols, Saponins, Sugars } = editValues;
        const m = parseFloat(MoisturePct);
        const a = parseFloat(TotalAsh);
        const aia = parseFloat(AcidInsolAsh);
        const hm = parseFloat(HeavyMetalPpm);
        const ac = parseFloat(ActiveCompoundPct);
        const we = parseFloat(WaterExtractPct);
        const ae = parseFloat(AlcoholExtractPct);
        const bd = parseFloat(BulkDensity);
        const td = parseFloat(TapDensity);
        const p = parseFloat(pH);
        if (!Brand.trim() || isNaN(m) || isNaN(a) || isNaN(aia) || isNaN(hm) || isNaN(ac) || isNaN(we) || isNaN(ae) || isNaN(bd) || isNaN(td) || isNaN(p) || m < 0 || a < 0 || aia < 0 || hm < 0 || ac < 0 || we < 0 || ae < 0 || bd <= 0 || td <= 0 || p < 0) {
            setValidationError('Please fill all 10 numerical fields correctly (non-negative numbers).');
            return;
        }

        const customData: Sample = {
            SampleID: sample.SampleID, Brand, MoisturePct: m, TotalAsh: a, AcidInsolAsh: aia, HeavyMetalPpm: hm,
            ActiveCompoundPct: ac, WaterExtractPct: we, AlcoholExtractPct: ae, BulkDensity: bd, TapDensity: td, pH: p
        };
        if (Color) customData.Color = Color;
        if (Odor) customData.Odor = Odor;
        if (Taste) customData.Taste = Taste;
        if (ForeignMatter) customData.ForeignMatter = parseFloat(ForeignMatter);
        if (HPTLCRf) customData.HPTLCRf = parseFloat(HPTLCRf);
        if (Alkaloids) customData.Alkaloids = Alkaloids as any;
        if (Flavonoids) customData.Flavonoids = Flavonoids as any;
        if (Steroids) customData.Steroids = Steroids as any;
        if (Polyphenols) customData.Polyphenols = Polyphenols as any;
        if (Saponins) customData.Saponins = Saponins as any;
        if (Sugars) customData.Sugars = Sugars as any;

        onSave(customData);
    };

    return (
        <div className="p-3 bg-slate-900/50 rounded-lg border border-indigo-500/30 space-y-2 drop-shadow-md">
            <input autoFocus placeholder="Brand" value={editValues.Brand || ''} onChange={e => setEditValues({ ...editValues, Brand: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
            <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Moisture %" value={editValues.MoisturePct || ''} onChange={e => setEditValues({ ...editValues, MoisturePct: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                <input type="number" placeholder="Total Ash %" value={editValues.TotalAsh || ''} onChange={e => setEditValues({ ...editValues, TotalAsh: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                <input type="number" placeholder="Acid Insol. Ash %" value={editValues.AcidInsolAsh || ''} onChange={e => setEditValues({ ...editValues, AcidInsolAsh: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                <input type="number" placeholder="Heavy Metal ppm" value={editValues.HeavyMetalPpm || ''} onChange={e => setEditValues({ ...editValues, HeavyMetalPpm: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                <input type="number" placeholder="Active Compound %" value={editValues.ActiveCompoundPct || ''} onChange={e => setEditValues({ ...editValues, ActiveCompoundPct: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                <input type="number" placeholder="Water Extract %" value={editValues.WaterExtractPct || ''} onChange={e => setEditValues({ ...editValues, WaterExtractPct: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                <input type="number" placeholder="Alcohol Extract %" value={editValues.AlcoholExtractPct || ''} onChange={e => setEditValues({ ...editValues, AlcoholExtractPct: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                <input type="number" placeholder="Bulk Density" value={editValues.BulkDensity || ''} onChange={e => setEditValues({ ...editValues, BulkDensity: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                <input type="number" placeholder="Tap Density" value={editValues.TapDensity || ''} onChange={e => setEditValues({ ...editValues, TapDensity: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                <input type="number" placeholder="pH" value={editValues.pH || ''} onChange={e => setEditValues({ ...editValues, pH: e.target.value })} className="col-span-2 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
            </div>
            <button onClick={() => setShowQualitativeEdit(!showQualitativeEdit)} className="text-xs text-slate-500 hover:text-slate-300 link">
                {showQualitativeEdit ? '－ Hide qualitative data' : '＋ Add qualitative data (optional)'}
            </button>
            {showQualitativeEdit && (
                <div className="grid grid-cols-2 gap-2 border-t border-slate-700/50 pt-2 mt-2">
                    <input placeholder="Color" value={editValues.Color || ''} onChange={e => setEditValues({ ...editValues, Color: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                    <input placeholder="Odor" value={editValues.Odor || ''} onChange={e => setEditValues({ ...editValues, Odor: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                    <input placeholder="Taste" value={editValues.Taste || ''} onChange={e => setEditValues({ ...editValues, Taste: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                    <input type="number" placeholder="HPTLC Rf Value" value={editValues.HPTLCRf || ''} onChange={e => setEditValues({ ...editValues, HPTLCRf: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                    <input type="number" placeholder="Foreign Matter %" value={editValues.ForeignMatter || ''} onChange={e => setEditValues({ ...editValues, ForeignMatter: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors col-span-2" />
                    {['Alkaloids', 'Flavonoids', 'Steroids', 'Polyphenols', 'Saponins', 'Sugars'].map(f => (
                        <select key={f} value={(editValues as any)?.[f] || ''} onChange={e => setEditValues({ ...editValues, [f]: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 outline-none focus:border-indigo-500 transition-colors">
                            <option value="">{f}: —</option>
                            <option value="Pass">Pass</option>
                            <option value="Fail">Fail</option>
                        </select>
                    ))}
                </div>
            )}
            {validationError && <p className="text-red-400 text-xs mt-1">{validationError}</p>}
            <div className="flex justify-end gap-2 mt-2">
                <button onClick={onCancel} className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
                <button onClick={handleSave} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors text-xs font-medium">Save</button>
            </div>
        </div>
    );
};

export default function Dashboard() {
    const customSampleCounter = useRef(1);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [hasAnalyzed, setHasAnalyzed] = useState(false);
    const [analyzedData, setAnalyzedData] = useState<AnalyzedSample[]>([]);
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
    const [customSamples, setCustomSamples] = useState<Sample[]>([]);
    const [analysisError, setAnalysisError] = useState<string>('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [isStale, setIsStale] = useState(false);
    const [editingSampleId, setEditingSampleId] = useState<string | null>(null);


    const handleReset = () => {
        setCustomSamples([]);
        setAnalyzedData([]);
        setHasAnalyzed(false);
        setAnalysisError('');
        setExpandedRowId(null);

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
            const features = [
                'MoisturePct', 'TotalAsh', 'AcidInsolAsh', 'HeavyMetalPpm',
                'ActiveCompoundPct', 'WaterExtractPct', 'AlcoholExtractPct',
                'BulkDensity', 'TapDensity', 'pH'
            ] as const;

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
            setIsStale(false);
            setHasAnalyzed(true);
        }, 800);
    };

    // Filter data for scatter plot
    const { scatterCluster1, scatterCluster2, scatterCluster3 } = useMemo(() => ({
        scatterCluster1: analyzedData.filter(d => d.Cluster === 1),
        scatterCluster2: analyzedData.filter(d => d.Cluster === 2),
        scatterCluster3: analyzedData.filter(d => d.Cluster === 3),
    }), [analyzedData]);

    const allData = useMemo(() => [...mockData, ...customSamples], [customSamples]);
    const dynamicBrandConsistencyData = useMemo(() => computeBrandConsistency(analyzedData), [analyzedData]);
    const totalSamples = allData.length;
    const { flaggedSamples, cleanSamples } = useMemo(() => ({
        flaggedSamples: analyzedData.filter(s => s.Cluster === 2 || s.Cluster === 3).length,
        cleanSamples: analyzedData.filter(s => s.Cluster === 1).length,
    }), [analyzedData]);

    const clusterStats = useMemo(() => {
        const stats = {
            1: { active: 0, heavy: 0, waterExtract: 0, alcoholExtract: 0 },
            2: { active: 0, heavy: 0, waterExtract: 0, alcoholExtract: 0 },
            3: { active: 0, heavy: 0, waterExtract: 0, alcoholExtract: 0 }
        };
        if (!hasAnalyzed) return stats;
        ([1, 2, 3] as ClusterId[]).forEach(id => {
            const s = analyzedData.filter(x => x.Cluster === id);
            if (s.length > 0) {
                stats[id].active = s.reduce((acc, x) => acc + x.ActiveCompoundPct, 0) / s.length;
                stats[id].heavy = s.reduce((acc, x) => acc + x.HeavyMetalPpm, 0) / s.length;
                stats[id].waterExtract = s.reduce((acc, x) => acc + x.WaterExtractPct, 0) / s.length;
                stats[id].alcoholExtract = s.reduce((acc, x) => acc + x.AlcoholExtractPct, 0) / s.length;
            }
        });
        return stats;
    }, [analyzedData, hasAnalyzed]);

    const clusterCounts = useMemo(() => ({
        1: analyzedData.filter(s => s.Cluster === 1).length,
        2: analyzedData.filter(s => s.Cluster === 2).length,
        3: analyzedData.filter(s => s.Cluster === 3).length,
    }), [analyzedData]);

    const scatterXDomain = useMemo(() => {
        if (analyzedData.length === 0) return [50, 100];
        const min = Math.min(...analyzedData.map(d => d.ActiveCompoundPct));
        const max = Math.max(...analyzedData.map(d => d.ActiveCompoundPct));
        return [Math.max(0, Math.floor(min - 5)), Math.ceil(max + 2)];
    }, [analyzedData]);

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
                @keyframes pulse-border {
                    0%, 100% { border-bottom-color: rgb(99 102 241 / 0.3); }
                    50% { border-bottom-color: rgb(99 102 241 / 0.9); }
                }
                .analyzing-border {
                    animation: pulse-border 1.2s ease-in-out infinite;
                }
                .delay-300 { animation-delay: 300ms; }
            `}</style>
            {/* Navbar */}
            <header className={`flex items-center justify-between px-6 py-4 bg-slate-800 shadow-md ${isAnalyzing ? "border-b-2 border-b-indigo-500 analyzing-border" : hasAnalyzed && !isStale ? "border-b-2 border-b-green-500/50" : isStale ? "border-b-2 border-b-amber-500/50" : "border-b border-slate-700"}`}>
                <div className="flex items-center gap-3">
                    <Beaker className="w-6 h-6 text-indigo-400" />
                    <h1 className="text-xl font-bold tracking-wide">DrugSecure <span className="text-slate-400 font-medium ml-2">— Lab Dashboard</span></h1>
                </div>
                <div className="flex items-center gap-4">
                    {!hasAnalyzed && customSamples.length > 0 && (
                        <div className="flex items-center gap-2 bg-amber-500/10 text-amber-400 text-xs font-medium px-3 py-1.5 rounded-full border border-amber-500/20 mr-2 animate-fade-slide-up">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></div>
                            {customSamples.length} custom sample{customSamples.length > 1 ? 's' : ''} pending analysis
                        </div>
                    )}
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
                                                                {CLUSTER_LABELS[cluster]} <span className="text-slate-500 font-normal text-xs ml-1">· {clusterCounts[cluster]}</span>
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
                                                        <EditSampleForm sample={sample} onSave={(updated) => { setCustomSamples(customSamples.map(cs => cs.SampleID === sample.SampleID ? updated : cs)); setEditingSampleId(null); if (hasAnalyzed) setIsStale(true); }} onCancel={() => setEditingSampleId(null)} />
                                                    </td>
                                                </tr>
                                            ) : isExpanded && (
                                                <tr className="bg-slate-800/80 border-b-0">
                                                    <td colSpan={3} className="px-4 py-3 border-t-0">
                                                        <SampleDetailPanel sample={sample} />
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-3 border-t border-slate-700 bg-slate-800/80 flex flex-col max-h-[75%] overflow-y-auto mt-auto shrink-0">
                        {showAddForm && (
                            <AddSampleForm
                                onAdd={(sample) => {
                                    setCustomSamples([...customSamples, sample]);
                                    if (hasAnalyzed) setIsStale(true);
                                    setShowAddForm(false);
                                }}
                                nextId={() => {
                                    const id = `C-${String(customSampleCounter.current).padStart(3, '0')}`;
                                    customSampleCounter.current += 1;
                                    return id;
                                }}
                            />
                        )}
                        <button
                            onClick={() => { setShowAddForm(!showAddForm); }}
                            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg transition-colors border border-dashed border-slate-700"
                        >
                            <Plus className="w-4 h-4" />
                            {showAddForm ? 'Cancel' : 'Add Sample'}
                        </button>
                    </div>
                </div>

                {/* Right Panel - Visualizations (70%) */}
                <div className="w-[70%] flex flex-col gap-6 overflow-y-auto pr-2">

                    {isStale && hasAnalyzed && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start flex-col gap-2 shadow-sm animate-fade-slide-up">
                            <div className="flex items-center gap-2 text-amber-500 font-semibold px-1">
                                <AlertTriangle className="w-5 h-5 shrink-0" />
                                <span>Stale Data Warning</span>
                            </div>
                            <div className="flex justify-between w-full items-center pl-8 text-sm text-amber-200/80">
                                <span>Custom dataset was modified. Re-run analysis to update clusters and benchmarks.</span>
                                <button onClick={handleRunAnalysis} disabled={isAnalyzing} className="px-3 py-1.5 text-xs bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded transition-colors shadow">
                                    Update Analysis
                                </button>
                            </div>
                        </div>
                    )}

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
                        <div className="flex-1 flex flex-col items-center justify-center rounded-xl bg-slate-800/30 border-2 border-dashed border-slate-700 p-12">
                            {isAnalyzing ? (
                                <>
                                    <div className="relative mb-6">
                                        <div className="w-16 h-16 rounded-full border-2 border-indigo-500/20 flex items-center justify-center">
                                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                        </div>
                                    </div>
                                    <p className="text-base font-semibold text-slate-300 mb-1">Running K-Means Clustering</p>
                                    <p className="text-xs text-slate-500 mb-4">Normalizing {allData.length} samples across 10 features...</p>
                                    <div className="flex items-center gap-2 text-xs text-slate-600">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                        <span>Applying WHO / FSSAI benchmarks</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="relative mb-6">
                                        <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                            <Beaker className="w-9 h-9 text-indigo-400/60" />
                                        </div>
                                        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                                            <div className="w-2 h-2 rounded-full bg-slate-500" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-300 mb-2">Ready to Analyze</h3>
                                    <p className="text-sm text-slate-500 text-center max-w-xs mb-6">
                                        K-Means clustering will group your {allData.length} samples across 3 quality tiers benchmarked against WHO / FSSAI guidelines.
                                    </p>
                                    <div className="grid grid-cols-3 gap-3 w-full max-w-sm mb-6">
                                        <div className="bg-slate-800 rounded-lg p-3 text-center border border-slate-700">
                                            <div className="text-xl font-bold text-slate-200">{allData.length}</div>
                                            <div className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">Samples</div>
                                        </div>
                                        <div className="bg-slate-800 rounded-lg p-3 text-center border border-slate-700">
                                            <div className="text-xl font-bold text-slate-200">10</div>
                                            <div className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">Features</div>
                                        </div>
                                        <div className="bg-slate-800 rounded-lg p-3 text-center border border-slate-700">
                                            <div className="text-xl font-bold text-slate-200">3</div>
                                            <div className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">Clusters</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleRunAnalysis}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors shadow-md"
                                    >
                                        <Activity className="w-4 h-4" />
                                        Run Analysis
                                    </button>
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
                                    <div className="flex-1 w-full min-h-0 relative">
                                        <div className="absolute right-2 bottom-0 text-[10px] text-slate-500 z-10 pointer-events-none pb-2 pr-2">▲ Triangle = Custom sample</div>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ScatterChart margin={{ top: 10, right: 30, bottom: 40, left: 15 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                                <XAxis
                                                    type="number"
                                                    dataKey="ActiveCompoundPct"
                                                    name="Active Compound (%)"
                                                    domain={scatterXDomain}
                                                    stroke="#94a3b8"
                                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                    label={{ value: 'Active Compound (%)', position: 'insideBottom', offset: -25, fill: '#94a3b8', fontSize: 12 }}
                                                />
                                                <YAxis
                                                    type="number"
                                                    dataKey="HeavyMetalPpm"
                                                    name="Heavy Metals (ppm)"
                                                    stroke="#94a3b8"
                                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                    label={{ value: 'Heavy Metals (ppm)', angle: -90, position: 'insideLeft', offset: 25, fill: '#94a3b8', fontSize: 12 }}
                                                />
                                                <RechartsTooltip
                                                    cursor={{ strokeDasharray: '3 3' }}
                                                    content={<CustomTooltip />}
                                                />
                                                <ReferenceLine x={INDUSTRY_BENCHMARKS.ActiveCompoundPct} stroke="#6366f1" strokeDasharray="4 4" label="WHO Min" />
                                                <ReferenceLine y={INDUSTRY_BENCHMARKS.HeavyMetalPpm} stroke="#6366f1" strokeDasharray="4 4" label="WHO Max" />
                                                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', color: '#cbd5e1' }} />
                                                <Scatter name="High Purity" data={scatterCluster1} fill={CLUSTER_COLORS[1]} shape={<CustomDot />} />
                                                <Scatter name="Moderate Risk" data={scatterCluster2} fill={CLUSTER_COLORS[2]} shape={<CustomDot />} />
                                                <Scatter name="Contaminated" data={scatterCluster3} fill={CLUSTER_COLORS[3]} shape={<CustomDot />} />
                                            </ScatterChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Bar Chart */}
                                <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-md flex flex-col animate-fade-slide-up delay-200" style={{ height: `${Math.max(200, dynamicBrandConsistencyData.length * 56 + 60)}px` }}>
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
                                                    itemStyle={{ color: '#f8fafc' }}
                                                    labelStyle={{ color: '#cbd5e1' }}
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
                                <ClusterSummaryCard clusterId={1} label="High Purity" color="green" topColor="border-t-green-500" stats={clusterStats[1]} isCompliantStatus={isCompliant(clusterStats[1])} />
                                <ClusterSummaryCard clusterId={2} label="Moderate Risk" color="amber" topColor="border-t-amber-500" stats={clusterStats[2]} isCompliantStatus={isCompliant(clusterStats[2])} />
                                <ClusterSummaryCard clusterId={3} label="Contaminated" color="red" topColor="border-t-red-500" stats={clusterStats[3]} isCompliantStatus={isCompliant(clusterStats[3])} />
                            </div>
                        </>
                    )}

                </div>

            </main>
        </div>
    );
}