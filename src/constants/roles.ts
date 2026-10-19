export enum UserRole {
  ADMIN = "admin",
  STUDENT = "student",
  CANDIDATE = "candidate",
}

export enum AdminTab {
  OVERVIEW = "overview",
  SCHEMES = "schemes",
  USERS = "users",
}

export enum DashboardSection {
  DASHBOARD = "dashboard",
  ADMIN = "admin",
  PROFILE = "profile",
  RESUME = "resume",
  JOBS = "jobs",
  INTERVIEW = "interview",
  SCHOLARSHIPS = "scholarships",
  LEARN = "learn",
}

export enum InterviewTabState {
  SETUP = "setup",
  SESSION = "session",
  SCORECARD = "scorecard",
  HISTORY = "history",
}

export enum ScholarshipTabState {
  WIZARD = "wizard",
  RESULTS = "results",
  DIRECTORY = "directory",
  SCHOLARS = "scholars",
  ADMIN = "admin",
}

export enum LearnSubPageState {
  HUB = "hub",
  ROADMAPS = "roadmaps",
  NOTES = "notes",
  QUIZZES = "quizzes",
  RESOURCES_CATEGORY = "resources-category",
  RESOURCES_DETAIL = "resources-detail",
}

export const STORAGE_KEYS = {
  GUEST_MODE: "resumentor_guest_mode",
  RESUME_CURRENT: "resumentor_resume_current",
  RESUME_REVISIONS: "resumentor_resume_revisions",
  SCHOLARSHIP_PROFILE: "resumentor_scholarship_profile",
  INTERVIEW_HISTORY: "resumentor_interview_history",
} as const;

export function isUserAdmin(role?: string | null, email?: string | null): boolean {
  if (role === UserRole.ADMIN) {
    return true;
  }
  const superAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;
  if (superAdminEmail && email && email.trim().toLowerCase() === superAdminEmail.trim().toLowerCase()) {
    return true;
  }
  return false;
}
