import { createContext, useContext, useState } from "react";

export type FontFamily =
  | "Merriweather"
  | "Crimson Text"
  | "Inter"
  | "Public Sans";
export type BibleVersion = "bsb" | "KJV" | "WEB" | "ASV" | "DRA";

export const AVAILABLE_VERSIONS: { id: BibleVersion; name: string }[] = [
  { id: "bsb", name: "Berean Study Bible" },
  { id: "KJV", name: "King James Version" },
  { id: "WEB", name: "World English Bible" },
  { id: "ASV", name: "American Standard Version" },
  { id: "DRA", name: "Douay-Rheims 1899" },
];

interface BibleContextType {
  fontSize: number;
  setFontSize: (size: number) => void;
  fontFamily: FontFamily;
  setFontFamily: (font: FontFamily) => void;
  version: BibleVersion;
  setVersion: (version: BibleVersion) => void;
  resetSettings: () => void;
}

const BibleContext = createContext<BibleContextType | undefined>(undefined);

const DEFAULT_FONT_SIZE = 18;
const DEFAULT_FONT_FAMILY: FontFamily = "Merriweather";
const DEFAULT_VERSION: BibleVersion = "bsb";

const STORAGE_KEY_SIZE = "bible-font-size";
const STORAGE_KEY_FAMILY = "bible-font-family";
const STORAGE_KEY_VERSION = "bible-version";

export function BibleProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSizeState] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SIZE);
    return saved ? parseInt(saved, 10) : DEFAULT_FONT_SIZE;
  });

  const [fontFamily, setFontFamilyState] = useState<FontFamily>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_FAMILY);
    return (saved as FontFamily) || DEFAULT_FONT_FAMILY;
  });

  const [version, setVersionState] = useState<BibleVersion>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_VERSION);
    // Validate if saved version is valid
    if (saved && AVAILABLE_VERSIONS.some((v) => v.id === saved)) {
      return saved as BibleVersion;
    }
    return DEFAULT_VERSION;
  });

  const setFontSize = (size: number) => {
    const newSize = Math.max(12, Math.min(32, size));
    setFontSizeState(newSize);
    localStorage.setItem(STORAGE_KEY_SIZE, newSize.toString());
  };

  const setFontFamily = (font: FontFamily) => {
    setFontFamilyState(font);
    localStorage.setItem(STORAGE_KEY_FAMILY, font);
  };

  const setVersion = (ver: BibleVersion) => {
    setVersionState(ver);
    localStorage.setItem(STORAGE_KEY_VERSION, ver);
  };

  const resetSettings = () => {
    setFontSize(DEFAULT_FONT_SIZE);
    setFontFamily(DEFAULT_FONT_FAMILY);
    setVersion(DEFAULT_VERSION);
  };

  return (
    <BibleContext.Provider
      value={{
        fontSize,
        setFontSize,
        fontFamily,
        setFontFamily,
        version,
        setVersion,
        resetSettings,
      }}
    >
      {children}
    </BibleContext.Provider>
  );
}

export function useBibleContext() {
  const context = useContext(BibleContext);
  if (context === undefined) {
    throw new Error("useBibleSettings must be used within a BibleProvider");
  }
  return context;
}
