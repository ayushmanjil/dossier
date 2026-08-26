import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSelectionManager } from "../hooks/useRecruitmentData";

export default function Layout({ children }) {
  const location = useLocation();
  const { currentUser, isAdmin, logout } = useAuth();
  const { selectedCount } = useSelectionManager();
  const isApplicantPage = location.pathname.startsWith("/applicant/");

  return (
    <div className={`bg-paper text-ink ${isApplicantPage ? "h-screen overflow-hidden flex flex-col" : "min-h-screen"}`}>
      <header className="shrink-0 border-b border-line/70 bg-paper/95 backdrop-blur-sm z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <Link to="/" className="group flex items-baseline gap-3">
            <span className="font-display text-xl font-semibold tracking-tight text-ink">
              Sahityika
            </span>
            <span className="hidden font-mono text-[0.68rem] uppercase tracking-[0.22em] text-ink-faint sm:inline">
              Recruitment Archive
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-6 font-mono text-[0.72rem] uppercase tracking-[0.14em]">
              <Link
                to="/"
                className={`transition-colors hover:text-oxblood ${
                  location.pathname === "/" ? "text-oxblood" : "text-ink-soft"
                }`}
              >
                Dashboard
              </Link>

              <Link
                to="/selected"
                className={`flex items-center gap-1.5 transition-colors hover:text-oxblood ${
                  location.pathname === "/selected" ? "text-oxblood" : "text-ink-soft"
                }`}
              >
                <span>Selected</span>
                {selectedCount > 0 && (
                  <span className="rounded-full bg-forest px-1.5 py-0.2 font-mono text-[0.58rem] font-bold text-paper-raised">
                    {selectedCount}
                  </span>
                )}
              </Link>

              {isAdmin && (
                <>
                  <Link
                    to="/admin/upload"
                    className={`transition-colors hover:text-oxblood ${
                      location.pathname === "/admin/upload" ? "text-oxblood" : "text-ink-soft"
                    }`}
                  >
                    Import CSV
                  </Link>
                  <Link
                    to="/admin/interviewers"
                    className={`transition-colors hover:text-oxblood ${
                      location.pathname === "/admin/interviewers" ? "text-oxblood" : "text-ink-soft"
                    }`}
                  >
                    Interviewers
                  </Link>
                </>
              )}
            </nav>

            {currentUser && (
              <div className="flex items-center gap-3 border-l border-line pl-6">
                <div className="text-right hidden sm:block">
                  <div className="font-display text-xs font-medium text-ink leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="font-mono text-[0.6rem] uppercase tracking-wider text-brass leading-tight">
                    {currentUser.role}
                  </div>
                </div>

                <button
                  onClick={logout}
                  title="Sign Out"
                  className="rounded border border-line bg-paper-raised px-2.5 py-1 font-mono text-[0.65rem] uppercase tracking-wider text-ink-soft hover:border-oxblood hover:text-oxblood transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="stitch-divider" />
      </header>

      <main className={isApplicantPage ? "flex-1 overflow-hidden min-h-0" : ""}>{children}</main>

      {!isApplicantPage && (
        <footer className="mt-24 border-t border-line/70 py-8">
          <div className="mx-auto max-w-6xl px-6 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-ink-faint">
            Sahityika Recruitment Archive · Confidential Society Dossier
          </div>
        </footer>
      )}
    </div>
  );
}
