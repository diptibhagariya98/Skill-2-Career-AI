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
