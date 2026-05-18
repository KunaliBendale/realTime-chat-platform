import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RegisterPage } from "./pages/RegisterPage";

function App() {
  return (
    <>
      {/* Authentication guards are temporarily disabled for frontend page review. */}
      {/* <AuthSessionListener /> */}
      <Routes>
        {/* <Route element={<PublicRoute />}> */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* </Route> */}

        {/* <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}> */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/chat" element={<DashboardPage />} />
        {/* </Route>
        </Route> */}

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default App;
