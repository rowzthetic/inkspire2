import { useState } from "react";


// ─── Data ────────────────────────────────────────────────────────────────────

const STAGES = [
  {
    id: 1,
    label: "Initial Healing",
    days: "Days 1–3",
    range: [1, 3],
    color: "#E24B4A",
    bg: "#2a1414",
    desc: "Redness, swelling & oozing are normal.",
  },
  {
    id: 2,
    label: "Peeling Phase",
    days: "Days 4–7",
    range: [4, 7],
    color: "#EF9F27",
    bg: "#261d0d",
    desc: "Skin begins to peel. Do NOT pick or scratch.",
  },
  {
    id: 3,
    label: "Itching & Settling",
    days: "Days 8–14",
    range: [8, 14],
    color: "#1D9E75",
    bg: "#0d1f19",
    desc: "Itching peaks. Moisturise regularly.",
  },
  {
    id: 4,
    label: "Full Surface Heal",
    days: "Days 15–28",
    range: [15, 28],
    color: "#378ADD",
    bg: "#0d1a26",
    desc: "Outer skin healed. Deeper layers still settling.",
  },
];

const SYMPTOMS = [
  "Redness",
  "Swelling",
  "Oozing",
  "Peeling",
  "Itching",
  "Dryness",
  "Scabbing",
  "Bruising",
];

const ALL_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

function getStage(day) {
  return STAGES.find((s) => day >= s.range[0] && day <= s.range[1]);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PhotoUpload({ dayKey, photos, onAdd }) {
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onAdd(dayKey, { url, name: file.name, date: new Date().toLocaleDateString() });
  };

  return (
    <div style={{ marginTop: 12 }}>
      <p style={styles.sectionLabel}>📷 Photos</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
        {photos.map((p, i) => (
          <div key={i} style={styles.photoThumb}>
            <img src={p.url} alt="progress" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6 }} />
          </div>
        ))}
        <label style={styles.photoUploadBtn}>
          <span style={{ fontSize: 22, lineHeight: 1 }}>+</span>
          <span style={{ fontSize: 11, color: "#888", marginTop: 2 }}>Add</span>
          <input type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
        </label>
      </div>
    </div>
  );
}

function SymptomChecklist({ dayKey, checked, onToggle }) {
  return (
    <div style={{ marginTop: 12 }}>
      <p style={styles.sectionLabel}>Symptoms today</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
        {SYMPTOMS.map((s) => {
          const active = checked.includes(s);
          return (
            <button
              key={s}
              onClick={() => onToggle(dayKey, s)}
              style={{
                ...styles.symptomTag,
                background: active ? "#3a2a0a" : "#1a1a1a",
                border: `1px solid ${active ? "#EF9F27" : "#333"}`,
                color: active ? "#EF9F27" : "#666",
              }}
            >
              {s}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PainSlider({ dayKey, value, onChange }) {
  const color =
    value <= 3 ? "#1D9E75" : value <= 6 ? "#EF9F27" : "#E24B4A";
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={styles.sectionLabel}>Pain / Discomfort</p>
        <span style={{ fontSize: 13, fontWeight: 600, color, fontFamily: "monospace" }}>
          {value}/10
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        value={value}
        onChange={(e) => onChange(dayKey, Number(e.target.value))}
        style={{ width: "100%", marginTop: 6, accentColor: color }}
      />
    </div>
  );
}

function ArtistNote({ note }) {
  if (!note) return null;
  return (
    <div style={styles.artistNote}>
      <span style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>
        ✏️ Artist note
      </span>
      <p style={{ margin: 0, fontSize: 13, color: "#ccc", lineHeight: 1.5 }}>{note}</p>
    </div>
  );
}

function DayCard({ day, data, onPhotoAdd, onSymptomToggle, onPainChange, onNoteChange, isOpen, onToggle }) {
  const stage = getStage(day);
  const hasActivity =
    data.photos.length > 0 || data.symptoms.length > 0 || data.pain > 0;

  return (
    <div style={{ marginBottom: 8 }}>
      {/* Header row */}
      <button
        onClick={onToggle}
        style={{
          ...styles.dayHeader,
          borderLeft: `3px solid ${stage.color}`,
          background: isOpen ? "#1e1e1e" : "#141414",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: hasActivity ? stage.color + "22" : "#222",
              border: `1.5px solid ${hasActivity ? stage.color : "#333"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              color: hasActivity ? stage.color : "#555",
              flexShrink: 0,
            }}
          >
            {day}
          </span>
          <div style={{ textAlign: "left" }}>
            <p style={{ margin: 0, fontSize: 13, color: "#ddd", fontWeight: 500 }}>
              Day {day}
            </p>
            {data.symptoms.length > 0 && (
              <p style={{ margin: 0, fontSize: 11, color: "#888" }}>
                {data.symptoms.slice(0, 3).join(", ")}
                {data.symptoms.length > 3 && " …"}
              </p>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {data.photos.length > 0 && (
            <span style={{ fontSize: 11, color: "#666" }}>
              {data.photos.length} photo{data.photos.length > 1 ? "s" : ""}
            </span>
          )}
          <span style={{ color: "#444", fontSize: 14 }}>{isOpen ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* Expanded body */}
      {isOpen && (
        <div style={styles.dayBody}>
          <ArtistNote note={data.artistNote} />
          <PainSlider dayKey={day} value={data.pain} onChange={onPainChange} />
          <SymptomChecklist dayKey={day} checked={data.symptoms} onToggle={onSymptomToggle} />
          <PhotoUpload dayKey={day} photos={data.photos} onAdd={onPhotoAdd} />
          <div style={{ marginTop: 12 }}>
            <p style={styles.sectionLabel}>Personal notes</p>
            <textarea
              placeholder="How's it looking today?"
              value={data.note}
              onChange={(e) => onNoteChange(day, e.target.value)}
              rows={2}
              style={styles.textarea}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const initDay = () => ({
  pain: 0,
  symptoms: [],
  photos: [],
  note: "",
  artistNote: "",
});

const DEMO_NOTES = {
  1: "Keep it wrapped for the first 4 hours. Pat dry, don't rub.",
  4: "Peeling is completely normal — trust the process!",
  8: "Looking great! Itching means it's healing. No scratching.",
  15: "Almost there. Book your touch-up after 8 weeks if needed.",
};

export default function TattooHealingTracker() {
  const [dayData, setDayData] = useState(() => {
    const d = {};
    ALL_DAYS.forEach((day) => {
      d[day] = { ...initDay(), artistNote: DEMO_NOTES[day] || "" };
    });
    return d;
  });

  const [openDay, setOpenDay] = useState(1);
  const [activeStage, setActiveStage] = useState(null);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderEmail, setReminderEmail] = useState("");
  const [view, setView] = useState("timeline"); // "timeline" | "overview"

  const completedDays = ALL_DAYS.filter(
    (d) =>
      dayData[d].pain > 0 ||
      dayData[d].symptoms.length > 0 ||
      dayData[d].photos.length > 0
  ).length;

  const handlePhotoAdd = (day, photo) => {
    setDayData((prev) => ({
      ...prev,
      [day]: { ...prev[day], photos: [...prev[day].photos, photo] },
    }));
  };

  const handleSymptomToggle = (day, symptom) => {
    setDayData((prev) => {
      const cur = prev[day].symptoms;
      return {
        ...prev,
        [day]: {
          ...prev[day],
          symptoms: cur.includes(symptom)
            ? cur.filter((s) => s !== symptom)
            : [...cur, symptom],
        },
      };
    });
  };

  const handlePainChange = (day, val) => {
    setDayData((prev) => ({ ...prev, [day]: { ...prev[day], pain: val } }));
  };

  const handleNoteChange = (day, val) => {
    setDayData((prev) => ({ ...prev, [day]: { ...prev[day], note: val } }));
  };

  const filteredDays = activeStage
    ? ALL_DAYS.filter((d) => {
        const s = getStage(d);
        return s.id === activeStage;
      })
    : ALL_DAYS;

  return (
    <div style={styles.root}>
      {/* ── Header ── */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Healing Tracker</h1>
          <p style={styles.subtitle}>28-day aftercare progress</p>
        </div>
        <div style={styles.progressRing}>
          <svg width="56" height="56" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="22" fill="none" stroke="#222" strokeWidth="4" />
            <circle
              cx="28"
              cy="28"
              r="22"
              fill="none"
              stroke="#EF9F27"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${(completedDays / 28) * 138} 138`}
              strokeDashoffset="34.5"
              transform="rotate(-90 28 28)"
            />
          </svg>
          <div style={styles.progressLabel}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#EF9F27" }}>
              {completedDays}
            </span>
            <span style={{ fontSize: 10, color: "#666" }}>/28</span>
          </div>
        </div>
      </div>

      {/* ── Stage pills ── */}
      <div style={styles.stagePills}>
        <button
          onClick={() => setActiveStage(null)}
          style={{
            ...styles.stagePill,
            background: !activeStage ? "#2a2a2a" : "transparent",
            border: `1px solid ${!activeStage ? "#555" : "#2a2a2a"}`,
            color: !activeStage ? "#eee" : "#555",
          }}
        >
          All
        </button>
        {STAGES.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveStage(activeStage === s.id ? null : s.id)}
            style={{
              ...styles.stagePill,
              background: activeStage === s.id ? s.bg : "transparent",
              border: `1px solid ${activeStage === s.id ? s.color : "#2a2a2a"}`,
              color: activeStage === s.id ? s.color : "#555",
            }}
          >
            {s.days}
          </button>
        ))}
      </div>

      {/* ── Stage info banner ── */}
      {activeStage && (() => {
        const s = STAGES.find((x) => x.id === activeStage);
        return (
          <div
            style={{
              ...styles.stageBanner,
              background: s.bg,
              borderLeft: `3px solid ${s.color}`,
            }}
          >
            <p style={{ margin: 0, fontWeight: 600, color: s.color, fontSize: 13 }}>
              {s.label}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>{s.desc}</p>
          </div>
        );
      })()}

      {/* ── Day cards ── */}
      <div style={{ marginTop: 16 }}>
        {filteredDays.map((day) => (
          <DayCard
            key={day}
            day={day}
            data={dayData[day]}
            onPhotoAdd={handlePhotoAdd}
            onSymptomToggle={handleSymptomToggle}
            onPainChange={handlePainChange}
            onNoteChange={handleNoteChange}
            isOpen={openDay === day}
            onToggle={() => setOpenDay(openDay === day ? null : day)}
          />
        ))}
      </div>

      {/* ── Reminder section ── */}
      <div style={styles.reminderBox}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: 0, fontWeight: 600, color: "#ddd", fontSize: 14 }}>
              Daily Reminders
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#666" }}>
              Get an email nudge each day to log your healing
            </p>
          </div>
          <button
            onClick={() => setReminderEnabled((v) => !v)}
            style={{
              width: 44,
              height: 24,
              borderRadius: 12,
              border: "none",
              background: reminderEnabled ? "#1D9E75" : "#333",
              position: "relative",
              cursor: "pointer",
              transition: "background 0.2s",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 3,
                left: reminderEnabled ? 23 : 3,
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "#fff",
                transition: "left 0.2s",
              }}
            />
          </button>
        </div>

        {reminderEnabled && (
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <input
              type="email"
              placeholder="your@email.com"
              value={reminderEmail}
              onChange={(e) => setReminderEmail(e.target.value)}
              style={styles.emailInput}
            />
            <button
              style={styles.saveBtn}
              onClick={() => alert(`Reminders set for ${reminderEmail}`)}
            >
              Save
            </button>
          </div>
        )}
      </div>

      {/* ── Artist panel ── */}
      <div style={styles.artistPanel}>
        <p style={{ margin: "0 0 10px", fontWeight: 600, color: "#ddd", fontSize: 14 }}>
          ✏️ Artist Notes
        </p>
        <p style={{ margin: "0 0 12px", fontSize: 12, color: "#666" }}>
          Your artist has left aftercare notes for specific days. Look for the ✏️ badge on each day card.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Object.entries(DEMO_NOTES).map(([day, note]) => (
            <div
              key={day}
              style={styles.artistNoteRow}
              onClick={() => {
                setActiveStage(null);
                setOpenDay(Number(day));
                setTimeout(() => {
                  document
                    .getElementById(`day-${day}`)
                    ?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: getStage(Number(day)).color,
                  fontWeight: 700,
                  minWidth: 44,
                }}
              >
                Day {day}
              </span>
              <span style={{ fontSize: 12, color: "#999", flex: 1 }}>{note}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  root: {
    fontFamily: "'Inter', system-ui, sans-serif",
    background: "#0e0e0e",
    minHeight: "100vh",
    color: "#ddd",
    padding: "20px 16px 40px",
    maxWidth: 480,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: "#fff",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    margin: "2px 0 0",
    fontSize: 13,
    color: "#666",
  },
  progressRing: {
    position: "relative",
    width: 56,
    height: 56,
    flexShrink: 0,
  },
  progressLabel: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
  },
  stagePills: {
    display: "flex",
    gap: 6,
    overflowX: "auto",
    paddingBottom: 4,
    scrollbarWidth: "none",
  },
  stagePill: {
    padding: "5px 12px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.15s",
  },
  stageBanner: {
    padding: "10px 14px",
    borderRadius: 8,
    marginTop: 12,
  },
  dayHeader: {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid #222",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    transition: "background 0.15s",
    textAlign: "left",
  },
  dayBody: {
    background: "#1a1a1a",
    border: "1px solid #222",
    borderTop: "none",
    borderRadius: "0 0 8px 8px",
    padding: "12px 14px 16px",
  },
  sectionLabel: {
    margin: 0,
    fontSize: 11,
    fontWeight: 600,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  symptomTag: {
    padding: "4px 10px",
    borderRadius: 20,
    fontSize: 12,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  photoThumb: {
    width: 56,
    height: 56,
    borderRadius: 6,
    overflow: "hidden",
    border: "1px solid #333",
  },
  photoUploadBtn: {
    width: 56,
    height: 56,
    borderRadius: 6,
    border: "1.5px dashed #333",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#555",
    transition: "border-color 0.15s",
  },
  textarea: {
    width: "100%",
    background: "#111",
    border: "1px solid #2a2a2a",
    borderRadius: 6,
    color: "#ddd",
    fontSize: 13,
    padding: "8px 10px",
    resize: "none",
    marginTop: 6,
    boxSizing: "border-box",
    fontFamily: "inherit",
    outline: "none",
  },
  artistNote: {
    background: "#1e1a10",
    border: "1px solid #3a3010",
    borderRadius: 6,
    padding: "10px 12px",
    marginBottom: 4,
  },
  reminderBox: {
    marginTop: 24,
    background: "#141414",
    border: "1px solid #222",
    borderRadius: 10,
    padding: "16px",
  },
  emailInput: {
    flex: 1,
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 6,
    color: "#ddd",
    fontSize: 13,
    padding: "8px 12px",
    outline: "none",
    fontFamily: "inherit",
  },
  saveBtn: {
    padding: "8px 18px",
    background: "#1D9E75",
    border: "none",
    borderRadius: 6,
    color: "#fff",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
  },
  artistPanel: {
    marginTop: 16,
    background: "#141414",
    border: "1px solid #222",
    borderRadius: 10,
    padding: "16px",
  },
  artistNoteRow: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    padding: "8px 10px",
    background: "#1a1a1a",
    borderRadius: 6,
    cursor: "pointer",
    border: "1px solid transparent",
    transition: "border-color 0.15s",
  },
};
