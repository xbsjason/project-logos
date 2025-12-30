import React, { type ReactNode } from "react";
import { BottomNav } from "../nav/BottomNav";
import "./AppFrame.css";

interface AppFrameProps {
  children: ReactNode;
}

export const AppFrame: React.FC<AppFrameProps> = ({ children }) => {
  return (
    <div className="appFrame">
      <div id="scroll-container" className="content">
        {children}
      </div>
      <BottomNav />
    </div>
  );
};
