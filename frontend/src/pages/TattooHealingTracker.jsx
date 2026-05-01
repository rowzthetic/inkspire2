import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  MessageSquare, Send, User, ShieldCheck, Calendar, 
  ChevronDown, ChevronUp, Clock, Activity, Camera,
  X, Check, AlertCircle, ArrowLeft, Maximize2, Lock
} from "lucide-react";

const API_BASE_URL = "http://localhost:8000";

// ─── Constants ──────────────────────────────────────────────────────────────

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
  "Redness", "Swelling", "Oozing", "Peeling", 
  "Itching", "Dryness", "Scabbing", "Bruising"
];

const ALL_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

function getStage(day) {
  return STAGES.find((s) => day >= s.range[0] && day <= s.range[1]);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PhotoUpload({ dayKey, photos, onAdd, onPreview, disabled }) {
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    onAdd(dayKey, file);
  };

  return (
    <div style={{ marginTop: 12 }}>
      <p style={styles.sectionLabel}>📷 Photos</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
        {photos.map((p, i) => (
          <div 
            key={i} 
            style={styles.photoThumb} 
            onClick={() => onPreview(p.url)}
          >
            <img src={p.url} alt="progress" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
            <div style={styles.zoomOverlay}>
              <Maximize2 size={16} color="#fff" />
            </div>
          </div>
        ))}
        {!disabled && (
          <label style={styles.photoUploadBtn}>
            <Camera size={20} />
            <span style={{ fontSize: 10, color: "#888", marginTop: 4 }}>Add</span>
            <input type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
          </label>
        )}
      </div>
    </div>
  );
}

function SymptomChecklist({ dayKey, checked, onToggle, disabled }) {
  return (
    <div style={{ marginTop: 12 }}>
      <p style={styles.sectionLabel}>Symptoms today</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
        {SYMPTOMS.map((s) => {
          const active = checked.includes(s);
          return (
            <button
              key={s}
              onClick={() => !disabled && onToggle(dayKey, s)}
              disabled={disabled}
              style={{
                ...styles.symptomTag,
                background: active ? "#3a2a0a" : "#1a1a1a",
                border: `1px solid ${active ? "#EF9F27" : "#333"}`,
                color: active ? "#EF9F27" : "#666",
                cursor: disabled ? "default" : "pointer",
                opacity: disabled && !active ? 0.3 : 1
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

function PainSlider({ dayKey, value, onChange, disabled }) {
  const color = value <= 3 ? "#1D9E75" : value <= 6 ? "#EF9F27" : "#E24B4A";
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
        onChange={(e) => !disabled && onChange(dayKey, Number(e.target.value))}
        disabled={disabled}
        style={{ width: "100%", marginTop: 10, accentColor: color }}
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const initDay = () => ({
  id: null,
  pain: 0,
  symptoms: [],
  photos: [],
  note: "",
  artistNote: "",
  feedback: "",
});

export default function TattooHealingTracker() {
  const { authFetch, user: authUser } = useAuth();
  const [searchParams] = useSearchParams();
  const apptIdFromUrl = searchParams.get("appt");

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(authUser);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(null);
  const [activeImage, setActiveImage] = useState(null);
  const [currentHealingDay, setCurrentHealingDay] = useState(1);

  const [dayData, setDayData] = useState(() => {
    const d = {};
    ALL_DAYS.forEach((day) => {
      d[day] = initDay();
    });
    return d;
  });

  const [openDay, setOpenDay] = useState(1);
  const [activeStage, setActiveStage] = useState(null);
  const [savingDay, setSavingDay] = useState(null);
  
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (showChat) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, showChat]);

  const fetchTrackerData = async (apptId) => {
    try {
      setError(null);
      const res = await authFetch(`${API_BASE_URL}/api/appointments/healing-tracker/${apptId}/`);
      if (res.ok) {
        const data = await res.json();
        if (data.appointment) {
          setAppointment(data.appointment);
        } else {
          setError("No appointment data found.");
        }
        
        const newDayData = {};
        ALL_DAYS.forEach(d => { newDayData[d] = initDay(); });

        data.artist_notes.forEach((n) => {
          if (newDayData[n.day]) { newDayData[n.day].artistNote = n.note; }
        });
        
        data.logs.forEach((l) => {
          if (newDayData[l.day]) {
            newDayData[l.day] = {
              ...newDayData[l.day],
              id: l.id,
              pain: l.pain_level,
              symptoms: l.symptoms,
              note: l.personal_notes,
              feedback: l.artist_feedback,
              photos: l.photos.map(p => ({ url: `${API_BASE_URL}${p.image}`, id: p.id }))
            };
          }
        });
        
        setDayData(newDayData);
        
        // Auto-open current day & lockout logic
        const today = new Date();
        const apptDate = new Date(data.appointment.date);
        
        // Count full days passed since appointment (1-indexed)
        const diffDays = Math.floor((today - apptDate) / (1000 * 60 * 60 * 24)) + 1;
        setCurrentHealingDay(Math.max(1, diffDays));
        
        // Prioritize URL 'day' parameter over calculated 'diffDays'
        const dayFromUrl = searchParams.get("day");
        if (dayFromUrl) {
          setOpenDay(parseInt(dayFromUrl));
        } else if (diffDays >= 1 && diffDays <= 28) {
          setOpenDay(diffDays);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.detail || errData.error || "Failed to load healing journey.");
      }
    } catch (err) { 
      console.error(err);
      setError("An unexpected error occurred. Please refresh or try again.");
    }
    finally { setLoading(false); }
  };

  const fetchMessages = async (apptId) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/api/appointments/healing-messages/${apptId}/`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch current user if authUser is stale
        if (!user) {
          const userRes = await authFetch(`${API_BASE_URL}/api/users/me/`);
          if (userRes.ok) {
             const userData = await userRes.json();
             setUser(userData);
          }
        }

        let targetApptId = apptIdFromUrl;

        if (!targetApptId) {
          const res = await authFetch(`${API_BASE_URL}/api/appointments/active-healing/`);
          if (res.ok) {
            const data = await res.json();
            targetApptId = data.id;
          } else if (res.status === 404) {
            setLoading(false);
            return; // No active healing session
          }
        }

        if (targetApptId) {
          fetchTrackerData(targetApptId);
          fetchMessages(targetApptId);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Fetch fails", err);
        setLoading(false);
        setError("Network error. Please check your connection.");
      }
    };
    fetchData();
  }, [apptIdFromUrl, authFetch, searchParams]);

  const dayFromUrl = searchParams.get("day");
  useEffect(() => {
    if (dayFromUrl && !loading && appointment) {
      const timeout = setTimeout(() => {
        const el = document.getElementById(`day-${dayFromUrl}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 800); // Reasonable delay for layout stabilization
      return () => clearTimeout(timeout);
    }
  }, [dayFromUrl, loading, appointment]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !appointment) return;
    try {
      const res = await authFetch(`${API_BASE_URL}/api/appointments/healing-messages/${appointment.id}/`, {
        method: "POST",
        body: JSON.stringify({ message: newMessage }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setNewMessage("");
      }
    } catch (err) { console.error(err); }
  };

  const saveArtistFeedback = async (day, logId, feedback) => {
    setFeedbackLoading(logId);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/appointments/artist-feedback/${logId}/`, {
        method: "PATCH",
        body: JSON.stringify({ artist_feedback: feedback }),
      });
      if (res.ok) {
        const log = await res.json();
        setDayData((prev) => ({
          ...prev,
          [log.day]: { ...prev[log.day], feedback: log.artist_feedback },
        }));
      }
    } catch (err) { console.error(err); }
    finally { setFeedbackLoading(null); }
  };

  const saveLog = async (day, updatedFields) => {
    if (!appointment || user?.is_artist) return;
    setSavingDay(day);
    try {
      const currentData = dayData[day];
      const payload = {
        day,
        pain_level: updatedFields.pain !== undefined ? updatedFields.pain : currentData.pain,
        symptoms: updatedFields.symptoms !== undefined ? updatedFields.symptoms : currentData.symptoms,
        personal_notes: updatedFields.note !== undefined ? updatedFields.note : currentData.note,
      };

      const res = await authFetch(`${API_BASE_URL}/api/appointments/healing-tracker/${appointment.id}/`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        setDayData(prev => ({ ...prev, [day]: { ...prev[day], id: result.id } }));
      }
    } catch (err) { console.error(err); }
    finally { setSavingDay(null); }
  };

  const handlePhotoAdd = async (day, file) => {
    if (!appointment || user?.is_artist) return;
    let logId = dayData[day].id;
    if (!logId) {
       await saveLog(day, {});
       logId = dayData[day].id;
    }
    const formData = new FormData();
    formData.append("image", file);
    setSavingDay(day);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/appointments/healing-photo/${logId}/`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const photo = await res.json();
        setDayData((prev) => ({
          ...prev,
          [day]: {
            ...prev[day],
            photos: [...prev[day].photos, { url: `${API_BASE_URL}${photo.image}`, id: photo.id }],
          },
        }));
      }
    } catch (err) { console.error(err); }
    finally { setSavingDay(null); }
  };

  const completedCount = ALL_DAYS.filter(d => dayData[d].id || dayData[d].pain > 0).length;

  if (loading) return <div style={{ color: "#fff", padding: "100px 20px", textAlign: "center" }}>
    <Activity size={40} className="animate-spin" style={{ color: "#EF9F27", marginBottom: 20 }} />
    <p>Retrieving your healing data...</p>
  </div>;

  if (error) return (
    <div style={styles.errorBox}>
      <AlertCircle size={48} color="#EF4444" style={{ marginBottom: 16 }} />
      <h2 style={{ fontSize: 20, color: "#fff", marginBottom: 8 }}>Unable to Load Session</h2>
      <p style={{ color: "#888", marginBottom: 24 }}>{error}</p>
      <button onClick={() => window.location.reload()} style={styles.retryBtn}>Retry Connection</button>
    </div>
  );

  if (!appointment) return (
    <div style={{ color: "#fff", padding: "100px 40px", textAlign: "center" }}>
      <div style={{ marginBottom: 20 }}>
          <Activity size={48} color="#222" />
      </div>
      <h2 style={{ color: "#EF9F27", fontSize: 24, fontWeight: 700 }}>No Active Healing Session</h2>
      <p style={{ color: "#888", marginTop: 10, maxWidth: 300, margin: "10px auto 30px" }}>
        Healing trackers are only available for confirmed or completed appointments within the last 28 days.
      </p>
      <Link to="/dashboard" style={styles.backBtn}>
        <ArrowLeft size={16} /> Back to Appointments
      </Link>
    </div>
  );

  return (
    <div style={styles.root}>
      {/* ── Header ── */}
      <div style={styles.header}>
        <Link to="/dashboard" style={{ color: "#555", textDecoration: "none", display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 15 }}>
          <ArrowLeft size={14} /> Dash
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={styles.title}>Healing Tracker</h1>
            <p style={styles.subtitle}>{user?.is_artist ? `Client: ${appointment.customer_name}` : `Artist: ${appointment.artist_name}`}</p>
          </div>
          <div style={styles.progressRing}>
            <svg width="56" height="56" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="22" fill="none" stroke="#222" strokeWidth="4" />
              <circle cx="28" cy="28" r="22" fill="none" stroke="#EF9F27" strokeWidth="4" strokeLinecap="round"
                strokeDasharray={`${(completedCount / 28) * 138} 138`} strokeDashoffset="34.5" transform="rotate(-90 28 28)" />
            </svg>
            <div style={styles.progressLabel}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#EF9F27" }}>{completedCount}</span>
              <span style={{ fontSize: 9, color: "#666" }}>/28</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stage filters ── */}
      <div style={styles.stagePills}>
        <button onClick={() => setActiveStage(null)} style={{ ...styles.stagePill, background: !activeStage ? "#2a2a2a" : "transparent", color: !activeStage ? "#eee" : "#555" }}>All</button>
        {STAGES.map(s => (
          <button key={s.id} onClick={() => setActiveStage(s.id)} style={{ ...styles.stagePill, background: activeStage === s.id ? s.bg : "transparent", color: activeStage === s.id ? s.color : "#555", borderColor: activeStage === s.id ? s.color : "#2a2a2a" }}>{s.days}</button>
        ))}
      </div>

      {/* ── Day List ── */}
      <div style={{ marginTop: 20 }}>
        {ALL_DAYS.filter(d => !activeStage || (d >= STAGES.find(s=>s.id===activeStage).range[0] && d <= STAGES.find(s=>s.id===activeStage).range[1])).map(day => {
          const data = dayData[day];
          const isOpen = openDay === day;
          const stage = getStage(day);
          const isArtist = user?.is_artist;
          const isLocked = day > currentHealingDay;

          return (
            <div key={day} id={`day-${day}`} style={{ marginBottom: 10 }}>
              <button 
                onClick={() => !isLocked && setOpenDay(isOpen ? null : day)} 
                disabled={isLocked}
                style={{ 
                  ...styles.dayHeader, 
                  borderLeftColor: isLocked ? "#222" : stage.color, 
                  background: isOpen ? "#1a1a1a" : "#121212",
                  opacity: isLocked ? 0.3 : 1,
                  cursor: isLocked ? "not-allowed" : "pointer"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ 
                    ...styles.dayCircle, 
                    borderColor: isLocked ? "#222" : (data.id ? stage.color : "#333"), 
                    color: isLocked ? "#222" : (data.id ? stage.color : "#555") 
                  }}>
                    {isLocked ? <Lock size={12} /> : day}
                  </div>
                  <div>
                    <span style={{ fontSize: 13, color: isLocked ? "#444" : "#fff", fontWeight: 500 }}>Day {day}</span>
                    {savingDay === day && <span style={{ fontSize: 10, color: "#666", marginLeft: 8 }}>Saving...</span>}
                    {data.feedback && !isOpen && <span style={{ fontSize: 9, background: "#1D9E75", padding: "2px 6px", borderRadius: 10, marginLeft: 8 }}>New Feedback</span>}
                    {isLocked && <span style={{ fontSize: 9, color: "#444", marginLeft: 8 }}>Unlocks in {day - currentHealingDay} {day - currentHealingDay === 1 ? 'day' : 'days'}</span>}
                  </div>
                </div>
                {!isLocked && (isOpen ? <ChevronUp size={16} color="#555" /> : <ChevronDown size={16} color="#555" />)}
              </button>

              {isOpen && !isLocked && (
                <div style={styles.dayBody}>
                  {data.artistNote && (
                    <div style={styles.artistInstructions}>
                      <ShieldCheck size={14} color="#EF9F27" />
                      <p>{data.artistNote}</p>
                    </div>
                  )}

                  <PainSlider dayKey={day} value={data.pain} onChange={handlePainChange} disabled={isArtist} />
                  <SymptomChecklist dayKey={day} checked={data.symptoms} onToggle={handleSymptomToggle} disabled={isArtist} />
                  <PhotoUpload dayKey={day} photos={data.photos} onAdd={handlePhotoAdd} onPreview={setActiveImage} disabled={isArtist} />

                  <div style={{ marginTop: 15 }}>
                    <p style={styles.sectionLabel}>Client Notes</p>
                    {isArtist ? (
                      <p style={styles.staticNote}>{data.note || "No notes from client."}</p>
                    ) : (
                      <textarea
                        style={styles.textarea}
                        placeholder="Log any observations..."
                        value={data.note}
                        onChange={(e) => handleNoteChange(day, e.target.value)}
                        onBlur={() => handleNoteBlur(day)}
                      />
                    )}
                  </div>

                  {/* Artist Feedback Section */}
                  <div style={{ marginTop: 15, borderTop: "1px solid #222", paddingTop: 15 }}>
                    <p style={styles.sectionLabel}>Artist Feedback</p>
                    {isArtist ? (
                      <div style={{ position: "relative" }}>
                        <textarea
                          style={{ ...styles.textarea, borderColor: feedbackLoading === data.id ? "#EF9F27" : "#2a2a2a" }}
                          placeholder="Give feedback on this day's progress..."
                          defaultValue={data.feedback}
                          onBlur={(e) => data.id && saveArtistFeedback(day, data.id, e.target.value)}
                        />
                        {feedbackLoading === data.id && <span style={styles.savingBadge}>Saving...</span>}
                      </div>
                    ) : (
                      <div style={styles.feedbackBubble}>
                         {data.feedback ? (
                           <p style={{ margin: 0 }}>{data.feedback}</p>
                         ) : (
                           <p style={{ margin: 0, color: "#555", fontStyle: "italic" }}>Awaiting feedback...</p>
                         )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Chat Float ── */}
      <button onClick={() => setShowChat(!showChat)} style={styles.chatToggle}>
        <MessageSquare size={24} />
      </button>

      {showChat && (
        <div style={styles.chatWindow}>
          <div style={styles.chatHeader}>
            <span style={{ fontWeight: 600 }}>Healing Message Center</span>
            <button onClick={() => setShowChat(false)} style={{ background: "none", border: "none" }}><X size={20} color="#888" /></button>
          </div>
          <div style={styles.messageList}>
            {messages.length === 0 && <p style={{ textAlign: "center", color: "#555", marginTop: 40, fontSize: 13 }}>No messages yet. Start the conversation!</p>}
            {messages.map((m, i) => {
              const isMine = m.sender_name === user?.username;
              return (
                <div key={i} style={{ ...styles.msgWrapper, alignSelf: isMine ? "flex-end" : "flex-start" }}>
                  <div style={{ ...styles.msgBubble, background: isMine ? "#1D9E75" : "#222" }}>
                    <span style={styles.senderName}>{m.sender_name} {m.is_artist && <ShieldCheck size={10} style={{ display: 'inline' }} />}</span>
                    <p style={{ margin: "4px 0 0" }}>{m.message}</p>
                  </div>
                  <span style={styles.msgTime}>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>
          <div style={styles.chatInputRow}>
            <input
              style={styles.chatInput}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Ask a question..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage} style={styles.sendBtn}><Send size={18} /></button>
          </div>
        </div>
      )}

      {/* ── Image Modal ── */}
      {activeImage && (
        <div style={styles.modalOverlay} onClick={() => setActiveImage(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={() => setActiveImage(null)}><X size={32} /></button>
            <img src={activeImage} alt="Full view" style={styles.modalImg} />
          </div>
        </div>
      )}
    </div>
  );

  function handleSymptomToggle(day, s) {
    const cur = dayData[day].symptoms;
    const next = cur.includes(s) ? cur.filter(x => x !== s) : [...cur, s];
    setDayData(prev => ({ ...prev, [day]: { ...prev[day], symptoms: next } }));
    saveLog(day, { symptoms: next });
  }
  function handlePainChange(day, v) {
    setDayData(prev => ({ ...prev, [day]: { ...prev[day], pain: v } }));
    saveLog(day, { pain: v });
  }
  function handleNoteChange(day, v) {
    setDayData(prev => ({ ...prev, [day]: { ...prev[day], note: v } }));
  }
  function handleNoteBlur(day) {
    saveLog(day, { note: dayData[day].note });
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  root: { fontFamily: "'Inter', sans-serif", background: "#0e0e0e", minHeight: "100vh", color: "#ddd", padding: "30px 20px", maxWidth: 600, margin: "0 auto", position: "relative" },
  header: { marginBottom: 30 },
  title: { margin: 0, fontSize: 26, fontWeight: 800, color: "#fff" },
  subtitle: { margin: "4px 0 0", color: "#666", fontSize: 14 },
  progressRing: { position: "relative", width: 56, height: 56 },
  progressLabel: { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1 },
  stagePills: { display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10 },
  stagePill: { padding: "6px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: "transparent", border: "1px solid #222", cursor: "pointer", transition: "all 0.2s" },
  dayHeader: { width: "100%", padding: "14px 18px", border: "1px solid #222", borderLeft: "4px solid transparent", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.2s" },
  dayCircle: { width: 30, height: 30, borderRadius: "50%", border: "2px solid", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 },
  dayBody: { background: "#111", border: "1px solid #222", borderTop: "none", borderRadius: "0 0 10px 10px", padding: "20px", marginTop: -2 },
  sectionLabel: { fontSize: 11, fontWeight: 700, color: "#444", textTransform: "uppercase", marginBottom: 10 },
  artistInstructions: { background: "#1a160d", border: "1px solid #3a3010", padding: "12px", borderRadius: 8, display: "flex", gap: 10, marginBottom: 15, fontSize: 13, color: "#ccc" },
  textarea: { width: "100%", background: "#0c0c0c", border: "1px solid #2a2a2a", borderRadius: 8, color: "#eee", padding: "12px", fontSize: 13, resize: "none", boxSizing: "border-box" },
  staticNote: { margin: 0, padding: "12px", background: "#0c0c0c", borderRadius: 8, color: "#888", fontSize: 13, fontStyle: "italic" },
  feedbackBubble: { background: "#171a1d", border: "1px solid #2b3238", padding: "12px", borderRadius: "0 12px 12px 12px", fontSize: 13, color: "#99aebb" },
  symptomTag: { padding: "5px 12px", borderRadius: 20, fontSize: 11, border: "1px solid #333" },
  photoThumb: { width: 80, height: 80, borderRadius: 10, border: "1px solid #333", cursor: "pointer", position: "relative", overflow: "hidden", transition: "transform 0.2s" },
  zoomOverlay: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" },
  photoUploadBtn: { width: 80, height: 80, borderRadius: 10, border: "2px dashed #333", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#555" },
  chatToggle: { position: "fixed", bottom: 30, right: 30, width: 60, height: 60, borderRadius: "50%", background: "#EF9F27", border: "none", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 10px 25px rgba(0,0,0,0.5)", zIndex: 100 },
  chatWindow: { position: "fixed", bottom: 100, right: 30, width: 350, height: 500, background: "#161616", border: "1px solid #333", borderRadius: 16, display: "flex", flexDirection: "column", overflow: "hidden", zIndex: 100, boxShadow: "0 15px 40px rgba(0,0,0,0.8)" },
  chatHeader: { padding: "16px", background: "#222", borderBottom: "1px solid #333", display: "flex", justifyContent: "space-between", alignItems: "center" },
  messageList: { flex: 1, padding: "16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 },
  msgWrapper: { display: "flex", flexDirection: "column", maxWidth: "80%" },
  msgBubble: { padding: "10px 14px", borderRadius: 14, fontSize: 13, color: "#fff" },
  senderName: { fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)" },
  msgTime: { fontSize: 9, color: "#555", marginTop: 4, alignSelf: "flex-end" },
  chatInputRow: { padding: "12px", background: "#222", display: "flex", gap: 10 },
  chatInput: { flex: 1, background: "#111", border: "1px solid #333", borderRadius: 8, color: "#fff", padding: "8px 12px", fontSize: 13 },
  sendBtn: { background: "#EF9F27", border: "none", borderRadius: 8, color: "#000", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  savingBadge: { position: "absolute", top: -15, right: 0, fontSize: 9, color: "#EF9F27" },
  errorBox: { color: "#fff", padding: "100px 40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" },
  retryBtn: { background: "#EF9F27", color: "#000", border: "none", padding: "10px 24px", borderRadius: 8, fontWeight: 700, cursor: "pointer", transition: "transform 0.2s" },
  backBtn: { display: "flex", alignItems: "center", gap: 8, color: "#555", textDecoration: "none", fontSize: 14, fontWeight: 600, margin: "0 auto" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  modalContent: { position: "relative", maxWidth: "90%", maxHeight: "90%", background: "#000", borderRadius: 12, overflow: "hidden" },
  modalImg: { maxWidth: "100%", maxHeight: "80vh", objectFit: "contain", display: "block" },
  modalClose: { position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", cursor: "pointer", width: 50, height: 50, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 },
};
