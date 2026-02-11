import { BrowserRouter as Router, Routes, Route } from "react-router";

import LandingPage from "@/features/landing/landing.page.jsx";
import AuthLayout from "./shared/layouts/AuthLayout.wrapper";
import AppLayout from "./shared/layouts/AppLayout.wrapper";
import LoginPage from "@/features/auth/pages/Login.page.jsx";
import RegisterPage from "@/features/auth/pages/Register.page.jsx";
import NotFoundPage from "@/shared/pages/NotFound.page.jsx";

import DebugPage from "@/features/debug/debug.page.jsx";
import EmotionPredTest from "@/features/debug/tests/emotion/emotionPred.test.jsx";
import EmotionAnalyzer from "@/features/debug/tests/emotion/ws_emotionPred.test.jsx";
import AvailableTests from "@/features/debug/availableTests.jsx";

function App() {
  return (
    <div className="w-screen h-screen flex flex-col bg-background">
      <Router>
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
            <Route path="/app" element={<AppLayout />}></Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
