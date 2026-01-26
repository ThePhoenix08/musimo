import { useContext } from "react"
import { ThemeProviderContext } from "@/shared/providers/theme.provider.jsx"

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}