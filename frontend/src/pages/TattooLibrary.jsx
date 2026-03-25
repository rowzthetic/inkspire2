// import React, { useState, useEffect } from 'react';
// import { Search } from 'lucide-react'; // Make sure you have lucide-react installed

// const TattooLibrary = () => {
//   const [meanings, setMeanings] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [selectedItem, setSelectedItem] = useState(null); // For the popup modal

//   // 1. Fetch data from your new Backend API
//   useEffect(() => {
//     const fetchLibrary = async () => {
//       try {
//         // If search is empty, fetch all. If not, append ?search=...
//         const url = searchTerm 
//           ? `http://127.0.0.1:8000/api/library/?search=${searchTerm}`
//           : 'http://127.0.0.1:8000/api/library/';
        
//         const res = await fetch(url);
//         const data = await res.json();
//         setMeanings(data);
//         setLoading(false);
//       } catch (error) {
//         console.error("Error fetching library:", error);
//         setLoading(false);
//       }
//     };

//     // specific delay so it doesn't search on every single keystroke immediately
//     const delayDebounce = setTimeout(() => {
//       fetchLibrary();
//     }, 300);

//     return () => clearTimeout(delayDebounce);
//   }, [searchTerm]);

//   return (
//     <div className="min-h-screen bg-gray-50 p-8">
//       {/* Header Section */}
//       <div className="text-center mb-12">
//         <h1 className="text-4xl font-bold text-gray-900 mb-4">Tattoo Meaning Library</h1>
//         <p className="text-gray-600 mb-8">Discover the symbolism behind the ink.</p>
        
//         {/* Search Bar */}
//         <div className="relative max-w-xl mx-auto">
//           <input 
//             type="text"
//             placeholder="Search for 'Rose', 'Anchor', 'Strength'..."
//             className="w-full p-4 pl-12 rounded-full border border-gray-300 shadow-sm focus:ring-2 focus:ring-purple-500 outline-none"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//           <Search className="absolute left-4 top-4 text-gray-400" />
//         </div>
//       </div>

//       {/* Grid Display */}
//       {loading ? (
//         <p className="text-center">Loading Library...</p>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
//           {meanings.map((item) => (
//             <div 
//               key={item.id} 
//               onClick={() => setSelectedItem(item)}
//               className="bg-white rounded-xl shadow hover:shadow-lg transition cursor-pointer overflow-hidden border border-gray-100 group"
//             >
//               {/* Image Area */}
//               <div className="h-48 bg-gray-200 overflow-hidden">
//                 {item.image ? (
//                   <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
//                 ) : (
//                   <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
//                 )}
//               </div>
              
//               {/* Text Area */}
//               <div className="p-4">
//                 <h3 className="text-xl font-bold text-gray-800">{item.title}</h3>
//                 <p className="text-gray-500 text-sm mt-1 truncate">{item.meaning}</p>
                
//                 {/* Tags */}
//                 <div className="mt-3 flex flex-wrap gap-2">
//                   {item.tags.split(',').slice(0, 2).map((tag, idx) => (
//                     <span key={idx} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
//                       {tag.trim()}
//                     </span>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Modal Popup for Details */}
//       {selectedItem && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white rounded-lg max-w-2xl w-full p-6 relative">
//             <button 
//               onClick={() => setSelectedItem(null)}
//               className="absolute top-4 right-4 text-gray-500 hover:text-black text-xl font-bold"
//             >
//               ✕
//             </button>
            
//             <h2 className="text-3xl font-bold mb-4">{selectedItem.title}</h2>
            
//             <div className="flex gap-6 flex-col md:flex-row">
//               {selectedItem.image && (
//                 <img src={selectedItem.image} alt={selectedItem.title} className="w-full md:w-1/2 rounded-lg object-cover" />
//               )}
//               <div className="flex-1">
//                 <h4 className="font-bold text-gray-700 mb-2">Meaning & Symbolism:</h4>
//                 <p className="text-gray-600 leading-relaxed whitespace-pre-line">
//                   {selectedItem.meaning}
//                 </p>
                
//                 <div className="mt-6 pt-4 border-t">
//                     <span className="text-sm font-semibold text-gray-500">Tags: </span>
//                     <span className="text-sm text-purple-600">{selectedItem.tags}</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default TattooLibrary;


import { useState, useMemo } from "react";
import { Search, X, BookOpen, MapPin, Sparkles, ChevronRight, AlertTriangle, Send, RotateCcw } from "lucide-react";

// ─── Dataset ────────────────────────────────────────────────────────────────

const SYMBOLS = [
  {
    id: 1, name: "Lion", culture: "American Traditional", emoji: "🦁",
    color: "#C9A84C",
    tags: ["strength", "courage", "leadership", "power", "pride", "royalty"],
    placements: ["chest", "back", "upperarm", "thigh"],
    sensitive: false,
    history: "Lions have been tattooed since ancient Egypt, symbolising divine power and protection across civilisations.",
    meaning: "Represents raw courage, fierce protectiveness, and the will to lead. Often chosen at life's turning points.",
    bestPlacement: "Chest or upper back — allows the mane to breathe and the face to command presence.",
    aiKeywords: ["strength", "courage", "power", "leadership", "fierce"],
  },
  {
    id: 2, name: "Phoenix", culture: "Japanese (Irezumi)", emoji: "🔥",
    color: "#E05C2A",
    tags: ["rebirth", "transformation", "resilience", "new beginnings", "fire", "hope"],
    placements: ["back", "shoulder", "thigh", "chest"],
    sensitive: false,
    history: "In Japanese Irezumi tradition, the Hō-ō (phoenix) is one of the four sacred creatures, symbolising the south and summer.",
    meaning: "Rising from ashes — the ultimate symbol of transformation, surviving hardship, and beginning again stronger.",
    bestPlacement: "Full back or thigh — the sweeping wings demand space to tell their story.",
    aiKeywords: ["rebirth", "transformation", "new beginnings", "resilience", "fire"],
  },
  {
    id: 3, name: "Snake", culture: "American Traditional", emoji: "🐍",
    color: "#4A7C59",
    tags: ["wisdom", "temptation", "rebirth", "duality", "healing", "mystery"],
    placements: ["forearm", "upperarm", "calf", "back"],
    sensitive: false,
    history: "Snake tattoos appear across Greek (Asclepius), Norse, and Indigenous cultures — simultaneously feared and revered.",
    meaning: "Duality incarnate: poison and cure, temptation and wisdom, death and renewal. The serpent knows all secrets.",
    bestPlacement: "Forearm or calf — the natural curve of the limb mimics the serpent's sinuous movement.",
    aiKeywords: ["wisdom", "duality", "mystery", "healing", "temptation"],
  },
  {
    id: 4, name: "Rose", culture: "American Traditional", emoji: "🌹",
    color: "#C0392B",
    tags: ["love", "beauty", "passion", "loss", "balance", "femininity"],
    placements: ["forearm", "chest", "shoulder", "ankle"],
    sensitive: false,
    history: "The American Traditional rose was popularised by Sailor Jerry in the early 20th century as a token of love at sea.",
    meaning: "Beauty married to pain — the thorns are as important as the bloom. Represents love's joy and its inevitable sacrifice.",
    bestPlacement: "Inner forearm or chest — intimate placement honours its emotional weight.",
    aiKeywords: ["love", "beauty", "passion", "loss", "balance"],
  },
  {
    id: 5, name: "Compass", culture: "American Traditional", emoji: "🧭",
    color: "#2980B9",
    tags: ["guidance", "travel", "direction", "adventure", "finding your way", "new beginnings"],
    placements: ["forearm", "chest", "back", "upperarm"],
    sensitive: false,
    history: "Sailors tattooed compasses as talismans to ensure safe return home — a tradition stretching back centuries.",
    meaning: "You will always find your way. A reminder that direction comes from within, not from the world around you.",
    bestPlacement: "Inner forearm — visible to the wearer as a daily reminder to stay the course.",
    aiKeywords: ["guidance", "direction", "travel", "adventure", "finding your way"],
  },
  {
    id: 6, name: "Dagger", culture: "American Traditional", emoji: "🗡️",
    color: "#7F8C8D",
    tags: ["sacrifice", "betrayal", "protection", "courage", "swift justice", "strength"],
    placements: ["forearm", "calf", "chest", "upperarm"],
    sensitive: false,
    history: "Dagger tattoos were common among sailors and soldiers as symbols of readiness, sacrifice, and willingness to fight.",
    meaning: "Often paired with a rose or heart to signify love's darker side — sacrifice, loss, or betrayal survived.",
    bestPlacement: "Forearm or shin — the vertical blade echoes the limb's natural lines.",
    aiKeywords: ["sacrifice", "protection", "betrayal", "justice", "courage"],
  },
  {
    id: 7, name: "Lotus", culture: "Japanese (Irezumi)", emoji: "🪷",
    color: "#D98CB8",
    tags: ["enlightenment", "purity", "rebirth", "beauty", "spiritual growth", "overcoming"],
    placements: ["back", "chest", "shoulder", "ankle"],
    sensitive: true,
    history: "Sacred in Buddhism and Hinduism, the lotus rises from murky water to bloom in perfect purity — a metaphor for the spiritual path.",
    meaning: "You have risen. Through suffering, grief, or darkness — you have emerged unchanged in your beauty.",
    bestPlacement: "Upper back or chest — positioned near the heart, where spiritual transformation is felt most deeply.",
    aiKeywords: ["enlightenment", "purity", "rebirth", "overcoming", "spiritual"],
  },
  {
    id: 8, name: "Dragon", culture: "Japanese (Irezumi)", emoji: "🐉",
    color: "#16A085",
    tags: ["wisdom", "power", "protection", "balance", "freedom", "magic"],
    placements: ["back", "sleeve", "thigh", "chest"],
    sensitive: true,
    history: "Unlike Western dragons, the Japanese Ryū is a benevolent water deity — a guardian that bestows wisdom and good fortune.",
    meaning: "The dragon does not destroy — it protects. A symbol of wisdom earned through trial and the power to choose mercy.",
    bestPlacement: "Full sleeve or back — the dragon's serpentine body was made to wrap and flow across large canvases.",
    aiKeywords: ["wisdom", "power", "protection", "freedom", "magic"],
  },
  {
    id: 9, name: "Anchor", culture: "American Traditional", emoji: "⚓",
    color: "#1A5276",
    tags: ["stability", "home", "loyalty", "grounding", "family", "strength"],
    placements: ["forearm", "chest", "ankle", "upperarm"],
    sensitive: false,
    history: "The anchor is one of tattoo's oldest symbols — worn by sailors who had crossed the Atlantic as proof of the voyage.",
    meaning: "This is what holds me. Whether it is a person, a place, or a belief — the anchor declares what keeps you steady.",
    bestPlacement: "Forearm or chest — worn where it can be seen as a constant reminder of what grounds you.",
    aiKeywords: ["stability", "grounding", "home", "loyalty", "family"],
  },
  {
    id: 10, name: "Butterfly", culture: "Sacred Geometry", emoji: "🦋",
    color: "#8E44AD",
    tags: ["transformation", "freedom", "change", "beauty", "new beginnings", "joy"],
    placements: ["shoulder", "ankle", "back", "chest"],
    sensitive: false,
    history: "Across cultures from Greek (Psyche = soul/butterfly) to Japanese, the butterfly has always embodied the soul's transformation.",
    meaning: "You are not the same person you were. The butterfly is proof that total transformation is not only possible — it is beautiful.",
    bestPlacement: "Shoulder blade or ankle — delicate placements that honour the lightness of the symbol.",
    aiKeywords: ["transformation", "freedom", "change", "beauty", "new beginnings"],
  },
  {
    id: 11, name: "Owl", culture: "Nordic/Viking", emoji: "🦉",
    color: "#6E5A3A",
    tags: ["wisdom", "mystery", "knowledge", "intuition", "death", "truth"],
    placements: ["chest", "back", "upperarm", "thigh"],
    sensitive: false,
    history: "Associated with Athena in Greek myth and Odin's ravens in Norse lore — the owl is the keeper of hidden knowledge.",
    meaning: "You see what others cannot. The owl represents deep intuition, the ability to navigate darkness, and ancient knowing.",
    bestPlacement: "Chest or upper arm — the owl's gaze should face the wearer outward, watching the world.",
    aiKeywords: ["wisdom", "mystery", "knowledge", "intuition", "truth"],
  },
  {
    id: 12, name: "Moon", culture: "Sacred Geometry", emoji: "🌙",
    color: "#5D6D7E",
    tags: ["femininity", "cycles", "change", "mystery", "intuition", "time"],
    placements: ["ankle", "wrist", "shoulder", "chest"],
    sensitive: false,
    history: "Moon symbolism is universal — from ancient lunar goddesses to modern astronomy, it marks time and governs tides.",
    meaning: "Everything is cyclical. The moon reminds us that darkness is temporary and fullness always returns.",
    bestPlacement: "Ankle or wrist — intimate placements that honour the moon's quiet, personal influence.",
    aiKeywords: ["cycles", "change", "mystery", "intuition", "femininity", "time"],
  },
];

const CULTURES = ["All", "Japanese (Irezumi)", "American Traditional", "Nordic/Viking", "Sacred Geometry"];

const BODY_PARTS = [
  { id: "chest", label: "Chest", x: 95, y: 110, w: 60, h: 40 },
  { id: "back", label: "Back", x: 95, y: 110, w: 60, h: 60 },
  { id: "upperarm", label: "Upper Arm", x: 55, y: 105, w: 30, h: 35 },
  { id: "forearm", label: "Forearm", x: 40, y: 150, w: 25, h: 35 },
  { id: "thigh", label: "Thigh", x: 80, y: 220, w: 35, h: 45 },
  { id: "calf", label: "Calf", x: 80, y: 280, w: 28, h: 40 },
  { id: "shoulder", label: "Shoulder", x: 55, y: 88, w: 30, h: 25 },
  { id: "ankle", label: "Ankle", x: 86, y: 335, w: 22, h: 18 },
  { id: "sleeve", label: "Full Sleeve", x: 38, y: 90, w: 28, h: 100 },
  { id: "wrist", label: "Wrist", x: 32, y: 185, w: 22, h: 16 },
];

const AI_RESPONSES = [
  { keywords: ["travel", "journey", "adventure", "wanderlust", "explore"],
    response: "Your wandering spirit speaks clearly. I'd recommend the **Compass** — sailors carried it as a talisman for safe return, and it promises you'll always find your way home. Pair it with the **Anchor** to balance freedom with the people and places that ground you." },
  { keywords: ["loss", "grief", "death", "someone", "passed", "gone", "memorial"],
    response: "Grief is the price of deep love. The **Phoenix** rising from ash speaks to surviving what seemed unsurvivable. For something quieter, the **Moon** — its cycles mirror our own: darkness always gives way to returning light." },
  { keywords: ["strength", "strong", "overcome", "fight", "battle", "hard", "difficult"],
    response: "You've been through fire. The **Lion** carries the courage of someone who has faced their darkness and didn't look away. If your struggle involved inner transformation, the **Lotus** rising from murky water tells that story with breathtaking elegance." },
  { keywords: ["love", "heart", "relationship", "partner", "together", "bond"],
    response: "Love leaves marks. The **Rose** in American Traditional style captures beauty inseparable from pain — the thorns matter as much as the bloom. For something deeper, the **Anchor** declares: *this is what holds me.*" },
  { keywords: ["new", "start", "begin", "fresh", "change", "transform", "chapter"],
    response: "New chapters deserve permanent marks. The **Butterfly** is pure transformation — proof that total change is not only possible, it's beautiful. Or the **Phoenix**, for those whose new beginning was forged through something that had to end first." },
  { keywords: ["wisdom", "knowledge", "learn", "grow", "understand", "insight"],
    response: "The pursuit of wisdom is its own kind of courage. The **Owl** sees what others cannot — keeper of hidden knowledge across every culture that has ever looked up at the night sky. The **Dragon** (Japanese Ryū) adds depth: wisdom not as passive knowing, but as earned power." },
  { keywords: ["protect", "family", "home", "safe", "guard", "belong"],
    response: "What you protect defines you. The **Anchor** is tattooed by those who know exactly what — or who — keeps them steady. The **Dragon** as a Japanese guardian is a profound choice: it does not destroy, it watches over." },
];

const DEFAULT_AI = "I see your story in the symbols you're drawn to. Tell me more — describe a journey you've taken, a person you've lost, a strength you've found, or a transformation you've lived through. The right symbol is already somewhere in your story.";

// ─── Components ────────────────────────────────────────────────────────────

const CultureBadge = ({ culture }) => {
  const colors = {
    "Japanese (Irezumi)": { bg: "rgba(22,160,133,0.15)", border: "#16A085", text: "#1abc9c" },
    "American Traditional": { bg: "rgba(201,168,76,0.15)", border: "#C9A84C", text: "#f1c40f" },
    "Nordic/Viking": { bg: "rgba(108,122,137,0.15)", border: "#6C7A89", text: "#95a5a6" },
    "Sacred Geometry": { bg: "rgba(142,68,173,0.15)", border: "#8E44AD", text: "#9b59b6" },
  };
  const c = colors[culture] || { bg: "rgba(255,255,255,0.05)", border: "#444", text: "#aaa" };
  return (
    <span style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text,
      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
      letterSpacing: "0.05em", textTransform: "uppercase" }}>
      {culture}
    </span>
  );
};

const SymbolCard = ({ symbol, onClick }) => (
  <button onClick={() => onClick(symbol)} style={{
    background: "linear-gradient(145deg, #1a1a1a 0%, #111 100%)",
    border: `1px solid #2a2a2a`, borderRadius: 16, padding: 0,
    cursor: "pointer", textAlign: "left", overflow: "hidden",
    transition: "transform 0.2s, border-color 0.2s, box-shadow 0.2s",
    position: "relative",
  }}
    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = symbol.color; e.currentTarget.style.boxShadow = `0 12px 40px ${symbol.color}22`; }}
    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.boxShadow = "none"; }}
  >
    {/* Emoji hero */}
    <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center",
      background: `radial-gradient(circle at 50% 60%, ${symbol.color}18 0%, transparent 70%)`,
      fontSize: 56, position: "relative" }}>
      {symbol.emoji}
      {symbol.sensitive && (
        <div style={{ position: "absolute", top: 10, right: 10,
          background: "rgba(230,126,34,0.15)", border: "1px solid #e67e22",
          borderRadius: 6, padding: "2px 6px", display: "flex", alignItems: "center", gap: 4 }}>
          <AlertTriangle size={10} color="#e67e22" />
          <span style={{ fontSize: 9, color: "#e67e22", fontWeight: 700 }}>CULTURAL</span>
        </div>
      )}
    </div>
    {/* Info */}
    <div style={{ padding: "14px 16px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#f0ebe0",
          fontFamily: "'Georgia', serif", letterSpacing: "-0.3px" }}>{symbol.name}</h3>
        <ChevronRight size={16} color="#555" />
      </div>
      <CultureBadge culture={symbol.culture} />
      <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 4 }}>
        {symbol.tags.slice(0, 3).map(t => (
          <span key={t} style={{ fontSize: 10, background: "rgba(255,255,255,0.04)",
            border: "1px solid #2a2a2a", color: "#666", padding: "1px 7px", borderRadius: 10 }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  </button>
);

const Modal = ({ symbol, onClose, onBook }) => {
  if (!symbol) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 20, backdropFilter: "blur(8px)" }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#111", border: `1px solid ${symbol.color}44`,
        borderRadius: 20, maxWidth: 780, width: "100%", maxHeight: "90vh",
        overflow: "auto", display: "grid", gridTemplateColumns: "1fr 1.4fr",
        boxShadow: `0 40px 120px ${symbol.color}22`,
      }}>
        {/* Left: Visual */}
        <div style={{ background: `radial-gradient(circle at 50% 50%, ${symbol.color}20 0%, #0a0a0a 70%)`,
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: 40, borderRight: "1px solid #1e1e1e", gap: 16 }}>
          <div style={{ fontSize: 96 }}>{symbol.emoji}</div>
          <h2 style={{ margin: 0, fontSize: 32, fontWeight: 900, color: "#f0ebe0",
            fontFamily: "'Georgia', serif", textAlign: "center" }}>{symbol.name}</h2>
          <CultureBadge culture={symbol.culture} />
          {symbol.sensitive && (
            <div style={{ background: "rgba(230,126,34,0.1)", border: "1px solid #e67e2244",
              borderRadius: 10, padding: "10px 14px", display: "flex", gap: 8, alignItems: "flex-start" }}>
              <AlertTriangle size={14} color="#e67e22" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 11, color: "#e67e22", lineHeight: 1.5 }}>
                This symbol carries deep cultural significance. Please research its heritage before wearing it.
              </p>
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div style={{ padding: 36 }}>
          <button onClick={onClose} style={{ float: "right", background: "transparent",
            border: "none", color: "#555", cursor: "pointer", padding: 4 }}>
            <X size={20} />
          </button>

          <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 8 }}>
            {[
              { label: "History", text: symbol.history, icon: "📜" },
              { label: "Meaning", text: symbol.meaning, icon: "✦" },
              { label: "Best Placement", text: symbol.bestPlacement, icon: "📍" },
            ].map(({ label, text, icon }) => (
              <div key={label}>
                <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: symbol.color,
                  textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {icon} {label}
                </p>
                <p style={{ margin: 0, fontSize: 14, color: "#b0a89a", lineHeight: 1.7 }}>{text}</p>
              </div>
            ))}

            {/* Tags */}
            <div>
              <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#555",
                textTransform: "uppercase", letterSpacing: "0.08em" }}>Themes</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {symbol.tags.map(t => (
                  <span key={t} style={{ fontSize: 11, background: `${symbol.color}15`,
                    border: `1px solid ${symbol.color}33`, color: symbol.color,
                    padding: "3px 10px", borderRadius: 20 }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA */}
            <button onClick={() => onBook(symbol)} style={{
              background: `linear-gradient(135deg, ${symbol.color}, ${symbol.color}99)`,
              border: "none", borderRadius: 10, padding: "14px 20px",
              color: "#0a0a0a", fontWeight: 800, fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              letterSpacing: "0.02em", marginTop: 4,
            }}>
              <BookOpen size={16} />
              Book Artist with this Design
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Body Map ───────────────────────────────────────────────────────────────

const BodyMap = ({ activeBodyPart, onSelect }) => {
  const [view, setView] = useState("front");
  return (
    <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 16, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#555",
          textTransform: "uppercase", letterSpacing: "0.08em" }}>
          <MapPin size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
          Placement Map
        </p>
        <div style={{ display: "flex", gap: 4 }}>
          {["front", "back"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              background: view === v ? "#C9A84C22" : "transparent",
              border: `1px solid ${view === v ? "#C9A84C" : "#2a2a2a"}`,
              color: view === v ? "#C9A84C" : "#555",
              borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer",
              fontWeight: 600, textTransform: "capitalize",
            }}>{v}</button>
          ))}
        </div>
      </div>

      <svg viewBox="0 0 250 400" style={{ width: "100%", maxWidth: 180, display: "block", margin: "0 auto" }}>
        {/* Silhouette */}
        <g opacity="0.15" fill="#C9A84C">
          {/* Head */}
          <ellipse cx="125" cy="38" rx="28" ry="32" />
          {/* Neck */}
          <rect x="115" y="66" width="20" height="18" rx="4" />
          {/* Torso */}
          <rect x="80" y="84" width="90" height="110" rx="12" />
          {/* Left arm */}
          <rect x="48" y="88" width="30" height="100" rx="12" />
          {/* Right arm */}
          <rect x="172" y="88" width="30" height="100" rx="12" />
          {/* Left leg */}
          <rect x="83" y="198" width="36" height="150" rx="12" />
          {/* Right leg */}
          <rect x="131" y="198" width="36" height="150" rx="12" />
        </g>

        {/* Hotspots */}
        {BODY_PARTS.filter(p => view === "front"
          ? !["back"].includes(p.id)
          : !["chest", "forearm", "wrist"].includes(p.id)
        ).map(part => {
          const isActive = activeBodyPart === part.id;
          // Mirror x for back view
          const x = view === "back" ? 250 - part.x - part.w : part.x;
          return (
            <g key={part.id} style={{ cursor: "pointer" }} onClick={() => onSelect(activeBodyPart === part.id ? null : part.id)}>
              <rect x={x} y={part.y} width={part.w} height={part.h} rx={6}
                fill={isActive ? "#C9A84C" : "rgba(201,168,76,0.08)"}
                stroke={isActive ? "#C9A84C" : "rgba(201,168,76,0.3)"}
                strokeWidth={isActive ? 2 : 1}
                style={{ transition: "all 0.2s" }}
              />
              <text x={x + part.w / 2} y={part.y + part.h / 2 + 4}
                textAnchor="middle" fontSize="8"
                fill={isActive ? "#0a0a0a" : "#C9A84C"} fontWeight="700">
                {part.label.split(" ")[0]}
              </text>
            </g>
          );
        })}
      </svg>

      {activeBodyPart && (
        <div style={{ marginTop: 12, textAlign: "center" }}>
          <span style={{ fontSize: 11, color: "#C9A84C",
            background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)",
            padding: "4px 12px", borderRadius: 20 }}>
            Filtering: {BODY_PARTS.find(p => p.id === activeBodyPart)?.label}
          </span>
          <button onClick={() => onSelect(null)} style={{
            display: "block", margin: "8px auto 0", background: "transparent",
            border: "none", color: "#555", cursor: "pointer", fontSize: 11,
            display: "flex", alignItems: "center", gap: 4, margin: "8px auto 0",
          }}>
            <RotateCcw size={10} /> Clear
          </button>
        </div>
      )}
    </div>
  );
};

// ─── AI Consultant ───────────────────────────────────────────────────────────

const AIConsultant = ({ onSymbolHighlight }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "ai", text: DEFAULT_AI }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      const lower = userMsg.toLowerCase();
      const match = AI_RESPONSES.find(r => r.keywords.some(k => lower.includes(k)));
      const responseText = match
        ? match.response
        : `Your story carries weight. Based on what you've shared, I sense themes of **${lower.split(" ").slice(0, 3).join(", ")}**. The symbols that often resonate with journeys like yours are the **Phoenix** (transformation through fire) and the **Compass** (finding your own direction). Would you like to explore either of these?`;

      setMessages(prev => [...prev, { role: "ai", text: responseText }]);
      setLoading(false);
    }, 1200);
  };

  const renderText = (text) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1
        ? <strong key={i} style={{ color: "#C9A84C" }}>{part}</strong>
        : part
    );
  };

  return (
    <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 16,
      display: "flex", flexDirection: "column", height: 340 }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid #1e1e1e",
        display: "flex", alignItems: "center", gap: 8 }}>
        <Sparkles size={14} color="#C9A84C" />
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#C9A84C",
          textTransform: "uppercase", letterSpacing: "0.08em" }}>
          AI Symbolism Consultant
        </p>
        <span style={{ marginLeft: "auto", fontSize: 10, color: "#555",
          background: "#1a1a1a", padding: "2px 8px", borderRadius: 10 }}>
          UI Preview
        </span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px", display: "flex",
        flexDirection: "column", gap: 12 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "85%",
          }}>
            <div style={{
              background: msg.role === "user"
                ? "linear-gradient(135deg, #C9A84C22, #C9A84C11)"
                : "#1a1a1a",
              border: `1px solid ${msg.role === "user" ? "#C9A84C44" : "#2a2a2a"}`,
              borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              padding: "10px 14px",
              fontSize: 13, color: "#c8bfb0", lineHeight: 1.6,
            }}>
              {renderText(msg.text)}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: "flex-start", background: "#1a1a1a",
            border: "1px solid #2a2a2a", borderRadius: "16px 16px 16px 4px",
            padding: "10px 18px", fontSize: 20, letterSpacing: 4, color: "#C9A84C" }}>
            ···
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid #1e1e1e",
        display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder="Tell your story..."
          style={{ flex: 1, background: "#1a1a1a", border: "1px solid #2a2a2a",
            borderRadius: 10, padding: "8px 12px", color: "#c8bfb0", fontSize: 13,
            outline: "none", fontFamily: "inherit" }}
        />
        <button onClick={handleSend} style={{
          background: "#C9A84C", border: "none", borderRadius: 10,
          padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "center",
        }}>
          <Send size={14} color="#0a0a0a" />
        </button>
      </div>
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function TattooLibrary() {
  const [culture, setCulture] = useState("All");
  const [search, setSearch] = useState("");
  const [bodyPart, setBodyPart] = useState(null);
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    return SYMBOLS.filter(s => {
      if (culture !== "All" && s.culture !== culture) return false;
      if (bodyPart && !s.placements.includes(bodyPart)) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.tags.some(t => t.includes(q)) ||
          s.culture.toLowerCase().includes(q) ||
          s.meaning.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [culture, search, bodyPart]);

  const handleBook = (symbol) => {
    setSelected(null);
    window.location.href = `/appointment?style=${encodeURIComponent(symbol.name)}`;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f0ebe0",
      fontFamily: "'Georgia', 'Times New Roman', serif" }}>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1a1a1a", padding: "48px 40px 36px",
        background: "radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 60%)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <p style={{ margin: "0 0 8px", fontSize: 11, color: "#C9A84C", fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.2em", fontFamily: "system-ui" }}>
            Inkspire
          </p>
          <h1 style={{ margin: "0 0 12px", fontSize: "clamp(32px, 5vw, 56px)",
            fontWeight: 900, letterSpacing: "-1px", lineHeight: 1.1,
            background: "linear-gradient(135deg, #f0ebe0 0%, #C9A84C 50%, #8B6914 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Symbolism Library
          </h1>
          <p style={{ margin: 0, fontSize: 16, color: "#6b6560", maxWidth: 560, lineHeight: 1.6,
            fontFamily: "system-ui", fontWeight: 400 }}>
            Every mark carries a story older than memory. Explore 12 symbols across cultures,
            find your meaning, and book the artist who will make it permanent.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 40px 80px",
        display: "grid", gridTemplateColumns: "1fr 280px", gap: 32, alignItems: "start" }}>

        {/* Main column */}
        <div>
          {/* Culture filter */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            {CULTURES.map(c => (
              <button key={c} onClick={() => setCulture(c)} style={{
                background: culture === c ? "#C9A84C" : "transparent",
                border: `1px solid ${culture === c ? "#C9A84C" : "#2a2a2a"}`,
                color: culture === c ? "#0a0a0a" : "#888",
                borderRadius: 8, padding: "7px 16px", fontSize: 13, cursor: "pointer",
                fontWeight: culture === c ? 800 : 400, fontFamily: "system-ui",
                transition: "all 0.15s",
              }}>{c}</button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: "relative", marginBottom: 28 }}>
            <Search size={16} color="#555" style={{ position: "absolute", left: 14, top: "50%",
              transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder='Search by feeling: "strength", "new beginnings", "wisdom"...'
              style={{ width: "100%", background: "#111", border: "1px solid #2a2a2a",
                borderRadius: 10, padding: "11px 14px 11px 40px", color: "#c8bfb0",
                fontSize: 14, outline: "none", boxSizing: "border-box",
                fontFamily: "system-ui" }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: 12,
                top: "50%", transform: "translateY(-50%)", background: "transparent",
                border: "none", cursor: "pointer", color: "#555" }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Results count */}
          <p style={{ margin: "0 0 20px", fontSize: 12, color: "#555", fontFamily: "system-ui" }}>
            {filtered.length} symbol{filtered.length !== 1 ? "s" : ""} found
            {bodyPart && ` for ${BODY_PARTS.find(p => p.id === bodyPart)?.label}`}
            {culture !== "All" && ` in ${culture}`}
            {search && ` matching "${search}"`}
          </p>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#444" }}>
              <p style={{ fontSize: 40 }}>🔍</p>
              <p style={{ fontFamily: "system-ui" }}>No symbols found. Try a different search or filter.</p>
            </div>
          ) : (
            <div style={{ display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
              {filtered.map(s => <SymbolCard key={s.id} symbol={s} onClick={setSelected} />)}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, position: "sticky", top: 24 }}>
          <BodyMap activeBodyPart={bodyPart} onSelect={setBodyPart} />
          <AIConsultant />
        </div>
      </div>

      {/* Modal */}
      <Modal symbol={selected} onClose={() => setSelected(null)} onBook={handleBook} />
    </div>
  );
}
