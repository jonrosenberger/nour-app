import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Compass,
  Check,
  Download,
  FileText,
  Heart,
  HelpCircle,
  Home,
  Menu,
  X,
  LifeBuoy,
  Moon,
  RotateCcw,
  Save,
  ShieldCheck,
  SkipForward,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";

/*
  Nour — local-first emotional cartography prototype

  V1 principles:
  - Local-only storage in this browser/device.
  - No account, no analytics, no ads, no cloud sync, no data sale.
  - Reflection and visualization only. No diagnosis, risk scoring, predictions, or clinical interpretation.
  - User baseline is subjective: neutral means the user's neutral.
  - Slider direction is consistent: left = harder/lower, center = neutral, right = easier/better.
  - Skipped fields are stored as null and excluded from averages.
  - Default chart shows composite + smoothed overall path only; individual lines are optional toggles.
  - Tags are descriptive context only; they do not affect the chart score.
  - Naming is centralized in APP_CONFIG so the working name can change later without hunting through code.
*/

const APP_CONFIG = {
  appName: "Nour",
  storageKey: "nour_entries_v1",
  exportFilePrefix: "nour-export",
  schemaVersion: 1,
  dayOneAnimationSeenKey: "nour_day1_animation_seen_v1",
};



const FEATURE_FLAGS = {
  enforceBackdatingLimit: false,
  maxBackdateDays: 3,
};

const TRACKERS = [
  {
    key: "mood",
    label: "Mood",
    prompt: "How was your emotional weather today?",
    left: "Very hard",
    midLeft: "Hard",
    center: "Neutral",
    midRight: "Good",
    right: "Very good",
    icon: Heart,
    color: "#ec4899",
    enabledInV1: true,
  },
  {
    key: "energy",
    label: "Energy",
    prompt: "How much energy did you have today?",
    left: "Empty",
    midLeft: "Low",
    center: "Neutral",
    midRight: "Energized",
    right: "Very energized",
    icon: Zap,
    color: "#f59e0b",
    enabledInV1: true,
  },
  {
    key: "calm",
    label: "Calm",
    prompt: "How calm did your nervous system feel today?",
    left: "Overwhelmed",
    midLeft: "Uneasy",
    center: "Neutral",
    midRight: "Calm",
    right: "Very calm",
    icon: Sparkles,
    color: "#38bdf8",
    enabledInV1: false,
  },
  {
    key: "selfTalk",
    label: "Self-talk",
    prompt: "How did your inner voice treat you today?",
    left: "Cruel",
    midLeft: "Harsh",
    center: "Neutral",
    midRight: "Kind",
    right: "Supportive",
    icon: FileText,
    color: "#fb7185",
    enabledInV1: true,
  },
  {
    key: "connection",
    label: "Connection",
    prompt: "How socially or emotionally connected did you feel today?",
    left: "Isolated",
    midLeft: "Distant",
    center: "Neutral",
    midRight: "Connected",
    right: "Supported",
    icon: Sparkles,
    color: "#a78bfa",
    enabledInV1: false,
  },
  {
    key: "rest",
    label: "Rest",
    prompt: "How rested did you feel today?",
    left: "Wrecked",
    midLeft: "Tired",
    center: "Neutral",
    midRight: "Rested",
    right: "Restored",
    icon: Moon,
    color: "#34d399",
    enabledInV1: false,
  },
];

const ACTIVE_FIELDS = TRACKERS.filter((field) => field.enabledInV1);
const FIELDS = ACTIVE_FIELDS;


const FEELING_GROUPS = [
  { title: "Low / Foggy", colorClass: "tag-low", tags: ["cloudy", "empty", "numb", "sad", "heavy", "foggy", "lonely"] },
  { title: "Activated", colorClass: "tag-active", tags: ["scared", "nervous", "restless", "raw", "fragile", "angry", "overwhelmed", "wired"] },
  { title: "Steady / Warm", colorClass: "tag-warm", tags: ["steady", "safe", "relieved", "hopeful", "curious", "cozy", "connected", "proud", "playful", "inspired"] },
];

const EVENT_GROUPS = [
  { title: "Care", colorClass: "tag-care", tags: ["therapy", "good sleep", "ate enough", "cleaned", "left the house"] },
  { title: "Movement / Body", colorClass: "tag-body", tags: ["poor sleep", "walked", "walked dog", "sunlight", "missed meal", "med change"] },
  { title: "People", colorClass: "tag-people", tags: ["socialized", "isolated", "family stress", "argument", "helped someone"] },
  { title: "Work / Stress", colorClass: "tag-work", tags: ["creative work", "job applications", "money stress", "doomscrolling"] },
];

const DEFAULT_VALUES = FIELDS.reduce((acc, field) => ({ ...acc, [field.key]: 50 }), {});
const DEFAULT_SKIPPED = FIELDS.reduce((acc, field) => ({ ...acc, [field.key]: false }), {});

const DEFAULT_VISIBLE = FIELDS.reduce(
  (acc, field) => ({ ...acc, [field.key]: false }),
  { composite: true, trend: true }
);

const RANGE_OPTIONS = [
  { key: "week", label: "Week", days: 7 },
  { key: "month", label: "Month", days: 30 },
  { key: "sixMonths", label: "6 Months", days: 183 },
  { key: "year", label: "Year", days: 365 },
  { key: "all", label: "All Time", days: null },
  { key: "custom", label: "Custom", days: null },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(dateISO, amount) {
  const date = new Date(`${dateISO}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return date.toISOString().slice(0, 10);
}

function uid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function migrateEntries(entries) {
  if (!Array.isArray(entries)) return [];

  return entries
    .filter((entry) => entry && typeof entry === "object" && entry.date)
    .map((entry) => ({
      ...entry,
      schemaVersion: APP_CONFIG.schemaVersion,
      fields: { ...(entry.fields || {}) },
      skippedFields: { ...DEFAULT_SKIPPED, ...(entry.skippedFields || {}) },
      feelings: Array.isArray(entry.feelings) ? entry.feelings : [],
      events: Array.isArray(entry.events) ? entry.events : [],
      note: entry.note || "",
      includeNotesInExport: entry.includeNotesInExport ?? true,
    }));
}

function loadEntries() {
  try {
    const raw = localStorage.getItem(APP_CONFIG.storageKey);
    return raw ? migrateEntries(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  try {
    localStorage.setItem(APP_CONFIG.storageKey, JSON.stringify(entries));
    return { ok: true };
  } catch (error) {
    console.error("Unable to save Nour entries", error);
    return { ok: false, error };
  }
}

function fieldLabel(value, field) {
  if (value === null || value === undefined) return "Skipped";
  if (value < 20) return field.left;
  if (value < 42) return field.midLeft;
  if (value < 59) return field.center;
  if (value < 80) return field.midRight;
  return field.right;
}

function compositeFromFields(fields) {
  const answered = ACTIVE_FIELDS.map((field) => fields[field.key]).filter((value) => typeof value === "number");
  if (!answered.length) return null;
  return Math.round(answered.reduce((sum, value) => sum + value, 0) / answered.length);
}

function movingAverage(rows, key, windowSize) {
  return rows.map((row, index) => {
    const slice = rows
      .slice(Math.max(0, index - windowSize + 1), index + 1)
      .filter((item) => typeof item[key] === "number");
    if (!slice.length) return { ...row, [`${key}Trend`]: null };
    return { ...row, [`${key}Trend`]: Math.round(slice.reduce((sum, item) => sum + item[key], 0) / slice.length) };
  });
}

function buildChartRows(entries, rangeMode, customStart, customEnd, today) {
  const sorted = entries.slice().sort((a, b) => a.date.localeCompare(b.date));
  const selected = RANGE_OPTIONS.find((range) => range.key === rangeMode);
  let start = null;
  let end = today;

  if (rangeMode === "custom") {
    start = customStart || sorted[0]?.date || today;
    end = customEnd || today;
  } else if (selected?.days) {
    start = addDaysISO(today, -(selected.days - 1));
  }

  const rows = sorted
    .filter((entry) => {
      if (start && entry.date < start) return false;
      if (end && entry.date > end) return false;
      return true;
    })
    .map((entry) => {
      const row = { date: entry.date, skippedDay: Boolean(entry.skippedDay), composite: compositeFromFields(entry.fields || {}) };
      FIELDS.forEach((field) => {
        row[field.key] = entry.fields?.[field.key] ?? null;
      });
      return row;
    });

  return movingAverage(rows, "composite", rangeMode === "week" ? 3 : 7);
}

// V2 analytics scaffold: retained for future tag/context views, but not a V1 primary feature.
function countTags(entries, rangeRows, type) {
  const dates = new Set(rangeRows.map((row) => row.date));
  const counts = new Map();
  entries.forEach((entry) => {
    if (!dates.has(entry.date)) return;
    const list = type === "feelings" ? entry.feelings || [] : entry.events || [];
    list.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
}

function toggleArrayItem(list, item) {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

function Button({ children, onClick, variant = "primary", disabled = false }) {
  return (
    <button className={`button ${variant}`} onClick={onClick} disabled={disabled} type="button">
      {children}
    </button>
  );
}

function Card({ children, className = "" }) {
  return <div className={`card ${className}`}>{children}</div>;
}

function TagButton({ tag, selected, onClick, colorClass }) {
  return (
    <button type="button" onClick={onClick} className={`tag ${colorClass} ${selected ? "selected" : ""}`}>
      {tag}
    </button>
  );
}

function makePath(points) {
  const valid = points.filter((point) => typeof point.value === "number");
  if (!valid.length) return "";
  return valid.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

function MoodChart({ rows, visible, setVisible, animateDayOne }) {
  const width = 1080;
  const height = 520;
  const pad = { top: 42, right: 30, bottom: 60, left: 62 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const xFor = (index) => pad.left + (rows.length <= 1 ? innerW / 2 : (index / (rows.length - 1)) * innerW);
  const yFor = (value) => pad.top + ((100 - value) / 100) * innerH;

  const series = [
    { key: "composite", label: "Composite", color: "#111827", width: 3.5 },
    { key: "compositeTrend", label: "Overall path", color: "#b45309", width: 9 },

    ...FIELDS.map((field) => ({ key: field.key, label: field.label, color: field.color, width: 2.5 })),
  ];
 
  const activeSeries = series.filter((item) => (item.key === "compositeTrend" ? visible.trend : visible[item.key]));
  const dayOneRow = rows.length === 1 && typeof rows[0]?.composite === "number" ? rows[0] : null;
  const dayOneX = dayOneRow ? xFor(0) : null;
  const dayOneY = dayOneRow ? yFor(dayOneRow.composite) : null;

  return (
    <Card className="chart-card">
      <div className="chart-header">
        <div>
          <p className="eyebrow">Graph</p>
          <h1>{APP_CONFIG.appName}</h1>
          <p>Daily composite plus a smoothed overall path. No interpretation; just your recorded data.</p>
        </div>
      </div>

      <div className="big-chart-scroll">
        <svg viewBox={`0 0 ${width} ${height}`} className="big-chart" role="img" aria-label="Mood tracking chart">
          <defs>
            <pattern id="smallGrid" width="18" height="18" patternUnits="userSpaceOnUse">
              <path d="M 18 0 L 0 0 0 18" fill="none" stroke="rgba(51,65,85,0.18)" strokeWidth="1" />
            </pattern>
            <pattern id="bigGrid" width="90" height="90" patternUnits="userSpaceOnUse">
              <rect width="90" height="90" fill="url(#smallGrid)" />
              <path d="M 90 0 L 0 0 0 90" fill="none" stroke="rgba(69,115,141,0.36)" strokeWidth="2" />
            </pattern>
            <filter id="pencil">
              <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.8" />
            </filter>
          </defs>
          <rect x="0" y="0" width={width} height={height} rx="26" fill="#f8f1df" />
          <rect x={pad.left} y={pad.top} width={innerW} height={innerH} fill="url(#bigGrid)" stroke="#45738d" strokeWidth="3" />

          {[0, 25, 50, 75, 100].map((value) => (
            <line key={value} x1={pad.left} x2={pad.left + innerW} y1={yFor(value)} y2={yFor(value)} stroke={value === 50 ? "#111827" : "rgba(17,24,39,.45)"} strokeDasharray={value === 50 ? "8 8" : ""} strokeWidth={value === 50 ? 2.5 : 1.4} />
          ))}
          <text x={pad.left - 12} y={yFor(100) + 4} textAnchor="end" fontSize="14" fill="#111827" fontWeight="800">Feeling better</text>
          <text x={pad.left - 12} y={yFor(0) + 4} textAnchor="end" fontSize="14" fill="#111827" fontWeight="800">Feeling worse</text>
          <text x={pad.left + 8} y={yFor(50) - 8} fontSize="14" fill="#111827" fontWeight="800">personal neutral line</text>

          {activeSeries.map((item) => {
            const path = makePath(rows.map((row, index) => ({ x: xFor(index), y: yFor(row[item.key] ?? 0), value: row[item.key] })));
            if (!path) return null;
            return (
              <g key={item.key} filter={item.key === "compositeTrend" || item.key === "composite" ? "url(#pencil)" : ""}>
                <path d={path} fill="none" stroke={item.color} strokeWidth={item.width + 2} strokeLinecap="round" strokeLinejoin="round" opacity="0.16" />
                <path d={path} fill="none" stroke={item.color} strokeWidth={item.width} strokeLinecap="round" strokeLinejoin="round" opacity={item.key === "compositeTrend" ? 0.9 : 0.76} />
              </g>
            );
          })}

          {dayOneRow ? (
            <g className={animateDayOne ? "day-one-marker animate" : "day-one-marker"} transform={`translate(${dayOneX} ${dayOneY})`}>
              <circle className="day-one-ring" r="26" fill="none" stroke="#5f7d68" strokeWidth="3" />
              <circle r="14" fill="#eef3ec" stroke="#243028" strokeWidth="3" />
              <Compass className="day-one-compass" x="-10" y="-10" width="20" height="20" color="#243028" strokeWidth="2.4" />
              <line className="day-one-needle" x1="0" y1="0" x2="0" y2="-11" stroke="#c07a4a" strokeWidth="3" strokeLinecap="round" />
              <text className="day-one-label" x="0" y="48" textAnchor="middle">Day 1. Start of my journey.</text>
            </g>
          ) : rows.map((row, index) => typeof row.composite === "number" ? <circle key={row.date} cx={xFor(index)} cy={yFor(row.composite)} r="4" fill="#243028" opacity=".85" /> : null)}
          {rows.map((row, index) => {
            const showLabel = rows.length <= 12 || index === 0 || index === rows.length - 1 || index % Math.ceil(rows.length / 8) === 0;
            return showLabel ? <text key={`label-${row.date}`} x={xFor(index)} y={height - 26} textAnchor="middle" fontSize="12" fill="#111827" fontWeight="700">{row.date.slice(5)}</text> : null;
          })}
        </svg>
      </div>

        <div className="chart-controls-label">Chart options</div>
      <div className="legend-wrap">
        <button className={visible.composite ? "legend on" : "legend"} onClick={() => setVisible((v) => ({ ...v, composite: !v.composite }))}>
          <span style={{ background: "#111827" }} /> Composite
        </button>
        <button className={visible.trend ? "legend on" : "legend"} onClick={() => setVisible((v) => ({ ...v, trend: !v.trend }))}>
          <span style={{ background: "#b45309" }} /> Overall path
        </button>
        {FIELDS.map((field) => (
          <button key={field.key} className={visible[field.key] ? "legend on" : "legend"} onClick={() => setVisible((v) => ({ ...v, [field.key]: !v[field.key] }))}>
            <span style={{ background: field.color }} /> {field.label}
          </button>
        ))}
      </div>    </Card>
  );
}

function RangeControls({ rangeMode, setRangeMode, customStart, setCustomStart, customEnd, setCustomEnd }) {
  return (
    <Card>
      <div className="range-header"><div><h2>View range</h2><p>Controls the graph and PDF export.</p></div><CalendarDays size={22} /></div>
      <div className="range-buttons">{RANGE_OPTIONS.map((range) => <button key={range.key} className={rangeMode === range.key ? "range-chip active" : "range-chip"} onClick={() => setRangeMode(range.key)}>{range.label}</button>)}</div>
      {rangeMode === "custom" && <div className="custom-range"><label>Start<input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} /></label><label>End<input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} /></label></div>}
    </Card>
  );
}

function TagFrequency({ title, counts }) {
  const max = Math.max(1, ...counts.map(([, count]) => count));
  return (
    <div className="frequency-box">
      <h3>{title}</h3>
      {!counts.length && <p className="muted">No tags in this range yet.</p>}
      {counts.map(([tag, count]) => (
        <div className="freq-row" key={tag}>
          <span>{tag}</span>
          <div className="freq-track"><div className="freq-bar" style={{ width: `${(count / max) * 100}%` }} /></div>
          <b>{count}</b>
        </div>
      ))}
    </div>
  );
}

function CrisisSupport() {
  const [open, setOpen] = useState(false);
  return (
    <div className="crisis-wrap">
      <button className="crisis-button" onClick={() => setOpen((value) => !value)}><LifeBuoy size={16} /> Need support now?</button>
      {open && <div className="crisis-panel"><h3>Immediate support</h3><p>If you may hurt yourself or someone else, call emergency services now.</p><p>In the U.S. and Canada, call or text <b>988</b> for crisis support.</p><p>This app is not an emergency service.</p></div>}
    </div>
  );
}

function SafetyFooter() {
  return (
    <footer className="safety-footer">
      <div><ShieldCheck size={20} /><h2>Privacy & safety baseline</h2></div>
      <p>Local-only MVP: entries stay in this browser on this device unless you export them. No account, ads, analytics, cloud sync, or selling data.</p>
      <p>Reflection tool only. Not a diagnosis, treatment, emergency service, or replacement for professional care.</p>
    </footer>
  );
}

function SliderStep({ field, value, skipped, onValue, onSkip, onUnskip }) {
  const Icon = field.icon;
  return (
    <Card className="step-card">
      <div className="step-icon"><Icon size={30} /></div>
      <p className="eyebrow">{field.label}</p>
      <h1>{field.prompt}</h1>
      {skipped && <div className="step-value">Skipped</div>}
      <input className="range jumbo" type="range" min="0" max="100" value={value} disabled={skipped} onChange={(e) => onValue(field.key, Number(e.target.value))} aria-label={field.prompt} />
      <div className="range-labels"><span>{field.left}</span><span>{field.midLeft}</span><span>{field.center}</span><span>{field.midRight}</span><span>{field.right}</span></div>
      <div className="step-actions-inline">
        {skipped ? <Button variant="secondary" onClick={() => onUnskip(field.key)}>Answer this field</Button> : <Button variant="secondary" onClick={() => onSkip(field.key)}><SkipForward size={16} /> Skip this field</Button>}
      </div>
    </Card>
  );
}

function TagGroupPicker({ title, subtitle, groups, selected, setSelected }) {
  return (
    <Card className="step-card wide-step">
      <p className="eyebrow">Optional context</p>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {groups.map((group) => (
        <div className="tag-group" key={group.title}>
          <h3>{group.title}</h3>
          <div className="tag-wrap">{group.tags.map((tag) => <TagButton key={tag} tag={tag} colorClass={group.colorClass} selected={selected.includes(tag)} onClick={() => setSelected((prev) => toggleArrayItem(prev, tag))} />)}</div>
        </div>
      ))}
    </Card>
  );
}

function NotesStep({ note, setNote, includeNotesInExport, setIncludeNotesInExport }) {
  return (
    <Card className="step-card wide-step">
      <p className="eyebrow">Final note</p>
      <h1>Anything you want to remember?</h1>
      <p>Optional. This is attached to the whole day, not individual fields.</p>
      <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Example: I was tired, but I still moved forward." />
      <label className="checkbox-line"><input type="checkbox" checked={includeNotesInExport} onChange={(e) => setIncludeNotesInExport(e.target.checked)} /> Include notes in PDF exports by default</label>
    </Card>
  );
}

function CheckInPage({ date, setDate, draft, setDraft, existingEntry, onSave, onCancel, saveState }) {
  const [step, setStep] = useState(0);
  const totalSteps = FIELDS.length + 3;
  const currentField = FIELDS[step];

  function updateValue(key, value) {
    setDraft((prev) => ({ ...prev, fields: { ...prev.fields, [key]: value }, skippedFields: { ...prev.skippedFields, [key]: false } }));
  }

  function skipField(key) {
    setDraft((prev) => ({ ...prev, fields: { ...prev.fields, [key]: null }, skippedFields: { ...prev.skippedFields, [key]: true } }));
  }

  function unskipField(key) {
    setDraft((prev) => ({ ...prev, fields: { ...prev.fields, [key]: 50 }, skippedFields: { ...prev.skippedFields, [key]: false } }));
  }

  return (
    <main className="app-shell checkin-shell">
      <CrisisSupport />
      <div className="checkin-top"><button className="back-link" onClick={onCancel}><ArrowLeft size={18} /> Back to chart</button><div className="progress-pill">{Math.min(step + 1, totalSteps)} of {totalSteps}</div></div>
      <div className="date-row checkin-date"><label>Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label></div>

      {currentField && <SliderStep field={currentField} value={draft.fields[currentField.key] ?? 50} skipped={draft.skippedFields[currentField.key]} onValue={updateValue} onSkip={skipField} onUnskip={unskipField} />}
      {step === FIELDS.length && <TagGroupPicker title="Feelings" subtitle="Click any that fit. These labels do not affect the chart score." groups={FEELING_GROUPS} selected={draft.feelings} setSelected={(fn) => setDraft((prev) => ({ ...prev, feelings: typeof fn === "function" ? fn(prev.feelings) : fn }))} />}
      {step === FIELDS.length + 1 && <TagGroupPicker title="Events" subtitle="Optional context for memory or export. These do not affect the chart score." groups={EVENT_GROUPS} selected={draft.events} setSelected={(fn) => setDraft((prev) => ({ ...prev, events: typeof fn === "function" ? fn(prev.events) : fn }))} />}
      {step === FIELDS.length + 2 && <NotesStep note={draft.note} setNote={(note) => setDraft((prev) => ({ ...prev, note }))} includeNotesInExport={draft.includeNotesInExport} setIncludeNotesInExport={(includeNotesInExport) => setDraft((prev) => ({ ...prev, includeNotesInExport }))} />}

      {saveState === "error" && <p className="save-error">Nour could not save this entry. Your browser storage may be full or unavailable.</p>}
      <div className="step-nav">
        <Button variant="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}><ArrowLeft size={16} /> Back</Button>
        {step < totalSteps - 1 ? <Button onClick={() => setStep((s) => Math.min(totalSteps - 1, s + 1))}>Next <ArrowRight size={16} /></Button> : <Button onClick={onSave}><Save size={16} /> {saveState === "saved" ? "Saved" : existingEntry ? "Save changes" : "Save entry"}</Button>}
      </div>
    </main>
  );
}

function buildDraftFromEntry(entry) {
  return {
    fields: { ...DEFAULT_VALUES, ...(entry?.fields || {}) },
    skippedFields: { ...DEFAULT_SKIPPED, ...(entry?.skippedFields || {}) },
    feelings: entry?.feelings || [],
    events: entry?.events || [],
    note: entry?.note || "",
    includeNotesInExport: entry?.includeNotesInExport ?? true,
  };
}

function buildEntry(date, draft, existing) {
  const now = new Date().toISOString();
  const fields = {};
  FIELDS.forEach((field) => {
    fields[field.key] = draft.skippedFields[field.key] ? null : draft.fields[field.key];
  });
  return {
    schemaVersion: APP_CONFIG.schemaVersion,
    id: existing?.id || uid(),
    date,
    fields,
    skippedFields: { ...draft.skippedFields },
    skippedDay: FIELDS.every((field) => draft.skippedFields[field.key]),
    feelings: draft.feelings,
    events: draft.events,
    note: draft.note,
    includeNotesInExport: draft.includeNotesInExport,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
}

function buildExportHTML({ rows, entries, rangeLabel, includeNotes }) {
  const width = 900;
  const height = 420;
  const pad = { top: 40, right: 30, bottom: 60, left: 56 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const xFor = (index) => pad.left + (rows.length <= 1 ? innerW / 2 : (index / (rows.length - 1)) * innerW);
  const yFor = (value) => pad.top + ((100 - value) / 100) * innerH;
  const compositePath = makePath(rows.map((row, i) => ({ x: xFor(i), y: yFor(row.composite ?? 0), value: row.composite })));
  const trendPath = makePath(rows.map((row, i) => ({ x: xFor(i), y: yFor(row.compositeTrend ?? 0), value: row.compositeTrend })));
  const dates = new Set(rows.map((row) => row.date));
  const filteredEntries = entries.filter((entry) => dates.has(entry.date));
  const notes = filteredEntries.filter((entry) => includeNotes && entry.note).map((entry) => `<li><b>${entry.date}</b>: ${entry.note.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</li>`).join("");

  return `
    <html><head><title>${APP_CONFIG.appName} Export</title><style>
      body{font-family:Arial,sans-serif;background:#f8f1df;color:#111827;padding:28px} h1{font-size:34px;margin:0 0 4px}.subtitle{font-size:18px;color:#374151;margin:0 0 18px}.card{border:2px solid #45738d;border-radius:20px;background:#fff9ea;padding:22px;margin-top:18px} svg{width:100%;height:auto}.footer{border-top:1px solid #9ca3af;margin-top:24px;padding-top:14px;font-size:15px;color:#374151;line-height:1.45} li{margin:8px 0}@media print{body{padding:16px}.card{break-inside:avoid}}
    </style></head><body>
      <h1>${APP_CONFIG.appName}</h1><p class="subtitle">${rangeLabel} reflection export</p>
      <div class="card"><svg viewBox="0 0 ${width} ${height}">
        <rect x="0" y="0" width="${width}" height="${height}" rx="24" fill="#f8f1df"/>
        <rect x="${pad.left}" y="${pad.top}" width="${innerW}" height="${innerH}" fill="#eef6f6" stroke="#45738d" stroke-width="3"/>
        ${[0,25,50,75,100].map(v => `<line x1="${pad.left}" x2="${pad.left+innerW}" y1="${yFor(v)}" y2="${yFor(v)}" stroke="#111827" stroke-opacity="${v===50 ? .8 : .25}" stroke-width="${v===50 ? 2.4 : 1.2}" stroke-dasharray="${v===50 ? '8 8' : ''}"/>`).join('')}
        <text x="${pad.left-12}" y="${yFor(100)+4}" text-anchor="end" font-size="12" font-weight="700">Feeling better</text>
        <text x="${pad.left-12}" y="${yFor(0)+4}" text-anchor="end" font-size="12" font-weight="700">Feeling worse</text>
        <path d="${compositePath}" fill="none" stroke="#111827" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".82"/>
        <path d="${trendPath}" fill="none" stroke="#b45309" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity=".92"/>
        ${rows.map((row,i)=> typeof row.composite === 'number' ? `<circle cx="${xFor(i)}" cy="${yFor(row.composite)}" r="4" fill="#111827"/>` : '').join('')}
        <text x="${pad.left+8}" y="${yFor(50)-8}" font-size="13" font-weight="800">personal neutral line</text>
      </svg><p><b>Dark line:</b> daily composite. <b>Gold line:</b> smoothed overall path.</p></div>
      ${includeNotes && notes ? `<div class="card"><h2>Notes</h2><ul>${notes}</ul></div>` : ""}
      <div class="footer">Generated locally by the user. Data stays on the device unless exported. User-entered record only; not a diagnosis, treatment plan, clinical assessment, or emergency service.</div>
      <script>window.print()</script>
    </body></html>`;
}

function parseImportedEntries(text) {
  const trimmed = text.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    const parsed = JSON.parse(trimmed);
    return migrateEntries(Array.isArray(parsed) ? parsed : parsed.entries);
  }

  const lines = trimmed.split(/\r?\n/).filter(Boolean);
  const headers = lines.shift().split(",").map((header) => header.trim());

  return migrateEntries(lines.map((line) => {
    const values = line.split(",").map((value) => value.trim());
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    const fields = {};
    FIELDS.forEach((field) => {
      const raw = row[field.key] ?? row[field.label] ?? row[field.label.toLowerCase()];
      const value = Number(raw);
      fields[field.key] = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : null;
    });
    return {
      id: row.id || uid(),
      schemaVersion: APP_CONFIG.schemaVersion,
      date: row.date,
      fields,
      skippedFields: FIELDS.reduce((acc, field) => ({ ...acc, [field.key]: fields[field.key] === null }), {}),
      skippedDay: FIELDS.every((field) => fields[field.key] === null),
      feelings: row.feelings ? row.feelings.split(";").map((item) => item.trim()).filter(Boolean) : [],
      events: row.events ? row.events.split(";").map((item) => item.trim()).filter(Boolean) : [],
      note: row.note || "",
      includeNotesInExport: true,
      createdAt: row.createdAt || new Date().toISOString(),
      updatedAt: row.updatedAt || new Date().toISOString(),
    };
  })).filter((entry) => entry.date);
}

export default function App() {
  const [entries, setEntries] = useState(loadEntries);
  const [page, setPage] = useState("home");
  const [date, setDate] = useState(todayISO());
  const [rangeMode, setRangeMode] = useState("week");
  const [customStart, setCustomStart] = useState(addDaysISO(todayISO(), -6));
  const [customEnd, setCustomEnd] = useState(todayISO());
  const [visible, setVisible] = useState(DEFAULT_VISIBLE);
  const [saveState, setSaveState] = useState("idle");
  const [menuOpen, setMenuOpen] = useState(false);
  const [exportIncludeNotes, setExportIncludeNotes] = useState(true);
  const [currentToday, setCurrentToday] = useState(todayISO());
  const [dayOneAnimationSeen, setDayOneAnimationSeen] = useState(() => localStorage.getItem(APP_CONFIG.dayOneAnimationSeenKey) === "true");
  const importInputRef = useRef(null);

  const existingEntry = entries.find((entry) => entry.date === date);
  const [draft, setDraft] = useState(() => buildDraftFromEntry(existingEntry));

  const chartRows = useMemo(() => buildChartRows(entries, rangeMode, customStart, customEnd, currentToday), [entries, rangeMode, customStart, customEnd, currentToday]);
  const feelingCounts = useMemo(() => countTags(entries, chartRows, "feelings"), [entries, chartRows]);
  const eventCounts = useMemo(() => countTags(entries, chartRows, "events"), [entries, chartRows]);
  const shouldAnimateDayOne = chartRows.length === 1 && typeof chartRows[0]?.composite === "number" && !dayOneAnimationSeen;

  useEffect(() => {
    const interval = window.setInterval(() => {
      const nextToday = todayISO();
      setCurrentToday((previous) => (previous === nextToday ? previous : nextToday));
    }, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!shouldAnimateDayOne) return;
    const timeout = window.setTimeout(() => {
      localStorage.setItem(APP_CONFIG.dayOneAnimationSeenKey, "true");
      setDayOneAnimationSeen(true);
    }, 1600);
    return () => window.clearTimeout(timeout);
  }, [shouldAnimateDayOne]);

  function startCheckIn(targetDate = date) {
    setDate(targetDate);
    const existing = entries.find((entry) => entry.date === targetDate);
    setDraft(buildDraftFromEntry(existing));
    setSaveState("idle");
    setPage("checkin");
  }

  function handleCheckInDate(nextDate) {
    setDate(nextDate);
    const existing = entries.find((entry) => entry.date === nextDate);
    setDraft(buildDraftFromEntry(existing));
    setSaveState("idle");
  }

  function saveDraft() {
    const existing = entries.find((entry) => entry.date === date);
    const nextEntry = buildEntry(date, draft, existing);
    const nextEntries = [...entries.filter((entry) => entry.date !== date), nextEntry].sort((a, b) => a.date.localeCompare(b.date));
    const result = saveEntries(nextEntries);
    if (!result.ok) {
      setSaveState("error");
      return;
    }
    setEntries(nextEntries);
    setSaveState("saved");
    window.setTimeout(() => setPage("home"), 450);
  }

  function clearEntries() {
    const confirmed = window.confirm("Clear all local Nour data on this device? This cannot be undone.");
    if (!confirmed) return;

    const result = saveEntries([]);
    if (!result.ok) {
      window.alert("Nour could not clear local data. Please try again.");
      return;
    }
    setEntries([]);
  }

  function exportPdf() {
    const label = RANGE_OPTIONS.find((range) => range.key === rangeMode)?.label || "Selected range";
    const html = buildExportHTML({ rows: chartRows, entries, rangeLabel: label, includeNotes: exportIncludeNotes });
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
  }

  function importEntriesFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = parseImportedEntries(String(reader.result || ""));
        if (!imported.length) {
          window.alert("No valid entries found in that import file.");
          return;
        }
        const merged = [...entries.filter((entry) => !imported.some((item) => item.date === entry.date)), ...imported].sort((a, b) => a.date.localeCompare(b.date));
        const result = saveEntries(merged);
        if (!result.ok) {
          window.alert("Nour could not import this file. Please try again.");
          return;
        }
        setEntries(merged);
        setMenuOpen(false);
      } catch (error) {
        console.error("Unable to import Nour entries", error);
        window.alert("Nour could not read that import file.");
      } finally {
        event.target.value = "";
      }
    };
    reader.readAsText(file);
  }

  if (page === "checkin") {
    return <><CheckInPage date={date} setDate={handleCheckInDate} draft={draft} setDraft={setDraft} existingEntry={existingEntry} onSave={saveDraft} onCancel={() => setPage("home")} saveState={saveState} /></>;
  }

  const todayEntry = entries.find((entry) => entry.date === currentToday);

  return (
    <main className="app-shell">
      <CrisisSupport />

      <header className="mobile-header">
        <button className="menu-button" type="button" onClick={() => setMenuOpen((open) => !open)} aria-label="Open menu">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <div className="brand-lockup">
          <p className="eyebrow">Working prototype</p>
          <h1>{APP_CONFIG.appName}</h1>
          <p>Healing has curves. Follow trends, not moments.</p>
        </div>
      </header>

      {menuOpen && (
        <section className="menu-panel" aria-label="Menu">
          <label className="menu-checkbox"><input type="checkbox" checked={exportIncludeNotes} onChange={(event) => setExportIncludeNotes(event.target.checked)} /> Include notes in export</label>
          <button type="button" onClick={() => { exportPdf(); setMenuOpen(false); }}><Download size={16} /> Export PDF</button>
          <button type="button" onClick={() => importInputRef.current?.click()}><FileText size={16} /> Import QA data</button>
          <input ref={importInputRef} className="hidden-file-input" type="file" accept=".csv,.json,application/json,text/csv" onChange={importEntriesFile} />
          <button type="button" onClick={() => { clearEntries(); setMenuOpen(false); }}><Trash2 size={16} /> Clear all local data</button>
          <p>Export is kept here because it matters, but it is not a daily action.</p>
        </section>
      )}

      <MoodChart rows={chartRows} visible={visible} setVisible={setVisible} animateDayOne={shouldAnimateDayOne} />
      <RangeControls rangeMode={rangeMode} setRangeMode={setRangeMode} customStart={customStart} setCustomStart={setCustomStart} customEnd={customEnd} setCustomEnd={setCustomEnd} />

      <section className={todayEntry ? "checkin-cta completed" : "checkin-cta"}>
        <div>
          <p className="eyebrow">Today</p>
          <h2>{todayEntry ? "You’ve already checked in today." : "Ready for today’s check-in?"}</h2>
          <p>{todayEntry ? "You can reopen today’s entry if you need to edit it." : "A few focused questions. One screen at a time."}</p>
        </div>
        <Button onClick={() => startCheckIn(currentToday)} variant={todayEntry ? "secondary" : "primary"}>
          <BarChart3 size={18} /> {todayEntry ? "Review today" : "Check in"}
        </Button>
      </section>


      <SafetyFooter />
    </main>
  );
}
