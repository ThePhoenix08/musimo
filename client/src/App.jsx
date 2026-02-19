import { Suspense, lazy, memo } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router";
import { ToastContainer } from "react-toastify";
import GlobalLoader from "./components/misc/GlobalLoader";

const lazyPage = (path) => lazy(() => import(path));

const LandingPage = lazyPage("@/features/landing/landing.page.jsx");
const AuthLayout = lazyPage("./shared/layouts/AuthLayout.wrapper");
const AppLayout = lazyPage("./shared/layouts/AppLayout.wrapper");
const LoginPage = lazyPage("@/features/auth/pages/Login.page.jsx");
const RegisterPage = lazyPage("@/features/auth/pages/Register.page.jsx");
const ProfilePage = lazyPage("@/features/profile/pages/profile.page");
const NotFoundPage = lazyPage("@/shared/pages/NotFound.page.jsx");
const DebugPage = lazyPage("@/features/debug/debug.page.jsx");
const AvailableTests = lazyPage("@/features/debug/availableTests.jsx");
const EmotionPredTest = lazyPage(
  "@/features/debug/tests/emotion/emotionPred.test.jsx",
);
const EmotionAnalyzer = lazyPage(
  "@/features/debug/tests/emotion/ws_emotionPred.test.jsx",
);

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
