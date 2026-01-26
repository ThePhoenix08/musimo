import { Routes, Route } from "react-router"
import LandingPage from "@/features/landing/landing.page.jsx"
import DebugPage from "@/features/debug/debug.page.jsx"
import EmotionPredTest from "@/features/debug/tests/emotion/emotionPred.test.jsx"
import EmotionAnalyzer from "@/features/debug/tests/emotion/ws_emotionPred.test.jsx"
import AvailableTests from "@/features/debug/availableTests.jsx"

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/debug" element={<DebugPage />} >
          <Route index element={<AvailableTests />} />
          <Route path="emotion" element={<EmotionPredTest />} />
          <Route path="emotion-websocket" element={<EmotionAnalyzer />} />
        </Route>
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </>
  )
}

export default App
