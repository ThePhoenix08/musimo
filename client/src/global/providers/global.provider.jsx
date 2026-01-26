import { BrowserRouter as Router } from 'react-router';

function GlobalProvider({ children }) {
  return (
    <>
      {/* Add global context providers here */}
      <Router>
          {children}
      </Router>
    </>
  );
}
export default GlobalProvider;
