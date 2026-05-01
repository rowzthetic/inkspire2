import React, { useState, useRef } from 'react';
import './TattooAISuite.css';

export default function TattooAISuite() {
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'generate' | 'stencil'
  const [prompt, setPrompt] = useState("");
  
  const [skinFile, setSkinFile] = useState(null);
  const [tattooFile, setTattooFile] = useState(null);
  
  const [skinPreviewUrl, setSkinPreviewUrl] = useState("");
  const [tattooPreviewUrl, setTattooPreviewUrl] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultImage, setResultImage] = useState(null);

  const [isPositioning, setIsPositioning] = useState(false);
  const [posX, setPosX] = useState(50); // percent
  const [posY, setPosY] = useState(50); // percent
  const [scale, setScale] = useState(40); // percent width
  const [rotation, setRotation] = useState(0); // degrees
  
  const sandboxRef = useRef(null);
  const draggingRef = useRef(false);

  const skinInputRef = useRef(null);
  const tattooInputRef = useRef(null);

  const handleFileChange = (e, setFile, setPreview) => {
    const file = e.target.files[0];
    if (file) {
      setFile(file);
      setPreview(URL.createObjectURL(file));
      setResultImage(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, setFile, setPreview) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setFile(file);
      setPreview(URL.createObjectURL(file));
      setResultImage(null);
    }
  };

  // Drag mechanics for the sandbox
  const handlePointerDown = (e) => {
    draggingRef.current = true;
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!draggingRef.current || !sandboxRef.current) return;
    const rect = sandboxRef.current.getBoundingClientRect();
    
    // Calculate new position as percentage of sandbox
    let newX = ((e.clientX - rect.left) / rect.width) * 100;
    let newY = ((e.clientY - rect.top) / rect.height) * 100;

    // Constrain to sandbox borders roughly (0-100)
    newX = Math.max(0, Math.min(newX, 100));
    newY = Math.max(0, Math.min(newY, 100));

    setPosX(newX);
    setPosY(newY);
  };

  const handlePointerUp = (e) => {
    draggingRef.current = false;
    e.target.releasePointerCapture(e.pointerId);
  };

  const handleSubmit = async () => {
    setError(null);
    setResultImage(null);

    if (activeTab === 'generate' && !prompt.trim()) {
      setError("Please enter a prompt to generate a tattoo.");
      return;
    }
    if (activeTab === 'preview' && (!skinFile || !tattooFile)) {
      setError("Please upload both a body image and a tattoo design.");
      return;
    }
    if (activeTab === 'stencil' && !tattooFile) {
      setError("Please upload a tattoo design to convert into a stencil.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("mode", activeTab);
    
    if (activeTab === 'generate') {
      formData.append("prompt", prompt);
    } else if (activeTab === 'stencil') {
      formData.append("tattoo_image", tattooFile);
    } else {
      formData.append("skin_image", skinFile);
      formData.append("tattoo_image", tattooFile);
      
      // Append strictly calculated visual placement metrics
      formData.append("x_pos", posX);
      formData.append("y_pos", posY);
      formData.append("scale", scale);
      formData.append("rotation", rotation);
    }

    try {
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${BASE_URL}/api/tattoo-preview/`, {
        method: 'POST',
        // Optional: Include any auth tokens if needed here
        body: formData,
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (err) {
        throw new Error("Failed to parse server response correctly.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to process your request.");
      }

      if (data.image_url) {
        setResultImage(data.image_url);
      } else {
        throw new Error("The AI returned a successful response, but no image URL was found.");
      }

    } catch (err) {
      setError(err.message || "An unexpected error occurred during processing.");
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setResultImage(null);
    setError(null);
    setPrompt("");
    setSkinFile(null);
    setSkinPreviewUrl("");
    setTattooFile(null);
    setTattooPreviewUrl("");
  };

  return (
    <div className="ai-suite-container">
      <div className="ai-header">
        <h1 className="ai-title">Inkspire AI Suite</h1>
        <p className="ai-subtitle">Experience the magic of AI. Visualize your next masterpiece or create it from scratch.</p>
      </div>

      <div className="ai-tabs">
        <button 
          className={`ai-tab ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => { setActiveTab('preview'); setResultImage(null); setError(null); }}
        >
          Tattoo Skin Preview
        </button>
        <button 
          className={`ai-tab ${activeTab === 'generate' ? 'active' : ''}`}
          onClick={() => { setActiveTab('generate'); setResultImage(null); setError(null); }}
        >
          AI Design Generator
        </button>
        <button 
          className={`ai-tab ${activeTab === 'stencil' ? 'active' : ''}`}
          onClick={() => { setActiveTab('stencil'); setResultImage(null); setError(null); }}
        >
          AI Stencil Generator
        </button>
      </div>

      <div className="ai-content">
        {error && (
          <div className="ai-error-banner">
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading ? (
          <div className="ai-loader">
            <div className="spinner"></div>
            <h3>Weaving Digital Ink...</h3>
            <p style={{ color: '#888', marginTop: 10 }}>This may take a few seconds.</p>
          </div>
        ) : resultImage ? (
          <div className="ai-result-panel">
            <h2 style={{ marginBottom: 20 }}>Your Generated Artwork</h2>
            <img src={resultImage} alt="Generated Tattoo Result" className="ai-result-image" referrerPolicy="no-referrer" />
            <div style={{ marginTop: 20, display: 'flex', gap: 15, justifyContent: 'center' }}>
              <button className="ai-back-btn" onClick={() => setResultImage(null)}>
                Make Adjustments
              </button>
              <button 
                className="ai-submit-btn" 
                style={{ width: 'auto' }}
                onClick={async () => {
                  try {
                    const response = await fetch(resultImage, { referrerPolicy: "no-referrer" });
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `inkspire-tattoo-${Date.now()}.jpg`;
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(url);
                  } catch (e) {
                    const link = document.createElement('a');
                    link.href = resultImage;
                    link.target = '_blank';
                    link.rel = 'noreferrer';
                    link.click();
                  }
                }}
              >
                Download Masterpiece
              </button>
            </div>
          </div>
        ) : (
          <div>
            {activeTab === 'preview' && (
              <>
                {!skinPreviewUrl || !tattooPreviewUrl ? (
                  <div className="ai-upload-grid">
                    <div 
                      className="ai-dropzone"
                      onClick={() => skinInputRef.current.click()}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, setSkinFile, setSkinPreviewUrl)}
                    >
                      <input 
                        type="file" 
                        accept="image/*" 
                        ref={skinInputRef} 
                        onChange={(e) => handleFileChange(e, setSkinFile, setSkinPreviewUrl)}
                      />
                      {skinPreviewUrl ? (
                        <img src={skinPreviewUrl} className="ai-preview-image" alt="Skin target" />
                      ) : (
                        <>
                          <div className="ai-dropzone-icon">👤</div>
                          <div className="ai-dropzone-text">Click or drop Body/Skin Image</div>
                        </>
                      )}
                    </div>

                    <div 
                      className="ai-dropzone"
                      onClick={() => tattooInputRef.current.click()}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, setTattooFile, setTattooPreviewUrl)}
                    >
                      <input 
                        type="file" 
                        accept="image/*" 
                        ref={tattooInputRef} 
                        onChange={(e) => handleFileChange(e, setTattooFile, setTattooPreviewUrl)}
                      />
                      {tattooPreviewUrl ? (
                        <img src={tattooPreviewUrl} className="ai-preview-image" alt="Tattoo design" />
                      ) : (
                        <>
                          <div className="ai-dropzone-icon">✒️</div>
                          <div className="ai-dropzone-text">Click or drop Tattoo Design</div>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="ai-sandbox-container">
                    <h3 style={{ marginBottom: '15px', textAlign: 'center' }}>Drag to Position & Adjust Scale</h3>
                    
                    <div className="ai-sandbox" ref={sandboxRef} style={{ touchAction: 'none' }}>
                      <img src={skinPreviewUrl} alt="Skin Base" className="ai-sandbox-bg" />
                      <img 
                        src={tattooPreviewUrl} 
                        alt="Draggable Tattoo" 
                        className="ai-sandbox-draggable"
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        style={{
                          left: `${posX}%`,
                          top: `${posY}%`,
                          width: `${scale}%`,
                          transform: `translate(-50%, -50%) rotate(${rotation}deg)`
                        }}
                      />
                    </div>

                    <div className="ai-sandbox-controls">
                      <div className="ai-slider-group">
                        <label>Tattoo Scale: {scale}%</label>
                        <input type="range" min="10" max="150" value={scale} onChange={(e) => setScale(e.target.value)} />
                      </div>
                      <div className="ai-slider-group">
                        <label>Rotation: {rotation}°</label>
                        <input type="range" min="-180" max="180" value={rotation} onChange={(e) => setRotation(e.target.value)} />
                      </div>
                    </div>
                    
                    <button className="ai-back-btn" onClick={() => { setSkinPreviewUrl(null); setSkinFile(null); setTattooPreviewUrl(null); setTattooFile(null); }} style={{ marginTop: '10px', display: 'block', margin: '15px auto 0 auto' }}>
                      Clear & Upload New Images
                    </button>
                  </div>
                )}
              </>
            )}
            
            {activeTab === 'stencil' && (
              <div className="ai-upload-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '500px', margin: '0 auto' }}>
                <div 
                  className="ai-dropzone"
                  onClick={() => tattooInputRef.current.click()}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, setTattooFile, setTattooPreviewUrl)}
                >
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={tattooInputRef} 
                    onChange={(e) => handleFileChange(e, setTattooFile, setTattooPreviewUrl)}
                  />
                  {tattooPreviewUrl ? (
                    <img src={tattooPreviewUrl} className="ai-preview-image" alt="Stencil source" />
                  ) : (
                    <>
                      <div className="ai-dropzone-icon">📓</div>
                      <div className="ai-dropzone-text">Click or drop image to convert to Stencil</div>
                    </>
                  )}
                </div>
              </div>
            )}


            {activeTab === 'generate' && (
              <div className="ai-input-group">
                <textarea 
                  className="ai-input" 
                  rows="4"
                  placeholder="Describe the tattoo you want to create (e.g. A neo-traditional owl with glowing amber eyes)"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                ></textarea>
              </div>
            )}

            <button 
              className="ai-submit-btn" 
              onClick={handleSubmit}
              disabled={loading || (activeTab === 'preview' && (!skinFile || !tattooFile)) || (activeTab === 'generate' && !prompt.trim()) || (activeTab === 'stencil' && !tattooFile)}
            >
              {activeTab === 'preview' ? "Preview on Skin" : activeTab === 'stencil' ? "Generate Stencil" : "Generate Tattoo"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
