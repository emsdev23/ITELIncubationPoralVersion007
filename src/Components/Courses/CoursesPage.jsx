import React from "react";
import CoursesTable from "./CoursesTable.jsx"; // Importing the CoursesTable component
import "./CoursesPage.css"; // page-specific CSS
import styles from "../Navbar.module.css"; // CSS module for scoped styles
import ITELLogo from "../../assets/ITEL_Logo.png"; // Logo image
import { NavLink } from "react-router-dom";
import { FolderDown, MoveLeft } from "lucide-react"; // Icon for the button

export default function CoursesPage() {
  return (
    <div className="doc-management-page">
      <main className="doc-management-main" style={{ paddingTop: "100px" }}>

        <section className="doccat-section">
          < CoursesTable/>
        </section>
      </main>
    </div>
  );
}
