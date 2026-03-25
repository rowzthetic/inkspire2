import { useState } from "react";
import "../App.css";

export default function PriceEstimator() {
  // 1. UPDATED: State starts with empty strings so we know if user hasn't selected anything
  const [formData, setFormData] = useState({
    size: "",
    placement: "",
    complexity: "",
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
    // Clear error as soon as user selects something
    if (error) setError("");
  };

  const estimatePrice = async () => {
    // 2. NEW: Validation Check
    // If any field is empty, show error and stop.
    if (!formData.size || !formData.placement || !formData.complexity) {
        setError("Please fill in all the boxes to get an estimate.");
        return; 
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/price/estimate-price/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch (err) {
      console.error(err);
      setError("Server is not running. Please check your backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="price-estimator" style={{ padding: "50px 20px", textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
      <h2 style={{ color: "#e63946", marginBottom: "10px" }}>Tattoo Price Estimator</h2>
      <p style={{ color: "#ccc", marginBottom: "30px" }}>
        Get an instant quote based on our studio standards.
      </p>

      <div className="price-form" style={{ display: "flex", flexDirection: "column", gap: "15px", textAlign: "left" }}>
        
        {/* SIZE INPUT */}
        <label>Tattoo Size:</label>
        <select id="size" value={formData.size} onChange={handleChange} className="input-field" style={{ padding: '10px' }}>
          {/* 3. NEW: Default disabled option */}
          <option value="" disabled>-- Select Size --</option>
          <option value="small">Small (1-3 inches)</option>
          <option value="medium">Medium (4-6 inches)</option>
          <option value="large">Large (7-10 inches)</option>
          <option value="xlarge">Extra Large (Sleeve/Back)</option>
        </select>

        {/* PLACEMENT INPUT */}
        <label>Placement:</label>
        <select id="placement" value={formData.placement} onChange={handleChange} className="input-field" style={{ padding: '10px' }}>
          <option value="" disabled>-- Select Placement --</option>
          <option value="arm">Arm</option>
          <option value="leg">Leg</option>
          <option value="chest">Chest</option>
          <option value="back">Back</option>
          <option value="neck">Neck</option>
          <option value="ribs">Ribs</option>
          <option value="stomach">Stomach</option>
        </select>

        {/* COMPLEXITY INPUT */}
        <label>Design Complexity:</label>
        <select id="complexity" value={formData.complexity} onChange={handleChange} className="input-field" style={{ padding: '10px' }}>
          <option value="" disabled>-- Select Complexity --</option>
          <option value="simple">Simple (Line Work)</option>
          <option value="moderate">Moderate (Shading)</option>
          <option value="complex">Complex (Color / Realism)</option>
        </select>

        <button 
          onClick={estimatePrice} 
          className="btn" 
          disabled={loading}
          style={{ marginTop: "20px" }}
        >
          {loading ? "Calculating..." : "Get Estimate"}
        </button>
      </div>

      {/* --- RESULTS SECTION --- */}
      {/* Error message is now styled to look like a warning box */}
      {error && (
        <div style={{ 
            marginTop: "20px", 
            padding: "10px", 
            backgroundColor: "#ffe6e6", 
            color: "#d8000c", 
            border: "1px solid #d8000c", 
            borderRadius: "5px",
            fontWeight: "bold"
        }}>
            ⚠️ {error}
        </div>
      )}

      {result && (
        <div style={{ 
          marginTop: "30px", 
          padding: "20px", 
          background: "#222", 
          borderRadius: "10px", 
          borderLeft: "5px solid #e63946" 
        }}>
          <h3 style={{ color: "#fff", margin: 0 }}>
            Estimated Price: <span style={{ color: "#e63946" }}>${result.estimated_price}</span>
          </h3>
          <p style={{ color: "#ccc", marginTop: "10px" }}>{result.message}</p>
          
          {result.pain_level && (
            <p style={{ color: "#bbb", fontSize: "0.9rem" }}>
              Pain Level: {result.pain_level}/10
            </p>
          )}
        </div>
      )}
    </div>
  );
}