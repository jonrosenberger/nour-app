/* eslint-disable no-unused-vars -- V2 feature-flagged helpers/components are intentionally preserved in this prototype. */
import { useMemo, useState } from "react";
import "./App.css";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Download,
  FileText,
  Heart,
  LifeBuoy,
  Moon,
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
  - V1 default check-in uses three active trackers: Mood, Energy, and Self-talk.
  - Additional trackers remain in the internal registry for future configuration, but are not exposed in V1.
  - Default chart shows composite + smoothed Trend Line only; individual lines are optional toggles.
  - Feelings/events tag infrastructure remains present for V2+, but is feature-flagged off in V1.
  - Naming is centralized in APP_CONFIG so the working name can change later without hunting through code.
*/

const APP_CONFIG = {
  appName: "Nour",
  storageKey: "nour_entries_v1",
  exportFilePrefix: "nour-export",
  schemaVersion: 3,
  tagline: "Healing Has Curves. Follow trends, not moments.",
};

const FEATURE_FLAGS = {
  tags: false,
  trackerConfiguration: false,
  showMissingSkippedMarkers: false,
  qaCsvImporter: true,
  restrictBackdatingToThreeDays: false, // V2+/policy-ready: code exists but is off for V1 testing.
};

// Tracker registry: all possible trackers live here. V1 enables only the core three; future user configuration should be layered on top instead of hardcoding new arrays.
const TRACKERS = [
  {
    key: "mood",
    enabledInV1: true,
    label: "Mood",
    prompt: "How was your emotional weather today?",
    left: "Very hard",
    midLeft: "Hard",
    center: "Neutral",
    midRight: "Good",
    right: "Very good",
    icon: Heart,
    color: "#ec4899",
  },
  {
    key: "energy",
    enabledInV1: true,
    label: "Energy",
    prompt: "How much energy did you have today?",
    left: "Empty",
    midLeft: "Low",
    center: "Neutral",
    midRight: "Energized",
    right: "Very energized",
    icon: Zap,
    color: "#f59e0b",
  },
  {
    key: "calm",
    enabledInV1: false,
    label: "Calm",
    prompt: "How calm did your nervous system feel today?",
    left: "Overwhelmed",
    midLeft: "Uneasy",
    center: "Neutral",
    midRight: "Calm",
    right: "Very calm",
    icon: Sparkles,
    color: "#38bdf8",
  },
  {
    key: "selfTalk",
    enabledInV1: true,
    label: "Self-talk",
    prompt: "How did your inner voice treat you today?",
    left: "Cruel",
    midLeft: "Harsh",
    center: "Neutral",
    midRight: "Kind",
    right: "Supportive",
    icon: FileText,
    color: "#fb7185",
  },
  {
    key: "connection",
    enabledInV1: false,
    label: "Connection",
    prompt: "How socially or emotionally connected did you feel today?",
    left: "Isolated",
    midLeft: "Distant",
    center: "Neutral",
    midRight: "Connected",
    right: "Supported",
    icon: Sparkles,
    color: "#a78bfa",
  },
  {
    key: "rest",
    enabledInV1: false,
    label: "Rest",
    prompt: "How rested did you feel today?",
    left: "Wrecked",
    midLeft: "Tired",
    center: "Neutral",
    midRight: "Rested",
    right: "Restored",
    icon: Moon,
    color: "#34d399",
  },
];

const ACTIVE_FIELDS = TRACKERS.filter((field) => field.enabledInV1);

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

const DEFAULT_VALUES = ACTIVE_FIELDS.reduce((acc, field) => ({ ...acc, [field.key]: 50 }), {});
const DEFAULT_SKIPPED = ACTIVE_FIELDS.reduce((acc, field) => ({ ...acc, [field.key]: false }), {});

const DEFAULT_VISIBLE = ACTIVE_FIELDS.reduce(
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

function getAllowedCheckInDateRange(today = todayISO()) {
  return {
    min: addDaysISO(today, -3),
    max: today,
  };
}

function enforceCheckInDatePolicy(nextDate, today = todayISO()) {
  if (!FEATURE_FLAGS.restrictBackdatingToThreeDays) return nextDate;
  const { min, max } = getAllowedCheckInDateRange(today);
  if (nextDate < min) return min;
  if (nextDate > max) return max;
  return nextDate;
}

function uid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function migrateEntries(entries) {
  // Lightweight migration runner placeholder.
  // Current v3 data keeps the v1/v2 shape but adds stronger IDs and QA import metadata.
  // Future schema changes should be handled here rather than silently assuming old data still matches.
  if (!Array.isArray(entries)) return [];
  return entries.map((entry) => ({
    schemaVersion: entry.schemaVersion || 1,
    ...entry,
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
    console.error("Failed to save Nour entries", error);
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

function buildChartRows(entries, rangeMode, customStart, customEnd, today = todayISO()) {
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
      ACTIVE_FIELDS.forEach((field) => {
        row[field.key] = entry.fields?.[field.key] ?? null;
      });
      return row;
    });

  return movingAverage(rows, "composite", rangeMode === "week" ? 3 : 7);
}

// V2+: dormant tag analytics helper. Tags are feature-flagged off in V1 UI.
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

function makePath(points, smooth = false) {
  const valid = points.filter((point) => typeof point.value === "number");
  if (!valid.length) return "";
  if (!smooth || valid.length < 3) {
    return valid.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  }
  let path = `M ${valid[0].x} ${valid[0].y}`;
  for (let i = 0; i < valid.length - 1; i += 1) {
    const current = valid[i];
    const next = valid[i + 1];
    const midX = (current.x + next.x) / 2;
    path += ` Q ${current.x} ${current.y} ${midX} ${(current.y + next.y) / 2}`;
    path += ` T ${next.x} ${next.y}`;
  }
  return path;
}

function MoodChart({ rows, visible, setVisible }) {
  const width = 1080;
  const height = 520;
  const pad = { top: 42, right: 30, bottom: 60, left: 62 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const xFor = (index) => pad.left + (rows.length <= 1 ? innerW / 2 : (index / (rows.length - 1)) * innerW);
  const yFor = (value) => pad.top + ((100 - value) / 100) * innerH;

  const series = [
    { key: "composite", label: "Daily Average", color: "#111827", width: 3.5 },
    { key: "compositeTrend", label: "Trend Line", color: "#b45309", width: 6 },
    ...ACTIVE_FIELDS.map((field) => ({ key: field.key, label: field.label, color: field.color, width: 2.5 })),
  ];

  const activeSeries = series.filter((item) => (item.key === "compositeTrend" ? visible.trend : visible[item.key]));

  return (
    <Card className="chart-card">
      <div className="chart-header">
        <div>
          <p className="eyebrow">Graph</p>
          <h1>{APP_CONFIG.appName}</h1>
          <p>{APP_CONFIG.tagline}</p><p>Daily Average plus a smoothed Trend Line. No interpretation; just your recorded check-ins.</p>
        </div>
      </div>

      <div className="legend-wrap">
        <button className={visible.composite ? "legend on" : "legend"} onClick={() => setVisible((v) => ({ ...v, composite: !v.composite }))}>
          <span style={{ background: "#111827" }} /> Daily Average
        </button>
        <button className={visible.trend ? "legend on" : "legend"} onClick={() => setVisible((v) => ({ ...v, trend: !v.trend }))}>
          <span style={{ background: "#b45309" }} /> Trend Line
        </button>
        {ACTIVE_FIELDS.map((field) => (
          <button key={field.key} className={visible[field.key] ? "legend on" : "legend"} onClick={() => setVisible((v) => ({ ...v, [field.key]: !v[field.key] }))}>
            <span style={{ background: field.color }} /> {field.label}
          </button>
        ))}
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
            <g key={value}>
              <line x1={pad.left} x2={pad.left + innerW} y1={yFor(value)} y2={yFor(value)} stroke={value === 50 ? "#111827" : "rgba(17,24,39,.45)"} strokeDasharray={value === 50 ? "8 8" : ""} strokeWidth={value === 50 ? 2.5 : 1.4} />
              <text x={pad.left - 12} y={yFor(value) + 4} textAnchor="end" fontSize="13" fill="#111827" fontWeight="700">{value}</text>
            </g>
          ))}
          <text x={pad.left + 8} y={yFor(50) - 8} fontSize="14" fill="#111827" fontWeight="800">personal neutral line</text>

          {activeSeries.map((item) => {
            const path = makePath(rows.map((row, index) => ({ x: xFor(index), y: yFor(row[item.key] ?? 0), value: row[item.key] })), true);
            if (!path) return null;
            return (
              <g key={item.key} filter={item.key === "compositeTrend" || item.key === "composite" ? "url(#pencil)" : ""}>
                <path d={path} fill="none" stroke={item.color} strokeWidth={item.width + 2} strokeLinecap="round" strokeLinejoin="round" opacity="0.16" />
                <path d={path} fill="none" stroke={item.color} strokeWidth={item.width} strokeLinecap="round" strokeLinejoin="round" opacity={item.key === "compositeTrend" ? 0.9 : 0.76} />
              </g>
            );
          })}

          {rows.map((row, index) => typeof row.composite === "number" ? <circle key={row.date} cx={xFor(index)} cy={yFor(row.composite)} r="4" fill="#111827" opacity=".85" /> : null)}
          {rows.map((row, index) => {
            const showLabel = rows.length <= 12 || index === 0 || index === rows.length - 1 || index % Math.ceil(rows.length / 8) === 0;
            return showLabel ? <text key={`label-${row.date}`} x={xFor(index)} y={height - 26} textAnchor="middle" fontSize="12" fill="#111827" fontWeight="700">{row.date.slice(5)}</text> : null;
          })}
        </svg>
      </div>
    </Card>
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

function SliderStep({ field, value, skipped, onValue }) {
  const Icon = field.icon;
  const labels = [field.left, field.midLeft, field.center, field.midRight, field.right];
  return (
    <Card className={`step-card slider-step-card ${skipped ? "skipped-card" : ""}`}>
      <div className="step-icon"><Icon size={30} /></div>
      <p className="eyebrow">{field.label}</p>
      <h1>{field.prompt}</h1>
      <p className="baseline-hint">Answer relative to your own normal. First thought is enough.</p>
      <div className="slider-fixed-zone">
        <div className="slider-track-wrap">
          <input className="range jumbo" type="range" min="0" max="100" value={value} disabled={skipped} onChange={(e) => onValue(field.key, Number(e.target.value))} aria-label={field.prompt} />
          <div className="range-labels">{labels.map((label, index) => <span key={label} style={{ left: `${index * 25}%` }}>{label}</span>)}</div>
        </div>
      </div>
      {skipped && <p className="skip-state-note">Skipped for today. Use “Answer this field” below to restore it.</p>}
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

function NotesStep({ note, setNote }) {
  return (
    <Card className="step-card wide-step">
      <p className="eyebrow">Final note</p>
      <h1>Notes (optional)</h1>
      <p>You can leave this blank and continue. No need to write anything.</p>
      <textarea value={note} maxLength={2000} onChange={(event) => setNote(event.target.value)} placeholder="Optional context for today." />
    </Card>
  );
}

function CheckInPage({ date, setDate, draft, setDraft, existingEntry, onSave, onCancel, saveState }) {
  const [step, setStep] = useState(0);
  const allowedDateRange = getAllowedCheckInDateRange();
  const totalSteps = ACTIVE_FIELDS.length + 1;
  const currentField = ACTIVE_FIELDS[step];

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
      <div className="date-row checkin-date subtle-date"><label>Check-in date<input type="date" value={date} min={FEATURE_FLAGS.restrictBackdatingToThreeDays ? allowedDateRange.min : undefined} max={FEATURE_FLAGS.restrictBackdatingToThreeDays ? allowedDateRange.max : undefined} onChange={(e) => setDate(enforceCheckInDatePolicy(e.target.value))} /></label></div>

      {currentField && <SliderStep field={currentField} value={draft.fields[currentField.key] ?? 50} skipped={draft.skippedFields[currentField.key]} onValue={updateValue} />}
{step === ACTIVE_FIELDS.length && <NotesStep note={draft.note} setNote={(note) => setDraft((prev) => ({ ...prev, note }))} />}

      <div className="step-nav">
        <Button variant="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}><ArrowLeft size={16} /> Back</Button>
        <div className="forward-actions">
          {step < totalSteps - 1 ? <Button onClick={() => setStep((s) => Math.min(totalSteps - 1, s + 1))}>Next <ArrowRight size={16} /></Button> : <Button onClick={onSave}><Save size={16} /> {saveState === "error" ? "Save failed" : saveState === "saved" ? "Saved" : existingEntry ? "Save changes" : "Save entry"}</Button>}
          {currentField && (draft.skippedFields[currentField.key]
            ? <button className="answer-field-button" type="button" onClick={() => unskipField(currentField.key)}>Answer this field</button>
            : <button className="skip-under-next" type="button" onClick={() => skipField(currentField.key)}><SkipForward size={14} /> Skip this field</button>)}
        </div>
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
  };
}

function buildEntry(date, draft, existing) {
  const now = new Date().toISOString();
  // Preserve inactive tracker fields from older/future entries while only updating the active V1 trackers.
  const fields = { ...(existing?.fields || {}) };
  ACTIVE_FIELDS.forEach((field) => {
    fields[field.key] = draft.skippedFields[field.key] ? null : draft.fields[field.key];
  });
  return {
    schemaVersion: APP_CONFIG.schemaVersion,
    id: existing?.id || uid(),
    date,
    fields,
    skippedFields: { ...(existing?.skippedFields || {}), ...draft.skippedFields },
    skippedDay: ACTIVE_FIELDS.every((field) => draft.skippedFields[field.key]),
    feelings: draft.feelings,
    events: draft.events,
    note: draft.note,
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
  const compositePath = makePath(rows.map((row, i) => ({ x: xFor(i), y: yFor(row.composite ?? 0), value: row.composite })), false);
  const trendPath = makePath(rows.map((row, i) => ({ x: xFor(i), y: yFor(row.compositeTrend ?? 0), value: row.compositeTrend })), true);
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
        ${[0,25,50,75,100].map(v => `<line x1="${pad.left}" x2="${pad.left+innerW}" y1="${yFor(v)}" y2="${yFor(v)}" stroke="#111827" stroke-opacity="${v===50 ? .8 : .25}" stroke-width="${v===50 ? 2.4 : 1.2}" stroke-dasharray="${v===50 ? '8 8' : ''}"/><text x="${pad.left-12}" y="${yFor(v)+4}" text-anchor="end" font-size="12" font-weight="700">${v}</text>`).join('')}
        <path d="${compositePath}" fill="none" stroke="#111827" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".82"/>
        <path d="${trendPath}" fill="none" stroke="#b45309" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity=".92"/>
        ${rows.map((row,i)=> typeof row.composite === 'number' ? `<circle cx="${xFor(i)}" cy="${yFor(row.composite)}" r="4" fill="#111827"/>` : '').join('')}
        <text x="${pad.left+8}" y="${yFor(50)-8}" font-size="13" font-weight="800">personal neutral line</text>
      </svg><p><b>Dark line:</b> Daily Average. <b>Gold line:</b> Trend Line.</p></div>
      ${includeNotes && notes ? `<div class="card"><h2>Notes</h2><ul>${notes}</ul></div>` : ""}
      <div class="footer">Generated locally by the user. Data stays on the device unless exported. User-entered record only; not a diagnosis, treatment plan, clinical assessment, or emergency service.</div>
      <script>window.print()</script>
    </body></html>`;
}

function parseCSV(text) {
  const rows = [];
  let current = "";
  let row = [];
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && insideQuotes && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      row.push(current);
      current = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current);
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }

  row.push(current);
  if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  if (rows.length < 2) return [];

  const headers = rows[0].map((cell) => cell.trim());
  return rows.slice(1).map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index]?.trim() ?? ""])));
}

function csvRowsToEntries(csvRows) {
  return csvRows
    .filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.date || ""))
    .map((row) => {
      const fields = { ...DEFAULT_VALUES };
      const skippedFields = { ...DEFAULT_SKIPPED };
      const csvKeysByTracker = { mood: "mood", energy: "energy", selfTalk: "self_talk" };

      ACTIVE_FIELDS.forEach((field) => {
        const raw = row[csvKeysByTracker[field.key] || field.key];
        const value = raw === "" || raw === undefined ? null : Number(raw);
        if (Number.isFinite(value)) {
          fields[field.key] = Math.max(0, Math.min(100, Math.round(value)));
          skippedFields[field.key] = false;
        } else {
          fields[field.key] = null;
          skippedFields[field.key] = true;
        }
      });

      const skippedDay = row.status === "missed" || ACTIVE_FIELDS.every((field) => skippedFields[field.key]);
      const now = new Date().toISOString();
      return {
        schemaVersion: APP_CONFIG.schemaVersion,
        id: uid(),
        date: row.date,
        fields,
        skippedFields,
        skippedDay,
        feelings: [],
        events: [],
        note: row.notes || "",
        source: row.source || "csv_import",
        isTestData: row.source === "synthetic_qa" || row.source === "csv_import",
        importedAt: now,
        createdAt: now,
        updatedAt: now,
      };
    });
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
  const [exportIncludeNotes, setExportIncludeNotes] = useState(false);

  const existingEntry = entries.find((entry) => entry.date === date);
  const [draft, setDraft] = useState(() => buildDraftFromEntry(existingEntry));

  const today = useMemo(() => todayISO(), []);
  const chartRows = useMemo(() => buildChartRows(entries, rangeMode, customStart, customEnd, today), [entries, rangeMode, customStart, customEnd, today]);

  function startCheckIn() {
    const existing = entries.find((entry) => entry.date === date);
    setDraft(buildDraftFromEntry(existing));
    setSaveState("idle");
    setPage("checkin");
  }

  function handleCheckInDate(nextDate) {
    const allowedDate = enforceCheckInDatePolicy(nextDate);
    setDate(allowedDate);
    const existing = entries.find((entry) => entry.date === allowedDate);
    setDraft(buildDraftFromEntry(existing));
    setSaveState("idle");
  }

  function persistEntries(nextEntries) {
    const result = saveEntries(nextEntries);
    if (!result.ok) {
      setSaveState("error");
      return false;
    }
    setEntries(nextEntries);
    return true;
  }

  function saveDraft() {
    const existing = entries.find((entry) => entry.date === date);
    const nextEntry = buildEntry(date, draft, existing);
    const nextEntries = [...entries.filter((entry) => entry.date !== date), nextEntry].sort((a, b) => a.date.localeCompare(b.date));
    if (!persistEntries(nextEntries)) return;
    setSaveState("saved");
    window.setTimeout(() => setPage("home"), 450);
  }

  function clearEntries() {
    if (!window.confirm("Clear all local Nour entries? This cannot be undone unless you already exported or backed up the data.")) return;
    if (!persistEntries([])) return;
    setSaveState("idle");
  }

  async function importCSV(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const imported = csvRowsToEntries(parseCSV(text));
      if (!imported.length) {
        window.alert("No valid rows found. Expected columns: date, mood, energy, self_talk, status, notes, source.");
        return;
      }
      const byDate = new Map(entries.map((entry) => [entry.date, entry]));
      imported.forEach((entry) => byDate.set(entry.date, entry));
      const nextEntries = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
      if (!persistEntries(nextEntries)) return;
      window.alert(`Imported ${imported.length} QA/test entries.`);
    } catch (error) {
      console.error("CSV import failed", error);
      window.alert("CSV import failed. Check the file format and try again.");
    }
  }

  function exportPdf() {
    const label = RANGE_OPTIONS.find((range) => range.key === rangeMode)?.label || "Selected range";
    const html = buildExportHTML({ rows: chartRows, entries, rangeLabel: label, includeNotes: exportIncludeNotes });
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
  }

  if (page === "checkin") {
    return <><CheckInPage date={date} setDate={handleCheckInDate} draft={draft} setDraft={setDraft} existingEntry={existingEntry} onSave={saveDraft} onCancel={() => setPage("home")} saveState={saveState} /></>;
  }

  return (
    <main className="app-shell">
      <CrisisSupport />
      <section className="home-hero">
        <div><p className="eyebrow">Working prototype</p><h1>{APP_CONFIG.appName}</h1><p>{APP_CONFIG.tagline}</p><p>A private emotional cartography tool. No diagnosis, no interpretation, no cloud account.</p></div>
        <Button onClick={startCheckIn}><BarChart3 size={18} /> Check in</Button>
      </section>

      <RangeControls rangeMode={rangeMode} setRangeMode={setRangeMode} customStart={customStart} setCustomStart={setCustomStart} customEnd={customEnd} setCustomEnd={setCustomEnd} />
      <MoodChart rows={chartRows} visible={visible} setVisible={setVisible} />

      <section className="lower-grid single-card-grid">
        <Card><h2>Export / QA controls</h2><p>PDF uses the selected range. Export options live here so the check-in flow stays focused.</p><label className="checkbox-line export-option"><input type="checkbox" checked={exportIncludeNotes} onChange={(event) => setExportIncludeNotes(event.target.checked)} /> Include notes in this PDF export</label><div className="button-row"><Button variant="secondary" onClick={exportPdf}><Download size={16} /> Export PDF</Button>{FEATURE_FLAGS.qaCsvImporter && <label className="button secondary file-button"><FileText size={16} /> Import QA CSV<input type="file" accept=".csv,text/csv" onChange={importCSV} /></label>}<Button variant="secondary" onClick={clearEntries}><Trash2 size={16} /> Clear local data</Button></div><p className="muted qa-note">CSV import is a testing-only utility for graph/export QA, not a user-facing roadmap feature.</p></Card>
      </section>

      <SafetyFooter />
    </main>
  );
}

