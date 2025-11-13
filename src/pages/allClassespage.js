import React, { useState, useEffect } from "react";
import axios from "axios";
import "../Style/allClassesPage.css";

function AllClassesPage() {
  const [data, setData] = useState([]); // API response [{model, classes}]
  const [selectedModel, setSelectedModel] = useState(null);
  const [displayedClasses, setDisplayedClasses] = useState([]);

  const fetchClasses = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/cmdb/models");
      setData(res.data.results || []);
      // show all classes by default
      const allClasses = res.data.results.flatMap((item) => item.classes);
      setDisplayedClasses(allClasses);
    } catch (err) {
      console.error("Error fetching classes:", err);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleModelClick = (model) => {
    setSelectedModel(model);
    const modelData = data.find((d) => d.model === model);
    setDisplayedClasses(modelData ? modelData.classes : []);
  };

  const handleShowAll = () => {
    setSelectedModel(null);
    const allClasses = data.flatMap((item) => item.classes);
    setDisplayedClasses(allClasses);
  };

  return (
    <div className="all-classes-container">
      {/* Sidebar */}
      <div className="sidebar">
        <h3>Models</h3>
        <ul className="model-list">
          {data.map((item, index) => (
            <li
              key={index}
              className={selectedModel === item.model ? "model-item selected" : "model-item"}
              onClick={() => handleModelClick(item.model)}
            >
              {item.model}
            </li>
          ))}
        </ul>
        <div className="show-all" onClick={handleShowAll}>
          Show All
        </div>
      </div>

      {/* Main Area */}
      <div className="main-area">
        <h3>{selectedModel ? `Classes for "${selectedModel}"` : "All Classes"}</h3>
        <div className="class-grid">
          {displayedClasses.length > 0 ? (
            displayedClasses.map((cls, idx) => (
              <div key={idx} className="class-card">
                {cls}
              </div>
            ))
          ) : (
            <p>No classes available.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AllClassesPage;
