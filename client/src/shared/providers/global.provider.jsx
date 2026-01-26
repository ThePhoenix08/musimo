import { BrowserRouter as Router } from "react-router";
import { ThemeProvider } from "@/shared/providers/theme.provider.jsx";

function GlobalProvider({ children }) {
  return (
    <>
      {/* Add global context providers here */}
      <ThemeProvider>
        <Router>{children}</Router>
      </ThemeProvider>
    </>
  );
}
export default GlobalProvider;
