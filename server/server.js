const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

// ==========================================
// MODELS
// ==========================================

const User = require("./models/User");
const Analysis = require("./models/Analysis");
const ResumeAnalysis = require("./models/ResumeAnalysis");
const Roadmap = require("./models/Roadmap");

console.log("Roadmap model:", Roadmap);

console.log(
  "Roadmap.create:",
  typeof Roadmap.create
);

// ==========================================
// PDF + FILE UPLOAD
// ==========================================

const multer = require("multer");
const { PDFParse } = require("pdf-parse");

// ==========================================
// DEBUG
// ==========================================

console.log("User model:", User);

console.log(
  "User.create:",
  typeof User.create
);

// ==========================================
// EXPRESS APP
// ==========================================

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());
app.use(express.json());

// ==========================================
// FILE UPLOAD CONFIGURATION
// ==========================================

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// ==========================================
// GEMINI AI
// ==========================================

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// ==========================================
// GEMINI MODEL HELPER
// ==========================================

const PRIMARY_MODEL = "gemini-3.5-flash-lite";
const FALLBACK_MODEL = "gemini-3.1-flash-lite";

async function generateGeminiContent(prompt) {
  const models = [
    "gemini-3.8-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
  ];

  let lastError = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(
          `Trying ${model} - attempt ${attempt}...`
        );

        const response =
          await ai.models.generateContent({
            model,
            contents: prompt,
          });

        console.log(
          `Gemini request successful using ${model}`
        );

        return response;

      } catch (error) {
        lastError = error;

        console.error(
          `${model} failed on attempt ${attempt}:`,
          error?.status || error
        );

        if (
          error?.status === 503 ||
          error?.status === 429 ||
          error?.status === 500
        ) {
          const delay =
            attempt === 1
              ? 5000
              : attempt === 2
              ? 15000
              : 30000;

          console.log(
            `Waiting ${delay / 1000} seconds before retry...`
          );

          await new Promise(resolve =>
            setTimeout(resolve, delay)
          );

          continue;
        }

        throw error;
      }
    }

    console.log(
      `Moving to next Gemini model...`
    );
  }

  throw lastError;
}

// ==========================================
// CREATE USER PROFILE
// ==========================================

app.post("/api/users", async (req, res) => {
  try {
    const {
      education,
      skills,
      interests,
      targetCareer,
    } = req.body;

    const user = await User.create({
      education,
      skills,
      interests,
      targetCareer,
    });

    res.status(201).json({
      success: true,
      userId: user._id,
      message: "Profile saved successfully",
    });

  } catch (error) {
    console.error(
      "User creation error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to save profile.",
    });
  }
});

// ==========================================
// GET USER PROFILE
// ==========================================

app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findById(
      req.params.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });

  } catch (error) {
    console.error(
      "User fetch error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch user.",
    });
  }
});

// ==========================================
// HOME ROUTE
// ==========================================

app.get("/", (req, res) => {
  res.json({
    message:
      "CareerLens AI server is running 🚀",
  });
});

// ==========================================
// CAREER ANALYSIS
// ==========================================

app.post(
  "/api/career-analysis",
  async (req, res) => {
    try {
      const {
        education,
        skills,
        interests,
        targetCareer,
        userId,
      } = req.body;

      // ==========================================
      // CHECK USER ID
      // ==========================================

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required.",
        });
      }

      // ==========================================
      // CAREER ANALYSIS PROMPT
      // ==========================================

      const prompt = `
You are CareerLens AI, an AI career guidance assistant.

Analyze this student's profile.

STUDENT PROFILE:

Education:
${education}

Current Skills:
${skills}

Interests:
${interests}

Target Career:
${targetCareer}

IMPORTANT RULES:

- Use ONLY the information provided in the student profile.
- Do NOT assume the student knows a programming language, framework,
  tool, or technology that is not listed.
- Clearly distinguish between existing skills and recommended skills.
- If an important skill is missing, mention it under Skill Gaps.
- Do not guarantee employment or career outcomes.

Provide the analysis using these sections:

1. Suitable Career Paths

2. Current Strengths

3. Skill Gaps

4. Recommended Skills to Learn

5. 6-Month Learning Roadmap

6. Project Suggestions

7. Next Steps

Give practical, clear, and student-friendly advice.

Use headings and bullet points.
`;

      // ==========================================
      // GENERATE AI ANALYSIS
      // ==========================================

      const response =
        await generateGeminiContent(prompt);

      const analysisText =
        response.text.trim();

      // ==========================================
      // SAVE ANALYSIS
      // ==========================================

      const savedAnalysis =
        await Analysis.create({
          userId,
          analysis: analysisText,
        });

      console.log(
        "Analysis saved:",
        savedAnalysis._id
      );

      // ==========================================
      // RESPONSE
      // ==========================================

      res.json({
        success: true,
        analysis: analysisText,
        analysisId:
          savedAnalysis._id,
      });

    } catch (error) {
      console.error(
        "Career analysis error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Career analysis failed. Please try again.",
      });
    }
  }
);

// ==========================================
// RESUME ANALYZER
// ==========================================

app.post(
  "/api/resume-analysis",
  upload.single("resume"),
  async (req, res) => {
    let parser;

    try {
      const { userId } = req.body;

      // ==========================================
      // CHECK USER ID
      // ==========================================

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required.",
        });
      }

      // ==========================================
      // CHECK FILE
      // ==========================================

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "Please upload a PDF resume.",
        });
      }

      // ==========================================
      // CHECK PDF
      // ==========================================

      if (
        req.file.mimetype !==
        "application/pdf"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Only PDF resumes are supported.",
        });
      }

      // ==========================================
      // PDF TEXT EXTRACTION
      // ==========================================

      parser = new PDFParse({
        data: req.file.buffer,
      });

      const pdfData =
        await parser.getText();

      const resumeText =
        pdfData.text;

      if (
        !resumeText ||
        !resumeText.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Could not extract text from the PDF.",
        });
      }

      console.log(
        "Resume text extracted successfully."
      );

      // ==========================================
      // DOCUMENT VALIDATION
      // ==========================================

      const validationPrompt = `
You are a document classifier for CareerLens AI.

Determine whether the uploaded PDF is a professional resume or CV.

A resume or CV is primarily created to present a person's professional profile, such as:

- Education
- Skills
- Work experience
- Internship experience
- Projects
- Certifications
- Achievements
- Professional summary
- Contact information

The document does not need to contain all of these sections.

The following documents are NOT resumes:

- Cover letters
- Internship offer letters
- Mark sheets
- Grade cards
- Academic transcripts
- Certificates
- Recommendation letters
- Job descriptions
- Company documents
- Application letters
- Random documents
- Any document that is not primarily a resume or CV

Return ONLY one of these two values:

RESUME

or

NOT_RESUME

Do not provide any explanation.

DOCUMENT TEXT:

${resumeText}
`;

      // ==========================================
      // VALIDATE DOCUMENT WITH GEMINI
      // ==========================================

      const validationResponse =
        await generateGeminiContent(
          validationPrompt
        );

      const documentType =
        validationResponse.text
          .trim()
          .toUpperCase();

      console.log(
        "Document validation result:",
        documentType
      );

      // ==========================================
      // STOP IF DOCUMENT IS NOT A RESUME
      // ==========================================

      if (
        documentType !== "RESUME"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please upload a proper resume in PDF format.",
        });
      }

      // ==========================================
      // RESUME AI ANALYSIS
      // ==========================================

      const prompt = `
You are CareerLens AI, an AI-powered resume analyzer.

Analyze the following resume.

IMPORTANT RULES:

- Use ONLY information explicitly present in the resume.
- Do not invent skills, experience, education, projects, or achievements.
- Do not assume technologies that are not mentioned.
- Clearly distinguish existing skills from recommended skills.
- Do not guarantee employment or interview outcomes.
- If information is not mentioned in the resume, say "Not mentioned in the resume."

Provide the analysis using these sections:

1. Resume Summary

2. Key Skills

3. Strengths

4. Missing or Weak Areas

5. ATS-Friendly Improvements

6. Recommended Skills

7. Project Suggestions

8. Resume Improvement Checklist

Keep the feedback practical, specific, and student-friendly.

RESUME TEXT:

${resumeText}
`;

      // ==========================================
      // GENERATE RESUME ANALYSIS
      // ==========================================

      const response =
        await generateGeminiContent(
          prompt
        );

      const analysisText =
        response.text.trim();

      // ==========================================
      // SAVE RESUME ANALYSIS
      // ==========================================

      const savedResumeAnalysis =
        await ResumeAnalysis.create({
          userId,
          fileName:
            req.file.originalname,
          resumeText,
          analysis:
            analysisText,
        });

      console.log(
        "Resume analysis saved:",
        savedResumeAnalysis._id
      );

      // ==========================================
      // RESPONSE
      // ==========================================

      res.json({
        success: true,
        analysis: analysisText,
        analysisId:
          savedResumeAnalysis._id,
      });

    } catch (error) {
      console.error(
        "Resume analysis error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Resume analysis failed. Please upload the resume in PDF format and try again.",
      });

    } finally {
      // ==========================================
      // DESTROY PDF PARSER
      // ==========================================

      if (parser) {
        try {
          await parser.destroy();
        } catch (error) {
          console.error(
            "PDF parser cleanup error:",
            error
          );
        }
      }
    }
  }
);

// ==========================================
// AI LEARNING ROADMAP
// ==========================================

app.post(
  "/api/roadmap",
  async (req, res) => {
    try {
      const { userId } = req.body;

      // ==========================================
      // CHECK USER ID
      // ==========================================

      if (!userId) {
        return res.status(400).json({
          success: false,
          message:
            "User ID is required.",
        });
      }

      // ==========================================
      // GET USER PROFILE
      // ==========================================

      const user =
        await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User profile not found.",
        });
      }

      console.log(
        "Creating roadmap for:",
        user._id
      );

      // ==========================================
      // ROADMAP PROMPT
      // ==========================================

      const prompt = `
You are CareerLens AI, an AI-powered career roadmap generator.

Create a personalized 6-month learning roadmap for this student.

STUDENT PROFILE:

Education:
${user.education}

Current Skills:
${user.skills}

Interests:
${user.interests}

Target Career:
${user.targetCareer}

IMPORTANT RULES:

- Use ONLY the information provided in the student profile.
- Do NOT claim that the student already knows a technology unless it is listed in Current Skills.
- Clearly distinguish current skills from skills that need to be learned.
- Focus on practical and realistic learning steps.
- Do not guarantee employment.
- Clearly identify skills that are already present versus skills that are recommended.

Create the roadmap with these sections:

1. Career Goal

2. Current Skill Assessment

3. Skill Gaps

4. Month 1

5. Month 2

6. Month 3

7. Month 4

8. Month 5

9. Month 6

10. Recommended Projects

11. Final Preparation

Use clear headings and bullet points.
`;

      // ==========================================
      // GENERATE ROADMAP
      // ==========================================

      const response =
        await generateGeminiContent(
          prompt
        );

      const roadmapText =
        response.text.trim();

      // ==========================================
      // SAVE ROADMAP
      // ==========================================

      const savedRoadmap =
        await Roadmap.create({
          userId,
          roadmap: roadmapText,
        });

      console.log(
        "Roadmap saved:",
        savedRoadmap._id
      );

      // ==========================================
      // RESPONSE
      // ==========================================

      res.json({
        success: true,
        roadmap: roadmapText,
        roadmapId:
          savedRoadmap._id,
      });

    } catch (error) {
      console.error(
        "Roadmap error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Roadmap generation failed. Please try again.",
      });
    }
  }
);

// ==========================================
// START SERVER
// ==========================================

const PORT =
  process.env.PORT || 5000;

mongoose
  .connect(
    process.env.MONGODB_URI,
    {
      dbName: "careerLens",
    }
  )
  .then(() => {
    console.log(
      "MongoDB connected ✅"
    );

    app.listen(PORT, () => {
      console.log(
        `Server running on port ${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error(
      "MongoDB connection error:",
      error
    );
  });