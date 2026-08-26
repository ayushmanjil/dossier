/**
 * RECRUITMENT CONFIGURATION
 * ---------------------------------------------------------------------------
 * This file is the single source of truth for how raw CSV columns map onto
 * the recruitment UI. Nothing about departments or questions is hard-coded
 * anywhere else in the app — every screen reads from this file.
 *
 * To evolve the form later (new department, new question, a question moving
 * departments, a question being retired) you only ever edit this file.
 *
 * HOW MATCHING WORKS
 * Google Forms column headers drift slightly over time (extra whitespace,
 * curly quotes, punctuation, capitalization). Every `match` array below lists
 * acceptable variants of a CSV header. Matching is done on a normalized form
 * of the header (see lib/normalize.js), so "How  familiar are you with
 * Sahityika  and its agenda?" and "How familiar are you with Sahityika and
 * its agenda ?" both resolve to the same question.
 */

// ---------------------------------------------------------------------------
// COMMON QUESTIONS — asked of every applicant, regardless of department
// ---------------------------------------------------------------------------
export const COMMON_QUESTIONS = [
  { key: "timestamp", label: "Submitted", match: ["Timestamp"], type: "timestamp", optional: true },
  { key: "name", label: "Name", match: ["Name"], type: "short", required: true },
  { key: "rollNumber", label: "Roll Number", match: ["Roll Number", "Roll No", "Roll No."], type: "short", required: true },
  { key: "gender", label: "Gender", match: ["Gender"], type: "short" },
  { key: "degree", label: "Degree", match: ["Degree"], type: "short" },
  { key: "level", label: "Level", match: ["Level"], type: "short" },
  {
    key: "applicable",
    label: "Which of the following is applicable to you?",
    match: ["Which of the following is applicable to you?", "Which of the following is applicable to you"],
    type: "short",
  },
  {
    key: "homeState",
    label: "Home State / Union Territory",
    match: ["Home State or Union Territory", "Home State/Union Territory", "Home State"],
    type: "short",
  },
  { key: "house", label: "House", match: ["House"], type: "short" },
  {
    key: "sahityikaMember",
    label: "Existing Sahityika Member",
    match: ["Are you a member of Sahityika?", "Are you a member of Sahityika"],
    type: "short",
  },
  {
    key: "department",
    label: "Department",
    match: ["Which department are you interested in?", "Which department are you interested in", "Department"],
    type: "short",
    required: true,
    isDepartmentField: true,
  },
];

// Columns that are expected to sometimes be present in a raw export but must
// never be surfaced in the UI even if somehow left in the CSV.
export const SENSITIVE_COLUMN_HINTS = ["email", "e-mail", "phone", "contact number", "mobile"];

// ---------------------------------------------------------------------------
// DEPARTMENT QUESTION MAPPING
// ---------------------------------------------------------------------------
// Each department entry:
//   slug        stable internal id, used in URLs and as a React key
//   label       display name
//   match       strings/variants used to recognize this department from the
//               raw "Which department are you interested in?" column
//   questions[] ordered list of questions to render on the applicant dossier
//     - type: "long"   long-form paragraph answer, gets manuscript-style typography
//     - type: "short"  brief answer, shown inline
//     - type: "url"    answer is treated as one-or-more links, rendered as buttons
//     - type: "resume" same as url, but labeled/iconified specifically as a resume
//     - type: "feature" a "long" answer that should be presented with extra
//               emphasis (e.g. the two creative-writing articles)
export const DEPARTMENTS = [
  {
    slug: "executive-management",
    label: "Executive & Management Department",
    match: [
      "Executive & Management Department",
      "Executive and Management Department",
      "Executive & Management",
      "Executive and Management",
      "Executive & Management Dept",
      "Executive and Management Dept",
      "Executive & Management ",
    ],
    questions: [
      {
        key: "background",
        label: "Background & Experience",
        prompt: "Please tell us about your background and experience in executive and/or management roles.",
        match: ["Please tell us about your background and experience in executive and/or management roles."],
        type: "long",
      },
      {
        key: "familiarity",
        label: "Familiarity with Sahityika",
        prompt: "How familiar are you with Sahityika and its agenda?",
        match: ["How familiar are you with Sahityika and its agenda?"],
        type: "long",
      },
      {
        key: "timeManagement",
        label: "Prioritization & Time Management",
        prompt: "How do you prioritize tasks and manage your time effectively when overseeing multiple responsibilities?",
        match: ["How do you prioritize tasks and manage your time effectively when overseeing multiple responsibilities?"],
        type: "long",
      },
      {
        key: "conflictResolution",
        label: "Conflict Resolution",
        prompt: "How would you handle conflicts within the society to ensure a positive and constructive resolution?",
        match: ["How would you handle conflicts within the society to ensure a positive and constructive resolution?"],
        type: "long",
      },
      {
        key: "fosteringPassion",
        label: "Fostering Passion for Literature",
        prompt: "In what ways do you envision fostering a passion for literature among the members of the society?",
        match: ["In what ways do you envision fostering a passion for literature among the members of the society?"],
        type: "long",
      },
      {
        key: "handlingFeedback",
        label: "Handling Feedback",
        prompt: "How do you handle constructive criticism or feedbacks on your work, and how do you incorporate changes into the same?",
        match: ["How do you handle constructive criticism or feedbacks on your work, and how do you incorporate changes into the same?"],
        type: "long",
      },
      {
        key: "contribution",
        label: "Contribution to Society",
        prompt: "How would you contribute to the overall success and sustainability of the society?",
        match: ["How would you contribute to the overall success and sustainability of the society?"],
        type: "long",
      },
      {
        key: "resume",
        label: "Résumé",
        prompt: "Resume (optional)",
        match: ["Resume (optional)", "Resume"],
        type: "resume",
        optional: true,
      },
    ],
  },
  {
    slug: "editorial-documentation",
    label: "Editorial & Documentation Department",
    match: [
      "Editorial & Documentation Department",
      "Editorial and Documentation Department",
      "Editorial & Documentation",
      "Editorial and Documentation",
      "Editorial & Documentation Dept",
      "Editorial and Documentation Dept",
      "Content & Creative Writing",
      "Content and Creative Writing",
      "Content & Creative Writing Department",
      "Content and Creative Writing Department",
    ],
    questions: [
      {
        key: "background",
        label: "Background & Experience",
        prompt: "Please tell us about your background and experience in content and creative writing.",
        match: [
          "Please tell us about your background and experience in content and creative writing.",
          "Please tell us about your background and experience in editorial and documentation.",
        ],
        type: "long",
      },
      {
        key: "familiarity",
        label: "Familiarity with Sahityika",
        prompt: "How familiar are you with Sahityika and its agenda?",
        match: ["How familiar are you with Sahityika and its agenda?"],
        type: "long",
      },
      {
        key: "deadlineHandling",
        label: "Handling Multiple Deadlines",
        prompt: "How do you prioritize and handle multiple projects with different deadlines?",
        match: ["How do you prioritize and handle multiple projects with different deadlines?"],
        type: "long",
      },
      {
        key: "handlingFeedback",
        label: "Handling Feedback",
        prompt: "How do you handle constructive criticism or feedback on your writings, and how do you incorporate changes into your work?",
        match: ["How do you handle constructive criticism or feedback on your writings, and how do you incorporate changes into your work?"],
        type: "long",
      },
      {
        key: "articleStorytelling",
        label: "Article 1 — Importance of Storytelling",
        prompt: "Write an article on \"The importance of Storytelling\" in about 300 words.",
        match: ["Write an article on \"The importance of Storytelling\" in about 300 words.", "Write an article on \u201cThe importance of Storytelling\u201d in about 300 words."],
        type: "feature",
      },
      {
        key: "articleAI",
        label: "Article 2 — AI vs Human Creativity",
        prompt: "Write an article on \"How AI can never mimic Human Creativity\" in about 300 words.",
        match: ["Write an article on \"How AI can never mimic Human Creativity\" in about 300 words.", "Write an article on \u201cHow AI can never mimic Human Creativity\u201d in about 300 words."],
        type: "feature",
      },
      {
        key: "resume",
        label: "Résumé",
        prompt: "Resume (optional)",
        match: ["Resume (optional)", "Resume"],
        type: "resume",
        optional: true,
      },
    ],
  },
  {
    slug: "creative-design",
    label: "Creative & Design Department",
    match: [
      "Creative & Design Department",
      "Creative and Design Department",
      "Creative & Design",
      "Creative and Design",
      "Creative Designing",
      "Creative Design",
      "Creative Designing Department",
      "Creative Design Department",
      "Creative & Design Dept",
      "Creative and Design Dept",
    ],
    questions: [
      {
        key: "background",
        label: "Background & Experience",
        prompt: "Please tell us about your background and experience in creative designing domain.",
        match: [
          "Please tell us about your background and experience in creative designing domain.",
          "Please tell us about your background and experience in creative and design.",
        ],
        type: "long",
      },
      {
        key: "familiarity",
        label: "Familiarity with Sahityika",
        prompt: "How familiar are you with Sahityika and its agenda?",
        match: ["How familiar are you with Sahityika and its agenda?"],
        type: "long",
      },
      {
        key: "toolsAndTrends",
        label: "Design Tools & Updating Skills",
        prompt: "What design and editing software(s) are you proficient in, and how do you stay updated on the latest features and trends in design tools?",
        match: ["What design and editing software(s) are you proficient in, and how do you stay updated on the latest features and trends in design tools?"],
        type: "long",
      },
      {
        key: "timeManagement",
        label: "Prioritization & Quality",
        prompt: "How do you prioritize tasks to ensure timely delivery without compromising the quality of your designs?",
        match: ["How do you prioritize tasks to ensure timely delivery without compromising the quality of your designs?"],
        type: "long",
      },
      {
        key: "handlingFeedback",
        label: "Handling Feedback",
        prompt: "How do you handle constructive criticism or feedback on your designs, and how do you incorporate changes into your work?",
        match: ["How do you handle constructive criticism or feedback on your designs, and how do you incorporate changes into your work?"],
        type: "long",
      },
      {
        key: "portfolioWorks",
        label: "Best Works & Portfolio",
        prompt: "Please share some of your best works with us.",
        match: ["Please share some of your best works with us."],
        type: "url",
      },
      {
        key: "resume",
        label: "Résumé",
        prompt: "Resume (optional)",
        match: ["Resume (optional)", "Resume"],
        type: "resume",
        optional: true,
      },
    ],
  },
  {
    slug: "media-outreach",
    label: "Media & Outreach Department",
    match: [
      "Media & Outreach Department",
      "Media and Outreach Department",
      "Media & Outreach",
      "Media and Outreach",
      "Media & Outreach Dept",
      "Media and Outreach Dept",
      "Social Media & Outreach Department",
      "Social Media and Outreach Department",
      "Social Media & Outreach",
      "Social Media and Outreach",
      "Social Media & Outreach Dept",
      "Social Media and Outreach Dept",
    ],
    questions: [
      {
        key: "background",
        label: "Background & Experience",
        prompt: "Please tell us about your background and experience in Social Media and Outreach acquisition.",
        match: [
          "Please tell us about your background and experience in Social Media and Outreach acquisition.",
          "Please tell us about your background and experience in Media and Outreach.",
        ],
        type: "long",
      },
      {
        key: "familiarity",
        label: "Familiarity with Sahityika",
        prompt: "How familiar are you with Sahityika and its agenda?",
        match: ["How familiar are you with Sahityika and its agenda?"],
        type: "long",
      },
      {
        key: "prTactics",
        label: "PR Tactics & Event Hype",
        prompt: "How would you leverage PR tactics to generate excitement and anticipation for our upcoming events in order to maximize attendance and engagement?",
        match: ["How would you leverage PR tactics to generate excitement and anticipation for our upcoming events in order to maximize attendance and engagement?"],
        type: "long",
      },
      {
        key: "contentStrategy",
        label: "Content Strategy & Audience Attraction",
        prompt: "What kind of content do you think would best attract students, young professionals, creators, towards Sahityika or Literature?",
        match: ["What kind of content do you think would best attract students, young professionals, creators, towards Sahityika or Literature?"],
        type: "long",
      },
      {
        key: "prPlan",
        label: "Hypothetical PR & Sponsorship Plan",
        prompt: "Can you outline a hypothetical PR and sponsorship plan for a major upcoming event hosted by the society?",
        match: ["Can you outline a hypothetical PR and sponsorship plan for a major upcoming event hosted by the society?"],
        type: "feature",
      },
      {
        key: "resume",
        label: "Résumé",
        prompt: "Resume (optional)",
        match: ["Resume (optional)", "Resume"],
        type: "resume",
        optional: true,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// PENDING / UNASSIGNED QUESTIONS
// ---------------------------------------------------------------------------
// Columns observed in the raw export that don't yet belong to a department in
// this configuration. They are intentionally NOT auto-assigned. The importer
// will detect them, list them in the import summary, and leave them out of
// every applicant's dossier until a human assigns them here.
//
// To activate one: move its entry into the relevant department's
// `questions` array above (or create a new department) and give it a `type`.
export const PENDING_QUESTIONS = [
  {
    key: "declaration",
    label: "Declaration",
    match: ["I hereby declare that :", "I hereby declare that:", "I hereby declare that"],
  },
  {
    key: "videoEditingExperience",
    label: "Video Editing Experience",
    match: ["How experienced are you with video editing?"],
  },
  {
    key: "socialMediaAudit",
    label: "Social Media Improvement Suggestions",
    match: [
      "After reviewing the society\u2019s social media handles, what changes, ideas, or strategies would you suggest to improve our content, audience engagement, media presence, and overall outreach?",
      "After reviewing the society's social media handles, what changes, ideas, or strategies would you suggest to improve our content, audience engagement, media presence, and overall outreach?",
    ],
  },
];

// Fallback bucket for any applicant whose department value doesn't match a
// configured department. Keeps the importer honest instead of silently
// dropping rows or mis-filing them.
export const UNKNOWN_DEPARTMENT = {
  slug: "unassigned",
  label: "Unrecognized Department",
  match: [],
  questions: [],
};

export function getDepartmentBySlug(slug) {
  return DEPARTMENTS.find((d) => d.slug === slug) || null;
}

export function getAllDepartments() {
  return DEPARTMENTS;
}
