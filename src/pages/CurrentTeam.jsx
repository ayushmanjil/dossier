import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApplicationsStore } from "../context/ApplicationsContext";
import { useEvaluationsMap } from "../hooks/useRecruitmentData";
import { DEPARTMENTS } from "../config/recruitmentConfig";
import GlyphBar from "../components/GlyphBar";

const MAX_MEMBERS = 12;
const SPINE_ACCENTS = ["bg-oxblood", "bg-forest", "bg-brass", "bg-oxblood-deep", "bg-forest-deep"];

// ─── Inline form for adding / editing a regular member ──────────────────────
function MemberForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || "");
  const [email, setEmail] = useState(initial?.email || "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSave({ name: name.trim(), email: email.trim() });
      }}
      className="border-b border-line bg-paper/50 px-6 py-4"
    >
      <p className="font-mono text-[0.62rem] uppercase tracking-wider text-ink-soft mb-3">
        {initial ? "Edit Member" : "Add New Member"}
      </p>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block font-mono text-[0.58rem] uppercase tracking-wider text-ink-faint mb-1">
            Full Name <span className="text-oxblood">*</span>
          </label>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Aryan Sharma"
            className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-oxblood focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label className="block font-mono text-[0.58rem] uppercase tracking-wider text-ink-faint mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. aryan@example.com"
            className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-oxblood focus:outline-none"
          />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="submit"
          className="rounded-md bg-oxblood px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-paper-raised hover:bg-oxblood-deep transition-colors"
        >
          {initial ? "Save Changes" : "Add Member"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-line px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-ink-soft hover:text-ink transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Inline form for assigning / editing the dept head ──────────────────────
function HeadForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || "");
  const [email, setEmail] = useState(initial?.email || "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSave({ name: name.trim(), email: email.trim(), title: "Department Head" });
      }}
      className="border-b border-line bg-paper/50 px-6 py-4"
    >
      <p className="font-mono text-[0.62rem] uppercase tracking-wider text-ink-soft mb-3">
        {initial ? "Edit Department Head" : "Assign Department Head"}
      </p>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block font-mono text-[0.58rem] uppercase tracking-wider text-ink-faint mb-1">
            Full Name <span className="text-oxblood">*</span>
          </label>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Priya Menon"
            className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-forest focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label className="block font-mono text-[0.58rem] uppercase tracking-wider text-ink-faint mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. priya@example.com"
            className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-forest focus:outline-none"
          />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="submit"
          className="rounded-md bg-forest px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-paper-raised hover:bg-forest-deep transition-colors"
        >
          {initial ? "Save Changes" : "Assign Head"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-line px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-ink-soft hover:text-ink transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Per-department panel ─────────────────────────────────────────────────────
function DepartmentPanel({ dept, index, isAdmin, evalMap }) {
  const { departmentTeams, selectedApplicants, saveTeam } = useApplicationsStore();
  const teamData = departmentTeams[dept.slug] || { deptHead: null, members: [] };
  const deptHead = teamData.deptHead || null;
  const members = teamData.members || [];

  // Selected/hired candidates who belong to this department
  const newRecruits = useMemo(
    () =>
      selectedApplicants.filter((a) =>
        (a.department || "") === dept.slug ||
        (dept.match || []).some(
          (m) =>
            m.toLowerCase() === (a.department || "").toLowerCase() ||
            m.toLowerCase() === (a.departmentLabel || "").toLowerCase()
        )
      ),
    [selectedApplicants, dept]
  );

  const [showHeadForm, setShowHeadForm] = useState(false);
  const [editHeadMode, setEditHeadMode] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [saving, setSaving] = useState(false);

  const memberLimitReached = members.length >= MAX_MEMBERS;
  const accent = SPINE_ACCENTS[index % SPINE_ACCENTS.length];

  async function persist(patch) {
    setSaving(true);
    try { await saveTeam(dept.slug, { ...teamData, ...patch }); }
    finally { setSaving(false); }
  }

  // ── Head actions ──
  async function handleSaveHead(data) {
    await persist({ deptHead: data });
    setShowHeadForm(false);
    setEditHeadMode(false);
  }
  async function handleRemoveHead() {
    if (!window.confirm("Remove the department head?")) return;
    await persist({ deptHead: null });
  }

  // ── Member actions ──
  async function handleAddMember(data) {
    const id = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    await persist({ members: [...members, { id, ...data }] });
    setShowAddMember(false);
  }
  async function handleEditMember(id, data) {
    await persist({ members: members.map((m) => (m.id === id ? { ...m, ...data } : m)) });
    setEditingMemberId(null);
  }
  async function handleRemoveMember(id) {
    if (!window.confirm("Remove this member?")) return;
    await persist({ members: members.filter((m) => m.id !== id) });
  }

  const totalOccupied = members.length + newRecruits.length;

  return (
    <div className="rounded-xl border border-line bg-paper-raised shadow-lifted overflow-hidden">
      {/* Coloured top bar */}
      <div className={`h-1.5 w-full ${accent}`} />

      {/* Section header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-line">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">{dept.label}</h2>
          <p className="font-mono text-[0.62rem] uppercase tracking-wider text-ink-faint mt-0.5">
            {totalOccupied}/{MAX_MEMBERS} members
            {newRecruits.length > 0 && (
              <span className="ml-2 text-oxblood font-semibold">
                · {newRecruits.length} new recruit{newRecruits.length !== 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
        {/* Capacity pill */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-24 h-1.5 rounded-full bg-line overflow-hidden">
            <div
              className={`h-full rounded-full ${accent} transition-all`}
              style={{ width: `${Math.min((totalOccupied / MAX_MEMBERS) * 100, 100)}%` }}
            />
          </div>
          <span className="font-mono text-[0.6rem] text-ink-faint whitespace-nowrap">
            {MAX_MEMBERS - totalOccupied} open
          </span>
        </div>
      </div>

      {/* ════ DEPARTMENT HEAD ════ */}
      <div>
        {/* Sub-header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-line/60">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-forest font-bold">
            Department Head
          </p>
          {isAdmin && !showHeadForm && !editHeadMode && !deptHead && (
            <button
              onClick={() => setShowHeadForm(true)}
              className="font-mono text-[0.62rem] uppercase tracking-wider text-ink-faint hover:text-forest transition-colors"
            >
              + Assign
            </button>
          )}
          {isAdmin && deptHead && !editHeadMode && !showHeadForm && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setEditHeadMode(true)}
                className="font-mono text-[0.62rem] uppercase tracking-wider text-ink-faint hover:text-ink transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleRemoveHead}
                className="font-mono text-[0.62rem] uppercase tracking-wider text-ink-faint hover:text-oxblood transition-colors"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Head form */}
        {(showHeadForm || editHeadMode) && (
          <HeadForm
            initial={editHeadMode ? deptHead : null}
            onSave={handleSaveHead}
            onCancel={() => { setShowHeadForm(false); setEditHeadMode(false); }}
          />
        )}

        {/* Head row */}
        {deptHead && !editHeadMode && !showHeadForm ? (
          <div className="flex items-center gap-4 px-6 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-forest bg-forest/10 font-display text-sm font-bold text-forest">
              {deptHead.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-bold text-ink">{deptHead.name}</span>
                <span className="rounded bg-forest/10 px-1.5 py-0.5 font-mono text-[0.52rem] font-bold uppercase tracking-wider text-forest border border-forest/20">
                  Dept Head
                </span>
              </div>
              {deptHead.email && (
                <p className="font-mono text-[0.62rem] text-ink-faint mt-0.5">{deptHead.email}</p>
              )}
            </div>
          </div>
        ) : !showHeadForm && !editHeadMode ? (
          <div className="px-6 py-5 text-center">
            <p className="font-mono text-[0.65rem] text-ink-faint italic">No department head assigned.</p>
          </div>
        ) : null}
      </div>

      {/* ════ CURRENT MEMBERS ════ */}
      <div className="border-t border-line">
        {/* Sub-header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-line/60">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ink-soft font-bold">
            Current Members ({members.length}/{MAX_MEMBERS})
          </p>
          {isAdmin && !showAddMember && (
            <button
              onClick={() => {
                if (memberLimitReached) {
                  alert(`Maximum ${MAX_MEMBERS} members per department.`);
                  return;
                }
                setShowAddMember(true);
                setEditingMemberId(null);
              }}
              disabled={memberLimitReached}
              className={`font-mono text-[0.62rem] uppercase tracking-wider transition-colors ${
                memberLimitReached
                  ? "text-ink-faint opacity-40 cursor-not-allowed"
                  : "text-ink-faint hover:text-oxblood"
              }`}
            >
              + Add Member
            </button>
          )}
        </div>

        {/* Add-member form */}
        {showAddMember && (
          <MemberForm
            onSave={handleAddMember}
            onCancel={() => setShowAddMember(false)}
          />
        )}

        {/* Member rows */}
        {members.length === 0 && !showAddMember ? (
          <div className="px-6 py-5 text-center">
            <p className="font-mono text-[0.65rem] text-ink-faint italic">No members added yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-line/60">
            {members.map((m) => (
              <div key={m.id}>
                {editingMemberId === m.id ? (
                  <MemberForm
                    initial={m}
                    onSave={(data) => handleEditMember(m.id, data)}
                    onCancel={() => setEditingMemberId(null)}
                  />
                ) : (
                  <div className="flex items-center gap-4 px-6 py-4 hover:bg-paper/40 transition-colors">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper border border-line font-display text-xs font-bold text-ink-soft">
                      {m.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-display text-sm font-semibold text-ink">{m.name}</span>
                      <p className="font-mono text-[0.62rem] text-ink-faint mt-0.5">
                        {m.email || "—"}
                      </p>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          onClick={() => { setEditingMemberId(m.id); setShowAddMember(false); }}
                          className="font-mono text-xs text-ink-soft hover:text-oxblood underline-offset-2 hover:underline transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRemoveMember(m.id)}
                          className="font-mono text-xs text-oxblood hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ════ NEW RECRUITS ════ */}
      {newRecruits.length > 0 && (
        <div className="border-t border-line">
          {/* Sub-header */}
          <div className="flex items-center gap-2 px-6 py-3 border-b border-line/60">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-oxblood font-bold">
              New Recruits
            </p>
            <span className="rounded-full bg-oxblood px-2 py-0.2 font-mono text-[0.52rem] font-bold text-paper-raised">
              {newRecruits.length}
            </span>
          </div>

          <div className="divide-y divide-line/60">
            {newRecruits.map((a) => {
              const evalData = evalMap.get(a.applicantId);
              const avg = evalData?.avgRating;
              const rounded = evalData?.roundedAvg || 0;
              const count = evalData?.count || 0;
              return (
                <Link
                  key={a.applicantId}
                  to={`/applicant/${a.applicantId}`}
                  className="group flex items-center gap-4 px-6 py-4 hover:bg-oxblood/[0.03] transition-colors"
                >
                  {/* Avatar with NEW badge */}
                  <div className="relative shrink-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-oxblood/50 bg-oxblood/10 font-display text-sm font-bold text-oxblood">
                      {a.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <span className="absolute -top-1.5 -right-2 rounded-full bg-oxblood px-1.5 py-0.2 font-mono text-[0.42rem] font-bold uppercase text-paper-raised leading-tight whitespace-nowrap">
                      NEW
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm font-semibold text-ink group-hover:text-oxblood transition-colors">
                        {a.name}
                      </span>
                      <span className="rounded bg-oxblood/10 px-1.5 py-0.2 font-mono text-[0.5rem] font-bold uppercase text-oxblood border border-oxblood/20">
                        ★ New Recruit
                      </span>
                    </div>
                    <p className="font-mono text-[0.62rem] text-ink-faint mt-0.5">
                      {[a.rollNumber, a.commonAnswers?.house ? `House ${a.commonAnswers.house}` : null].filter(Boolean).join(" · ")}
                    </p>
                    {count > 0 && (
                      <div className="mt-1 flex items-center gap-1.5">
                        <GlyphBar value={rounded} max={5} size="sm" />
                        <span className="font-mono text-[0.6rem] text-ink">{avg}/5</span>
                      </div>
                    )}
                  </div>

                  <span className="shrink-0 font-mono text-sm text-ink-faint group-hover:text-oxblood group-hover:translate-x-0.5 transition-all">
                    →
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CurrentTeam() {
  const { loading, selectedCount } = useApplicationsStore();
  const { isAdmin } = useAuth();
  const { evalMap } = useEvaluationsMap();
  const [activeTab, setActiveTab] = useState(DEPARTMENTS[0]?.slug || "");

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-24 text-center font-mono text-xs uppercase tracking-widest text-ink-faint">
        Loading team roster…
      </div>
    );
  }

  const activeDept = DEPARTMENTS.find((d) => d.slug === activeTab) || DEPARTMENTS[0];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 py-10">
      {/* ── Page Header ── */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-brass">
            Organization
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            Current Team
          </h1>
          <p className="mt-3 text-base text-ink-soft max-w-xl">
            {isAdmin
              ? "Manage current team members for each department and track new recruits from the selection drive."
              : "View current team members and new recruits across departments."}
          </p>
        </div>
        {selectedCount > 0 && (
          <span className="self-start sm:self-auto rounded-full border border-oxblood/30 bg-oxblood/10 px-4 py-1.5 font-mono text-xs font-bold text-oxblood">
            {selectedCount} New Recruit{selectedCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── Department Tabs ── */}
      <div className="flex flex-wrap gap-1.5 mb-8">
        {DEPARTMENTS.map((dept, i) => {
          const isActive = activeTab === dept.slug;
          const accent = SPINE_ACCENTS[i % SPINE_ACCENTS.length];
          return (
            <button
              key={dept.slug}
              onClick={() => setActiveTab(dept.slug)}
              className={`rounded-lg border px-4 py-2 font-mono text-[0.65rem] uppercase tracking-wider transition-all ${
                isActive
                  ? "border-transparent bg-ink text-paper-raised shadow-card"
                  : "border-line bg-paper-raised text-ink-soft hover:border-ink-soft hover:text-ink"
              }`}
            >
              {/* Short label: first meaningful word(s) */}
              {dept.label.replace(/ Department$/, "").replace(/\s*&\s*/g, " & ")}
            </button>
          );
        })}
      </div>

      {/* ── Active Dept Panel ── */}
      {activeDept && (
        <DepartmentPanel
          dept={activeDept}
          index={DEPARTMENTS.findIndex((d) => d.slug === activeDept.slug)}
          isAdmin={isAdmin}
          evalMap={evalMap}
        />
      )}
    </div>
  );
}
