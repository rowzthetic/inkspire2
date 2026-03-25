import { useState, useRef, useCallback } from "react";
import { Upload, Sparkles, Heart, Download, X, AlertCircle, Wand2, Eye, ImageIcon, Loader2, Star } from "lucide-react";

// ─── Constants ───────────────────────────────────────────────────────────────

const API_KEY = import.meta.env.VITE_GOOGLE_AI_KEY;
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

const STYLE_PRESETS = [
  "Japanese Irezumi", "American Traditional", "Fine Line", "Blackwork",
  "Watercolor", "Neo-Traditional", "Geometric", "Realism",
];

const PROMPT_SUGGESTIONS = [
  "A lone wolf howling at a crescent moon with pine trees in the background",
  "A blooming lotus flower with sacred geometry patterns inside",
  "A compass rose with an anchor, traditional sailor style",
  "A phoenix rising from flames, Japanese style with bold colors",
  "Minimal fine-line mountain range with coordinates below",
  "A serpent coiled around a dagger with roses",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const fileToDataURL = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });

// ─── Drop Zone ───────────────────────────────────────────────────────────────

const DropZone = ({ label, hint, icon: Icon, file, preview, onFile, accent = "#D4AF37" }) => {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) onFile(f);
  }, [onFile]);

  return (
    <div
      onClick={() => inputRef.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      style={{
        flex: 1, minHeight: 240, borderRadius: 16, cursor: "pointer",
        border: `2px dashed ${dragging ? accent : file ? accent + "88" : "#2a2a2a"}`,
        background: dragging
          ? `${accent}08`
          : file
          ? "#111"
          : "rgba(255,255,255,0.01)",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 12, position: "relative",
        transition: "all 0.2s", overflow: "hidden",
      }}
    >
      <input
        ref={inputRef} type="file" accept="image/*" hidden
        onChange={(e) => { const f = e.target.files[0]; if (f) onFile(f); }}
      />

      {preview ? (
        <>
          <img src={preview} alt={label} style={{
            width: "100%", height: "100%", objectFit: "cover",
            position: "absolute", inset: 0, borderRadius: 14,
          }} />
          <div style={{
            position: "absolute", inset: 0, background: "linear-gradient(to top, #0e0e0ecc, transparent)",
            borderRadius: 14,
          }} />
          <div style={{
            position: "absolute", bottom: 14, left: 0, right: 0,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            <div style={{
              background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
              border: `1px solid ${accent}44`, borderRadius: 20,
              padding: "5px 14px", fontSize: 12, color: accent, fontWeight: 600,
            }}>
              ✓ {file.name.slice(0, 22)}{file.name.length > 22 ? "…" : ""}
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: `${accent}12`, border: `1px solid ${accent}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={22} color={accent} />
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#c8bfb0" }}>{label}</p>
            <p style={{ margin: 0, fontSize: 12, color: "#555" }}>{hint}</p>
          </div>
          <p style={{ margin: 0, fontSize: 11, color: "#3a3a3a" }}>
            Drag & drop or click to browse
          </p>
        </>
      )}
    </div>
  );
};

// ─── Error Banner ─────────────────────────────────────────────────────────────

const ErrorBanner = ({ message, onClose }) => (
  <div style={{
    background: "rgba(220,53,69,0.08)", border: "1px solid rgba(220,53,69,0.3)",
    borderRadius: 12, padding: "14px 18px", display: "flex", gap: 12, alignItems: "flex-start",
    marginBottom: 24,
  }}>
    <AlertCircle size={16} color="#dc3545" style={{ flexShrink: 0, marginTop: 1 }} />
    <p style={{ margin: 0, fontSize: 13, color: "#e07070", flex: 1, lineHeight: 1.5 }}>{message}</p>
    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#555", padding: 0 }}>
      <X size={14} />
    </button>
  </div>
);

// ─── Loading Ink Bottle ───────────────────────────────────────────────────────

const InkLoader = ({ progress = 0 }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "48px 0" }}>
    <svg width="64" height="96" viewBox="0 0 64 96">
      <defs>
        <clipPath id="bottle-clip">
          <path d="M20 20 L12 40 L8 96 L56 96 L52 40 L44 20 Z" />
        </clipPath>
      </defs>
      {/* Bottle outline */}
      <path d="M24 8 L24 20 L12 40 L8 90 L56 90 L52 40 L40 20 L40 8 Z"
        fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinejoin="round" />
      {/* Ink fill animated */}
      <rect
        x="8" y={90 - (progress * 50)} width="48" height={progress * 50}
        fill="#D4AF37" opacity="0.7" clipPath="url(#bottle-clip)"
        style={{ transition: "all 0.5s ease" }}
      />
      {/* Cap */}
      <rect x="22" y="2" width="20" height="10" rx="3" fill="#D4AF37" />
      {/* Label */}
      <rect x="16" y="52" width="32" height="22" rx="4"
        fill="none" stroke="#D4AF37" strokeWidth="1" opacity="0.4" />
      <text x="32" y="67" textAnchor="middle" fontSize="7" fill="#D4AF37" opacity="0.6">INK</text>
    </svg>
    <div style={{ textAlign: "center" }}>
      <p style={{ margin: "0 0 6px", fontSize: 15, color: "#D4AF37", fontWeight: 600 }}>
        {progress < 0.4 ? "Analysing images…"
          : progress < 0.7 ? "Applying tattoo to skin…"
          : "Adding finishing touches…"}
      </p>
      <p style={{ margin: 0, fontSize: 12, color: "#555" }}>
        Gemini Vision is working its magic
      </p>
    </div>
    <div style={{ width: 200, height: 3, background: "#1e1e1e", borderRadius: 2, overflow: "hidden" }}>
      <div style={{
        height: "100%", background: "linear-gradient(90deg, #8B6914, #D4AF37)",
        width: `${progress * 100}%`, transition: "width 0.5s ease", borderRadius: 2,
      }} />
    </div>
  </div>
);

// ─── Tab 1: Skin Preview ──────────────────────────────────────────────────────

const SkinPreviewTab = () => {
  const [bodyFile, setBodyFile] = useState(null);
  const [bodyPreview, setBodyPreview] = useState(null);
  const [designFile, setDesignFile] = useState(null);
  const [designPreview, setDesignPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleBodyFile = async (f) => {
    setBodyFile(f);
    setBodyPreview(await fileToDataURL(f));
    setResult(null);
  };

  const handleDesignFile = async (f) => {
    setDesignFile(f);
    setDesignPreview(await fileToDataURL(f));
    setResult(null);
  };

  const handlePreview = async () => {
    if (!bodyFile || !designFile) {
      setError("Please upload both a body part image and a tattoo design.");
      return;
    }
    if (!API_KEY) {
      setError("API key missing. Add VITE_GOOGLE_AI_KEY to your .env file.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(0);

    // Simulate progress
    const tick = setInterval(() => {
      setProgress(p => Math.min(p + 0.08, 0.9));
    }, 600);

    try {
      const [bodyB64, designB64] = await Promise.all([
        fileToBase64(bodyFile),
        fileToBase64(designFile),
      ]);

      const systemPrompt = `You are a professional tattoo visualization and digital compositing expert.
Your task is to create a photorealistic preview of a tattoo applied to skin.

Instructions:
1. Analyse the body part image — note skin tone, lighting direction, muscle contours, and any curves.
2. Take the tattoo design and digitally "apply" it to the skin surface.
3. Ensure the tattoo wraps realistically around muscle contours and curves.
4. Match the tattoo to the skin's lighting — add shadows where the design goes into shadow, highlights where light hits.
5. Use a multiply blend effect so the tattoo looks like real ink under the skin rather than a sticker on top.
6. Maintain skin texture visible through the tattoo.
7. Output ONLY the final composite image with the tattoo realistically on the skin. No text, no descriptions.`;

      const response = await fetch(
        `${GEMINI_API_BASE}/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: systemPrompt },
                { inline_data: { mime_type: bodyFile.type, data: bodyB64 } },
                { inline_data: { mime_type: designFile.type, data: designB64 } },
                { text: "Create a photorealistic preview of this tattoo design applied to this body part. Show the tattoo as real ink under the skin." },
              ],
            }],
            generationConfig: {
              responseModalities: ["IMAGE", "TEXT"],
              temperature: 0.4,
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `API error ${response.status}`);
      }

      // Extract image from response
      const parts = data.candidates?.[0]?.content?.parts || [];
      const imgPart = parts.find(p => p.inlineData?.mimeType?.startsWith("image/"));
      const textPart = parts.find(p => p.text);

      if (imgPart) {
        setResult({
          type: "image",
          src: `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`,
        });
      } else if (textPart) {
        // Fallback: Gemini described what it would do
        setResult({ type: "text", description: textPart.text });
      } else {
        throw new Error("No image returned from Gemini. Try a clearer body part photo.");
      }

      setProgress(1);
    } catch (err) {
      setError(
        err.message.includes("quota") ? "API quota exceeded. Check your Google AI usage limits." :
        err.message.includes("size") ? "Image too large. Please use images under 4MB." :
        err.message.includes("key") ? "Invalid API key. Check your VITE_GOOGLE_AI_KEY in .env." :
        err.message || "Something went wrong. Please try again."
      );
    } finally {
      clearInterval(tick);
      setLoading(false);
    }
  };

  const canPreview = bodyFile && designFile && !loading;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: "#f0ebe0" }}>
          AI Skin Preview
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: "#666" }}>
          Upload your body part and tattoo design — Gemini Vision will composite them realistically.
        </p>
      </div>

      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      {loading ? (
        <InkLoader progress={progress} />
      ) : result ? (
        <div style={{ animation: "fadeIn 0.4s ease" }}>
          <div style={{
            borderRadius: 16, overflow: "hidden", border: "1px solid #2a2a2a",
            background: "#111", marginBottom: 20,
          }}>
            {result.type === "image" ? (
              <img src={result.src} alt="Tattoo preview" style={{ width: "100%", display: "block" }} />
            ) : (
              <div style={{ padding: 28 }}>
                <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                  <Sparkles size={18} color="#D4AF37" />
                  <p style={{ margin: 0, fontSize: 13, color: "#888" }}>
                    Gemini described your preview (image generation unavailable for this model tier):
                  </p>
                </div>
                <p style={{ margin: 0, fontSize: 15, color: "#c8bfb0", lineHeight: 1.7,
                  background: "#1a1a1a", padding: 20, borderRadius: 10, fontStyle: "italic",
                  borderLeft: "3px solid #D4AF37" }}>
                  "{result.description}"
                </p>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {result.type === "image" && (
              <a href={result.src} download="tattoo-preview.png" style={{
                flex: 1, background: "#D4AF37", color: "#0e0e0e", border: "none",
                borderRadius: 10, padding: "12px 20px", fontWeight: 700, fontSize: 14,
                cursor: "pointer", textDecoration: "none", textAlign: "center",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                <Download size={16} /> Download Preview
              </a>
            )}
            <button onClick={() => { setResult(null); setBodyFile(null); setBodyPreview(null); setDesignFile(null); setDesignPreview(null); }}
              style={{ flex: 1, background: "transparent", border: "1px solid #2a2a2a",
                color: "#888", borderRadius: 10, padding: "12px 20px", fontWeight: 600,
                fontSize: 14, cursor: "pointer" }}>
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <DropZone
              label="Body Part Photo" hint="Arm, leg, chest, back…"
              icon={ImageIcon} file={bodyFile} preview={bodyPreview}
              onFile={handleBodyFile} accent="#D4AF37"
            />
            <div style={{ display: "flex", alignItems: "center", color: "#333", fontSize: 20, fontWeight: 200 }}>+</div>
            <DropZone
              label="Tattoo Design" hint="PNG with white/transparent bg"
              icon={Wand2} file={designFile} preview={designPreview}
              onFile={handleDesignFile} accent="#9b59b6"
            />
          </div>

          {/* Tips */}
          <div style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.15)",
            borderRadius: 12, padding: "14px 18px", marginBottom: 24 }}>
            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#D4AF37",
              textTransform: "uppercase", letterSpacing: "0.08em" }}>💡 Tips for best results</p>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {[
                "Use well-lit body photos with clear skin texture",
                "Tattoo designs with white or transparent backgrounds work best",
                "Keep images under 4MB for faster processing",
                "Higher resolution = more realistic output",
              ].map((tip, i) => (
                <li key={i} style={{ fontSize: 12, color: "#666", marginBottom: 4, lineHeight: 1.5 }}>{tip}</li>
              ))}
            </ul>
          </div>

          <button onClick={handlePreview} disabled={!canPreview} style={{
            width: "100%", padding: "16px 24px",
            background: canPreview
              ? "linear-gradient(135deg, #8B6914 0%, #D4AF37 50%, #8B6914 100%)"
              : "#1a1a1a",
            border: canPreview ? "none" : "1px solid #2a2a2a",
            borderRadius: 12, color: canPreview ? "#0e0e0e" : "#333",
            fontWeight: 800, fontSize: 15, cursor: canPreview ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            backgroundSize: "200% 100%", transition: "all 0.2s",
          }}>
            <Eye size={18} />
            Preview Tattoo on Skin
          </button>
        </>
      )}
    </div>
  );
};

// ─── Tab 2: Design Generator ──────────────────────────────────────────────────

const DesignGeneratorTab = () => {
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) { setError("Please describe your tattoo idea."); return; }
    if (!API_KEY) { setError("API key missing. Add VITE_GOOGLE_AI_KEY to your .env file."); return; }

    setLoading(true);
    setError(null);

    const enhancedPrompt = [
      "Professional tattoo flash art",
      "clean crisp black outlines",
      "high contrast",
      "white background",
      "masterpiece quality",
      "tattoo design sheet",
      selectedStyle ? `${selectedStyle} style` : "",
      prompt.trim(),
    ].filter(Boolean).join(", ");

    try {
      const response = await fetch(
        `${GEMINI_API_BASE}/models/imagen-3.0-generate-002:predict?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instances: [{ prompt: enhancedPrompt }],
            parameters: {
              sampleCount: 2,
              aspectRatio: "1:1",
              safetyFilterLevel: "block_some",
              personGeneration: "dont_allow",
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `API error ${response.status}`);
      }

      const predictions = data.predictions || [];
      if (!predictions.length) throw new Error("No images generated. Try a different prompt.");

      const newResults = predictions.map((p, i) => ({
        id: Date.now() + i,
        src: `data:image/png;base64,${p.bytesBase64Encoded}`,
        prompt: prompt.trim(),
        style: selectedStyle,
        enhancedPrompt,
      }));

      setResults(prev => [...newResults, ...prev]);
    } catch (err) {
      // Fallback: Use Gemini Flash to describe + generate via text-to-image workaround
      try {
        const fallbackResponse = await fetch(
          `${GEMINI_API_BASE}/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: `Generate a tattoo design image: ${enhancedPrompt}. Create a detailed tattoo artwork.` }],
              }],
              generationConfig: {
                responseModalities: ["IMAGE", "TEXT"],
                temperature: 0.9,
              },
            }),
          }
        );

        const fallbackData = await fallbackResponse.json();
        const parts = fallbackData.candidates?.[0]?.content?.parts || [];
        const imgPart = parts.find(p => p.inlineData?.mimeType?.startsWith("image/"));

        if (imgPart) {
          setResults(prev => [{
            id: Date.now(),
            src: `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`,
            prompt: prompt.trim(),
            style: selectedStyle,
            enhancedPrompt,
          }, ...prev]);
        } else {
          throw new Error(err.message);
        }
      } catch {
        setError(
          err.message.includes("quota") ? "API quota exceeded. Check your Google AI usage limits." :
          err.message.includes("billing") ? "Imagen requires billing enabled on your Google Cloud project." :
          err.message.includes("key") ? "Invalid API key. Check your VITE_GOOGLE_AI_KEY in .env." :
          err.message || "Generation failed. Try rephrasing your prompt."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (id) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: "#f0ebe0" }}>
          AI Design Generator
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: "#666" }}>
          Describe your dream tattoo and Gemini will generate professional flash art.
        </p>
      </div>

      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      {/* Style presets */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
        {STYLE_PRESETS.map(s => (
          <button key={s} onClick={() => setSelectedStyle(selectedStyle === s ? "" : s)} style={{
            background: selectedStyle === s ? "rgba(212,175,55,0.15)" : "transparent",
            border: `1px solid ${selectedStyle === s ? "#D4AF37" : "#2a2a2a"}`,
            color: selectedStyle === s ? "#D4AF37" : "#666",
            borderRadius: 20, padding: "5px 14px", fontSize: 12, cursor: "pointer",
            fontWeight: selectedStyle === s ? 700 : 400, transition: "all 0.15s",
          }}>{s}</button>
        ))}
      </div>

      {/* Prompt area */}
      <div style={{ position: "relative", marginBottom: 12 }}>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && e.metaKey) handleGenerate(); }}
          placeholder="Describe your dream tattoo... (e.g. A lone wolf howling at a crescent moon with pine trees)"
          rows={4}
          style={{
            width: "100%", background: "#111", border: "1px solid #2a2a2a",
            borderRadius: 12, padding: "16px", color: "#c8bfb0", fontSize: 14,
            resize: "none", outline: "none", boxSizing: "border-box",
            fontFamily: "system-ui", lineHeight: 1.6,
            transition: "border-color 0.2s",
          }}
          onFocus={e => e.target.style.borderColor = "#D4AF3744"}
          onBlur={e => e.target.style.borderColor = "#2a2a2a"}
        />
        <p style={{ position: "absolute", bottom: 12, right: 14,
          margin: 0, fontSize: 11, color: "#333" }}>⌘ + Enter to generate</p>
      </div>

      {/* Suggestions */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ margin: "0 0 8px", fontSize: 11, color: "#444",
          textTransform: "uppercase", letterSpacing: "0.08em" }}>Quick ideas</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {PROMPT_SUGGESTIONS.map((s, i) => (
            <button key={i} onClick={() => setPrompt(s)} style={{
              background: "transparent", border: "1px solid #1e1e1e",
              color: "#555", borderRadius: 8, padding: "4px 10px",
              fontSize: 11, cursor: "pointer", textAlign: "left",
              transition: "all 0.15s",
            }}
              onMouseEnter={e => { e.target.style.borderColor = "#D4AF3744"; e.target.style.color = "#888"; }}
              onMouseLeave={e => { e.target.style.borderColor = "#1e1e1e"; e.target.style.color = "#555"; }}
            >
              {s.slice(0, 38)}{s.length > 38 ? "…" : ""}
            </button>
          ))}
        </div>
      </div>

      <button onClick={handleGenerate} disabled={loading || !prompt.trim()} style={{
        width: "100%", padding: "16px 24px",
        background: prompt.trim() && !loading
          ? "linear-gradient(135deg, #8B6914 0%, #D4AF37 50%, #8B6914 100%)"
          : "#1a1a1a",
        border: prompt.trim() && !loading ? "none" : "1px solid #2a2a2a",
        borderRadius: 12,
        color: prompt.trim() && !loading ? "#0e0e0e" : "#333",
        fontWeight: 800, fontSize: 15,
        cursor: prompt.trim() && !loading ? "pointer" : "not-allowed",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        marginBottom: 32, transition: "all 0.2s",
      }}>
        {loading ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={18} />}
        {loading ? "Generating…" : "Generate Tattoo Design"}
      </button>

      {/* Gallery */}
      {results.length > 0 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#888",
              textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Generated Designs ({results.length})
            </p>
            {favorites.length > 0 && (
              <span style={{ fontSize: 12, color: "#D4AF37" }}>
                ★ {favorites.length} saved
              </span>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {results.map(r => (
              <div key={r.id} style={{
                background: "#111", border: "1px solid #1e1e1e", borderRadius: 14,
                overflow: "hidden", position: "relative",
                transition: "border-color 0.2s, transform 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e1e1e"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <img src={r.src} alt={r.prompt} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
                <div style={{ padding: "12px 14px" }}>
                  <p style={{ margin: "0 0 4px", fontSize: 12, color: "#888", lineHeight: 1.4 }}>
                    {r.prompt.slice(0, 60)}{r.prompt.length > 60 ? "…" : ""}
                  </p>
                  {r.style && (
                    <span style={{ fontSize: 10, color: "#D4AF37", background: "rgba(212,175,55,0.1)",
                      border: "1px solid rgba(212,175,55,0.2)", padding: "1px 7px", borderRadius: 10 }}>
                      {r.style}
                    </span>
                  )}
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button onClick={() => toggleFavorite(r.id)} style={{
                      flex: 1, background: favorites.includes(r.id) ? "rgba(212,175,55,0.1)" : "transparent",
                      border: `1px solid ${favorites.includes(r.id) ? "#D4AF37" : "#2a2a2a"}`,
                      color: favorites.includes(r.id) ? "#D4AF37" : "#555",
                      borderRadius: 8, padding: "7px", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                      fontSize: 12, fontWeight: 600, transition: "all 0.15s",
                    }}>
                      <Star size={12} fill={favorites.includes(r.id) ? "#D4AF37" : "none"} />
                      {favorites.includes(r.id) ? "Saved" : "Save"}
                    </button>
                    <a href={r.src} download={`inkspire-design-${r.id}.png`} style={{
                      flex: 1, background: "transparent", border: "1px solid #2a2a2a",
                      color: "#555", borderRadius: 8, padding: "7px",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                      fontSize: 12, fontWeight: 600, textDecoration: "none",
                      transition: "all 0.15s",
                    }}>
                      <Download size={12} /> Download
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && results.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎨</div>
          <p style={{ color: "#D4AF37", fontWeight: 600, fontSize: 15 }}>Creating your design…</p>
          <p style={{ color: "#555", fontSize: 13 }}>Gemini is crafting your tattoo flash art</p>
          <div style={{ width: 120, height: 2, background: "#1e1e1e", borderRadius: 2,
            margin: "20px auto 0", overflow: "hidden" }}>
            <div style={{
              height: "100%", width: "40%", background: "#D4AF37",
              borderRadius: 2, animation: "slide 1.5s ease-in-out infinite",
            }} />
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TattooAISuite() {
  const [activeTab, setActiveTab] = useState("preview");

  const tabs = [
    { id: "preview", label: "AI Skin Preview", icon: Eye, desc: "See it on your body" },
    { id: "generate", label: "AI Design Generator", icon: Sparkles, desc: "Create from imagination" },
  ];

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(350%); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0e0e0e; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
      `}</style>

      <div style={{
        minHeight: "100vh", background: "#0e0e0e", color: "#f0ebe0",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}>
        {/* Header */}
        <div style={{
          borderBottom: "1px solid #1a1a1a", padding: "40px 40px 32px",
          background: "radial-gradient(ellipse at 50% -20%, rgba(212,175,55,0.07) 0%, transparent 60%)",
        }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <p style={{ margin: "0 0 8px", fontSize: 11, color: "#D4AF37", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.2em" }}>Inkspire</p>
            <h1 style={{
              margin: "0 0 10px", fontFamily: "'Georgia', serif",
              fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, letterSpacing: "-1px",
              background: "linear-gradient(135deg, #f0ebe0 0%, #D4AF37 60%, #8B6914 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Tattoo AI Suite
            </h1>
            <p style={{ margin: 0, fontSize: 15, color: "#555", maxWidth: 500 }}>
              Powered by Google Gemini — visualise your design on skin or generate new flash art from imagination.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 40px 80px" }}>
          {/* Tab switcher */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 36 }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                background: activeTab === tab.id
                  ? "linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.05))"
                  : "#111",
                border: `1px solid ${activeTab === tab.id ? "#D4AF3766" : "#1e1e1e"}`,
                borderRadius: 14, padding: "18px 24px", cursor: "pointer", textAlign: "left",
                display: "flex", alignItems: "center", gap: 16, transition: "all 0.2s",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: activeTab === tab.id ? "rgba(212,175,55,0.15)" : "#1a1a1a",
                  border: `1px solid ${activeTab === tab.id ? "rgba(212,175,55,0.3)" : "#2a2a2a"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <tab.icon size={20} color={activeTab === tab.id ? "#D4AF37" : "#444"} />
                </div>
                <div style={{ textAlign: "left" }}>
                  <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700,
                    color: activeTab === tab.id ? "#f0ebe0" : "#666" }}>
                    {tab.label}
                  </p>
                  <p style={{ margin: 0, fontSize: 12,
                    color: activeTab === tab.id ? "#888" : "#444" }}>
                    {tab.desc}
                  </p>
                </div>
                {activeTab === tab.id && (
                  <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%",
                    background: "#D4AF37", flexShrink: 0 }} />
                )}
              </button>
            ))}
          </div>

          {/* API key warning */}
          {!API_KEY && (
            <div style={{
              background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)",
              borderRadius: 12, padding: "14px 18px", marginBottom: 24,
              display: "flex", gap: 10, alignItems: "center",
            }}>
              <AlertCircle size={16} color="#D4AF37" />
              <p style={{ margin: 0, fontSize: 13, color: "#b8980a" }}>
                Add <code style={{ background: "#1a1a1a", padding: "1px 6px", borderRadius: 4,
                  fontFamily: "monospace", fontSize: 12 }}>VITE_GOOGLE_AI_KEY=your_key</code> to your{" "}
                <code style={{ background: "#1a1a1a", padding: "1px 6px", borderRadius: 4,
                  fontFamily: "monospace", fontSize: 12 }}>.env</code> file to enable AI features.
              </p>
            </div>
          )}

          {/* Tab content */}
          <div style={{ animation: "fadeIn 0.3s ease" }} key={activeTab}>
            {activeTab === "preview" ? <SkinPreviewTab /> : <DesignGeneratorTab />}
          </div>
        </div>
      </div>
    </>
  );
}
