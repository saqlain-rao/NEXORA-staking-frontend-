import React, { FC, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

export const SolanaProvider: FC<Props> = ({ children }) => {
    return (
        <>{children}</>
    );
};
