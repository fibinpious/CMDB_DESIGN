import React, { useState } from "react";
import "../Style/cmdbForm.css";
import { useNavigate } from "react-router-dom";
import OpenAI from "openai";

const CMDBForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    purpose: "",
    ciTypes: "",
    additionalNotes: "",
  });

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const openai = new OpenAI({
    apiKey:`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` , 
    dangerouslyAllowBrowser: true, // ⚠️ only for local testing
  });

  const questions = [
    {
      name: "purpose",
      label: "Please specify your role within the organization",
      placeholder: "speecify role",
      icon: "📊",
    },
    {
      name: "ciTypes",
      label: "Describe your vision of an ideal Configuration Management Database (CMDB). What key capabilities or insights should it provide to effectively support your role and organizational goals?",
      placeholder: "e.g., Servers, applications, networks, databases...",
      icon: "⚡",
    },
    {
      name: "additionalNotes",
      label: "What current challenges or limitations do you experience with tracking, managing, or analyzing configuration data?",
      placeholder: "Share any specific needs or integration requirements...",
      icon: "✨",
      multiline: true,
    },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (value && !completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = async() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {  // ✅ async and receive event
    e.preventDefault();
    setLoading(true);

    try {
     
      const response = await openai.responses.create({
        model: "gpt-4.1",
        input: `You are a cmdb designere from the inputs from user derive 5 root cmdb_ci classes. use classes that exsist in servicenow or from CSDM% suggested classes do not go for custom classes that can be used for them just provide the class and its description nothing else:  ${JSON.stringify(formData)}`,
      });
  
      const message = response.output[0].content[0].text;
  
      // ✅ Navigate to survey with GPT result
      navigate("/survey", { state: { apiResponse: message } });
    } catch (error) {
      console.error("API Error:", error);
      alert("Something went wrong calling ChatGPT!");
    } finally {
      setLoading(false);
    }
  }

  const currentQuestion = questions[currentStep];
  const isStepComplete = formData[currentQuestion.name]?.trim().length > 0;

  return (
    <div className="container">
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="content-wrapper">
        <div className="header">
          <div className="header-icon">
            <span>🗄️</span>
          </div>
          <h1 className="title">Create Your CMDB Plan</h1>
          <p className="subtitle">Answer a few questions to get started</p>
        </div>

        <div className="progress-section">
          <div className="progress-steps">
            {questions.map((q, idx) => (
              <React.Fragment key={idx}>
                <div className={`step-indicator ${idx < currentStep ? 'completed' : idx === currentStep ? 'active' : ''}`}>
                  {idx < currentStep ? '✓' : idx + 1}
                </div>
                {idx < questions.length - 1 && (
                  <div className="progress-line">
                    <div className={`progress-fill ${idx < currentStep ? 'filled' : ''}`}></div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="step-counter">
            Step {currentStep + 1} of {questions.length}
          </div>
        </div>

        <div className="form-card">
          <div className="question-section">
            <div className="question-header">
              <div className="question-icon">
                <span>{currentQuestion.icon}</span>
              </div>
              <div className="question-content">
                <h2 className="question-label">{currentQuestion.label}</h2>
                <div className="underline"></div>
              </div>
            </div>

            <div className="input-wrapper">
              {currentQuestion.multiline ? (
                <div className="textarea-container">
                  <textarea
                    name={currentQuestion.name}
                    value={formData[currentQuestion.name]}
                    onChange={handleChange}
                    placeholder={currentQuestion.placeholder}
                    rows={5}
                    className="input-field textarea-field"
                  />
                  {formData[currentQuestion.name] && (
                    <div className="char-count">
                      {formData[currentQuestion.name].length} characters
                    </div>
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  name={currentQuestion.name}
                  value={formData[currentQuestion.name]}
                  onChange={handleChange}
                  placeholder={currentQuestion.placeholder}
                  className="input-field text-field"
                />
              )}
            </div>

            {isStepComplete && (
              <div className="completion-indicator">
                <span className="check-icon">✓</span>
                <span className="completion-text">Great! Ready to continue</span>
              </div>
            )}
          </div>

          <div className="navigation-buttons">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`btn btn-secondary ${currentStep === 0 ? 'disabled' : ''}`}
            >
              ← Previous
            </button>

            {currentStep < questions.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!isStepComplete}
                className={`btn btn-primary ${!isStepComplete ? 'disabled' : ''}`}
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !isStepComplete}
                className={`btn btn-success ${loading || !isStepComplete ? 'disabled' : ''}`}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Generating...
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    Generate My Plan
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="footer-text">
          Your data is secure and will be used only to create your custom CMDB plan
        </div>
      </div>

    </div>
  );
};

export default CMDBForm;