import React, { useState } from "react";
import "./DocumentAccessManagement.css"; // page-specific CSS
import styles from "../Navbar.module.css"; // CSS module for scoped styles
import ITELLogo from "../../assets/ITEL_Logo.png"; // Logo image
import { NavLink } from "react-router-dom";
import { FolderDown, MoveLeft } from "lucide-react"; // Icon for the button
import CollectedDocumentsTable from "./CollectedDocumentsTable";

export default function DocumentAccessManagement() {
  return (
    <div className="doc-management-page">
      <main className="doc-management-main" style={{ paddingTop: "200px" }}>
        <h1>Document Access Management</h1>

        {/* Tab Content */}
        <div className="tab-content">
          <div className="documents-container">
            {/* Document Categories Table */}
            <section className="doccat-section">
              <CollectedDocumentsTable />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
