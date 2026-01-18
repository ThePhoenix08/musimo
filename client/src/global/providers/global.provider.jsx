import { BrowserRouter } from 'react-router';

function GlobalProvider({ children }) {
  return (
    <>
      {/* Add global context providers here */}
      <BrowserRouter>
          {children}
      </BrowserRouter>
    </>
  );
}
export default GlobalProvider;
