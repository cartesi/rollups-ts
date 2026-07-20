import type {
    AbiParameter,
    AbiParameterToPrimitiveType,
    ByteArray,
    Hex,
} from "viem";

/**
 * Map named ABI parameters to an object type: `{ name: primitiveType, ... }`.
 * Dynamic `bytes` parameters are mapped to `bytes` instead of `Hex`, so
 * decoded objects can carry byte arrays when decoding from byte arrays.
 */
export type ParamsToObject<
    params extends readonly AbiParameter[],
    bytes extends Hex | ByteArray = Hex,
> = {
    [param in params[number] as param extends {
        name: infer name extends string;
    }
        ? name
        : never]: param extends { type: "bytes" }
        ? bytes
        : AbiParameterToPrimitiveType<param>;
};

/**
 * Flatten an intersection so hover tooltips show a plain object type.
 */
export type Prettify<T> = { [K in keyof T]: T[K] } & {};

/**
 * Target representation of encoded data: a `Hex` string (the default) or a
 * `Uint8Array`.
 */
export type To = "hex" | "bytes";

/**
 * Encoded data in the representation selected by `to`.
 */
export type EncodedData<to extends To> = to extends "bytes" ? ByteArray : Hex;

/**
 * Representation of the variable-size byte fields of a decoded object, given
 * the representation of the encoded data: hex in, hex out; bytes in, bytes
 * out.
 */
export type DecodedBytes<data extends Hex | ByteArray> = data extends ByteArray
    ? ByteArray
    : Hex;
