import React, { useState, useEffect } from "react";

const Matrix = () => {
    const [criteria] = useState([
        { name: "Server", description: "Physical or virtual server infrastructure components that host applications and services.", icon: "🖥️" },
        { name: "Database", description: "Database management systems and data storage solutions used by applications.", icon: "🗄️" },
        { name: "Application", description: "Software applications and services that provide business functionality to end users.", icon: "💻" },
        { name: "Network Device", description: "Network infrastructure components including routers, switches, and firewalls.", icon: "🌐" },
        { name: "Computer", description: "End-user computing devices including laptops, desktops, and workstations.", icon: "🧑‍💻" },
        { name: "Cloud Service", description: "Cloud-based services and infrastructure components hosted by external providers.", icon: "☁️" },
    ]);

    const [criteriaList] = useState([
        { name: "Business Criticality", icon: "⚡" },
        { name: "Change Frequency", icon: "🔄" },
        { name: "Compliance Impact", icon: "📋" }
    ]);

    // Objective metrics for each criterion
    const [metrics] = useState({
        "Business Criticality": {
            description: "Measured as # of critical business services linked",
            values: {
                "Application": 120,
                "Database": 90,
                "Server": 50,
                "Network Device": 30,
                "Computer": 70,
                "Cloud Service": 85
            }
        },
        "Change Frequency": {
            description: "Measured as # of changes per quarter",
            values: {
                "Application": 400,
                "Database": 150,
                "Server": 600,
                "Network Device": 200,
                "Computer": 100,
                "Cloud Service": 250
            }
        },
        "Compliance Impact": {
            description: "Measured as # of regulatory controls mapped",
            values: {
                "Application": 40,
                "Database": 100,
                "Server": 20,
                "Network Device": 10,
                "Computer": 30,
                "Cloud Service": 55
            }
        }
    });

    // Pairwise comparison matrix for criteria
    const [criteriaMatrix, setCriteriaMatrix] = useState({});
    const [classMatrix, setClassMatrix] = useState({});
    const [bcMatrix, setBcMatrix] = useState({});
    const [cfMatrix, setCfMatrix] = useState({});
    const [crMatrix, setCrMatrix] = useState({});
    const ciClasses = ["Server", "Database", "Application", "Network Device", "Computer", "Cloud Service"];



    const scale = [
        { value: 1, label: "Equal" },
        { value: 3, label: "Moderate" },
        { value: 5, label: "Strong" },
        { value: 7, label: "Very Strong" },
        { value: 9, label: "Extreme" },
    ];

    const handleClassChange = (i, j, val) => {
        const updated = { ...classMatrix };
        updated[`${i}-${j}`] = val;
        updated[`${j}-${i}`] = 1 / val; // maintain reciprocity
        setClassMatrix(updated);
    };

    const handleBCChange = (i, j, val) => {
        const updated = { ...bcMatrix };
        updated[`${i}-${j}`] = val;
        updated[`${j}-${i}`] = 1 / val; // reciprocal
        setBcMatrix(updated);
    };

    const handleCFChange = (i, j, val) => {
        const updated = { ...cfMatrix };
        updated[`${i}-${j}`] = val;
        updated[`${j}-${i}`] = 1 / val;
        setCfMatrix(updated);
    };

    const handleCRChange = (i, j, val) => {
        const updated = { ...crMatrix };
        updated[`${i}-${j}`] = val;
        updated[`${j}-${i}`] = 1 / val;
        setCrMatrix(updated);
    };



    const [normalizedWeights, setNormalizedWeights] = useState({});
    const [criteriaWeights, setCriteriaWeights] = useState({});
    const [finalPriorities, setFinalPriorities] = useState([]);

    const totalCriteriaComparisons = (criteriaList.length * (criteriaList.length - 1)) / 2;

    useEffect(() => {
        calculateNormalizedWeights();
    }, [criteriaMatrix]);

    const calculateCriteriaWeights = () => {
        const n = criteriaList.length;
        const mat = Array.from({ length: n }, (_, i) =>
            Array.from({ length: n }, (_, j) => {
                if (i === j) return 1;
                return criteriaMatrix[`${i}-${j}`] || 1;
            })
        );


        // Compute geometric mean for each row
        const geomMeans = mat.map((row) => {
            const product = row.reduce((acc, val) => acc * val, 1);
            return Math.pow(product, 1 / n);
        });

        // Normalize
        const sumGeom = geomMeans.reduce((a, b) => a + b, 0);
        const weights = geomMeans.map((g) => g / sumGeom);

        const result = {};
        criteriaList.forEach((c, i) => {
            result[c.name] = weights[i];
        });

        return result;
    };

    const calculateNormalizedWeights = () => {
        const normalized = {};

        Object.keys(metrics).forEach(criterion => {
            const values = metrics[criterion].values;
            const total = Object.values(values).reduce((sum, val) => sum + val, 0);

            normalized[criterion] = {};
            Object.keys(values).forEach(ciClass => {
                normalized[criterion][ciClass] = values[ciClass] / total;
            });
        });

        setNormalizedWeights(normalized);

        // Calculate criteria weights from matrix
        const cWeights = calculateCriteriaWeights();
        setCriteriaWeights(cWeights);

        // Calculate final priorities using criteria weights
        const priorities = criteria.map(ci => {
            let weightSum = 0;
            Object.keys(metrics).forEach(criterion => {
                const criterionWeight = cWeights[criterion] || (1 / Object.keys(metrics).length);
                weightSum += normalized[criterion][ci.name] * criterionWeight;
            });
            return {
                className: ci.name,
                weight: weightSum,
                icon: ci.icon
            };
        });

        setFinalPriorities(priorities.sort((a, b) => b.weight - a.weight));
    };

    const handleCriteriaChange = (i, j, val) => {
        const updated = { ...criteriaMatrix };
        updated[`${i}-${j}`] = val;
        updated[`${j}-${i}`] = 1 / val;
        setCriteriaMatrix(updated);
    };

    const handleBack = () => {
        window.history.back();
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.pageTitle}>
                Review the suggested CI classes and complete objective metrics evaluation
            </h2>

            {/* Suggested CI Classes */}
            <section style={styles.section}>
                <div style={styles.headerRow}>
                    <h3 style={styles.sectionTitle}>Suggested CI Classes</h3>
                    <p style={styles.classCount}>{criteria.length} classes found</p>
                </div>

                <div style={styles.classGrid}>
                    {criteria.map((c, i) => (
                        <div key={i} style={styles.classCard}>
                            <div style={styles.classHeader}>
                                <span style={styles.classIcon}>{c.icon}</span>
                                <h4 style={styles.className}>{c.name}</h4>
                                <span style={styles.status}>Active</span>
                            </div>
                            <p style={styles.classDesc}>{c.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Criteria Pairwise Comparison Matrix */}
            <section style={styles.section}>
                <h3 style={styles.sectionTitle}>Step 1: Compare Criteria Importance</h3>
                <p style={styles.description}>
                    Compare each pair of criteria to determine their relative importance. Higher values indicate stronger preference.
                </p>

                {/* Scale */}
                <div style={styles.scaleRow}>
                    {scale.map((s, i) => (
                        <div key={i} style={styles.scaleBox}>
                            <div style={styles.scaleValue}>{s.value}</div>
                            <div style={styles.scaleLabel}>{s.label}</div>
                        </div>
                    ))}
                </div>

                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}></th>
                                {criteriaList.map((c, i) => (
                                    <th key={i} style={styles.th}>{c.icon} {c.name}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {criteriaList.map((row, i) => (
                                <tr key={i} style={i % 2 === 0 ? styles.evenRow : styles.oddRow}>
                                    <th style={styles.rowHeader}>
                                        <span style={styles.tableIcon}>{row.icon}</span>
                                        {row.name}
                                    </th>
                                    {criteriaList.map((col, j) => {
                                        if (i === j) return <td key={j} style={styles.td}>1</td>;
                                        if (i > j)
                                            return (
                                                <td key={j} style={styles.td}>
                                                    {criteriaMatrix[`${i}-${j}`] ? criteriaMatrix[`${i}-${j}`].toFixed(3) : "-"}
                                                </td>
                                            );
                                        return (
                                            <td key={j} style={styles.td}>
                                                <select
                                                    value={criteriaMatrix[`${i}-${j}`] || ""}
                                                    onChange={(e) =>
                                                        handleCriteriaChange(i, j, Number(e.target.value))
                                                    }
                                                    style={styles.select}
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

                    <div style={styles.progressSection}>
                        <p style={styles.progressText}>
                            Completion Progress:{" "}
                            <span style={styles.progressCount}>
                                {Object.keys(criteriaMatrix).length / 2} of {totalCriteriaComparisons} comparisons
                            </span>
                        </p>
                        <div style={styles.progressBar}>
                            <div
                                style={{
                                    ...styles.progressFill,
                                    width: `${((Object.keys(criteriaMatrix).length / 2) / totalCriteriaComparisons) * 100}%`,
                                }}
                            />
                        </div>
                    </div>

                    {Object.keys(criteriaWeights).length > 0 && (
                        <div style={styles.weightsDisplay}>
                            <h4 style={styles.weightsTitle}>Calculated Criteria Weights:</h4>
                            <div style={styles.weightsGrid}>
                                {Object.entries(criteriaWeights).map(([name, weight], i) => (
                                    <div key={i} style={styles.weightCard}>
                                        <span style={styles.weightIcon}>
                                            {criteriaList.find(c => c.name === name)?.icon}
                                        </span>
                                        <span style={styles.weightName}>{name}</span>
                                        <span style={styles.weightValue}>{(weight * 100).toFixed(2)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* CI Class vs CI Class Comparison Matrix */}
            <section style={styles.section}>
                <h3 style={styles.sectionTitle}>Step 2: Compare CI Classes Importance</h3>
                <p style={styles.description}>
                    Compare each pair of CI classes below to determine which ones are more
                    critical overall (independent of criteria). This gives an overall
                    relational weight for each class.
                </p>

                {/* Scale (reuse same as above) */}
                <div style={styles.scaleRow}>
                    {scale.map((s, i) => (
                        <div key={i} style={styles.scaleBox}>
                            <div style={styles.scaleValue}>{s.value}</div>
                            <div style={styles.scaleLabel}>{s.label}</div>
                        </div>
                    ))}
                </div>

                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}></th>
                                {criteria.map((c, i) => (
                                    <th key={i} style={styles.th}>{c.icon} {c.name}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {criteria.map((row, i) => (
                                <tr key={i} style={i % 2 === 0 ? styles.evenRow : styles.oddRow}>
                                    <th style={styles.rowHeader}>
                                        <span style={styles.tableIcon}>{row.icon}</span>
                                        {row.name}
                                    </th>
                                    {criteria.map((col, j) => {
                                        if (i === j) return <td key={j} style={styles.td}>1</td>;
                                        if (i > j)
                                            return (
                                                <td key={j} style={styles.td}>
                                                    {classMatrix[`${i}-${j}`]
                                                        ? classMatrix[`${i}-${j}`].toFixed(3)
                                                        : "-"}
                                                </td>
                                            );
                                        return (
                                            <td key={j} style={styles.td}>
                                                <select
                                                    value={classMatrix[`${i}-${j}`] || ""}
                                                    onChange={(e) =>
                                                        handleClassChange(i, j, Number(e.target.value))
                                                    }
                                                    style={styles.select}
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

                    {/* Progress indicator for class matrix */}
                    <div style={styles.progressSection}>
                        <p style={styles.progressText}>
                            Completion Progress:{" "}
                            <span style={styles.progressCount}>
                                {Object.keys(classMatrix).length / 2} of{" "}
                                {(criteria.length * (criteria.length - 1)) / 2} comparisons
                            </span>
                        </p>
                        <div style={styles.progressBar}>
                            <div
                                style={{
                                    ...styles.progressFill,
                                    width: `${((Object.keys(classMatrix).length / 2) /
                                            ((criteria.length * (criteria.length - 1)) / 2)) *
                                        100
                                        }%`,
                                }}
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="matrix-section">
                <h3>Step 4: Compare CI Classes based on CF (Configuration Flexibility)</h3>
                <p>Compare each pair of CI classes based on how flexible their configuration options are.</p>

                <table className="matrix-table">
                    <thead>
                        <tr>
                            <th></th>
                            {criteria.map((c, i) => (
                                <th key={i}>{c.icon} {c.name}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {criteria.map((row, i) => (
                            <tr key={i}>
                                <th>{row.icon} {row.name}</th>
                                {criteria.map((col, j) => {
                                    if (i === j) return <td key={j}>1</td>;
                                    if (i > j)
                                        return <td key={j}>{cfMatrix[`${i}-${j}`]?.toFixed(3) || "-"}</td>;
                                    return (
                                        <td key={j}>
                                            <select
                                                value={cfMatrix[`${i}-${j}`] || ""}
                                                onChange={(e) => handleCFChange(i, j, Number(e.target.value))}
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

            <section className="matrix-section">
                <h3>Step 5: Compare CI Classes based on CR (Change Risk)</h3>
                <p>Compare each pair of CI classes based on potential risk during change implementation.</p>

                <table className="matrix-table">
                    <thead>
                        <tr>
                            <th></th>
                            {criteria.map((c, i) => (
                                <th key={i}>{c.icon} {c.name}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {criteria.map((row, i) => (
                            <tr key={i}>
                                <th>{row.icon} {row.name}</th>
                                {criteria.map((col, j) => {
                                    if (i === j) return <td key={j}>1</td>;
                                    if (i > j)
                                        return <td key={j}>{crMatrix[`${i}-${j}`]?.toFixed(3) || "-"}</td>;
                                    return (
                                        <td key={j}>
                                            <select
                                                value={crMatrix[`${i}-${j}`] || ""}
                                                onChange={(e) => handleCRChange(i, j, Number(e.target.value))}
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

            <section className="matrix-section">
                <h3>Step 4: CR vs CI Class Matrix</h3>
                <table className="matrix-table">
                    <thead>
                        <tr>
                            <th></th>
                            {ciClasses.map((ci, i) => (
                                <th key={i}>{ci}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {ciClasses.map((row, i) => (
                            <tr key={i}>
                                <th>{row}</th>
                                {ciClasses.map((col, j) => {
                                    if (i === j) return <td key={j}>1</td>;
                                    if (i > j) return <td key={j}>{crMatrix[`${i}-${j}`]?.toFixed(3) || "-"}</td>;
                                    return (
                                        <td key={j}>
                                            <select
                                                value={crMatrix[`${i}-${j}`] || ""}
                                                onChange={(e) => handleCRChange(i, j, Number(e.target.value))}
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

            {/* Combined Summary Table */}
            <section style={styles.section}>
                <h3 style={styles.sectionTitle}>Summary: All Criteria Normalized Weights</h3>
                <p style={styles.description}>
                    Normalized weights for each CI class across all criteria
                </p>

                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>CI Class</th>
                                {Object.keys(metrics).map((criterion, i) => (
                                    <th key={i} style={styles.th}>
                                        <div>{criteriaList[i]?.icon} {criterion}</div>
                                        <div style={styles.metricDescription}>
                                            {metrics[criterion].description}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {criteria.map((ci, i) => (
                                <tr key={i} style={i % 2 === 0 ? styles.evenRow : styles.oddRow}>
                                    <th style={styles.rowHeader}>
                                        <span style={styles.tableIcon}>{ci.icon}</span>
                                        {ci.name}
                                    </th>
                                    {Object.keys(metrics).map((criterion, j) => (
                                        <td key={j} style={styles.td}>
                                            <div style={styles.metricValue}>
                                                {metrics[criterion].values[ci.name]}
                                            </div>
                                            <div style={styles.normalizedValue}>
                                                ({normalizedWeights[criterion]?.[ci.name]?.toFixed(3) || '0.000'})
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={styles.note}>
                    <strong>Note:</strong> Values in parentheses show normalized weights (proportion of total for each criterion)
                </div>
            </section>

            {/* Priority Results */}
            <section style={styles.section}>
                <h3 style={styles.sectionTitle}>Final Priority Weights</h3>
                <p style={styles.description}>
                    Final priorities calculated using weighted combination of all criteria
                </p>

                <div style={styles.priorityContainer}>
                    {finalPriorities.map((priority, i) => (
                        <div key={i} style={styles.priorityCard}>
                            <div style={styles.priorityRank}>#{i + 1}</div>
                            <div style={styles.priorityIcon}>{priority.icon}</div>
                            <div style={styles.priorityInfo}>
                                <div style={styles.priorityName}>{priority.className}</div>
                                <div style={styles.priorityWeight}>
                                    Weight: {(priority.weight * 100).toFixed(2)}%
                                </div>
                            </div>
                            <div style={styles.priorityBar}>
                                <div
                                    style={{
                                        ...styles.priorityBarFill,
                                        width: `${priority.weight * 100}%`
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div style={styles.footerButtons}>
                    <button style={styles.backBtn} onClick={handleBack}>← Back</button>
                    <button style={styles.nextBtn}>Next Step →</button>
                </div>
            </section>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '40px 20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backgroundColor: '#f5f7fa',
        minHeight: '100vh'
    },
    pageTitle: {
        fontSize: '28px',
        fontWeight: '600',
        color: '#1a202c',
        marginBottom: '40px',
        textAlign: 'center'
    },
    section: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '30px',
        marginBottom: '30px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    },
    headerRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
    },
    sectionTitle: {
        fontSize: '22px',
        fontWeight: '600',
        color: '#2d3748',
        margin: 0
    },
    classCount: {
        fontSize: '14px',
        color: '#718096',
        margin: 0
    },
    classGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
    },
    classCard: {
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '20px',
        transition: 'transform 0.2s, box-shadow 0.2s'
    },
    classHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '12px'
    },
    classIcon: {
        fontSize: '24px'
    },
    className: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#2d3748',
        margin: 0,
        flex: 1
    },
    status: {
        fontSize: '12px',
        padding: '4px 8px',
        backgroundColor: '#c6f6d5',
        color: '#22543d',
        borderRadius: '4px',
        fontWeight: '500'
    },
    classDesc: {
        fontSize: '14px',
        color: '#718096',
        lineHeight: '1.5',
        margin: 0
    },
    description: {
        fontSize: '14px',
        color: '#718096',
        marginBottom: '20px'
    },
    scaleRow: {
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        justifyContent: 'center',
        flexWrap: 'wrap'
    },
    scaleBox: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px 16px',
        border: '2px solid #e2e8f0',
        borderRadius: '8px',
        backgroundColor: '#f7fafc',
        minWidth: '80px'
    },
    scaleValue: {
        fontSize: '20px',
        fontWeight: '700',
        color: '#2d3748',
        marginBottom: '4px'
    },
    scaleLabel: {
        fontSize: '11px',
        color: '#718096',
        textAlign: 'center'
    },
    tableContainer: {
        overflowX: 'auto',
        marginBottom: '20px'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px'
    },
    th: {
        padding: '16px 12px',
        textAlign: 'left',
        backgroundColor: '#f7fafc',
        borderBottom: '2px solid #e2e8f0',
        fontWeight: '600',
        color: '#2d3748',
        fontSize: '13px'
    },
    metricDescription: {
        fontSize: '11px',
        fontWeight: '400',
        color: '#718096',
        marginTop: '4px'
    },
    evenRow: {
        backgroundColor: '#ffffff'
    },
    oddRow: {
        backgroundColor: '#f9fafb'
    },
    rowHeader: {
        padding: '16px 12px',
        textAlign: 'left',
        fontWeight: '600',
        color: '#2d3748',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    tableIcon: {
        fontSize: '18px'
    },
    td: {
        padding: '16px 12px',
        textAlign: 'center',
        borderBottom: '1px solid #e2e8f0'
    },
    select: {
        padding: '6px 10px',
        fontSize: '14px',
        borderRadius: '4px',
        border: '1px solid #cbd5e0',
        backgroundColor: 'white',
        cursor: 'pointer',
        minWidth: '70px'
    },
    metricValue: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#2d3748',
        marginBottom: '4px'
    },
    normalizedValue: {
        fontSize: '12px',
        color: '#718096'
    },
    barContainer: {
        position: 'relative',
        width: '100%',
        height: '24px',
        backgroundColor: '#e2e8f0',
        borderRadius: '4px',
        overflow: 'hidden'
    },
    barFill: {
        height: '100%',
        backgroundColor: '#4299e1',
        transition: 'width 0.3s ease'
    },
    barLabel: {
        position: 'absolute',
        top: '50%',
        right: '8px',
        transform: 'translateY(-50%)',
        fontSize: '11px',
        fontWeight: '600',
        color: '#2d3748'
    },
    progressSection: {
        marginTop: '20px',
        padding: '16px',
        backgroundColor: '#f7fafc',
        borderRadius: '8px'
    },
    progressText: {
        fontSize: '14px',
        color: '#4a5568',
        marginBottom: '8px'
    },
    progressCount: {
        fontWeight: '600',
        color: '#2d3748'
    },
    progressBar: {
        width: '100%',
        height: '8px',
        backgroundColor: '#e2e8f0',
        borderRadius: '4px',
        overflow: 'hidden'
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#48bb78',
        transition: 'width 0.3s ease'
    },
    weightsDisplay: {
        marginTop: '20px',
        padding: '20px',
        backgroundColor: '#edf2f7',
        borderRadius: '8px'
    },
    weightsTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#2d3748',
        marginBottom: '16px'
    },
    weightsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px'
    },
    weightCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px',
        backgroundColor: 'white',
        borderRadius: '6px',
        border: '1px solid #cbd5e0'
    },
    weightIcon: {
        fontSize: '24px'
    },
    weightName: {
        flex: 1,
        fontSize: '14px',
        color: '#4a5568'
    },
    weightValue: {
        fontSize: '16px',
        fontWeight: '700',
        color: '#2d3748'
    },
    note: {
        fontSize: '13px',
        color: '#718096',
        padding: '12px',
        backgroundColor: '#f7fafc',
        borderRadius: '6px',
        marginTop: '10px'
    },
    priorityContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        marginBottom: '30px'
    },
    priorityCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '20px',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        backgroundColor: '#fafafa'
    },
    priorityRank: {
        fontSize: '20px',
        fontWeight: '700',
        color: '#4a5568',
        minWidth: '40px'
    },
    priorityIcon: {
        fontSize: '32px'
    },
    priorityInfo: {
        flex: 1
    },
    priorityName: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#2d3748',
        marginBottom: '4px'
    },
    priorityWeight: {
        fontSize: '14px',
        color: '#718096'
    },
    priorityBar: {
        width: '200px',
        height: '8px',
        backgroundColor: '#e2e8f0',
        borderRadius: '4px',
        overflow: 'hidden'
    },
    priorityBarFill: {
        height: '100%',
        backgroundColor: '#4299e1',
        transition: 'width 0.3s ease'
    },
    footerButtons: {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '30px'
    },
    backBtn: {
        padding: '12px 24px',
        fontSize: '14px',
        fontWeight: '500',
        color: '#4a5568',
        backgroundColor: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    nextBtn: {
        padding: '12px 24px',
        fontSize: '14px',
        fontWeight: '500',
        color: 'white',
        backgroundColor: '#4299e1',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.2s'
    }
};

export default Matrix;