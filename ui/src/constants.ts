// eslint-disable-next-line import/prefer-default-export
export const APP_NAME: string = "urbits.exchange";
export const APP_TERM: string = "exchange";
export const APP_DBUG: boolean = import.meta.env.MODE === "development";

// https://stackoverflow.com/a/27093173
export const MAX_DATE: Date = new Date(8640000000000000);

export const CONTRACT = Object.freeze({
  AZIMUTH: APP_DBUG
    ? "ETHEREUM:0x06e3f092362d116c807482c0473ae256e5721c13"
    : "ETHEREUM:0x33eecbf908478c10614626a9d304bfe18b78dd73",
  VENTURE: APP_DBUG
    ? "ETHEREUM:0x0a36453Ce8645Df38c8aadAaf002b8CC24C0Fc81"
    : "ETHEREUM:0x9d8ca5b5715704175c6877ee911e727593726332",
  // https://www.circle.com/en/usdc/developers#usdc-multichain
  USDC: APP_DBUG
    ? "ETHEREUM:0x07865c6e87b9f70255377e024ace6630c1eaa37f"
    : "ETHEREUM:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
});

export const QUERY = Object.freeze({
  COLLECTION_BASE: <const> ["all", "mine", "bids"],
  POINT_TYPE: <const> ["galaxy", "star", "planet"],
});

export const TENDERS = <const> [
  Object.freeze({value: "usdc", label: "$ USDC"}),
  Object.freeze({value: "eth", label: "⧫ Ethereum"}),
];

export const TRADERS_HOST: [string, string] = APP_DBUG
  ? ["~zod", "master"]
  : ["~dister-dister-sidnym-ladrut", "master"];
export const TRADERS_HOST_FLAG: string = TRADERS_HOST.join("/");

export const AUTHORS = [
  "~labtug-doztec",
  "~sidnym-ladrut",
];
