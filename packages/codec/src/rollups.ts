//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ERC1155BatchPortal
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const erc1155BatchPortalAbi = [
    {
        type: 'constructor',
        inputs: [
            {
                name: 'inputBox',
                internalType: 'contract IInputBox',
                type: 'address',
            },
        ],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        inputs: [
            {
                name: 'token',
                internalType: 'contract IERC1155',
                type: 'address',
            },
            { name: 'appContract', internalType: 'address', type: 'address' },
            { name: 'tokenIds', internalType: 'uint256[]', type: 'uint256[]' },
            { name: 'values', internalType: 'uint256[]', type: 'uint256[]' },
            { name: 'baseLayerData', internalType: 'bytes', type: 'bytes' },
            { name: 'execLayerData', internalType: 'bytes', type: 'bytes' },
        ],
        name: 'depositBatchERC1155Token',
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        inputs: [],
        name: 'getInputBox',
        outputs: [
            { name: '', internalType: 'contract IInputBox', type: 'address' },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        inputs: [],
        name: 'version',
        outputs: [
            { name: 'major', internalType: 'uint64', type: 'uint64' },
            { name: 'minor', internalType: 'uint64', type: 'uint64' },
            { name: 'patch', internalType: 'uint64', type: 'uint64' },
            { name: 'preRelease', internalType: 'string', type: 'string' },
            { name: 'buildMetadata', internalType: 'string', type: 'string' },
        ],
        stateMutability: 'pure',
    },
] as const

export const erc1155BatchPortalAddress =
    '0x3649c5E2De91C69a7Bb80D864f0039da5E511096' as const

export const erc1155BatchPortalConfig = {
    address: erc1155BatchPortalAddress,
    abi: erc1155BatchPortalAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ERC1155SinglePortal
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const erc1155SinglePortalAbi = [
    {
        type: 'constructor',
        inputs: [
            {
                name: 'inputBox',
                internalType: 'contract IInputBox',
                type: 'address',
            },
        ],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        inputs: [
            {
                name: 'token',
                internalType: 'contract IERC1155',
                type: 'address',
            },
            { name: 'appContract', internalType: 'address', type: 'address' },
            { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
            { name: 'value', internalType: 'uint256', type: 'uint256' },
            { name: 'baseLayerData', internalType: 'bytes', type: 'bytes' },
            { name: 'execLayerData', internalType: 'bytes', type: 'bytes' },
        ],
        name: 'depositSingleERC1155Token',
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        inputs: [],
        name: 'getInputBox',
        outputs: [
            { name: '', internalType: 'contract IInputBox', type: 'address' },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        inputs: [],
        name: 'version',
        outputs: [
            { name: 'major', internalType: 'uint64', type: 'uint64' },
            { name: 'minor', internalType: 'uint64', type: 'uint64' },
            { name: 'patch', internalType: 'uint64', type: 'uint64' },
            { name: 'preRelease', internalType: 'string', type: 'string' },
            { name: 'buildMetadata', internalType: 'string', type: 'string' },
        ],
        stateMutability: 'pure',
    },
] as const

export const erc1155SinglePortalAddress =
    '0x13663E193673756a02e84b724B8a3422A9a7aab4' as const

export const erc1155SinglePortalConfig = {
    address: erc1155SinglePortalAddress,
    abi: erc1155SinglePortalAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ERC20Portal
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const erc20PortalAbi = [
    {
        type: 'constructor',
        inputs: [
            {
                name: 'inputBox',
                internalType: 'contract IInputBox',
                type: 'address',
            },
        ],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        inputs: [
            { name: 'token', internalType: 'contract IERC20', type: 'address' },
            { name: 'appContract', internalType: 'address', type: 'address' },
            { name: 'value', internalType: 'uint256', type: 'uint256' },
            { name: 'execLayerData', internalType: 'bytes', type: 'bytes' },
        ],
        name: 'depositERC20Tokens',
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        inputs: [],
        name: 'getInputBox',
        outputs: [
            { name: '', internalType: 'contract IInputBox', type: 'address' },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        inputs: [],
        name: 'version',
        outputs: [
            { name: 'major', internalType: 'uint64', type: 'uint64' },
            { name: 'minor', internalType: 'uint64', type: 'uint64' },
            { name: 'patch', internalType: 'uint64', type: 'uint64' },
            { name: 'preRelease', internalType: 'string', type: 'string' },
            { name: 'buildMetadata', internalType: 'string', type: 'string' },
        ],
        stateMutability: 'pure',
    },
    { type: 'error', inputs: [], name: 'ERC20TransferFailed' },
] as const

export const erc20PortalAddress =
    '0x22E57511C30CcE6CDaa742E13CE3b774fDC663b1' as const

export const erc20PortalConfig = {
    address: erc20PortalAddress,
    abi: erc20PortalAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ERC721Portal
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const erc721PortalAbi = [
    {
        type: 'constructor',
        inputs: [
            {
                name: 'inputBox',
                internalType: 'contract IInputBox',
                type: 'address',
            },
        ],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        inputs: [
            {
                name: 'token',
                internalType: 'contract IERC721',
                type: 'address',
            },
            { name: 'appContract', internalType: 'address', type: 'address' },
            { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
            { name: 'baseLayerData', internalType: 'bytes', type: 'bytes' },
            { name: 'execLayerData', internalType: 'bytes', type: 'bytes' },
        ],
        name: 'depositERC721Token',
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        inputs: [],
        name: 'getInputBox',
        outputs: [
            { name: '', internalType: 'contract IInputBox', type: 'address' },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        inputs: [],
        name: 'version',
        outputs: [
            { name: 'major', internalType: 'uint64', type: 'uint64' },
            { name: 'minor', internalType: 'uint64', type: 'uint64' },
            { name: 'patch', internalType: 'uint64', type: 'uint64' },
            { name: 'preRelease', internalType: 'string', type: 'string' },
            { name: 'buildMetadata', internalType: 'string', type: 'string' },
        ],
        stateMutability: 'pure',
    },
] as const

export const erc721PortalAddress =
    '0xcA3a0a47915C12F020CF70B938aCC8e744414cb8' as const

export const erc721PortalConfig = {
    address: erc721PortalAddress,
    abi: erc721PortalAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// EtherPortal
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const etherPortalAbi = [
    {
        type: 'constructor',
        inputs: [
            {
                name: 'inputBox',
                internalType: 'contract IInputBox',
                type: 'address',
            },
        ],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        inputs: [
            { name: 'appContract', internalType: 'address', type: 'address' },
            { name: 'execLayerData', internalType: 'bytes', type: 'bytes' },
        ],
        name: 'depositEther',
        outputs: [],
        stateMutability: 'payable',
    },
    {
        type: 'function',
        inputs: [],
        name: 'getInputBox',
        outputs: [
            { name: '', internalType: 'contract IInputBox', type: 'address' },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        inputs: [],
        name: 'version',
        outputs: [
            { name: 'major', internalType: 'uint64', type: 'uint64' },
            { name: 'minor', internalType: 'uint64', type: 'uint64' },
            { name: 'patch', internalType: 'uint64', type: 'uint64' },
            { name: 'preRelease', internalType: 'string', type: 'string' },
            { name: 'buildMetadata', internalType: 'string', type: 'string' },
        ],
        stateMutability: 'pure',
    },
    { type: 'error', inputs: [], name: 'EtherTransferFailed' },
] as const

export const etherPortalAddress =
    '0x8b53327575ac999bdfa8003f4b5134DFF9027516' as const

export const etherPortalConfig = {
    address: etherPortalAddress,
    abi: etherPortalAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Inputs
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const inputsAbi = [
    {
        type: 'function',
        inputs: [
            { name: 'chainId', internalType: 'uint256', type: 'uint256' },
            { name: 'appContract', internalType: 'address', type: 'address' },
            { name: 'msgSender', internalType: 'address', type: 'address' },
            { name: 'blockNumber', internalType: 'uint256', type: 'uint256' },
            {
                name: 'blockTimestamp',
                internalType: 'uint256',
                type: 'uint256',
            },
            { name: 'prevRandao', internalType: 'uint256', type: 'uint256' },
            { name: 'index', internalType: 'uint256', type: 'uint256' },
            { name: 'payload', internalType: 'bytes', type: 'bytes' },
        ],
        name: 'EvmAdvance',
        outputs: [],
        stateMutability: 'nonpayable',
    },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Outputs
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const outputsAbi = [
    {
        type: 'function',
        inputs: [
            { name: 'destination', internalType: 'address', type: 'address' },
            { name: 'payload', internalType: 'bytes', type: 'bytes' },
        ],
        name: 'DelegateCallVoucher',
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        inputs: [{ name: 'payload', internalType: 'bytes', type: 'bytes' }],
        name: 'Notice',
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        inputs: [
            { name: 'destination', internalType: 'address', type: 'address' },
            { name: 'value', internalType: 'uint256', type: 'uint256' },
            { name: 'payload', internalType: 'bytes', type: 'bytes' },
        ],
        name: 'Voucher',
        outputs: [],
        stateMutability: 'nonpayable',
    },
] as const
