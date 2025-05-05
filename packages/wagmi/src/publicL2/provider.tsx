import { CartesiPublicClient, createCartesiPublicClient } from "@cartesi/viem";
import { QueryClient } from "@tanstack/react-query";
import { createContext, ReactNode, useContext, useMemo } from "react";
import { http } from "viem";

interface CartesiProviderProps {
    children: ReactNode;
    rpcUrl: string;
}

const CartesiContext = createContext<CartesiPublicClient | null>(null);

export const CartesiProvider = ({ children, rpcUrl }: CartesiProviderProps) => {
    const client = useMemo(() => {
        return createCartesiPublicClient({
            transport: http(rpcUrl),
        });
    }, [rpcUrl]);

    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {},
        },
    });

    return (
        <CartesiContext.Provider value={client}>
            {children}
        </CartesiContext.Provider>
    );
};

export const useCartesiClient = (): CartesiPublicClient => {
    const client = useContext(CartesiContext);
    if (!client) {
        throw new Error(
            "useCartesiClient must be used within a CartesiProvider",
        );
    }
    return client;
};
