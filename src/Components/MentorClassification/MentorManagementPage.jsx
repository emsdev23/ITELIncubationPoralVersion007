import React, { useState } from "react";
import "./MentorManagementPage.css"; // page-specific CSS
import styles from "../Navbar.module.css"; // CSS module for scoped styles
import ITELLogo from "../../assets/ITEL_Logo.png"; // Logo image
import { NavLink } from "react-router-dom";
import { FolderDown, MoveLeft } from "lucide-react"; // Icon for the button
import MentorClassificationTable from "./MentorClassificationTable";
import MentorTable from "./MentorTable";
import MentorTypeTable from "./MentorTypeTable";

export default function MentorManagementPage() {
  const [activeTab, setActiveTab] = useState("documents"); // State to track active tab

  const tabs = [
    { id: "documents", label: "Mentor Management" },
    { id: "ddiDocuments", label: "Mentor Classification & Type Management" },
  ];

  return (
    <div className="doc-management-page">
      <main className="doc-management-main" style={{ paddingTop: "100px" }}>
        <h1>Mentor Management</h1>

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
                <MentorTable />
              </section>
            </div>
          ) : (
            <div className="ddi-documents-container">
              <MentorClassificationTable />
              <MentorTypeTable />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
