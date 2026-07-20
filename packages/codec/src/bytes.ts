import {
    type Address,
    type ByteArray,
    bytesToBigInt,
    bytesToHex,
    getAddress,
    type Hex,
    hexToBytes,
} from "viem";

// hand-rolled byte-level readers and writers used by the byte array codec
// paths; readers return zero-copy subarrays for variable-size fields, writers
// fill a preallocated buffer and return the offset just past what they wrote

/** Size of an ABI word in bytes. */
export const WORD = 32;

/** Round `length` up to whole ABI words. */
export const ceilWord = (length: number): number =>
    Math.ceil(length / WORD) * WORD;

/** Normalize a byte field to a byte array. */
export const asBytes = (value: Hex | ByteArray): ByteArray =>
    typeof value === "string" ? hexToBytes(value) : value;

/** Normalize a byte field to a hex string. */
export const asHex = (value: Hex | ByteArray): Hex =>
    typeof value === "string" ? value : bytesToHex(value);

/** Whether `data` starts with the 4-byte function `selector`. */
export const hasSelector = (data: ByteArray, selector: ByteArray): boolean =>
    selector.every((byte, i) => data[i] === byte);

const assertReadable = (data: ByteArray, end: number): void => {
    if (end > data.length) {
        throw new Error(
            `data out of bounds: expected at least ${end} bytes, got ${data.length}`,
        );
    }
};

/** Read the 20-byte address at `offset`, returned checksummed. */
export const readAddress = (data: ByteArray, offset: number): Address => {
    assertReadable(data, offset + 20);
    return getAddress(bytesToHex(data.subarray(offset, offset + 20)));
};

/** Read the address right-aligned in the ABI word at `offset`. */
export const readAddressWord = (data: ByteArray, offset: number): Address =>
    readAddress(data, offset + WORD - 20);

/** Read the big-endian uint256 at `offset`. */
export const readUint256 = (data: ByteArray, offset: number): bigint => {
    assertReadable(data, offset + WORD);
    return bytesToBigInt(data.subarray(offset, offset + WORD));
};

// uint256 offset or length that must fit in a JS number
const readSize = (data: ByteArray, offset: number): number => {
    const value = readUint256(data, offset);
    if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
        throw new Error(`data offset or size out of bounds: ${value}`);
    }
    return Number(value);
};

/**
 * Read the dynamic ABI `bytes` whose offset pointer sits at `pointer`, with
 * offsets relative to `base`. Returns a zero-copy subarray of `data`.
 */
export const readAbiBytes = (
    data: ByteArray,
    base: number,
    pointer: number,
): ByteArray => {
    const offset = base + readSize(data, pointer);
    const length = readSize(data, offset);
    assertReadable(data, offset + WORD + length);
    return data.subarray(offset + WORD, offset + WORD + length);
};

/**
 * Read the dynamic ABI `uint256[]` whose offset pointer sits at `pointer`,
 * with offsets relative to `base`.
 */
export const readAbiUint256Array = (
    data: ByteArray,
    base: number,
    pointer: number,
): bigint[] => {
    const offset = base + readSize(data, pointer);
    const length = readSize(data, offset);
    const values: bigint[] = [];
    for (let i = 0; i < length; i++) {
        values.push(readUint256(data, offset + WORD * (i + 1)));
    }
    return values;
};

/** Write `value` at `offset`. */
export const writeBytes = (
    data: Uint8Array,
    offset: number,
    value: ByteArray,
): number => {
    data.set(value, offset);
    return offset + value.length;
};

/** Write `value` at `offset`, zero-padded on the right to whole ABI words. */
export const writePaddedBytes = (
    data: Uint8Array,
    offset: number,
    value: ByteArray,
): number => {
    data.set(value, offset);
    return offset + ceilWord(value.length);
};

/** Write the 20-byte `address` at `offset`. */
export const writeAddress = (
    data: Uint8Array,
    offset: number,
    address: Address,
): number => writeBytes(data, offset, hexToBytes(address));

/** Write `address` right-aligned in the ABI word at `offset`. */
export const writeAddressWord = (
    data: Uint8Array,
    offset: number,
    address: Address,
): number => {
    writeAddress(data, offset + WORD - 20, address);
    return offset + WORD;
};

const MAX_UINT256 = 2n ** 256n - 1n;

/** Write `value` as a big-endian uint256 at `offset`. */
export const writeUint256 = (
    data: Uint8Array,
    offset: number,
    value: bigint,
): number => {
    if (value < 0n || value > MAX_UINT256) {
        throw new Error(`number out of uint256 range: ${value}`);
    }
    let rest = value;
    for (let i = WORD - 1; i >= 0; i--) {
        data[offset + i] = Number(rest & 0xffn);
        rest >>= 8n;
    }
    return offset + WORD;
};

/** Write the length word of `value` followed by its right-padded contents. */
export const writeAbiBytes = (
    data: Uint8Array,
    offset: number,
    value: ByteArray,
): number =>
    writePaddedBytes(
        data,
        writeUint256(data, offset, BigInt(value.length)),
        value,
    );

/** Write the length word of `values` followed by one word per element. */
export const writeAbiUint256Array = (
    data: Uint8Array,
    offset: number,
    values: readonly bigint[],
): number => {
    let next = writeUint256(data, offset, BigInt(values.length));
    for (const value of values) {
        next = writeUint256(data, next, value);
    }
    return next;
};

/** Encoded size of a dynamic ABI `bytes` tail item. */
export const abiBytesSize = (value: ByteArray): number =>
    WORD + ceilWord(value.length);

/** Encoded size of a dynamic ABI `uint256[]` tail item. */
export const abiUint256ArraySize = (values: readonly bigint[]): number =>
    WORD * (1 + values.length);
