import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

import {
  Sparkles,
  Target,
  FileText,
  Map,
  Brain,
  ArrowRight,
  Loader2,
  Upload,
  ArrowLeft,
  MessageCircle,
} from "lucide-react";

import "./App.css";

function Footer() {
  return (
    <footer className="footer">
      <p className="copyright">
        © 2026 CareerLens AI. All rights reserved.
      </p>

      <p className="tech-stack">
        Built with React • Node.js • MongoDB • Generative AI
      </p>
    </footer>
  );
}

function App() {
  // ==========================================
  // PAGE STATES
  // ==========================================

  const [showProfile, setShowProfile] = useState(false);
  const [showResumeAnalyzer, setShowResumeAnalyzer] =
    useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  // ==========================================
  // PROFILE FORM
  // ==========================================

  const [formData, setFormData] = useState({
    education: "",
    skills: "",
    interests: "",
    targetCareer: "",
  });

  // ==========================================
  // USER ID
  // ==========================================

  const [userId, setUserId] = useState(
    localStorage.getItem("careerLensUserId") || ""
  );

  // ==========================================
  // CAREER ANALYSIS
  // ==========================================

  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);

  // ==========================================
  // RESUME ANALYZER
  // ==========================================

  const [resumeFile, setResumeFile] = useState(null);
  const [resumeAnalysis, setResumeAnalysis] = useState("");
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState("");

  // ==========================================
  // ROADMAP
  // ==========================================

  const [roadmap, setRoadmap] = useState("");
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [roadmapError, setRoadmapError] = useState("");

 // ==========================================
// DASHBOARD
// ==========================================

const [dashboardLoading, setDashboardLoading] =
  useState(false);
  // ==========================================
  // LOAD PROFILE FOR DASHBOARD
  // ==========================================

  useEffect(() => {
    if (!showDashboard) return;

    const currentUserId =
  userId || localStorage.getItem("careerLensUserId");

if (!currentUserId) {
  return;
}

    const loadDashboardProfile = async () => {
      setDashboardLoading(true);

      try {
        const response = await fetch(
          `http://https://career-lens-ai-0qpx.onrender.com/api/users/${currentUserId}`
        );

        const data = await response.json();

        if (data.success) {
          const profile =
            data.user ||
            data.profile ||
            data.data ||
            data;

         

          setFormData({
            education: profile.education || "",
            skills: profile.skills || "",
            interests: profile.interests || "",
            targetCareer:
              profile.targetCareer || "",
          });
        }
      } catch (error) {
        console.error(
          "Dashboard profile error:",
          error
        );
      } finally {
        setDashboardLoading(false);
      }
    };

    loadDashboardProfile();
  }, [showDashboard, userId]);

  // ==========================================
  // HANDLE PROFILE INPUT
  // ==========================================

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ==========================================
  // CAREER ANALYSIS
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setAnalysis("");

    try {
      // Save user profile
      const userResponse = await fetch(
        "http://https://career-lens-ai-0qpx.onrender.com/api/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const userData = await userResponse.json();

      if (!userData.success) {
        setAnalysis(
          "Unable to save your profile."
        );
        return;
      }

      const currentUserId = userData.userId;

      setUserId(currentUserId);

      localStorage.setItem(
        "careerLensUserId",
        currentUserId
      );

      console.log(
        "User profile saved successfully!"
      );

      console.log("User ID:", currentUserId);

      // Generate career analysis
      const response = await fetch(
        "http://https://career-lens-ai-0qpx.onrender.com/api/career-analysis",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            userId: currentUserId,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setAnalysis(data.analysis);
      } else {
        setAnalysis(
          "Something went wrong while generating your analysis."
        );
      }
    } catch (error) {
      console.error(
        "Career Analysis Error:",
        error
      );

      setAnalysis(
        "Unable to connect to the CareerLens AI server. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // RESUME FILE SELECTION
  // ==========================================

  const handleResumeChange = (e) => {
    const file = e.target.files[0];

    setResumeError("");
    setResumeAnalysis("");

    if (!file) {
      setResumeFile(null);
      return;
    }

    if (file.type !== "application/pdf") {
      setResumeError(
        "Please upload a PDF resume only."
      );

      setResumeFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setResumeError(
        "Resume file must be smaller than 5 MB."
      );

      setResumeFile(null);
      return;
    }

    setResumeFile(file);
  };

  // ==========================================
  // RESUME ANALYSIS
  // ==========================================

  const handleResumeSubmit = async (e) => {
    e.preventDefault();

    setResumeError("");
    setResumeAnalysis("");

    const currentUserId =
      userId ||
      localStorage.getItem("careerLensUserId");

    if (!currentUserId) {
      setResumeError(
        "Please complete your Career Profile first so we can connect your resume to your account."
      );

      return;
    }

    if (!resumeFile) {
      setResumeError(
        "Please select a PDF resume."
      );

      return;
    }

    setResumeLoading(true);

    try {
      const formDataToSend = new FormData();

      formDataToSend.append(
        "resume",
        resumeFile
      );

      formDataToSend.append(
        "userId",
        currentUserId
      );

      console.log(
        "Uploading resume for user:",
        currentUserId
      );

      const response = await fetch(
        "http://https://career-lens-ai-0qpx.onrender.com/api/resume-analysis",
        {
          method: "POST",
          body: formDataToSend,
        }
      );

      const data = await response.json();

      if (data.success) {
        setResumeAnalysis(data.analysis);

        console.log(
          "Resume analysis saved successfully!"
        );

        console.log(
          "Resume Analysis ID:",
          data.analysisId
        );
      } else {
        setResumeError(
          data.message ||
            "Resume analysis failed."
        );
      }
    } catch (error) {
      console.error(
        "Resume Analysis Error:",
        error
      );

      setResumeError(
        "Unable to connect to the CareerLens AI server. Make sure the backend is running."
      );
    } finally {
      setResumeLoading(false);
    }
  };

  // ==========================================
  // GENERATE LEARNING ROADMAP
  // ==========================================

  const handleRoadmap = async () => {
    const currentUserId =
      userId ||
      localStorage.getItem("careerLensUserId");

    setRoadmapError("");
    setRoadmap("");

    if (!currentUserId) {
      setRoadmapError(
        "Please complete your Career Profile first."
      );

      return;
    }

    setRoadmapLoading(true);

    try {
      const response = await fetch(
        "http://https://career-lens-ai-0qpx.onrender.com/api/roadmap",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: currentUserId,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setRoadmap(data.roadmap);

        console.log(
          "Roadmap generated successfully!"
        );

        console.log(
          "Roadmap ID:",
          data.roadmapId
        );
      } else {
        setRoadmapError(
          data.message ||
            "Failed to generate roadmap."
        );
      }
    } catch (error) {
      console.error(
        "Roadmap Error:",
        error
      );

      setRoadmapError(
        "Unable to connect to the CareerLens AI server. Make sure the backend is running."
      );
    } finally {
      setRoadmapLoading(false);
    }
  };

  // ==========================================
  // DASHBOARD PAGE
  // ==========================================

  if (showDashboard) {
    return (
      <div className="app">

        {/* NAVBAR */}
        <header className="navbar">

          <div className="logo">
            <Sparkles size={24} />
            <span>CareerLens AI</span>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
            }}
          >
            <button
              className="profile-btn"
              onClick={() => {
                setShowDashboard(false);
                setShowProfile(true);
              }}
            >
              My Profile
            </button>

            <button
              className="profile-btn"
              onClick={() => {
                setShowDashboard(false);
               
              }}
            >
              Home
            </button>
          </div>

        </header>

        {/* DASHBOARD */}
        <main className="dashboard-page">

          <div className="dashboard-header">

            <div className="badge">
              <Brain size={16} />
              Your AI Career Navigator
            </div>

            <h1>
              Welcome to your Dashboard 👋
            </h1>

            <p>
              Manage your career analysis, resume,
              learning roadmap, and future AI
              career tools from one place.
            </p>

          </div>

          {dashboardLoading ? (

            <div className="dashboard-loading">

              <Loader2
                size={28}
                className="spin"
              />

              <p>
                Loading your profile...
              </p>

            </div>

          ) : (

            <>

              {!userId && (
                <div className="dashboard-profile dashboard-profile-warning">

                  <h2>
                    Complete your Career Profile
                  </h2>

                  <p>
                    Create your profile first so
                    CareerLens AI can personalize
                    your career tools.
                  </p>

                  <button
                    className="start-btn"
                    onClick={() => {
                      setShowDashboard(false);
                      setShowProfile(true);
                    }}
                  >
                    Create Career Profile
                    <ArrowRight size={20} />
                  </button>

                </div>
              )}

              <div className="dashboard-grid">

                {/* CAREER ANALYSIS */}
                <div
                  className="dashboard-card"
                  onClick={() => {
                    setShowDashboard(false);
                    setShowProfile(true);
                  }}
                >

                  <div className="dashboard-card-icon">
                    <Target size={24} />
                  </div>

                  <h3>
                    Career Analysis
                  </h3>

                  <p>
                    Discover suitable career paths,
                    strengths, skill gaps, and next
                    steps using AI.
                  </p>

                  <span className="dashboard-card-action">
                    Open Career Analysis
                    <ArrowRight size={16} />
                  </span>

                </div>

                {/* RESUME ANALYZER */}
                <div
                  className="dashboard-card"
                  onClick={() => {
                    setShowDashboard(false);
                    setShowResumeAnalyzer(true);
                  }}
                >

                  <div className="dashboard-card-icon">
                    <FileText size={24} />
                  </div>

                  <h3>
                    Resume Analyzer
                  </h3>

                  <p>
                    Upload your resume and get
                    AI-powered feedback on skills,
                    gaps, and improvements.
                  </p>

                  <span className="dashboard-card-action">
                    Analyze Resume
                    <ArrowRight size={16} />
                  </span>

                </div>

                {/* LEARNING ROADMAP */}
                <div
                  className="dashboard-card"
                  onClick={() => {
                    setShowDashboard(false);
                    setShowRoadmap(true);
                  }}
                >

                  <div className="dashboard-card-icon">
                    <Map size={24} />
                  </div>

                  <h3>
                    Learning Roadmap
                  </h3>

                  <p>
                    Generate a personalized
                    6-month learning roadmap based
                    on your target career.
                  </p>

                  <span className="dashboard-card-action">
                    View Roadmap
                    <ArrowRight size={16} />
                  </span>

                </div>

                {/* AI ASSISTANT */}
                <div className="dashboard-card dashboard-card-disabled">

                  <div className="dashboard-card-icon">
                    <MessageCircle size={24} />
                  </div>

                  <h3>
                    AI Career Assistant
                  </h3>

                  <p>
                    Ask questions about skills,
                    projects, interviews, and your
                    career journey.
                  </p>

                  <span className="dashboard-coming-soon">
                    Coming Soon
                  </span>

                </div>

              </div>

            </>

          )}

        </main>

        <Footer />

      </div>
    );
  }

  // ==========================================
  // ROADMAP PAGE
  // ==========================================

  if (showRoadmap) {
    return (
      <div className="app">

        {/* NAVBAR */}
        <header className="navbar">

          <div className="logo">
            <Sparkles size={24} />
            <span>CareerLens AI</span>
          </div>

          <button
            className="profile-btn"
            onClick={() => {
              setShowRoadmap(false);
              setRoadmap("");
              setRoadmapError("");
            }}
          >
            Home
          </button>

        </header>

        {/* ROADMAP PAGE */}
        <main className="profile-page">

          <div className="profile-card">

            {!roadmap ? (

              <>

                <div className="badge">
                  <Map size={16} />
                  AI Learning Roadmap
                </div>

                <h1>
                  Build Your Learning Roadmap
                </h1>

                <p>
                  CareerLens AI will analyze your
                  career profile and create a
                  personalized learning roadmap
                  based on your target career,
                  current skills, and skill gaps.
                </p>

                {/* PROFILE REQUIRED */}

                {!userId && (
                  <div className="analysis-result">

                    <strong>
                      Profile required
                    </strong>

                    <p>
                      Please complete your Career
                      Profile first so CareerLens AI
                      can personalize your roadmap.
                    </p>

                    <button
                      className="start-btn"
                      onClick={() => {
                        setShowRoadmap(false);
                        setShowProfile(true);
                      }}
                    >
                      Create Career Profile
                      <ArrowRight size={20} />
                    </button>

                  </div>
                )}

                {/* ROADMAP ERROR */}

                {roadmapError && (
                  <div
                    className="analysis-result"
                    style={{
                      marginBottom: "20px",
                    }}
                  >
                    {roadmapError}
                  </div>
                )}

                {/* ROADMAP ACTIONS */}

                <div className="result-actions">

                  <button
                    className="start-btn"
                    onClick={handleRoadmap}
                    disabled={
                      roadmapLoading ||
                      !userId
                    }
                  >

                    {roadmapLoading ? (
                      <>
                        <Loader2
                          size={20}
                          className="spin"
                        />
                        Creating Roadmap...
                      </>
                    ) : (
                      <>
                        Generate My Roadmap
                        <Map size={20} />
                      </>
                    )}

                  </button>

                  <button
                    className="secondary-btn"
                    onClick={() => {
                      setShowRoadmap(false);
                    }}
                  >
                    <ArrowLeft size={20} />
                    Back
                  </button>

                </div>

              </>

            ) : (

              // ROADMAP RESULT

              <div className="analysis-section">

                <div className="badge">
                  <Map size={16} />
                  Your AI Learning Roadmap
                </div>

                <h1>
                  Your Personalized Roadmap
                </h1>

                <div className="analysis-result">

                  <ReactMarkdown>
                    {roadmap}
                  </ReactMarkdown>

                </div>

                <div className="result-actions">

                  <button
                    className="start-btn"
                    onClick={() => {
                      setRoadmap("");
                      setRoadmapError("");
                    }}
                  >
                    Generate New Roadmap
                    <ArrowRight size={20} />
                  </button>

                  <button
                    className="secondary-btn"
                    onClick={() => {
                      setShowRoadmap(false);
                      setRoadmap("");
                      setRoadmapError("");
                    }}
                  >
                    <ArrowLeft size={20} />
                    Back to Home
                  </button>

                </div>

              </div>

            )}

          </div>

        </main>

        <Footer />

      </div>
    );
  }

  // ==========================================
  // RESUME ANALYZER PAGE
  // ==========================================

  if (showResumeAnalyzer) {
    return (
      <div className="app">

        {/* NAVBAR */}
        <header className="navbar">

          <div className="logo">
            <Sparkles size={24} />
            <span>CareerLens AI</span>
          </div>

          <button
            className="profile-btn"
            onClick={() => {
              setShowResumeAnalyzer(false);
              setResumeAnalysis("");
              setResumeError("");
            }}
          >
            Home
          </button>

        </header>

        {/* RESUME PAGE */}
        <main className="profile-page">

          <div className="profile-card">

            {!resumeAnalysis ? (

              <>

                <div className="badge">
                  <FileText size={16} />
                  AI Resume Analyzer
                </div>

                <h1>
                  Analyze Your Resume
                </h1>

                <p>
                  Upload your PDF resume and
                  CareerLens AI will analyze your
                  skills, strengths, gaps, and
                  resume improvements.
                </p>

                {/* PROFILE REQUIRED */}

                {!userId && (
                  <div className="analysis-result">

                    <strong>
                      Profile required
                    </strong>

                    <p>
                      Please complete your Career
                      Profile first. Your resume
                      analysis will then be linked
                      to your CareerLens profile.
                    </p>

                    <button
                      className="start-btn"
                      onClick={() => {
                        setShowResumeAnalyzer(false);
                        setShowProfile(true);
                      }}
                    >
                      Create Career Profile
                      <ArrowRight size={20} />
                    </button>

                  </div>
                )}

                {/* RESUME FORM */}

                <form
                  onSubmit={handleResumeSubmit}
                >

                  <label>
                    Upload Resume
                  </label>

                  <div
                    style={{
                      border: "2px dashed #ddd",
                      borderRadius: "14px",
                      padding: "30px",
                      textAlign: "center",
                      marginTop: "10px",
                      marginBottom: "20px",
                    }}
                  >

                    <Upload
                      size={35}
                      style={{
                        marginBottom: "10px",
                      }}
                    />

                    <p>
                      Select your resume PDF
                    </p>

                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleResumeChange}
                    />

                    {resumeFile && (
                      <p
                        style={{
                          marginTop: "15px",
                        }}
                      >
                        📄 {resumeFile.name}
                      </p>
                    )}

                  </div>

                  {/* ERROR */}

                  {resumeError && (
                    <div
                      className="analysis-result"
                      style={{
                        marginBottom: "20px",
                      }}
                    >
                      {resumeError}
                    </div>
                  )}

                  {/* ANALYZE */}

                  <button
                    type="submit"
                    className="start-btn"
                    disabled={
                      resumeLoading ||
                      !userId
                    }
                  >

                    {resumeLoading ? (
                      <>
                        <Loader2
                          size={20}
                          className="spin"
                        />
                        Analyzing Resume...
                      </>
                    ) : (
                      <>
                        Analyze Resume
                        <ArrowRight size={20} />
                      </>
                    )}

                  </button>

                </form>

                {/* BACK */}

                <div className="result-actions">

                  <button
                    className="secondary-btn"
                    onClick={() => {
                      setShowResumeAnalyzer(false);
                    }}
                  >
                    <ArrowLeft size={20} />
                    Back
                  </button>

                </div>

              </>

            ) : (

              // RESUME RESULT

              <div className="analysis-section">

                <div className="badge">
                  <Sparkles size={16} />
                  Resume Analysis
                </div>

                <h1>
                  Your Resume Analysis
                </h1>

                <div className="analysis-result">

                  <ReactMarkdown>
                    {resumeAnalysis}
                  </ReactMarkdown>

                </div>

                <div className="result-actions">

                  <button
                    className="start-btn"
                    onClick={() => {
                      setResumeAnalysis("");
                      setResumeFile(null);
                      setResumeError("");
                    }}
                  >
                    Analyze Another Resume
                    <ArrowRight size={20} />
                  </button>

                  <button
                    className="secondary-btn"
                    onClick={() => {
                      setShowResumeAnalyzer(false);
                      setResumeAnalysis("");
                    }}
                  >
                    <ArrowLeft size={20} />
                    Back to Home
                  </button>

                </div>

              </div>

            )}

          </div>

        </main>

        <Footer />

      </div>
    );
  }

  // ==========================================
  // CAREER PROFILE PAGE
  // ==========================================

  if (showProfile) {
    return (
      <div className="app">

        {/* NAVBAR */}
        <header className="navbar">

          <div className="logo">
            <Sparkles size={24} />
            <span>CareerLens AI</span>
          </div>

          <button
            className="profile-btn"
            onClick={() => {
              setShowProfile(false);
              setAnalysis("");
            }}
          >
            Home
          </button>

        </header>

        {/* PROFILE */}
        <main className="profile-page">

          <div className="profile-card">

            {!analysis ? (

              <>

                <div className="badge">
                  <Brain size={16} />
                  Career Profile
                </div>

                <h1>
                  Tell us about yourself
                </h1>

                <p>
                  Enter your details so
                  CareerLens AI can understand
                  your background and create a
                  personalized career analysis.
                </p>

                <form
                  onSubmit={handleSubmit}
                >

                  {/* EDUCATION */}

                  <label>
                    Education
                  </label>

                  <input
                    type="text"
                    name="education"
                    value={formData.education}
                    onChange={handleChange}
                    placeholder="e.g. B.E. Artificial Intelligence & Data Science"
                    required
                  />

                  {/* SKILLS */}

                  <label>
                    Skills
                  </label>

                  <input
                    type="text"
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    placeholder="e.g. JavaScript, React, Python, SQL"
                    required
                  />

                  {/* INTERESTS */}

                  <label>
                    Interests
                  </label>

                  <input
                    type="text"
                    name="interests"
                    value={formData.interests}
                    onChange={handleChange}
                    placeholder="e.g. AI, Web Development, Data Science"
                    required
                  />

                  {/* TARGET CAREER */}

                  <label>
                    Target Career
                  </label>

                  <input
                    type="text"
                    name="targetCareer"
                    value={formData.targetCareer}
                    onChange={handleChange}
                    placeholder="e.g. AI Engineer"
                    required
                  />

                  {/* ANALYZE */}

                  <button
                    type="submit"
                    className="start-btn"
                    disabled={loading}
                  >

                    {loading ? (
                      <>
                        <Loader2
                          size={20}
                          className="spin"
                        />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        Analyze My Career
                        <ArrowRight size={20} />
                      </>
                    )}

                  </button>

                </form>

              </>

            ) : (

              // CAREER ANALYSIS RESULT

              <div className="analysis-section">

                <div className="badge">
                  <Sparkles size={16} />
                  CareerLens AI Analysis
                </div>

                <h1>
                  Your Career Analysis
                </h1>

                <div className="analysis-result">

                  <ReactMarkdown>
                    {analysis}
                  </ReactMarkdown>

                </div>

                <div className="result-actions">

                  <button
                    className="start-btn"
                    onClick={() => {
                      setAnalysis("");
                    }}
                  >
                    Analyze Again
                    <ArrowRight size={20} />
                  </button>

                  <button
                    className="secondary-btn"
                    onClick={() => {
                      setShowProfile(false);
                      setAnalysis("");
                    }}
                  >
                    <ArrowLeft size={20} />
                    Back to Home
                  </button>

                </div>

              </div>

            )}

          </div>

        </main>

        <Footer />

      </div>
    );
  }

  // ==========================================
  // HOME PAGE
  // ==========================================

  return (
    <div className="app">

      {/* NAVBAR */}

      <header className="navbar">

        <div className="logo">
          <Sparkles size={24} />
          <span>CareerLens AI</span>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >

          <button
            className="profile-btn"
            onClick={() => {
              setShowDashboard(true);
            }}
          >
            Dashboard
          </button>

          <button
            className="profile-btn"
            onClick={() => {
              setShowProfile(true);
            }}
          >
            My Profile
          </button>

        </div>

      </header>

      {/* HERO */}

      <main className="hero">

        <div className="hero-content">

          <div className="badge">
            <Brain size={16} />
            AI-Powered Career Guidance
          </div>

          <h1>
            Discover Your
            <span>
              Career Path
            </span>
          </h1>

          <p>
            Analyze your skills, discover
            suitable career paths, identify
            skill gaps, and build a
            personalized roadmap with AI.
          </p>

          <button
            className="start-btn"
            onClick={() => {
              setShowProfile(true);
            }}
          >
            Start Career Analysis
            <Target size={20} />
          </button>

        </div>

      </main>

      {/* FEATURES */}

      <section className="features">

        {/* CAREER ANALYSIS */}

        <div
          className="feature-card"
          onClick={() => {
            setShowProfile(true);
          }}
          style={{
            cursor: "pointer",
          }}
        >

          <Target size={28} />

          <h3>
            Career Analysis
          </h3>

          <p>
            Discover career paths that match
            your skills and interests.
          </p>

        </div>

        {/* RESUME ANALYZER */}

        <div
          className="feature-card"
          onClick={() => {
            setShowResumeAnalyzer(true);
          }}
          style={{
            cursor: "pointer",
          }}
        >

          <FileText size={28} />

          <h3>
            Resume Analyzer
          </h3>

          <p>
            Get AI-powered insights and
            improvements for your resume.
          </p>

        </div>

        {/* LEARNING ROADMAP */}

        <div
          className="feature-card"
          onClick={() => {
            setShowRoadmap(true);
          }}
          style={{
            cursor: "pointer",
          }}
        >

          <Map size={28} />

          <h3>
            Learning Roadmap
          </h3>

          <p>
            Build a personalized roadmap to
            reach your career goal.
          </p>

        </div>

      </section>

      <Footer />

    </div>
  );
}

export default App;