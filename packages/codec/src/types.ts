import type { AbiParameter, AbiParameterToPrimitiveType } from "viem";

/**
 * Map named ABI parameters to an object type: `{ name: primitiveType, ... }`.
 */
export type ParamsToObject<params extends readonly AbiParameter[]> = {
    [param in params[number] as param extends {
        name: infer name extends string;
    }
        ? name
        : never]: AbiParameterToPrimitiveType<param>;
};

/**
 * Flatten an intersection so hover tooltips show a plain object type.
 */
export type Prettify<T> = { [K in keyof T]: T[K] } & {};
