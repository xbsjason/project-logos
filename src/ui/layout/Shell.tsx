import React, { ReactNode } from 'react';

interface ShellProps {
    children: ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ children }) => {
    return (
        <>
            {children}
        </>
    );
};
