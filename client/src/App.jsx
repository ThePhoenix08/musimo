import { Suspense, lazy, memo } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router";
import { ToastContainer } from "react-toastify";
import GlobalLoader from "./components/misc/GlobalLoader";

const LandingPage = lazy(() => import("@/features/landing/landing.page.jsx"));
const AuthLayout = lazy(() => import("./shared/layouts/AuthLayout.wrapper"));
const AppLayout = lazy(() => import("./shared/layouts/AppLayout.wrapper"));
const LoginPage = lazy(() => import("@/features/auth/pages/Login.page.jsx"));
const RegisterPage = lazy(
  () => import("@/features/auth/pages/Register.page.jsx"),
);
const NotFoundPage = lazy(() => import("@/shared/pages/NotFound.page.jsx"));

const DebugPage = lazy(() => import("@/features/debug/debug.page.jsx"));
const EmotionPredTest = lazy(
  () => import("@/features/debug/tests/emotion/emotionPred.test.jsx"),
);
const EmotionAnalyzer = lazy(
  () => import("@/features/debug/tests/emotion/ws_emotionPred.test.jsx"),
);
const AvailableTests = lazy(
  () => import("@/features/debug/availableTests.jsx"),
);
const ProfilePage = lazy(() => import("@/features/profile/pages/profile.page"));

function App() {
  return (
    <div className="w-screen h-screen flex flex-col bg-background">
      <Router>
        <Suspense fallback={<GlobalLoader />}>
          <Routes>
            {/* PUBLIC ROUTES */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/debug" element={<DebugPage />}>
              <Route index element={<AvailableTests />} />
              <Route path="emotion" element={<EmotionPredTest />} />
              <Route path="emotion-websocket" element={<EmotionAnalyzer />} />
            </Route>
            {/* AUTHENTICATED */}
            <Route element={<AuthLayout />}>
              <Route path="/app" element={<AppLayout />}>
                <Route path="user/profile" element={<ProfilePage />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
        <ToastContainer
          position="top-right"
          autoClose={4000}
          hideProgressBar
          newestOnTop
          closeButton
          className="toast-container-dark"
        />
      </Router>
    </div>
  );
}

export default memo(App);
