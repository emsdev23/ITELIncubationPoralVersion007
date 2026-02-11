import React from "react";
import "./MentorAssociation.css"; // page-specific CSS
import styles from "../Navbar.module.css"; // CSS module for scoped styles
import ITELLogo from "../../assets/ITEL_Logo.png"; // Logo image
import { NavLink } from "react-router-dom";
import { FolderDown, MoveLeft } from "lucide-react"; // Icon for the button
import MentorAssociationTable from "./MentorAssociationTable";
import { IPAdress } from "../Datafetching/IPAdrees";

export default function MentorAssociation() {
  return (
    <div className="doc-management-page">
      <main className="doc-management-main" style={{ paddingTop: "100px" }}>
        <h1>🔗 Mentor Associations Management</h1>
        <section className="doccat-section">
          <MentorAssociationTable />
        </section>
      </main>
    </div>
  );
}
