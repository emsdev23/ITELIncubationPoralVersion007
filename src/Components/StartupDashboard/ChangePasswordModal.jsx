import React, { useState } from "react";
import styles from "./ChangePasswordModal.module.css";
import api from "../Datafetching/api"; // Axios instance
import Swal from "sweetalert2";
import { Eye, EyeOff, Lock, User } from "lucide-react";

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const EmailID = sessionStorage.getItem("email");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: EmailID,
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
    captcha: "",
  });

  const [captchaText, setCaptchaText] = useState(generateCaptcha());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function generateCaptcha() {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();

  //   if (!formData.email) {
  //     setError("Email is required.");
  //     return;
  //   }

  //   if (formData.newPassword !== formData.confirmPassword) {
  //     setError("New password and confirm password do not match.");
  //     return;
  //   }

  //   if (formData.captcha.toUpperCase() !== captchaText) {
  //     setError("Captcha does not match.");
  //     return;
  //   }

  //   setLoading(true);

  //   try {
  //     const response = await api.post("/generic/changepassword", {
  //       email: formData.email,
  //       oldPassword: formData.oldPassword,
  //       newPassword: formData.newPassword,
  //     });

  //     if (response.data.statusCode === 200) {
  //       Swal.fire({
  //         icon: "success",
  //         title: "Success!",
  //         text: "Password changed successfully. Please login again.",
  //         confirmButtonColor: "#3085d6",
  //         confirmButtonText: "OK",
  //       }).then(() => {
  //         sessionStorage.clear();
  //         window.location.href = "/";
  //       });
  //     } else {
  //       setError(response.data.message || "Failed to change password");
  //     }
  //   } catch (err) {
  //     if (err.response) {
  //       setError(err.response.data?.message || "Authentication error");
  //     } else {
  //       setError("Network error: " + err.message);
  //     }
  //   } finally {
  //     setLoading(false);
  //     setCaptchaText(generateCaptcha());
  //     setFormData({ ...formData, captcha: "" });
  //   }
  // };

  // after encrypted password api call
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email) {
      setError("Email is required.");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (formData.captcha.toUpperCase() !== captchaText) {
      setError("Captcha does not match.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post("/generic/changepassword", {
        email: formData.email,
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
      });

      if (response.data.statusCode === 200) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Password changed successfully. Please login again.",
          confirmButtonColor: "#3085d6",
          confirmButtonText: "OK",
        }).then(() => {
          sessionStorage.clear();
          window.location.href = "/";
        });
      } else {
        setError(response.data.message || "Failed to change password");
      }
    } catch (err) {
      console.error("Error changing password:", err);

      // Handle different types of errors
      if (err.response) {
        // Server responded with an error status
        setError(err.response.data?.message || "Authentication error");
      } else if (err.request) {
        // Request was made but no response received
        setError("Network error: No response from server");
      } else {
        // Something else happened
        setError(err.message || "Network error: " + err.message);
      }
    } finally {
      setLoading(false);
      setCaptchaText(generateCaptcha());
      setFormData({ ...formData, captcha: "" });
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <h2>Change Password ?</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* <label>
            Email
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </label> */}

          <label>
            Old Password
            <div className={styles.passwordField}>
              <input
                type={showPassword ? "text" : "password"}
                name="oldPassword"
                value={formData.oldPassword}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.eyeButton}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          <label>
            New Password
            <div className={styles.passwordField}>
              <input
                type={showPassword ? "text" : "password"}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.eyeButton}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <label>
            Confirm New Password
            <div className={styles.passwordField}>
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.eyeButton}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <label>
            Captcha
            <div className={styles.captchaContainer}>
              <span className={styles.captchaText}>{captchaText}</span>
              <button
                type="button"
                className={styles.refreshCaptcha}
                onClick={() => setCaptchaText(generateCaptcha())}
              >
                ↻
              </button>
            </div>
            <input
              type="text"
              name="captcha"
              value={formData.captcha}
              onChange={handleChange}
              required
              placeholder="Enter captcha"
              className={styles.captchaInput}
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? "Changing..." : "Change Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
