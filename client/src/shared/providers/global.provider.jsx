import { ThemeProvider } from "@/shared/providers/theme.provider.jsx";
import { TooltipProvider } from "@/components/ui/tooltip";

import store from "../state/store/store";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistor } from "../state/store/store";

function GlobalProvider({ children }) {
  return (
    <>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <ThemeProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </ThemeProvider>
        </PersistGate>
      </Provider>
    </>
  );
}
export default GlobalProvider;
