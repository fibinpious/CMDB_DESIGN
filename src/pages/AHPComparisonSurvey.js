import React, { useState } from "react";
import "../Style/AHPComparisonSurvey.css";

const criteria = ["BC", "CF", "CR"];
const options = [
  { label: "Equal importance (1)", value: 1 },
  { label: "Moderate importance (3)", value: 3 },
  { label: "Strong importance (5)", value: 5 },
  { label: "Very strong importance (7)", value: 7 },
  { label: "Extreme importance (9)", value: 9 },
  { label: "Intermediate (2)", value: 2 },
  { label: "Intermediate (4)", value: 4 },
  { label: "Intermediate (6)", value: 6 },
  { label: "Intermediate (8)", value: 8 },
];

const AHPComparisonSurvey = () => {
  const [matrix, setMatrix] = useState(() => {
    const initial = {};
    criteria.forEach((r) => {
      initial[r] = {};
      criteria.forEach((c) => {
        initial[r][c] = r === c ? 1 : null;
      });
    });
    return initial;
  });

  const handleChange = (r, c, value) => {
    const val = parseFloat(value);
    if (!val) return;
    const reciprocal = 1 / val;
    const newMatrix = JSON.parse(JSON.stringify(matrix));
    newMatrix[r][c] = val;
    newMatrix[c][r] = parseFloat(reciprocal.toFixed(3));
    setMatrix(newMatrix);
  };

  return (
    <div className="survey-container">
      <h2>Criteria Comparison Survey</h2>
      <table className="criteria-table">
        <thead>
          <tr>
            <th>Criteria</th>
            {criteria.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {criteria.map((r) => (
            <tr key={r}>
              <th>{r}</th>
              {criteria.map((c) => (
                <td key={`${r}-${c}`}>
                  {r === c ? (
                    <span className="fixed">1</span>
                  ) : criteria.indexOf(r) < criteria.indexOf(c) ? (
                    <select
                      value={matrix[r][c] || ""}
                      onChange={(e) => handleChange(r, c, e.target.value)}
                    >
                      <option value="">Select</option>
                      {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="reciprocal">
                      {matrix[r][c] ? matrix[r][c] : "-"}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AHPComparisonSurvey;
