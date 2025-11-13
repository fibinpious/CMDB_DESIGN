import React, { useState } from "react";
import "../Style/suggestionScreen.css";

const SuggestionScreen = () => {
  const [criteria] = useState([
    { name: "Server", description: "Physical or virtual server infrastructure components that host applications and services.", icon: "🖥️" },
    { name: "Database", description: "Database management systems and data storage solutions used by applications.", icon: "🗄️" },
    { name: "Application", description: "Software applications and services that provide business functionality to end users.", icon: "💻" },
    { name: "Network Device", description: "Network infrastructure components including routers, switches, and firewalls.", icon: "🌐" },
    { name: "Computer", description: "End-user computing devices including laptops, desktops, and workstations.", icon: "🧑‍💻" },
    { name: "Cloud Service", description: "Cloud-based services and infrastructure components hosted by external providers.", icon: "☁️" },
  ]);

  const scale = [
    { value: 1, label: "Equal" },
    { value: 3, label: "Moderate" },
    { value: 5, label: "Strong" },
    { value: 7, label: "Very Strong" },
    { value: 9, label: "Extreme" },
  ];
  const [criteriaList] = useState([
    { name: "Business Criticality", icon: "⚡" },
    { name: "Change Frequency", icon: "🔄" },
    { name: "Compliance Impact", icon: "📋" }
  ]);

  const [metrics] = useState({
    "Business Criticality": {
      description: "Measured as # of critical business services linked",
      values: {
        "Application": 120, "Database": 90, "Server": 50,
        "Network Device": 30, "Computer": 70, "Cloud Service": 85
      }
    },
    "Change Frequency": {
      description: "Measured as # of changes per quarter",
      values: {
        "Application": 400, "Database": 150, "Server": 600,
        "Network Device": 200, "Computer": 100, "Cloud Service": 250
      }
    },
    "Compliance Impact": {
      description: "Measured as # of regulatory controls mapped",
      values: {
        "Application": 40, "Database": 100, "Server": 20,
        "Network Device": 10, "Computer": 30, "Cloud Service": 55
      }
    }
  });

  const [matrix, setMatrix] = useState({});
  const totalComparisons = (criteria.length * (criteria.length - 1)) / 2;
  const [criteriaMatrix, setCriteriaMatrix] = useState({});
  const [normalizedWeights, setNormalizedWeights] = useState({});
  const [criteriaWeights, setCriteriaWeights] = useState({});
  const [finalPriorities, setFinalPriorities] = useState([]);
  const totalCriteriaComparisons = (criteriaList.length * (criteriaList.length - 1)) / 2;

 
  const calculatePriorities = () => {
    const n = criteria.length;
    const mat = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => {
        if (i === j) return 1;
        return matrix[`${i}-${j}`] || 1;
      })
    );
  
    // Step 1: Compute geometric mean for each row
    const geomMeans = mat.map((row) => {
      const product = row.reduce((acc, val) => acc * val, 1);
      return Math.pow(product, 1 / n);
    });
  
    // Step 2: Normalize the geometric means to get priority weights
    const sumGeom = geomMeans.reduce((a, b) => a + b, 0);
    const priorities = geomMeans.map((g) => g / sumGeom);
  
    // Step 3: Map priorities back to classes
    const result = criteria.map((c, i) => ({
      className: c.name,
      weight: priorities[i],
    }));
  
    return result;
  };
  
  const handleCriteriaChange = (i, j, val) => {
    const updated = { ...criteriaMatrix };
    updated[`${i}-${j}`] = val;
    updated[`${j}-${i}`] = 1 / val;
    setCriteriaMatrix(updated);
  };

  const handleChange = (i, j, val) => {
    const updated = { ...matrix };
    updated[`${i}-${j}`] = val;
    updated[`${j}-${i}`] = 1 / val; // reciprocal
    setMatrix(updated);

    const priorities = calculatePriorities(updated);
    console.log("Priority Weights:", priorities);
  };

  const handleBack = () => {
    window.history.back();
  }

  const completed = Object.keys(matrix).filter(
    (k) => !k.includes("-") || matrix[k] === undefined
  ).length / 2;

  return (
    <div className="suggestion-container">
      <h2 className="page-title">Review the suggested CI classes and complete the comparison matrix to proceed.</h2>

      {/* Suggested CI Classes */}
      <section className="suggested-section">
        <div className="header-row">
          <h3>Suggested CI Classes</h3>
          <p>{criteria.length} classes found</p>
        </div>

        <div className="class-grid">
          {criteria.map((c, i) => (
            <div key={i} className="class-card">
              <div className="class-header">
                <span className="class-icon">{c.icon}</span>
                <h4>{c.name}</h4>
                <span className="status">Active</span>
              </div>
              <p className="class-desc">{c.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AHP Comparison Matrix */}
      <section className="ahp-section">
        <h3> Comparison Matrix</h3>
        <p>
          Compare each pair of CI classes using the scale below. Higher values
          indicate stronger preference.
        </p>

        {/* Scale */}
        <div className="scale-row">
          {scale.map((s, i) => (
            <div key={i} className={`scale-box scale-${s.value}`}>
              <div className="scale-value">{s.value}</div>
              <div className="scale-label">{s.label}</div>
            </div>
          ))}
        </div>

        <section className="matrix-section">
        <h3>Step 1: Compare Criteria Importance</h3>

        <table className="matrix-table">
          <thead>
            <tr>
              <th></th>
              {criteriaList.map((c, i) => (
                <th key={i}>{c.icon} {c.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {criteriaList.map((row, i) => (
              <tr key={i}>
                <th>{row.icon} {row.name}</th>
                {criteriaList.map((col, j) => {
                  if (i === j) return <td key={j}>1</td>;
                  if (i > j) return <td key={j}>{criteriaMatrix[`${i}-${j}`]?.toFixed(3) || "-"}</td>;
                  return (
                    <td key={j}>
                      <select
                        value={criteriaMatrix[`${i}-${j}`] || ""}
                        onChange={(e) => handleCriteriaChange(i, j, Number(e.target.value))}
                      >
                        <option value="">-</option>
                        {scale.map((s) => (
                          <option key={s.value} value={s.value}>{s.value}</option>
                        ))}
                      </select>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
<section>
        {/* Matrix Table */}
        <div className="matrix-container">
          <h3>Step 2 : CI Class Metrics</h3>
          <table>
            <thead>
              <tr>
                <th></th>
                {criteria.map((c, i) => (
                  <th key={i}>{c.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {criteria.map((row, i) => (
                <tr key={i}>
                  <th>{row.name}</th>
                  {criteria.map((col, j) => {
                    if (i === j) return <td key={j}>1</td>;
                    if (i > j)
                      return (
                        <td key={j}>
                          {matrix[`${i}-${j}`] ? matrix[`${i}-${j}`].toFixed(3) : "-"}
                        </td>
                      );
                    return (
                      <td key={j}>
                        <select
                          value={matrix[`${i}-${j}`] || ""}
                          onChange={(e) =>
                            handleChange(i, j, Number(e.target.value))
                          }
                        >
                          <option value="">-</option>
                          {scale.map((s, k) => (
                            <option key={k} value={s.value}>
                              {s.value}
                            </option>
                          ))}
                        </select>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Progress */}
          <div className="progress-section">
            <p>
              Completion Progress{" "}
              <span>
                {Object.keys(matrix).length / 2} of {totalComparisons} comparisons
              </span>
            </p>
            <div className="progress-bar">
              <div
                className="progress"
                style={{
                  width: `${
                    ((Object.keys(matrix).length / 2) / totalComparisons) * 100
                  }%`,
                }}
              ></div>
            </div>
          </div>

          <div className="footer-buttons">
            <button className="back-btn" onClick={handleBack}>← Back</button>
            <button className="next-btn">Next Step →</button>
          </div>
        </div>
        </section>
      </section>
    </div>
  );
};

export default SuggestionScreen;
