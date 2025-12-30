import React, { type ReactNode } from "react";

interface ShellProps {
  children: ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ children }) => {
  return <>{children}</>;
};
