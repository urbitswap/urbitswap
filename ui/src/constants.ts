// eslint-disable-next-line import/prefer-default-export
export const APP_TERM: string = "urbitswap";
export const APP_DBUG: boolean = import.meta.env.MODE === "development";
// NOTE: Separate from 'APP_DBUG' to test ETH/Urbit testnet/livenet independently.
export const APP_FAKEZOD: boolean = APP_DBUG;
export const APP_VERSION: string = import.meta.env.VITE_STORAGE_VERSION;

// https://stackoverflow.com/a/27093173
export const MAX_DATE: Date = new Date(8640000000000000);

export const CONTRACT = Object.freeze({
  WETH: APP_DBUG
    ? "ETHEREUM:0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6"
    : "ETHEREUM:0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  // https://www.circle.com/en/usdc/developers#usdc-multichain
  USDC: APP_DBUG
    ? "ETHEREUM:0x07865c6e87b9f70255377e024ace6630c1eaa37f"
    : "ETHEREUM:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
});

export const FEATURED = Object.freeze({
  AZP: APP_DBUG
    ? "ETHEREUM:0x06e3f092362d116c807482c0473ae256e5721c13"
    : "ETHEREUM:0x33eecbf908478c10614626a9d304bfe18b78dd73",
  MIL: APP_DBUG
    ? "ETHEREUM:0x248b3e3b3f711002d12c01bd326a8761233dd482"
    : "ETHEREUM:0x5af0d9827e0c53e4799bb226655a1de152a425a5",
  VC: APP_DBUG
    // "ETHEREUM:0x7374d1CbdCd648e13F5DD64389b73443074a12c1",
    ? "ETHEREUM:0x0a36453ce8645df38c8aadaaf002b8cc24c0fc81"
    : "ETHEREUM:0x9d8ca5b5715704175c6877ee911e727593726332",
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
