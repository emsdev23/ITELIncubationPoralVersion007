// ResetPassword.js
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import styles from "./ResetPassword.module.css";
import Swal from "sweetalert2";
import api from "../Datafetching/api";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tokenValid, setTokenValid] = useState(null);
  const [email, setEmail] = useState("");

  // Extract token and email from URL
  const token = searchParams.get("token");
  const urlEmail = searchParams.get("email");

  useEffect(() => {
    // Set email from URL
    if (urlEmail) {
      setEmail(decodeURIComponent(urlEmail));
    }

    // For now, we'll assume the token is valid without verifying it first
    // We'll let the backend validate it when the user submits the form
    if (token && urlEmail) {
      setTokenValid(true);
    } else {
      setTokenValid(false);
      setError("Missing required parameters");
    }
  }, [token, urlEmail]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!newPassword || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Password strength validation (matching your Java backend requirements)
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasDigit = /[0-9]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-\\[\];'/+=~`]/.test(
      newPassword
    );
    const hasLength = newPassword.length >= 8;

    if (!(hasUpper && hasLower && hasDigit && hasSpecial && hasLength)) {
      setError(
        "Password must meet all criteria: 8+ characters, uppercase, lowercase, digit, and special character."
      );
      return;
    }

    setLoading(true);

    try {
      // Use the same endpoint as your JSP page
      const response = await api.post("/resources/auth/reset-password", {
        token,
        email: email, // Use the decoded email
        newPassword,
      });

      if (response.data.statusCode === 200) {
        Swal.fire({
          icon: "success",
          title: "Password Reset Successful",
          text: "Your password has been reset successfully. You can now log in with your new password.",
          confirmButtonColor: "#3085d6",
        }).then(() => {
          navigate("/login");
        });
      } else {
        setError(response.data.message || "Failed to reset password.");
      }
    } catch (err) {
      console.error("Reset password error:", err);
      if (err.response?.status === 401) {
        setError(
          "Invalid or expired reset token. Please request a new password reset."
        );
      } else {
        setError(
          err.response?.data?.message ||
            "An error occurred while resetting your password. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (tokenValid === false) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠</div>
        <h2>Invalid Reset Link</h2>
        <p>{error}</p>
        <button
          onClick={() => navigate("/login")}
          className={styles.backButton}
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className={styles.resetPasswordContainer}>
      <div className={styles.resetPasswordCard}>
        <h1>Reset Your Password</h1>
        <p>Enter your new password below for account: {email}</p>

        <form onSubmit={handleSubmit} className={styles.resetForm}>
          <div className={styles.formGroup}>
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter your new password"
              disabled={loading}
              required
            />
            <div className={styles.passwordCriteria}>
              <p>Password must contain:</p>
              <ul>
                <li className={newPassword.length >= 8 ? styles.valid : ""}>
                  At least 8 characters
                </li>
                <li className={/[A-Z]/.test(newPassword) ? styles.valid : ""}>
                  One uppercase letter
                </li>
                <li className={/[a-z]/.test(newPassword) ? styles.valid : ""}>
                  One lowercase letter
                </li>
                <li className={/[0-9]/.test(newPassword) ? styles.valid : ""}>
                  One number
                </li>
                <li
                  className={
                    /[!@#$%^&*(),.?":{}|<>_\-\\[\];'/+=~`]/.test(newPassword)
                      ? styles.valid
                      : ""
                  }
                >
                  One special character
                </li>
              </ul>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              disabled={loading}
              required
            />
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
