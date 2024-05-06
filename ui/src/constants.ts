// eslint-disable-next-line import/prefer-default-export
export const APP_TERM: string = "urbitswap";
export const APP_DBUG: boolean = import.meta.env.MODE === "development";
// NOTE: Separate from 'APP_DBUG' to test ETH/Urbit testnet/livenet independently.
export const APP_FAKEZOD: boolean = APP_DBUG;
export const APP_VERSION: string = import.meta.env.VITE_STORAGE_VERSION;

// https://stackoverflow.com/a/27093173
export const MAX_DATE: Date = new Date(8640000000000000);

// NOTE: The blockchains used are: ETHEREUM SEPOLIA (DEBUG), BASE (RELEASE)
export const CONTRACT = Object.freeze({
  WETH: APP_DBUG
    ? "ETHEREUM:0x7b79995e5f793a07bc00c21412e50ecae098e7f9"
    : "ETHEREUM:0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  // https://www.circle.com/en/usdc/developers#usdc-multichain
  USDC: APP_DBUG
    ? "ETHEREUM:0x1c7d4b196cb0c7b01d743fbc6116a902379c7238"
    : "ETHEREUM:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  // https://docs.rarible.org/reference/contract-addresses
  // FIXME: Technically an "ETHEREUM:" address, but it's passed to Wagmi
  // instead of Rarible so we need to omit the chain identifier and keep
  // the lowercase/uppercase checksums
  EXCHANGE: APP_DBUG
    ? "0x02afbD43cAD367fcB71305a2dfB9A3928218f0c1"
    : "0x6C65a3C3AA67b126e43F86DA85775E0F5e9743F7",
});

export const FEATURED = Object.freeze({
  AZP: APP_DBUG
    ? "ETHEREUM:0xabe28c76e1c9750eb78f32a07c295afa99b557fd"
    : "ETHEREUM:0x33eecbf908478c10614626a9d304bfe18b78dd73",
  MIL: APP_DBUG
    ? "ETHEREUM:0x850bbcebba2bc39c362edd6eceecf67d61d71fa3"
    : "ETHEREUM:0x5af0d9827e0c53e4799bb226655a1de152a425a5",
  VC: APP_DBUG
    ? "ETHEREUM:0xd0773e6a1336143776c79c5a2c507ebb1402b688"
    : "BASE:0x854757c41ba48ad8c53cf1890b2b8672ad8b0c15",
});

export const TREASURY: {value: number; account: string;} = {
  value: 200, // 2%
  account: APP_DBUG
    ? "ETHEREUM:0x8aa4C4436b7FB8731b34e791b03C9b64b1461C75"
    : "ETHEREUM:0x5799f7EEf7c1D5f90AEB2ceFA917E853d160Bc2f",
};

export const QUERY = Object.freeze({
  COLLECTION_BASE: <const> ["mine", "bids"],
  POINT_TYPE: <const> ["galaxy", "star", "planet"],
});

export const TENDERS = <const> [
  Object.freeze({value: "usdc", label: "$ USDC"}),
  Object.freeze({value: "eth", label: "⧫ Ethereum"}),
];

export const TRADERS_HOST: [string, string] = APP_FAKEZOD
  ? ["~zod", "master"]
  : ["~firser-dister-sidnym-ladrut", "master"];
export const TRADERS_HOST_FLAG: string = TRADERS_HOST.join("/");

export const AUTHORS = [
  "~labtug-doztec",
  "~sidnym-ladrut",
];
