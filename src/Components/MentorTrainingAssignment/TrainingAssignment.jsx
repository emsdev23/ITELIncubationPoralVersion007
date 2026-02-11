import React, { useRef } from "react";
import "./TrainingAssignment.css"; // page-specific CSS
import styles from "../Navbar.module.css"; // CSS module for scoped styles
import ITELLogo from "../../assets/ITEL_Logo.png"; // Logo image
import { NavLink } from "react-router-dom";
import { FolderDown, MoveLeft } from "lucide-react"; // Icon for the button
import TrainingAssociationTable from "./TrainingAssociationTable";
import TrainingModule from "./TrainingModule";
import { IPAdress } from "../Datafetching/IPAdrees";

export default function TrainingAssignment() {
  // Create a ref to access the TrainingAssociationTable methods
  const associationTableRef = useRef(null);

  // This function will be called by TrainingModule when assignment is successful
  const handleAssignmentSuccess = () => {
    if (associationTableRef.current) {
      associationTableRef.current.refresh();
    }
  };

  return (
    <div className="doc-management-page">
      <main className="doc-management-main" style={{ paddingTop: "100px" }}>
        <h1>🔗 Training Assignment Management</h1>
        <section className="doccat-section">
          {/* Pass the callback to TrainingModule */}
          <TrainingModule onAssignSuccess={handleAssignmentSuccess} />
        </section>
        <section className="doccat-section">
          {/* Pass the ref to TrainingAssociationTable */}
          <TrainingAssociationTable ref={associationTableRef} />
        </section>
      </main>
    </div>
  );
}