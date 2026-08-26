import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import AuthGate from "./components/AuthGate";
import AdminGate from "./components/AdminGate";
import Dashboard from "./pages/Dashboard";
import DepartmentView from "./pages/DepartmentView";
import ApplicantView from "./pages/ApplicantView";
import UploadAdmin from "./pages/UploadAdmin";
import ManageInterviewers from "./pages/ManageInterviewers";
import SelectedCandidates from "./pages/SelectedCandidates";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <AuthGate>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/selected" element={<SelectedCandidates />} />
          <Route path="/department/:slug" element={<DepartmentView />} />
          <Route path="/applicant/:id" element={<ApplicantView />} />
          <Route
            path="/admin/upload"
            element={
              <AdminGate>
                <UploadAdmin />
              </AdminGate>
            }
          />
          <Route
            path="/admin/interviewers"
            element={
              <AdminGate>
                <ManageInterviewers />
              </AdminGate>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </AuthGate>
  );
}
