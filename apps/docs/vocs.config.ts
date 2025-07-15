import { type Config, defineConfig } from "vocs";

const config: Config = defineConfig({
	rootDir: ".",
	title: "Cartesi",
	description: "Documentation for Cartesi TypeScript libraries",
	baseUrl: "https://cartesi.github.io",
	basePath: "/rollups-ts",
	vite: {
		base: "/rollups-ts",
	},
	logoUrl: "https://cartesi.io/favicon.svg",
	editLink: {
		pattern:
			"https://github.com/cartesi/rollups-ts/edit/main/apps/docs/pages/:path",
		text: "Edit on GitHub",
	},
	sidebar: [
		{
			text: "Introduction",
			link: "/",
		},
		{
			text: "Viem Extension",
			items: [
				{
					text: "Introduction",
					link: "/viem",
				},
				{
					text: "Public L1 Actions",
					collapsed: true,
					items: [
						{
							text: "estimateAddInputGas",
							link: "/viem/estimateAddInputGas",
						},
						{
							text: "estimateDepositEtherGas",
							link: "/viem/estimateDepositEtherGas",
						},
						{
							text: "estimateDepositERC20TokenGas",
							link: "/viem/estimateDepositERC20TokenGas",
						},
						{
							text: "estimateDepositERC721TokenGas",
							link: "/viem/estimateDepositERC721TokenGas",
						},
						{
							text: "estimateDepositSingleERC1155TokenGas",
							link: "/viem/estimateDepositSingleERC1155TokenGas",
						},
						{
							text: "estimateDepositBatchERC1155TokenGas",
							link: "/viem/estimateDepositBatchERC1155TokenGas",
						},
						{
							text: "estimateExecuteOutputGas",
							link: "/viem/estimateExecuteOutputGas",
						},
						{
							text: "validateOutput",
							link: "/viem/validateOutput",
						},
					],
				},
				{
					text: "Wallet L1 Actions",
					collapsed: true,
					items: [
						{ text: "addInput", link: "/viem/addInput" },
						{ text: "depositEther", link: "/viem/depositEther" },
						{
							text: "depositERC20Tokens",
							link: "/viem/depositERC20Tokens",
						},
						{
							text: "depositERC721Token",
							link: "/viem/depositERC721Token",
						},
						{
							text: "depositSingleERC1155Token",
							link: "/viem/depositSingleERC1155Token",
						},
						{
							text: "depositBatchERC1155Token",
							link: "/viem/depositBatchERC1155Token",
						},
						{ text: "executeOutput", link: "/viem/executeOutput" },
					],
				},
				{
					text: "Public L2 Actions",
					collapsed: true,
					items: [
						{
							text: "listApplications",
							link: "/viem/listApplications",
						},
						{
							text: "getApplication",
							link: "/viem/getApplication",
						},
						{ text: "listEpochs", link: "/viem/listEpochs" },
						{ text: "getEpoch", link: "/viem/getEpoch" },
						{ text: "listInputs", link: "/viem/listInputs" },
						{ text: "getInput", link: "/viem/getInput" },
						{ text: "listOutputs", link: "/viem/listOutputs" },
						{ text: "getOutput", link: "/viem/getOutput" },
						{ text: "listReports", link: "/viem/listReports" },
						{ text: "getReport", link: "/viem/getReport" },
						{
							text: "getProcessedInputCount",
							link: "/viem/getProcessedInputCount",
						},
						{
							text: "getLastAcceptedEpochIndex",
							link: "/viem/getLastAcceptedEpochIndex",
						},
						{ text: "waitForInput", link: "viem/waitForInput" },
					],
				},
			],
		},
		{
			text: "React Hooks",
			items: [
				{
					text: "Introduction",
					link: "/wagmi",
				},
				{
					text: "Public L2 Hooks",
					collapsed: true,
					items: [
						{ text: "useApplication", link: "/wagmi/useApplication" },
						{ text: "useApplications", link: "/wagmi/useApplications" },
						{ text: "useChainId", link: "/wagmi/useChainId" },
						{ text: "useEpoch", link: "/wagmi/useEpoch" },
						{ text: "useEpochs", link: "/wagmi/useEpochs" },
						{ text: "useInput", link: "/wagmi/useInput" },
						{ text: "useInputs", link: "/wagmi/useInputs" },
						{
							text: "useLastAcceptedEpochIndex",
							link: "/wagmi/useLastAcceptedEpochIndex",
						},
						{ text: "useNodeVersion", link: "/wagmi/useNodeVersion" },
						{ text: "useOutput", link: "/wagmi/useOutput" },
						{ text: "useOutputs", link: "/wagmi/useOutputs" },
						{
							text: "useProcessedInputCount",
							link: "/wagmi/useProcessedInputCount",
						},
						{ text: "useReport", link: "/wagmi/useReport" },
						{ text: "useReports", link: "/wagmi/useReports" },
						{ text: "useWaitForInput", link: "/wagmi/useWaitForInput" },
					],
				},
			],
		},
		{
			text: "RPC Client",
			items: [
				{
					text: "Introduction",
					link: "/rpc",
				},
				{
					text: "API",
					collapsed: true,
					items: [
						{
							text: "createClient",
							link: "/rpc/createClient",
						},
					],
				},
				{
					text: "Methods",
					collapsed: true,
					items: [
						{
							text: "cartesi_listApplications",
							link: "/rpc/cartesi_listApplications",
						},
						{
							text: "cartesi_listEpochs",
							link: "/rpc/cartesi_listEpochs",
						},
						{
							text: "cartesi_listInputs",
							link: "/rpc/cartesi_listInputs",
						},
						{
							text: "cartesi_listOutputs",
							link: "/rpc/cartesi_listOutputs",
						},
						{
							text: "cartesi_listReports",
							link: "/rpc/cartesi_listReports",
						},
						{
							text: "cartesi_getApplication",
							link: "/rpc/cartesi_getApplication",
						},
						{
							text: "cartesi_getEpoch",
							link: "/rpc/cartesi_getEpoch",
						},
						{
							text: "cartesi_getLastAcceptedEpochIndex",
							link: "/rpc/cartesi_getLastAcceptedEpochIndex",
						},
						{
							text: "cartesi_getInput",
							link: "/rpc/cartesi_getInput",
						},
						{
							text: "cartesi_getProcessedInputCount",
							link: "/rpc/cartesi_getProcessedInputCount",
						},
						{
							text: "cartesi_getOutput",
							link: "/rpc/cartesi_getOutput",
						},
						{
							text: "cartesi_getReport",
							link: "/rpc/cartesi_getReport",
						},
					],
				},
			],
		},
	],
});

export default config;
