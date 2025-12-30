import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "sanctuary" | "night" | "radiant" | "system";

interface ThemeProviderProps {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
}

interface ThemeProviderState {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const initialState: ThemeProviderState = {
    theme: "system",
    setTheme: () => null,
};

const ThemeContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
    children,
    defaultTheme = "sanctuary",
    storageKey = "vite-ui-theme",
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
    );

    useEffect(() => {
        const root = window.document.documentElement;
        // Remove legacy classes if they exist
        root.classList.remove("light", "dark");

        // Remove data-theme to reset to default (active for sanctuary)
        root.removeAttribute("data-theme");

        let effectiveTheme = theme;

        if (theme === "system") {
            const systemIsDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            effectiveTheme = systemIsDark ? "night" : "sanctuary";
        }

        if (effectiveTheme === "night") {
            root.setAttribute("data-theme", "night");
            root.classList.add("dark"); // Maintain 'dark' class for Tailwind utilities if any use purely 'dark:'
        } else if (effectiveTheme === "radiant") {
            root.setAttribute("data-theme", "radiant");
        }
        // 'sanctuary' falls through to default :root variables

    }, [theme]);

    const value = {
        theme,
        setTheme: (theme: Theme) => {
            localStorage.setItem(storageKey, theme);
            setTheme(theme);
        },
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);

    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider");

    return context;
}


