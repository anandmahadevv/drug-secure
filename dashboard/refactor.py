import re
import traceback

filepath = "/home/dhanush/Desktop/hackathon-projects/drug-secure/dashboard/Dashboard.tsx"

try:
    with open(filepath, "r") as f:
        content = f.read()

    # 1. Imports
    content = content.replace(
        "import React, { useState, useRef } from 'react';",
        "import React, { useState, useRef, useMemo } from 'react';"
    )

    # 2. Extract SampleDetailPanel from lines 601-669 (exact match string representation)
    sdp_start = '<div className="flex flex-col gap-3 text-xs text-slate-400 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 shadow-inner">'

    idx1 = content.find(sdp_start)
    count = 0
    idx2 = idx1
    while idx2 < len(content):
        if content[idx2:idx2+4] == "<div":
            count += 1
        elif content[idx2:idx2+6] == "</div>":
            count -= 1
            if count == 0:
                idx2 += 6
                break
        idx2 += 1

    sdp_content = content[idx1:idx2]

    # Replace inside Dashboard
    content = content[:idx1] + "<SampleDetailPanel sample={sample} />" + content[idx2:]


    # 3. Extract EditSampleForm
    esf_start = '<div className="p-3 bg-slate-900/50 rounded-lg border border-indigo-500/30 space-y-2 drop-shadow-md">'
    idx3 = content.find(esf_start)
    count = 0
    idx4 = idx3
    while idx4 < len(content):
        if content[idx4:idx4+4] == "<div":
            count += 1
        elif content[idx4:idx4+6] == "</div>":
            count -= 1
            if count == 0:
                idx4 += 6
                break
        idx4 += 1

    esf_content = content[idx3:idx4]
    
    # Clean up the esf_content for the external component
    my_esf = esf_content
    my_esf = my_esf.replace('editValues?.', 'editValues.')
    my_esf = my_esf.replace('editValues!', 'editValues')
    my_esf = my_esf.replace('(editValues as any)', '(editValues as any)')
    my_esf = my_esf.replace("onClick={() => { setEditingSampleId(null); setValidationError(''); }}", "onClick={onCancel}")
    my_esf = my_esf.replace('onClick={() => setShowQualitative(!showQualitative)}', 'onClick={() => setShowQualitativeEdit(!showQualitativeEdit)}')
    my_esf = my_esf.replace('showQualitative ?', 'showQualitativeEdit ?')
    my_esf = my_esf.replace('{showQualitative && (', '{showQualitativeEdit && (')
    my_esf = my_esf.replace('{validationError && editingSampleId === sample.SampleID && <p', '{validationError && <p')

    # Find the Save button which is the LAST button in EditSampleForm
    idx_save = my_esf.rfind('<button')
    idx_save_end = my_esf.find('</button>', idx_save) + 9
    my_esf = my_esf[:idx_save] + '<button onClick={handleSave} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors text-xs font-medium">Save</button>' + my_esf[idx_save_end:]

    # Replace the inline usage inside Dashboard with the simple component call
    content = content[:idx3] + "<EditSampleForm sample={sample} onSave={(updated) => { setCustomSamples(customSamples.map(cs => cs.SampleID === sample.SampleID ? updated : cs)); setEditingSampleId(null); if (hasAnalyzed) setIsStale(true); }} onCancel={() => setEditingSampleId(null)} />" + content[idx4:]


    # Dashboard State Pruning & Data Derivation slice (moved here to avoid slicing injected components)
    toremove = '''    const [pasteInput, setPasteInput] = useState('');
    const [pasteError, setPasteError] = useState('');

    const [newSample, setNewSample] = useState({
        Brand: '', MoisturePct: '', TotalAsh: '', AcidInsolAsh: '', HeavyMetalPpm: '',
        ActiveCompoundPct: '', WaterExtractPct: '', AlcoholExtractPct: '', BulkDensity: '', TapDensity: '', pH: '',
        Color: '', Odor: '', Taste: '', ForeignMatter: '', HPTLCRf: '',
        Alkaloids: '', Flavonoids: '', Steroids: '', Polyphenols: '', Saponins: '', Sugars: ''
    });
    const [validationError, setValidationError] = useState('');
    const [editingSampleId, setEditingSampleId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<typeof newSample | null>(null);
    const [showQualitative, setShowQualitative] = useState(false);'''

    content = content.replace(toremove, "    const [editingSampleId, setEditingSampleId] = useState<string | null>(null);")

    idx_parse = content.find("const parsePastedData = (raw: string) => {")
    idx_handle = content.find("const handleAddSample = () => {")
    idx_handle_end = content.find("setShowAddForm(false);\n    };\n", idx_handle) + len("setShowAddForm(false);\n    };\n")
    content = content[:idx_parse] + content[idx_handle_end:]

    # Now inject the newly extracted components safely since the slice is over
    components_str = """
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
        __SDP_CONTENT__
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
        const parts = raw.split(/[\\t,]/).map(p => p.trim()).filter(p => p !== '');
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
        __ESF_CONTENT__
    );
};
"""

    components_str = components_str.replace('__SDP_CONTENT__', sdp_content)
    components_str = components_str.replace('__ESF_CONTENT__', my_esf)

    content = content.replace("export default function Dashboard() {", components_str + "\nexport default function Dashboard() {")

    # Add memoized data dependencies
    content = content.replace(
        "const allData = [...mockData, ...customSamples];",
        "const allData = useMemo(() => [...mockData, ...customSamples], [customSamples]);"
    )

    content = content.replace(
    '''    const scatterCluster1 = analyzedData.filter(d => d.Cluster === 1);
    const scatterCluster2 = analyzedData.filter(d => d.Cluster === 2);
    const scatterCluster3 = analyzedData.filter(d => d.Cluster === 3);''',
    '''    const { scatterCluster1, scatterCluster2, scatterCluster3 } = useMemo(() => ({
        scatterCluster1: analyzedData.filter(d => d.Cluster === 1),
        scatterCluster2: analyzedData.filter(d => d.Cluster === 2),
        scatterCluster3: analyzedData.filter(d => d.Cluster === 3),
    }), [analyzedData]);'''
    )

    content = content.replace(
        "const dynamicBrandConsistencyData = computeBrandConsistency(analyzedData);",
        "const dynamicBrandConsistencyData = useMemo(() => computeBrandConsistency(analyzedData), [analyzedData]);"
    )

    content = content.replace(
    '''    const flaggedSamples = analyzedData.filter(s => s.Cluster === 2 || s.Cluster === 3).length;
    const cleanSamples = analyzedData.filter(s => s.Cluster === 1).length;''',
    '''    const { flaggedSamples, cleanSamples } = useMemo(() => ({
        flaggedSamples: analyzedData.filter(s => s.Cluster === 2 || s.Cluster === 3).length,
        cleanSamples: analyzedData.filter(s => s.Cluster === 1).length,
    }), [analyzedData]);'''
    )

    clusterstats_old = '''    const clusterStats = {
        1: { active: 0, heavy: 0, waterExtract: 0, alcoholExtract: 0 },
        2: { active: 0, heavy: 0, waterExtract: 0, alcoholExtract: 0 },
        3: { active: 0, heavy: 0, waterExtract: 0, alcoholExtract: 0 }
    };

    if (hasAnalyzed) {
        [1, 2, 3].forEach(cNum => {
            const clusterId = cNum as ClusterId;
            const samples = analyzedData.filter(s => s.Cluster === clusterId);
            if (samples.length > 0) {
                clusterStats[clusterId].active = samples.reduce((acc, s) => acc + s.ActiveCompoundPct, 0) / samples.length;
                clusterStats[clusterId].heavy = samples.reduce((acc, s) => acc + s.HeavyMetalPpm, 0) / samples.length;
                clusterStats[clusterId].waterExtract = samples.reduce((acc, s) => acc + s.WaterExtractPct, 0) / samples.length;
                clusterStats[clusterId].alcoholExtract = samples.reduce((acc, s) => acc + s.AlcoholExtractPct, 0) / samples.length;
            }
        });
    }'''

    clusterstats_new = '''    const clusterStats = useMemo(() => {
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
    }, [analyzedData]);'''

    content = content.replace(clusterstats_old, clusterstats_new)

    content = content.replace('domain={[60, 100]}', 'domain={scatterXDomain}')
    content = content.replace('<Scatter name="High Purity" data={scatterCluster1} fill={CLUSTER_COLORS[1]} />', '<Scatter name="High Purity" data={scatterCluster1} fill={CLUSTER_COLORS[1]} shape={<CustomDot />} />')
    content = content.replace('<Scatter name="Moderate Risk" data={scatterCluster2} fill={CLUSTER_COLORS[2]} />', '<Scatter name="Moderate Risk" data={scatterCluster2} fill={CLUSTER_COLORS[2]} shape={<CustomDot />} />')
    content = content.replace('<Scatter name="Contaminated" data={scatterCluster3} fill={CLUSTER_COLORS[3]} />', '<Scatter name="Contaminated" data={scatterCluster3} fill={CLUSTER_COLORS[3]} shape={<CustomDot />} />')
    content = content.replace('<Legend wrapperStyle={{ paddingTop: \'10px\', fontSize: \'12px\', color: \'#cbd5e1\' }} />', '<Legend wrapperStyle={{ paddingTop: \'10px\', fontSize: \'12px\', color: \'#cbd5e1\' }} />\\n                                                <text x="50%" y="300" textAnchor="middle" className="text-[10px]" fill="#64748b">▲ Triangle = Custom sample</text>')

    content = content.replace('className="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700 shadow-md"', 'className={`flex items-center justify-between px-6 py-4 bg-slate-800 shadow-md ${isAnalyzing ? "border-b-2 border-b-indigo-500 analyzing-border" : hasAnalyzed && !isStale ? "border-b-2 border-b-green-500/50" : isStale ? "border-b-2 border-b-amber-500/50" : "border-b border-slate-700"}`}')

    addform_raw = '''{showAddForm && (
                            <div className="mb-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 space-y-2 text-sm drop-shadow-md overflow-hidden">'''

    idx_addform = content.find(addform_raw)
    if idx_addform != -1:
        idx_endadd = content.find('Add to Dataset\n                                </button>\n                            </div>\n                        )}', idx_addform)
        if idx_endadd != -1:
            text_to_replace = content[idx_addform:idx_endadd + len('Add to Dataset\n                                </button>\n                            </div>')]
            
            replacement = '''{showAddForm && (
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
                                />'''
            content = content.replace(text_to_replace, replacement)

    content = content.replace('shadow-md h-64 flex flex-col', 'shadow-md flex flex-col')
    content = content.replace('<div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-md flex flex-col animate-fade-slide-up delay-200">', '<div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-md flex flex-col animate-fade-slide-up delay-200" style={{ height: `${Math.max(200, dynamicBrandConsistencyData.length * 56 + 60)}px` }}>')

    content = content.replace('{CLUSTER_LABELS[cluster]}', '{CLUSTER_LABELS[cluster]} <span className="text-slate-500 font-normal text-xs ml-1">· {clusterCounts[cluster]}</span>')

    old_empty = '''                                    <Beaker className="w-12 h-12 mb-4 opacity-50" />
                                    <p className="text-lg font-medium">Awaiting Analysis</p>
                                    <p className="text-sm mt-2">Click "Run Analysis" to generate insights.</p>'''
    new_empty = '''                                  <div className="relative mb-6">
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
                                  </button>'''
    content = content.replace(old_empty, new_empty)

    old_load = '''                                    <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
                                    <p className="text-lg font-medium text-slate-300">Running advanced clustering analysis...</p>
                                    <p className="text-sm mt-2 text-slate-500">Evaluating active compounds and heavy metal ppm</p>'''
    new_load = '''                                  <div className="relative mb-6">
                                    <div className="w-16 h-16 rounded-full border-2 border-indigo-500/20 flex items-center justify-center">
                                      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                    </div>
                                  </div>
                                  <p className="text-base font-semibold text-slate-300 mb-1">Running K-Means Clustering</p>
                                  <p className="text-xs text-slate-500 mb-4">Normalizing {allData.length} samples across 10 features...</p>
                                  <div className="flex items-center gap-2 text-xs text-slate-600">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                    <span>Applying WHO / FSSAI benchmarks</span>
                                  </div>'''
    content = content.replace(old_load, new_load)
    content = content.replace('<div className="flex-1 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/30">', '<div className="flex-1 flex flex-col items-center justify-center rounded-xl bg-slate-800/30 border-2 border-dashed border-slate-700 p-12">')

    content = content.replace('<div className="p-3 border-t border-slate-700 bg-slate-800/80 mt-auto">', '<div className="p-3 border-t border-slate-700 bg-slate-800/80 flex flex-col max-h-[45%] overflow-y-auto mt-auto">')

    amb_badge = '''{hasAnalyzed && ('''
    amb_badge_new = '''{!hasAnalyzed && customSamples.length > 0 && (
                        <div className="flex items-center gap-2 bg-amber-500/10 text-amber-400 text-xs font-medium px-3 py-1.5 rounded-full border border-amber-500/20 mr-2 animate-fade-slide-up">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></div>
                            {customSamples.length} custom sample{customSamples.length > 1 ? 's' : ''} pending analysis
                        </div>
                    )}
                    {hasAnalyzed && ('''
    content = content.replace(amb_badge, amb_badge_new)

    pulse_css = '''                .delay-300 { animation-delay: 300ms; }
            `}</style>'''
    pulse_new = '''                @keyframes pulse-border {
                    0%, 100% { border-bottom-color: rgb(99 102 241 / 0.3); }
                    50% { border-bottom-color: rgb(99 102 241 / 0.9); }
                }
                .analyzing-border {
                    animation: pulse-border 1.2s ease-in-out infinite;
                }
                .delay-300 { animation-delay: 300ms; }
            `}</style>'''
    content = content.replace(pulse_css, pulse_new)

    idx_card = content.find('<div className="bg-slate-800 p-5 rounded-xl border border-slate-700 border-t-4 border-t-green-500 shadow-md">')
    if idx_card != -1:
        idx_end_card = content.find('</div>\n                                </div>\n                            </div>\n                        </>\n                    )}\n\n                </div>\n\n            </main>')
        if idx_end_card != -1:
            text_to_replace = content[idx_card:idx_end_card + len('</div>\n                                </div>\n                            </div>')]
            replacement = '''<ClusterSummaryCard clusterId={1} label="High Purity" color="green" topColor="border-t-green-500" stats={clusterStats[1]} isCompliantStatus={isCompliant(clusterStats[1])} />
                                <ClusterSummaryCard clusterId={2} label="Moderate Risk" color="amber" topColor="border-t-amber-500" stats={clusterStats[2]} isCompliantStatus={isCompliant(clusterStats[2])} />
                                <ClusterSummaryCard clusterId={3} label="Contaminated" color="red" topColor="border-t-red-500" stats={clusterStats[3]} isCompliantStatus={isCompliant(clusterStats[3])} />
                            </div>'''
            content = content.replace(text_to_replace, replacement)

    with open(filepath, "w") as f:
        f.write(content)

    print("Refactoring complete.")
except Exception as e:
    traceback.print_exc()
