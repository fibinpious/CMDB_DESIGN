import React, { useState, useEffect } from "react";
import "../Style/surveyForm.css";
import { useLocation } from "react-router-dom";

const SurveyForm = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [completedComparisons, setCompletedComparisons] = useState(0);

    const [criteriaList] = useState([
        { name: "Business Criticality", icon: "⚡" },
        { name: "Change Frequency", icon: "🔄" },
        { name: "Compliance Impact", icon: "📋" }
    ]);

    const [criteriaMatrix, setCriteriaMatrix] = useState({});
    const [classMatrix, setClassMatrix] = useState({});
    const [criteriaWeights, setCriteriaWeights] = useState({});
    const [classWeights, setClassWeights] = useState({});
    const [finalPriorities, setFinalPriorities] = useState([]);
    const [consistencyRatio, setConsistencyRatio] = useState({ criteria: 0, classes: 0 });

    const [currentComparison, setCurrentComparison] = useState({ i: 0, j: 1 });
    const [selectedValue, setSelectedValue] = useState(null);
    const location = useLocation();
    const apiResponse = location.state?.apiResponse || "";

    console.log("API Response:", apiResponse);  

    const scale = [
        { value: 1, label: "Equal", description: "Both elements contribute equally" },
        { value: 3, label: "Moderate", description: "Experience slightly favors one" },
        { value: 5, label: "Strong", description: "Experience strongly favors one" },
        { value: 7, label: "Very Strong", description: "Dominance demonstrated" },
        { value: 9, label: "Extreme", description: "Highest order of affirmation" },
    ];

    const steps = [
        { name: "Overview", icon: "📋" },
        { name: "Criteria", icon: "⚖️" },
        { name: "CI Classes", icon: "🔍" },
        { name: "Results", icon: "📊" }
    ];

    const parseApiResponse = (text) => {
        // Normalize newlines and spacing
        text = text.replace(/\r/g, '').trim();
      
        // Regex explanation:
        // - Optional numbering or bullet (e.g., 1., -, *, etc.)
        // - **name** captures between double asterisks
        // - Description: anything until the next **name**, number., or end
        const regex = /(?:\d+\.\s*)?\*\*(.*?)\*\*[^\n]*[\n:\-\u2013\u2014\s]*(.*?)(?=\n(?:\d+\.\s*\*\*|[-*]\s*\*\*|\*\*|$))/gs;
      
        const results = [];
        let match;
      
        while ((match = regex.exec(text)) !== null) {
          let name = match[1]?.trim();
          let desc = match[2]?.replace(/\s+/g, ' ').trim();
      
          if (name && desc) {
            results.push({ name, description: desc });
          }
        }
      
        return results;
      };
      


      const [classes, setClasses] = useState([]);

useEffect(() => {
  if (apiResponse) {
    const parsed = parseApiResponse(apiResponse);
    console.log("Parsed", parsed);
    const enriched = parsed.map((c) => ({
      ...c,
      icon: getIconForClass(c.name),
    }));
    setClasses(enriched);
  }
}, [apiResponse]);

const getIconForClass = (name) => {
    name = name.toLowerCase();
    if (name.includes("computer")) return "🧑‍💻";
    if (name.includes("application")) return "💻";
    if (name.includes("network")) return "🌐";
    if (name.includes("database")) return "🗄️";
    if (name.includes("service")) return "⚙️";
    return "📦";
  };
  

    useEffect(() => {
        calculateAllWeights();
    }, [criteriaMatrix, classMatrix]);

    const calculateWeights = (matrix, size) => {
        if (Object.keys(matrix).length === 0) return {};

        const mat = Array.from({ length: size }, (_, i) =>
            Array.from({ length: size }, (_, j) => {
                if (i === j) return 1;
                return matrix[`${i}-${j}`] || 1;
            })
        );

        const geomMeans = mat.map((row) => {
            const product = row.reduce((acc, val) => acc * val, 1);
            return Math.pow(product, 1 / size);
        });

        const sumGeom = geomMeans.reduce((a, b) => a + b, 0);
        const weights = geomMeans.map((g) => g / sumGeom);

        const cr = calculateConsistencyRatio(mat, weights);

        return { weights, consistencyRatio: cr };
    };

    const calculateConsistencyRatio = (matrix, weights) => {
        const n = matrix.length;
        if (n <= 2) return 0;

        const weightedSum = matrix.map((row, i) => 
            row.reduce((sum, val, j) => sum + val * weights[j], 0)
        );
        const lambdaMax = weightedSum.reduce((sum, val, i) => sum + val / weights[i], 0) / n;

        const ci = (lambdaMax - n) / (n - 1);

        const ri = [0, 0, 0.58, 0.90, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49];
        const randomIndex = ri[n] || 1.49;

        return ci / randomIndex;
    };

    const calculateAllWeights = () => {
        const criteriaResult = calculateWeights(criteriaMatrix, criteriaList.length);
        const cWeights = {};
        criteriaList.forEach((c, i) => {
            cWeights[c.name] = criteriaResult.weights ? criteriaResult.weights[i] : (1 / criteriaList.length);
        });
        setCriteriaWeights(cWeights);

        const classResult = calculateWeights(classMatrix, classes.length);
        const ciWeights = {};
        classes.forEach((c, i) => {
            ciWeights[c.name] = classResult.weights ? classResult.weights[i] : (1 / classes.length);
        });
        setClassWeights(ciWeights);

        setConsistencyRatio({
            criteria: criteriaResult.consistencyRatio || 0,
            classes: classResult.consistencyRatio || 0
        });

        const priorities = classes.map(ci => ({
            className: ci.name,
            weight: ciWeights[ci.name] || 0,
            icon: ci.icon
        }));

        setFinalPriorities(priorities.sort((a, b) => b.weight - a.weight));
    };

    const handleComparisonSubmit = () => {
        if (!selectedValue) return;

        const { i, j } = currentComparison;
        
        if (currentStep === 1) {
            const updated = { ...criteriaMatrix };
            updated[`${i}-${j}`] = selectedValue;
            updated[`${j}-${i}`] = 1 / selectedValue;
            setCriteriaMatrix(updated);
        } else if (currentStep === 2) {
            const updated = { ...classMatrix };
            updated[`${i}-${j}`] = selectedValue;
            updated[`${j}-${i}`] = 1 / selectedValue;
            setClassMatrix(updated);
        }

        setCompletedComparisons(completedComparisons + 1);
        setSelectedValue(null);
        moveToNextComparison();
    };

    const moveToNextComparison = () => {
        const { i, j } = currentComparison;
        const list = currentStep === 1 ? criteriaList : classes;
        
        let nextJ = j + 1;
        let nextI = i;

        if (nextJ >= list.length) {
            nextI = i + 1;
            nextJ = nextI + 1;
        }

        if (nextI >= list.length - 1) {
            setCurrentStep(currentStep + 1);
            setCurrentComparison({ i: 0, j: 1 });
        } else {
            setCurrentComparison({ i: nextI, j: nextJ });
        }
    };

    const getTotalComparisons = () => {
        const list = currentStep === 1 ? criteriaList : classes;
        return (list.length * (list.length - 1)) / 2;
    };

    const getCurrentProgress = () => {
        if (currentStep === 1) {
            return Object.keys(criteriaMatrix).length / 2;
        } else if (currentStep === 2) {
            return Object.keys(classMatrix).length / 2;
        }
        return 0;
    };

    const getConsistencyStatus = (cr) => {
        if (cr < 0.1) return { status: "Excellent", color: "#10b981" };
        if (cr < 0.15) return { status: "Acceptable", color: "#f59e0b" };
        return { status: "Inconsistent", color: "#ef4444" };
    };

    const renderOverview = () => (
        <div className="page-container">
            <div className="header-section">
                <h1 className="main-title">CMDB Configuration Item Classification</h1>
            </div>

            <div className="section">
                <h3 className="section-title">Configuration Item Classes ({classes.length})</h3>
                <div className="ci-grid">
                    {classes.map((c, i) => (
                        <div key={i} className="ci-card">
                            <div className="ci-header">
                                <span className="ci-icon">{c.icon}</span>
                                <h4 className="ci-name">{c.name}</h4>
                            </div>
                            <p className="ci-description">{c.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="process-section">
                <h3 className="section-title">Assessment Process</h3>
                <div className="process-grid">
                    <div className="process-card">
                        <div className="process-number">1</div>
                        <h4 className="process-title">Criteria Comparison</h4>
                        <p className="process-desc">Compare evaluation criteria to determine relative importance</p>
                    </div>
                    <div className="process-card">
                        <div className="process-number">2</div>
                        <h4 className="process-title">CI Class Comparison</h4>
                        <p className="process-desc">Evaluate CI classes through pairwise comparisons</p>
                    </div>
                    <div className="process-card">
                        <div className="process-number">3</div>
                        <h4 className="process-title">Review Results</h4>
                        <p className="process-desc">Analyze calculated priorities and weights</p>
                    </div>
                </div>
            </div>

            <button className="btn-primary" onClick={() => setCurrentStep(1)}>
                Begin Assessment
            </button>
        </div>
    );

    const renderComparison = () => {
        const list = currentStep === 1 ? criteriaList : classes;
        const { i, j } = currentComparison;
        const itemA = list[i];
        const itemB = list[j];
        const progress = getCurrentProgress();
        const total = getTotalComparisons();
        const progressPercent = (progress / total) * 100;

        return (
            <div className="page-container">
                <div className="progress-section">
                    <div className="progress-header">
                        <span className="progress-label">Comparison Progress</span>
                        <span className="progress-count">{Math.round(progress)} of {total} completed</span>
                    </div>
                    <div className="progress-bar-outer">
                        <div className="progress-bar-inner" style={{ width: `${progressPercent}%` }} />
                    </div>
                </div>

                <div className="comparison-section">
                    <h2 className="comparison-title">
                        {currentStep === 1 ? "Criteria Importance Comparison" : "CI Class Importance Comparison"}
                    </h2>
                    <p className="comparison-instruction">
                        Evaluate the relative importance of the following two items. Select the appropriate 
                        rating scale value that best represents their relationship.
                    </p>

                    <div className="comparison-grid">
                        <div className="item-card">
                            <div className="item-label">Item A</div>
                            <div className="item-icon-large">{itemA.icon}</div>
                            <h3 className="item-name">{itemA.name}</h3>
                            {itemA.description && <p className="item-desc">{itemA.description}</p>}
                        </div>

                        <div className="comparator">
                            <div className="comparator-line"></div>
                            <div className="comparator-label">compared to</div>
                            <div className="comparator-line"></div>
                        </div>

                        <div className="item-card">
                            <div className="item-label">Item B</div>
                            <div className="item-icon-large">{itemB.icon}</div>
                            <h3 className="item-name">{itemB.name}</h3>
                            {itemB.description && <p className="item-desc">{itemB.description}</p>}
                        </div>
                    </div>

                    <div className="scale-section">
                        <h4 className="scale-title">Select Importance Level (Item A relative to Item B)</h4>
                        <div className="scale-grid">
                            {scale.map((s) => (
                                <div
                                    key={s.value}
                                    className={`scale-option ${selectedValue === s.value ? 'scale-selected' : ''}`}
                                    onClick={() => setSelectedValue(s.value)}
                                >
                                    <div className="scale-value">{s.value}</div>
                                    <div className="scale-label">{s.label}</div>
                                    <div className="scale-desc">{s.description}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="action-bar">
                        <button 
                            className="btn-secondary" 
                            onClick={() => {
                                if (selectedValue && selectedValue !== 1) {
                                    setSelectedValue(1 / selectedValue);
                                }
                            }}
                        >
                            Reverse Comparison
                        </button>
                        <button 
                            className={`btn-primary ${!selectedValue ? 'btn-disabled' : ''}`}
                            onClick={handleComparisonSubmit}
                            disabled={!selectedValue}
                        >
                            Continue to Next
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderResults = () => {
        const criteriaStatus = getConsistencyStatus(consistencyRatio.criteria);
        const classStatus = getConsistencyStatus(consistencyRatio.classes);

        return (
            <div className="page-container">
                <div className="header-section">
                    <h1 className="main-title">Assessment Results</h1>
                    <p className="subtitle">Calculated Priority Weights and Analysis</p>
                </div>

                <div className="consistency-section">
                    <h3 className="section-title">Consistency Analysis</h3>
                    <div className="consistency-grid">
                        <div className="consistency-card">
                            <div className="consistency-label">Criteria Consistency Ratio</div>
                            <div className="consistency-value" style={{ color: criteriaStatus.color }}>
                                {consistencyRatio.criteria.toFixed(3)}
                            </div>
                            <div className="consistency-status" style={{ color: criteriaStatus.color }}>
                                {criteriaStatus.status}
                            </div>
                            <p className="consistency-note">
                                {consistencyRatio.criteria < 0.1 
                                    ? "Your comparisons are highly consistent." 
                                    : consistencyRatio.criteria < 0.15
                                    ? "Your comparisons are acceptable."
                                    : "Consider reviewing your comparisons."}
                            </p>
                        </div>
                        <div className="consistency-card">
                            <div className="consistency-label">CI Class Consistency Ratio</div>
                            <div className="consistency-value" style={{ color: classStatus.color }}>
                                {consistencyRatio.classes.toFixed(3)}
                            </div>
                            <div className="consistency-status" style={{ color: classStatus.color }}>
                                {classStatus.status}
                            </div>
                            <p className="consistency-note">
                                {consistencyRatio.classes < 0.1 
                                    ? "Your comparisons are highly consistent." 
                                    : consistencyRatio.classes < 0.15
                                    ? "Your comparisons are acceptable."
                                    : "Consider reviewing your comparisons."}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="section">
                    <h3 className="section-title">Criteria Weights Distribution</h3>
                    <div className="weights-grid">
                        {Object.entries(criteriaWeights).map(([name, weight], i) => (
                            <div key={i} className="weight-card">
                                <div className="weight-header">
                                    <span className="weight-icon">
                                        {criteriaList.find(c => c.name === name)?.icon}
                                    </span>
                                    <span className="weight-name">{name}</span>
                                </div>
                                <div className="weight-value">{(weight * 100).toFixed(2)}%</div>
                                <div className="weight-bar-container">
                                    <div className="weight-bar" style={{ width: `${weight * 100}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="section">
                    <h3 className="section-title">Pairwise Comparison Matrix</h3>
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>CI Class</th>
                                    {classes.map((c, i) => (
                                        <th key={i}>{c.icon} {c.name}</th>
                                    ))}
                                    <th>Weight</th>
                                </tr>
                            </thead>
                            <tbody>
                                {classes.map((rowCI, i) => (
                                    <tr key={i}>
                                        <td className="table-cell-name">
                                            <span className="table-icon">{rowCI.icon}</span>
                                            {rowCI.name}
                                        </td>
                                        {classes.map((colCI, j) => {
                                            const value = i === j ? 1 : (classMatrix[`${i}-${j}`] || '-');
                                            return (
                                                <td key={j}>
                                                    {typeof value === 'number' ? value.toFixed(2) : value}
                                                </td>
                                            );
                                        })}
                                        <td className="table-weight">
                                            {((classWeights[rowCI.name] || 0) * 100).toFixed(2)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="section">
                    <h3 className="section-title">Final Priority Rankings</h3>
                    <div className="rankings-container">
                        {finalPriorities.map((priority, i) => (
                            <div key={i} className="ranking-row">
                                <div className="ranking-position">{i + 1}</div>
                                <div className="ranking-icon-container">
                                    <span className="ranking-icon">{priority.icon}</span>
                                </div>
                                <div className="ranking-content">
                                    <div className="ranking-name">{priority.className}</div>
                                    <div className="ranking-bar-container">
                                        <div className="ranking-bar" style={{ width: `${priority.weight * 100}%` }} />
                                    </div>
                                </div>
                                <div className="ranking-weight">{(priority.weight * 100).toFixed(2)}%</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="action-bar">
                    <button className="btn-secondary" onClick={() => {
                        setCurrentStep(0);
                        setCriteriaMatrix({});
                        setClassMatrix({});
                        setCurrentComparison({ i: 0, j: 1 });
                        setCompletedComparisons(0);
                    }}>
                        Start New Assessment
                    </button>
                    <button className="btn-primary" onClick={() => {
                        const results = {
                            criteriaWeights,
                            classWeights,
                            finalPriorities,
                            consistencyRatio,
                            timestamp: new Date().toISOString()
                        };
                        const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'cmdb-assessment-results.json';
                        a.click();
                    }}>
                        Export Results
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="app-container">
            <div className="stepper-container">
                {steps.map((step, i) => (
                    <React.Fragment key={i}>
                        <div className={`stepper-item ${i === currentStep ? 'stepper-active' : ''} ${i < currentStep ? 'stepper-complete' : ''}`}>
                            <div className="stepper-circle">
                                {i < currentStep ? '✓' : i + 1}
                            </div>
                            <div className="stepper-label">
                                <div className="stepper-name">{step.name}</div>
                            </div>
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`stepper-line ${i < currentStep ? 'stepper-line-complete' : ''}`} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            <div className="content">
                {currentStep === 0 && renderOverview()}
                {(currentStep === 1 || currentStep === 2) && renderComparison()}
                {currentStep === 3 && renderResults()}
            </div>
        </div>
    );
};

export default SurveyForm;