import React, { useState } from "react";
import TrainingSubCatTable from "./TrainingSubCatTable";
import TrainingCatTable from "./TrainingCatTable";
import TrainingModule from "./TrainingModule";
import TrainingMaterialType from "./TrainingMaterialType";
import "./TrainingManagementPage.css";
import styles from "../Navbar.module.css"; // CSS module for scoped styles
import ITELLogo from "../../assets/ITEL_Logo.png"; // Logo image
import { NavLink } from "react-router-dom";
import { DataContext } from "../Datafetching/DataProvider";

export default function DocumentManagementPage() {
  const [activeTab, setActiveTab] = useState("documents"); // State to track active tab

  const tabs = [
    { id: "documents", label: "Training Management" },
    { id: "ddiDocuments", label: "Training Type Management" },
  ];

  return (
    <div className="doc-management-page">
      <main className="doc-management-main" style={{ paddingTop: "100px" }}>
        <h1>Training Module Management</h1>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === "documents" ? (
            <div className="documents-container">
              {/* Document Categories Table */}
              <section className="doccat-section">
                <TrainingCatTable />
              </section>

              {/* Document Subcategories Table */}
              <section className="docsubcat-section">
                <TrainingSubCatTable />
              </section>

              {/* Documents Table */}
              <section className="documents-section">
                <TrainingModule />
              </section>
            </div>
          ) : (
            <div className="ddi-documents-container">
              <TrainingMaterialType />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
