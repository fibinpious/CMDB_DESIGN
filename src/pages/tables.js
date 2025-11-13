import React, { useState, useEffect } from "react";

const Table = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [completedComparisons, setCompletedComparisons] = useState(0);

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

    const [criteriaMatrix, setCriteriaMatrix] = useState({});
    const [classMatrix, setClassMatrix] = useState({});
    const [normalizedWeights, setNormalizedWeights] = useState({});
    const [criteriaWeights, setCriteriaWeights] = useState({});
    const [finalPriorities, setFinalPriorities] = useState([]);

    const [currentComparison, setCurrentComparison] = useState({ i: 0, j: 1 });
    const [selectedValue, setSelectedValue] = useState(null);

    const scale = [
        { value: 1, label: "Equal Importance", description: "Both elements contribute equally" },
        { value: 3, label: "Moderately More Important", description: "Experience slightly favors one over another" },
        { value: 5, label: "Strongly More Important", description: "Experience strongly favors one over another" },
        { value: 7, label: "Very Strongly More Important", description: "Dominance is demonstrated in practice" },
        { value: 9, label: "Extremely More Important", description: "Highest possible order of affirmation" },
    ];

    const steps = [
        { name: "Overview", icon: "📋" },
        { name: "Criteria Comparison", icon: "⚖️" },
        { name: "CI Class Comparison", icon: "🔍" },
        { name: "Results & Analysis", icon: "📊" }
    ];

    useEffect(() => {
        calculateNormalizedWeights();
    }, [criteriaMatrix, classMatrix]);

    const calculateCriteriaWeights = () => {
        const n = criteriaList.length;
        const mat = Array.from({ length: n }, (_, i) =>
            Array.from({ length: n }, (_, j) => {
                if (i === j) return 1;
                return criteriaMatrix[`${i}-${j}`] || 1;
            })
        );

        const geomMeans = mat.map((row) => {
            const product = row.reduce((acc, val) => acc * val, 1);
            return Math.pow(product, 1 / n);
        });

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

        const cWeights = calculateCriteriaWeights();
        setCriteriaWeights(cWeights);

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
        const list = currentStep === 1 ? criteriaList : criteria;
        
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
        const list = currentStep === 1 ? criteriaList : criteria;
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

    const renderOverview = () => (
        <div style={styles.container}>
            <div style={styles.headerSection}>
                <h1 style={styles.mainTitle}>CMDB Configuration Item Classification</h1>
                <p style={styles.subtitle}>Systematic Analytical Hierarchy Process for Priority Assessment</p>
            </div>

            <div style={styles.infoBox}>
                <h3 style={styles.infoTitle}>Assessment Overview</h3>
                <p style={styles.infoParagraph}>
                    This wizard will guide you through a structured pairwise comparison process to determine 
                    the relative priorities of your Configuration Items (CIs). The process uses the Analytic 
                    Hierarchy Process (AHP) methodology to convert subjective judgments into quantifiable weights.
                </p>
            </div>

            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Configuration Item Classes ({criteria.length})</h3>
                <div style={styles.ciGrid}>
                    {criteria.map((c, i) => (
                        <div key={i} style={styles.ciCard}>
                            <div style={styles.ciHeader}>
                                <span style={styles.ciIcon}>{c.icon}</span>
                                <h4 style={styles.ciName}>{c.name}</h4>
                            </div>
                            <p style={styles.ciDescription}>{c.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div style={styles.processSteps}>
                <h3 style={styles.sectionTitle}>Assessment Process</h3>
                <div style={styles.stepsGrid}>
                    <div style={styles.processCard}>
                        <div style={styles.processNumber}>1</div>
                        <h4 style={styles.processTitle}>Criteria Comparison</h4>
                        <p style={styles.processDesc}>Compare evaluation criteria to determine their relative importance</p>
                    </div>
                    <div style={styles.processCard}>
                        <div style={styles.processNumber}>2</div>
                        <h4 style={styles.processTitle}>CI Class Comparison</h4>
                        <p style={styles.processDesc}>Evaluate CI classes through pairwise comparisons</p>
                    </div>
                    <div style={styles.processCard}>
                        <div style={styles.processNumber}>3</div>
                        <h4 style={styles.processTitle}>Review Results</h4>
                        <p style={styles.processDesc}>Analyze calculated priorities and weights</p>
                    </div>
                </div>
            </div>

            <button style={styles.primaryBtn} onClick={() => setCurrentStep(1)}>
                Begin Assessment
            </button>
        </div>
    );

    const renderComparison = () => {
        const list = currentStep === 1 ? criteriaList : criteria;
        const { i, j } = currentComparison;
        const itemA = list[i];
        const itemB = list[j];
        const progress = getCurrentProgress();
        const total = getTotalComparisons();
        const progressPercent = (progress / total) * 100;

        return (
            <div style={styles.container}>
                <div style={styles.progressSection}>
                    <div style={styles.progressHeader}>
                        <span style={styles.progressLabel}>Comparison Progress</span>
                        <span style={styles.progressCount}>{Math.round(progress)} of {total} completed</span>
                    </div>
                    <div style={styles.progressBarOuter}>
                        <div style={{...styles.progressBarInner, width: `${progressPercent}%`}} />
                    </div>
                </div>

                <div style={styles.comparisonSection}>
                    <h2 style={styles.comparisonTitle}>
                        {currentStep === 1 ? "Criteria Importance Comparison" : "CI Class Importance Comparison"}
                    </h2>
                    <p style={styles.comparisonInstruction}>
                        Please evaluate the relative importance of the following two items. Select the appropriate 
                        rating scale value that best represents their relationship.
                    </p>

                    <div style={styles.comparisonGrid}>
                        <div style={styles.itemCard}>
                            <div style={styles.itemLabel}>Item A</div>
                            <div style={styles.itemIconLarge}>{itemA.icon}</div>
                            <h3 style={styles.itemName}>{itemA.name}</h3>
                            {itemA.description && <p style={styles.itemDesc}>{itemA.description}</p>}
                        </div>

                        <div style={styles.comparator}>
                            <div style={styles.comparatorLine} />
                            <div style={styles.comparatorLabel}>compared to</div>
                            <div style={styles.comparatorLine} />
                        </div>

                        <div style={styles.itemCard}>
                            <div style={styles.itemLabel}>Item B</div>
                            <div style={styles.itemIconLarge}>{itemB.icon}</div>
                            <h3 style={styles.itemName}>{itemB.name}</h3>
                            {itemB.description && <p style={styles.itemDesc}>{itemB.description}</p>}
                        </div>
                    </div>

                    <div style={styles.scaleSection}>
                        <h4 style={styles.scaleTitle}>Select Importance Level (Item A relative to Item B)</h4>
                        <div style={styles.scaleGrid}>
                            {scale.map((s) => (
                                <div
                                    key={s.value}
                                    style={{
                                        ...styles.scaleOption,
                                        ...(selectedValue === s.value ? styles.scaleOptionSelected : {})
                                    }}
                                    onClick={() => setSelectedValue(s.value)}
                                >
                                    <div style={styles.scaleOptionValue}>{s.value}</div>
                                    <div style={styles.scaleOptionLabel}>{s.label}</div>
                                    <div style={styles.scaleOptionDesc}>{s.description}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={styles.actionBar}>
                        <button 
                            style={styles.secondaryBtn} 
                            onClick={() => {
                                if (selectedValue && selectedValue !== 1) {
                                    setSelectedValue(1 / selectedValue);
                                }
                            }}
                        >
                            Reverse Comparison
                        </button>
                        <button 
                            style={{
                                ...styles.primaryBtn,
                                ...(selectedValue ? {} : styles.btnDisabled)
                            }}
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

    const renderResults = () => (
        <div style={styles.container}>
            <div style={styles.headerSection}>
                <h1 style={styles.mainTitle}>Assessment Results</h1>
                <p style={styles.subtitle}>Calculated Priority Weights and Analysis</p>
            </div>

            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Criteria Weights Distribution</h3>
                <div style={styles.weightsGrid}>
                    {Object.entries(criteriaWeights).map(([name, weight], i) => (
                        <div key={i} style={styles.weightCard}>
                            <div style={styles.weightHeader}>
                                <span style={styles.weightIcon}>
                                    {criteriaList.find(c => c.name === name)?.icon}
                                </span>
                                <span style={styles.weightName}>{name}</span>
                            </div>
                            <div style={styles.weightValue}>{(weight * 100).toFixed(2)}%</div>
                            <div style={styles.weightBarContainer}>
                                <div style={{...styles.weightBar, width: `${weight * 100}%`}} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Objective Metrics Summary</h3>
                <div style={styles.tableWrapper}>
                    <table style={styles.dataTable}>
                        <thead>
                            <tr>
                                <th style={styles.tableHeader}>CI Class</th>
                                {Object.keys(metrics).map((criterion, i) => (
                                    <th key={i} style={styles.tableHeader}>
                                        <div>{criteriaList[i]?.icon} {criterion}</div>
                                        <div style={styles.tableHeaderSub}>{metrics[criterion].description}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {criteria.map((ci, i) => (
                                <tr key={i} style={i % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd}>
                                    <td style={styles.tableCellName}>
                                        <span style={styles.tableCellIcon}>{ci.icon}</span>
                                        {ci.name}
                                    </td>
                                    {Object.keys(metrics).map((criterion, j) => (
                                        <td key={j} style={styles.tableCell}>
                                            <div style={styles.metricPrimary}>{metrics[criterion].values[ci.name]}</div>
                                            <div style={styles.metricSecondary}>
                                                {(normalizedWeights[criterion]?.[ci.name] * 100)?.toFixed(1)}%
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Final Priority Rankings</h3>
                <div style={styles.rankingsContainer}>
                    {finalPriorities.map((priority, i) => (
                        <div key={i} style={styles.rankingRow}>
                            <div style={styles.rankingPosition}>{i + 1}</div>
                            <div style={styles.rankingIconContainer}>
                                <span style={styles.rankingIcon}>{priority.icon}</span>
                            </div>
                            <div style={styles.rankingContent}>
                                <div style={styles.rankingName}>{priority.className}</div>
                                <div style={styles.rankingBarContainer}>
                                    <div style={{...styles.rankingBar, width: `${priority.weight * 100}%`}} />
                                </div>
                            </div>
                            <div style={styles.rankingWeight}>{(priority.weight * 100).toFixed(2)}%</div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={styles.actionBar}>
                <button style={styles.secondaryBtn} onClick={() => setCurrentStep(0)}>
                    Return to Overview
                </button>
                <button style={styles.primaryBtn}>
                    Export Results
                </button>
            </div>
        </div>
    );

    return (
        <div style={styles.appContainer}>
            <div style={styles.stepperContainer}>
                {steps.map((step, i) => (
                    <React.Fragment key={i}>
                        <div style={{
                            ...styles.stepperItem,
                            ...(i === currentStep ? styles.stepperItemActive : {}),
                            ...(i < currentStep ? styles.stepperItemComplete : {})
                        }}>
                            <div style={styles.stepperCircle}>
                                {i < currentStep ? '✓' : i + 1}
                            </div>
                            <div style={styles.stepperLabel}>
                                <div style={styles.stepperName}>{step.name}</div>
                            </div>
                        </div>
                        {i < steps.length - 1 && (
                            <div style={{
                                ...styles.stepperLine,
                                ...(i < currentStep ? styles.stepperLineComplete : {})
                            }} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            <div style={styles.content}>
                {currentStep === 0 && renderOverview()}
                {(currentStep === 1 || currentStep === 2) && renderComparison()}
                {currentStep === 3 && renderResults()}
            </div>
        </div>
    );
};

const styles = {
    appContainer: {
        minHeight: '100vh',
        background: '#f5f7fa',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        padding: '20px',
    },
    stepperContainer: {
        maxWidth: '1200px',
        margin: '0 auto 40px',
        display: 'flex',
        alignItems: 'center',
        background: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    stepperItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flex: 1,
    },
    stepperItemActive: {
        fontWeight: '600',
    },
    stepperItemComplete: {
        color: '#059669',
    },
    stepperCircle: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: '#e5e7eb',
        color: '#6b7280',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '600',
        fontSize: '16px',
        flexShrink: 0,
    },
    stepperLabel: {
        display: 'flex',
        flexDirection: 'column',
    },
    stepperName: {
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151',
    },
    stepperLine: {
        height: '2px',
        background: '#e5e7eb',
        width: '60px',
        margin: '0 10px',
        flexShrink: 0,
    },
    stepperLineComplete: {
        background: '#059669',
    },
    content: {
        maxWidth: '1200px',
        margin: '0 auto',
    },
    container: {
        background: 'white',
        borderRadius: '8px',
        padding: '40px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    headerSection: {
        marginBottom: '32px',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '24px',
    },
    mainTitle: {
        fontSize: '28px',
        fontWeight: '600',
        color: '#111827',
        margin: '0 0 8px 0',
    },
    subtitle: {
        fontSize: '16px',
        color: '#6b7280',
        margin: 0,
    },
    infoBox: {
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        padding: '20px',
        marginBottom: '32px',
    },
    infoTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#374151',
        margin: '0 0 12px 0',
    },
    infoParagraph: {
        fontSize: '14px',
        color: '#6b7280',
        lineHeight: '1.6',
        margin: 0,
    },
    section: {
        marginBottom: '32px',
    },
    sectionTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '20px',
    },
    ciGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '16px',
    },
    ciCard: {
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        padding: '20px',
        transition: 'all 0.2s',
    },
    ciHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '12px',
    },
    ciIcon: {
        fontSize: '24px',
    },
    ciName: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#374151',
        margin: 0,
    },
    ciDescription: {
        fontSize: '14px',
        color: '#6b7280',
        lineHeight: '1.5',
        margin: 0,
    },
    processSteps: {
        marginBottom: '32px',
    },
    stepsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
    },
    processCard: {
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        padding: '24px',
        textAlign: 'center',
    },
    processNumber: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: '#66',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        fontWeight: '700',
        margin: '0 auto 16px',
    },
    processTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#374151',
        margin: '0 0 8px 0',
    },
    processDesc: {
        fontSize: '14px',
        color: '#6b7280',
        lineHeight: '1.5',
        margin: 0,
    },
    primaryBtn: {
        padding: '12px 32px',
        fontSize: '15px',
        fontWeight: '500',
        color: 'white',
        background: '#3b82f6',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    secondaryBtn: {
        padding: '12px 32px',
        fontSize: '15px',
        fontWeight: '500',
        color: '#374151',
        background: 'white',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    btnDisabled: {
        opacity: 0.5,
        cursor: 'not-allowed',
    },
    progressSection: {
        marginBottom: '32px',
    },
    progressHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
    },
    progressLabel: {
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151',
    },
    progressCount: {
        fontSize: '14px',
        color: '#6b7280',
    },
    progressBarOuter: {
        width: '100%',
        height: '8px',
        background: '#e5e7eb',
        borderRadius: '4px',
        overflow: 'hidden',
    },
    progressBarInner: {
        height: '100%',
        background: '#3b82f6',
        transition: 'width 0.3s ease',
    },
    comparisonSection: {
        marginTop: '24px',
    },
    comparisonTitle: {
        fontSize: '22px',
        fontWeight: '600',
        color: '#111827',
        marginBottom: '12px',
    },
    comparisonInstruction: {
        fontSize: '14px',
        color: '#6b7280',
        lineHeight: '1.6',
        marginBottom: '32px',
    },
    comparisonGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        gap: '32px',
        alignItems: 'center',
        marginBottom: '40px',
    },
    itemCard: {
        border: '2px solid #e5e7eb',
        borderRadius: '8px',
        padding: '32px',
        textAlign: 'center',
        background: '#fafafa',
    },
    itemLabel: {
        fontSize: '12px',
        fontWeight: '600',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '16px',
    },
    itemIconLarge: {
        fontSize: '56px',
        marginBottom: '16px',
    },
    itemName: {
        fontSize: '20px',
        fontWeight: '600',
        color: '#111827',
        margin: '0 0 12px 0',
    },
    itemDesc: {
        fontSize: '14px',
        color: '#6b7280',
        lineHeight: '1.5',
        margin: 0,
    },
    comparator: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
    },
    comparatorLine: {
        width: '2px',
        height: '40px',
        background: '#d1d5db',
    },
    comparatorLabel: {
        fontSize: '12px',
        fontWeight: '600',
        color: '#6b7280',
        textTransform: 'uppercase',
        padding: '4px 12px',
        background: '#f3f4f6',
        borderRadius: '4px',
    },
    scaleSection: {
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '32px',
    },
    scaleTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '16px',
    },
    scaleGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
    },
    scaleOption: {
        background: 'white',
        border: '2px solid #e5e7eb',
        borderRadius: '6px',
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        textAlign: 'center',
    },
    scaleOptionSelected: {
        borderColor: '#3b82f6',
    },
}

export default Table;