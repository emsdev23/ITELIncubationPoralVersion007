import React, { useState, useEffect } from "react";
import "./EditMentorModal.css";

const EditMentorModal = ({ mentor, onClose, onUpdate, isUpdating }) => {
  const [formData, setFormData] = useState({
    mentordetsid: "",
    mentordetsincubatorid: "",
    mentordetsmnttypeid: "",
    mentordetsname: "",
    mentordetsdesign: "",
    mentordetsphone: "",
    mentordetsaddress: "",
    mentordetsemail: "",
    mentordetsdomain: "",
    mentordetspastexp: "",
    mentordetslinkedin: "",
    mentordetswebsite: "",
    mentordetsblog: "",
    mentordetsimagepath: "",
    mentordetstimecommitment: "",
    mentordetsprevstupmentor: "",
    mentordetscomment: "",
    mentordetsadminstate: "",
  });

  useEffect(() => {
    if (mentor) {
      setFormData({
        mentordetsid: mentor.mentordetsid || "",
        mentordetsincubatorid: mentor.mentordetsincubatorid || "",
        mentordetsmnttypeid: mentor.mentordetsmnttypeid || "",
        mentordetsname: mentor.mentordetsname || "",
        mentordetsdesign: mentor.mentordetsdesign || "",
        mentordetsphone: mentor.mentordetsphone || "",
        mentordetsaddress: mentor.mentordetsaddress || "",
        mentordetsemail: mentor.mentordetsemail || "",
        mentordetsdomain: mentor.mentordetsdomain || "",
        mentordetspastexp: mentor.mentordetspastexp || "",
        mentordetslinkedin: mentor.mentordetslinkedin || "",
        mentordetswebsite: mentor.mentordetswebsite || "",
        mentordetsblog: mentor.mentordetsblog || "",
        mentordetsimagepath: mentor.mentordetsimagepath || "",
        mentordetstimecommitment: mentor.mentordetstimecommitment || "",
        mentordetsprevstupmentor: mentor.mentordetsprevstupmentor || "",
        mentordetscomment: mentor.mentordetscomment || "",
        mentordetsadminstate: mentor.mentordetsadminstate || "",
      });
    }
  }, [mentor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Edit Mentor Profile</h2>
          <button className="close-btn" onClick={onClose} disabled={isUpdating}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="mentordetsname">Name</label>
              <input
                type="text"
                id="mentordetsname"
                name="mentordetsname"
                value={formData.mentordetsname}
                onChange={handleChange}
                disabled={isUpdating}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="mentordetsdesign">Designation</label>
              <input
                type="text"
                id="mentordetsdesign"
                name="mentordetsdesign"
                value={formData.mentordetsdesign}
                onChange={handleChange}
                disabled={isUpdating}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="mentordetsphone">Phone</label>
              <input
                type="tel"
                id="mentordetsphone"
                name="mentordetsphone"
                value={formData.mentordetsphone}
                onChange={handleChange}
                disabled={isUpdating}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="mentordetsemail">Email</label>
              <input
                type="email"
                id="mentordetsemail"
                name="mentordetsemail"
                value={formData.mentordetsemail}
                onChange={handleChange}
                disabled={isUpdating}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="mentordetsdomain">Domain</label>
              <input
                type="text"
                id="mentordetsdomain"
                name="mentordetsdomain"
                value={formData.mentordetsdomain}
                onChange={handleChange}
                disabled={isUpdating}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="mentordetstimecommitment">Time Commitment</label>
              <input
                type="text"
                id="mentordetstimecommitment"
                name="mentordetstimecommitment"
                value={formData.mentordetstimecommitment}
                onChange={handleChange}
                disabled={isUpdating}
                required
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="mentordetsaddress">Address</label>
              <input
                type="text"
                id="mentordetsaddress"
                name="mentordetsaddress"
                value={formData.mentordetsaddress}
                onChange={handleChange}
                disabled={isUpdating}
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="mentordetspastexp">Past Experience</label>
              <textarea
                id="mentordetspastexp"
                name="mentordetspastexp"
                value={formData.mentordetspastexp}
                onChange={handleChange}
                disabled={isUpdating}
                rows="3"
              ></textarea>
            </div>

            <div className="form-group full-width">
              <label htmlFor="mentordetslinkedin">LinkedIn Profile</label>
              <input
                type="url"
                id="mentordetslinkedin"
                name="mentordetslinkedin"
                value={formData.mentordetslinkedin}
                onChange={handleChange}
                disabled={isUpdating}
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="mentordetswebsite">Website</label>
              <input
                type="url"
                id="mentordetswebsite"
                name="mentordetswebsite"
                value={formData.mentordetswebsite}
                onChange={handleChange}
                disabled={isUpdating}
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="mentordetsblog">Blog</label>
              <input
                type="url"
                id="mentordetsblog"
                name="mentordetsblog"
                value={formData.mentordetsblog}
                onChange={handleChange}
                disabled={isUpdating}
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="mentordetscomment">Comments</label>
              <textarea
                id="mentordetscomment"
                name="mentordetscomment"
                value={formData.mentordetscomment}
                onChange={handleChange}
                disabled={isUpdating}
                rows="3"
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="mentordetsprevstupmentor">
                Previous Startup Mentor
              </label>
              <select
                id="mentordetsprevstupmentor"
                name="mentordetsprevstupmentor"
                value={formData.mentordetsprevstupmentor}
                onChange={handleChange}
                disabled={isUpdating}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="mentordetsadminstate">Status</label>
              <select
                id="mentordetsadminstate"
                name="mentordetsadminstate"
                value={formData.mentordetsadminstate}
                onChange={handleChange}
                disabled={isUpdating}
              >
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={isUpdating}
            >
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <span className="spinner"></span>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMentorModal;
