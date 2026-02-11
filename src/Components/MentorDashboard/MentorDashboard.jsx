import React, { useState, useEffect, useContext } from "react";
import "./MentorDashboard.css";
import EditMentorModal from "./EditMentorModal";
import api from "../Datafetching/api";
import { DataContext } from "../Datafetching/DataProvider";
import { CircleFadingPlus } from "lucide-react";

const MentorDashboard = () => {
  const [mentors, setMentors] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { roleid, userid, incuserid } = useContext(DataContext);

  // Fetch mentors from API using your API format
  useEffect(() => {
    const fetchMentors = async () => {
      try {
        setLoading(true);
        const response = await api.post(
          "/resources/generic/getmentordetails",
          {
            userId: "ALL",
            incUserId: incuserid,
          },
          {
            headers: {
              userid: userid,
            },
          },
        );

        if (response.data.statusCode === 200) {
          setMentors(response.data.data);
          if (response.data.data.length > 0) {
            setSelectedMentor(response.data.data[0]);
          }
        } else {
          setError("Failed to fetch mentors");
        }
      } catch (err) {
        setError("Error fetching mentor data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, [userid]);

  // Get initials from name
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate gradient colors based on ID
  const getGradientColor = (id) => {
    const colors = [
      "gradient-blue",
      "gradient-purple",
      "gradient-emerald",
      "gradient-orange",
      "gradient-pink",
      "gradient-teal",
    ];
    return colors[id % colors.length];
  };

  const filteredMentors = mentors.filter(
    (mentor) =>
      mentor.mentordetsname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.mentordetsdomain.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleEditMentor = () => {
    setIsEditModalOpen(true);
  };

  const handleUpdateMentor = async (updatedMentor) => {
    try {
      const response = await api.post(
        "/updateMentor",
        {
          mentordetsid: updatedMentor.mentordetsid,
          mentordetsincubatorid: updatedMentor.mentordetsincubatorid,
          mentordetsmnttypeid: updatedMentor.mentordetsmnttypeid,
          mentordetsname: updatedMentor.mentordetsname,
          mentordetsdesign: updatedMentor.mentordetsdesign,
          mentordetsphone: updatedMentor.mentordetsphone,
          mentordetsaddress: updatedMentor.mentordetsaddress,
          mentordetsemail: updatedMentor.mentordetsemail,
          mentordetsdomain: updatedMentor.mentordetsdomain,
          mentordetspastexp: updatedMentor.mentordetspastexp,
          mentordetslinkedin: updatedMentor.mentordetslinkedin,
          mentordetswebsite: updatedMentor.mentordetswebsite,
          mentordetsblog: updatedMentor.mentordetsblog,
          mentordetsimagepath: updatedMentor.mentordetsimagepath,
          mentordetstimecommitment: updatedMentor.mentordetstimecommitment,
          mentordetsprevstupmentor: updatedMentor.mentordetsprevstupmentor,
          mentordetscomment: updatedMentor.mentordetscomment,
          mentordetsadminstate: updatedMentor.mentordetsadminstate,
          mentordetsmodifiedby: userid,
        },
        {
          headers: {
            userid: userid,
          },
        },
      );

      if (response.data.statusCode === 200) {
        // Update the mentor in the local state
        setMentors((prevMentors) =>
          prevMentors.map((mentor) =>
            mentor.mentordetsid === updatedMentor.mentordetsid
              ? { ...mentor, ...updatedMentor }
              : mentor,
          ),
        );

        // Update the selected mentor if it's the one being edited
        if (selectedMentor.mentordetsid === updatedMentor.mentordetsid) {
          setSelectedMentor({ ...selectedMentor, ...updatedMentor });
        }

        setIsEditModalOpen(false);
      } else {
        setError("Failed to update mentor");
      }
    } catch (err) {
      setError("Error updating mentor");
      console.error(err);
    }
  };

  // Shimmer loading component
  const ShimmerLoader = () => (
    <div className="dashboard-container">
      {/* Header Shimmer */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <div className="shimmer h-8 w-64 mb-2"></div>
            <div className="shimmer h-4 w-80"></div>
          </div>
          <div className="header-stats">
            <div className="shimmer stat-card h-20 w-24"></div>
            <div className="shimmer stat-card h-20 w-24"></div>
          </div>
        </div>
      </header>

      {/* Main Content Shimmer */}
      <div className="main-content">
        <div className="content-grid">
          {/* Left Sidebar - Mentor List Shimmer */}
          <div className="sidebar">
            {/* Search Box Shimmer */}
            <div className="search-container">
              <div className="shimmer h-10 w-full rounded-lg"></div>
            </div>

            {/* Mentor Cards List Shimmer */}
            <div className="mentor-list">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="mentor-card">
                  <div className="mentor-card-content">
                    <div className="shimmer mentor-avatar"></div>
                    <div className="mentor-info">
                      <div className="shimmer h-5 w-40 mb-2"></div>
                      <div className="shimmer h-4 w-32 mb-2"></div>
                      <div className="flex gap-2">
                        <div className="shimmer h-5 w-16 rounded-full"></div>
                        <div className="shimmer h-5 w-16 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Selected Mentor Details Shimmer */}
          <div className="details-section">
            {/* Mentor Profile Header Shimmer */}
            <div className="profile-header">
              <div className="shimmer profile-banner"></div>
              <div className="profile-content">
                <div className="profile-main">
                  <div className="shimmer profile-avatar"></div>
                  <div className="profile-text">
                    <div className="shimmer h-8 w-64 mb-2"></div>
                    <div className="shimmer h-5 w-48 mb-3"></div>
                    <div className="flex gap-2">
                      <div className="shimmer h-6 w-20 rounded-full"></div>
                      <div className="shimmer h-6 w-20 rounded-full"></div>
                      <div className="shimmer h-6 w-20 rounded-full"></div>
                    </div>
                  </div>
                  <div className="shimmer h-10 w-32 rounded-lg"></div>
                </div>
              </div>
            </div>

            {/* Contact and Online Presence Shimmer */}
            <div className="info-grid">
              {/* Contact Information Shimmer */}
              <div className="info-card">
                <div className="shimmer h-6 w-40 mb-4"></div>
                <div className="info-list">
                  <div className="info-item">
                    <div className="shimmer info-icon"></div>
                    <div className="info-details">
                      <div className="shimmer h-3 w-12 mb-1"></div>
                      <div className="shimmer h-4 w-full"></div>
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="shimmer info-icon"></div>
                    <div className="info-details">
                      <div className="shimmer h-3 w-12 mb-1"></div>
                      <div className="shimmer h-4 w-full"></div>
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="shimmer info-icon"></div>
                    <div className="info-details">
                      <div className="shimmer h-3 w-12 mb-1"></div>
                      <div className="shimmer h-4 w-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Online Presence Shimmer */}
              <div className="info-card">
                <div className="shimmer h-6 w-40 mb-4"></div>
                <div className="info-list">
                  <div className="shimmer h-14 w-full rounded-lg mb-3"></div>
                  <div className="shimmer h-14 w-full rounded-lg mb-3"></div>
                  <div className="shimmer h-14 w-full rounded-lg"></div>
                </div>
              </div>
            </div>

            {/* Professional Details Shimmer */}
            <div className="professional-section">
              <div className="shimmer h-6 w-48 mb-4"></div>
              <div className="professional-grid">
                <div className="shimmer detail-box h-24"></div>
                <div className="shimmer detail-box h-24"></div>
                <div className="shimmer detail-box h-24"></div>
                <div className="shimmer detail-box h-24"></div>
              </div>
            </div>

            {/* Record Information Shimmer */}
            <div className="record-section">
              <div className="shimmer h-6 w-48 mb-4"></div>
              <div className="record-grid">
                <div className="record-box">
                  <div className="shimmer h-3 w-20 mb-2"></div>
                  <div className="shimmer h-4 w-32 mb-1"></div>
                  <div className="shimmer h-3 w-24"></div>
                </div>
                <div className="record-box">
                  <div className="shimmer h-3 w-24 mb-2"></div>
                  <div className="shimmer h-4 w-32 mb-1"></div>
                  <div className="shimmer h-3 w-24"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <ShimmerLoader />;
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      {/* <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <div>
              <h1 className="header-title">Mentor Dashboard</h1>
              <p className="header-subtitle">
                Immersive Technology and Entrepreneurship Labs
              </p>
            </div>
          </div>

          <div className="header-stats">
            <div className="stat-card stat-blue">
              <div className="stat-number">{mentors.length}</div>
              <div className="stat-label">Total Mentors</div>
            </div>
            <div className="stat-card stat-green">
              <div className="stat-number">
                {mentors.filter((m) => m.mentordetsadminstate === 1).length}
              </div>
              <div className="stat-label">Active</div>
            </div>
          </div>
        </div>
      </header> */}

      {/* Main Content */}
      <div className="main-content">
        <div>
          {/* Left Sidebar - Mentor List */}

          {/* Right Content - Selected Mentor Details */}
          <div className="details-section">
            {selectedMentor && (
              <>
                {/* Mentor Profile Header */}
                <div className="profile-header">
                  <div
                    className={`profile-banner ${
                      selectedMentor.mentordetsid % 2 === 0
                        ? "banner-blue"
                        : "banner-green"
                    }`}
                  ></div>

                  <div className="profile-content">
                    <div className="profile-main">
                      <div
                        className={`profile-avatar ${getGradientColor(
                          selectedMentor.mentordetsid,
                        )}`}
                      >
                        {getInitials(selectedMentor.mentordetsname)}
                      </div>

                      <div className="profile-text">
                        <h2 className="profile-name">
                          {selectedMentor.mentordetsname}
                        </h2>
                        <p className="profile-designation">
                          {selectedMentor.mentordetsdesign}
                        </p>
                        {/* Only show badges if at least one exists */}
                        {(selectedMentor.mentorclasssetname ||
                          selectedMentor.mentortypename ||
                          selectedMentor.mentordetsdomain) && (
                          <div className="profile-badges">
                            {selectedMentor.mentorclasssetname && (
                              <span className="badge badge-blue">
                                {selectedMentor.mentorclasssetname}
                              </span>
                            )}
                            {selectedMentor.mentortypename && (
                              <span className="badge badge-purple">
                                {selectedMentor.mentortypename}
                              </span>
                            )}
                            {selectedMentor.mentordetsdomain && (
                              <span className="badge badge-green">
                                {selectedMentor.mentordetsdomain}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        className="edit-profile-btn"
                        onClick={handleEditMentor}
                      >
                        <CircleFadingPlus className="w-4 h-4" />
                        Edit Profile
                      </button>
                    </div>
                  </div>
                </div>

                {/* Contact and Online Presence */}
                <div className="info-grid">
                  {/* Contact Information */}
                  <div className="info-card">
                    <h3 className="info-title">
                      <span className="icon">✉️</span>
                      Contact Information
                    </h3>

                    <div className="info-list">
                      {selectedMentor.mentordetsemail && (
                        <div className="info-item">
                          <div className="info-icon icon-blue">✉️</div>
                          <div className="info-details">
                            <p className="info-label">Email</p>
                            <p className="info-value">
                              {selectedMentor.mentordetsemail}
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedMentor.mentordetsphone && (
                        <div className="info-item">
                          <div className="info-icon icon-green">📞</div>
                          <div className="info-details">
                            <p className="info-label">Phone</p>
                            <p className="info-value">
                              {selectedMentor.mentordetsphone}
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedMentor.mentordetsaddress && (
                        <div className="info-item">
                          <div className="info-icon icon-orange">📍</div>
                          <div className="info-details">
                            <p className="info-label">Address</p>
                            <p className="info-value">
                              {selectedMentor.mentordetsaddress}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Online Presence - Only show if at least one link exists */}
                  {(selectedMentor.mentordetslinkedin ||
                    selectedMentor.mentordetswebsite ||
                    selectedMentor.mentordetsblog) && (
                    <div className="info-card">
                      <h3 className="info-title">
                        <span className="icon">🌐</span>
                        Online Presence
                      </h3>

                      <div className="info-list">
                        {selectedMentor.mentordetslinkedin && (
                          <a
                            href={
                              selectedMentor.mentordetslinkedin.startsWith(
                                "http",
                              )
                                ? selectedMentor.mentordetslinkedin
                                : `https://${selectedMentor.mentordetslinkedin}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link-item link-blue"
                          >
                            <div className="link-icon">💼</div>
                            <div className="link-details">
                              <p className="link-label">LinkedIn</p>
                              <p className="link-text">View Profile</p>
                            </div>
                            <span className="link-arrow">→</span>
                          </a>
                        )}

                        {selectedMentor.mentordetswebsite && (
                          <a
                            href={
                              selectedMentor.mentordetswebsite.startsWith(
                                "http",
                              )
                                ? selectedMentor.mentordetswebsite
                                : `https://${selectedMentor.mentordetswebsite}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link-item link-purple"
                          >
                            <div className="link-icon">🌐</div>
                            <div className="link-details">
                              <p className="link-label">Website</p>
                              <p className="link-text">Visit Website</p>
                            </div>
                            <span className="link-arrow">→</span>
                          </a>
                        )}

                        {selectedMentor.mentordetsblog && (
                          <a
                            href={
                              selectedMentor.mentordetsblog.startsWith("http")
                                ? selectedMentor.mentordetsblog
                                : `https://${selectedMentor.mentordetsblog}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link-item link-green"
                          >
                            <div className="link-icon">📚</div>
                            <div className="link-details">
                              <p className="link-label">Blog</p>
                              <p className="link-text">Read Articles</p>
                            </div>
                            <span className="link-arrow">→</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Professional Details */}
                <div className="professional-section">
                  <h3 className="section-title">
                    <span className="icon">💼</span>
                    Professional Details
                  </h3>

                  <div className="professional-grid">
                    {selectedMentor.mentordetspastexp && (
                      <div className="detail-box box-indigo">
                        <div className="detail-header">
                          <span className="detail-icon">🏆</span>
                          <p className="detail-label">Past Experience</p>
                        </div>
                        <div className="detail-text-container">
                          <p className="detail-text">
                            {selectedMentor.mentordetspastexp}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedMentor.mentordetstimecommitment && (
                      <div className="detail-box box-purple">
                        <div className="detail-header">
                          <span className="detail-icon">⏰</span>
                          <p className="detail-label">Time Commitment</p>
                        </div>
                        <div className="detail-text-container">
                          <p className="detail-text">
                            {selectedMentor.mentordetstimecommitment}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedMentor.mentordetsprevstupmentor && (
                      <div className="detail-box box-green">
                        <div className="detail-header">
                          <span className="detail-icon">📈</span>
                          <p className="detail-label">
                            Previous Startup Mentor
                          </p>
                        </div>
                        <div className="detail-text-container">
                          <p className="detail-text detail-bold">
                            {selectedMentor.mentordetsprevstupmentor}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedMentor.mentordetscomment && (
                      <div className="detail-box box-orange">
                        <div className="detail-header">
                          <span className="detail-icon">💬</span>
                          <p className="detail-label">Comments</p>
                        </div>
                        <div className="detail-text-container">
                          <p className="detail-text">
                            {selectedMentor.mentordetscomment}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Record Information */}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit Mentor Modal */}
      {isEditModalOpen && (
        <EditMentorModal
          mentor={selectedMentor}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={handleUpdateMentor}
        />
      )}
    </div>
  );
};

export default MentorDashboard;

//  <div className="sidebar">
//             <div className="search-container">
//               <input
//                 type="text"
//                 className="search-input"
//                 placeholder="Search mentors..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//               <span className="search-icon">🔍</span>
//             </div>

//             <div className="mentor-list">
//               {filteredMentors.map((mentor) => (
//                 <div
//                   key={mentor.mentordetsid}
//                   className={`mentor-card ${
//                     selectedMentor?.mentordetsid === mentor.mentordetsid
//                       ? "active"
//                       : ""
//                   }`}
//                   onClick={() => setSelectedMentor(mentor)}
//                 >
//                   <div className="mentor-card-content">
//                     <div
//                       className={`mentor-avatar ${getGradientColor(
//                         mentor.mentordetsid,
//                       )}`}
//                     >
//                       {getInitials(mentor.mentordetsname)}
//                     </div>
//                     <div className="mentor-info">
//                       <h3 className="mentor-name">{mentor.mentordetsname}</h3>
//                       <p className="mentor-designation">
//                         {mentor.mentordetsdesign}
//                       </p>
//                       <div className="mentor-tags">
//                         {mentor.mentorclasssetname && (
//                           <span className="tag tag-blue">
//                             {mentor.mentorclasssetname}
//                           </span>
//                         )}
//                         {mentor.mentortypename && (
//                           <span className="tag tag-purple">
//                             {mentor.mentortypename}
//                           </span>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>

// record information section
//  <div className="record-section">
//                   <h3 className="section-title">
//                     <span className="icon">📅</span>
//                     Record Information
//                   </h3>

//                   <div className="record-grid">
//                     <div className="record-box">
//                       <p className="record-label">Created By</p>
//                       <p className="record-name">
//                         {selectedMentor.createdname}
//                       </p>
//                       <p className="record-date">
//                         {formatDate(selectedMentor.mentordetscreatedtime)}
//                       </p>
//                     </div>

//                     <div className="record-box">
//                       <p className="record-label">Last Modified By</p>
//                       <p className="record-name">
//                         {selectedMentor.modifiedname}
//                       </p>
//                       <p className="record-date">
//                         {formatDate(selectedMentor.mentordetsmodifiedtime)}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
