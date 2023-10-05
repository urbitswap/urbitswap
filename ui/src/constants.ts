// eslint-disable-next-line import/prefer-default-export
export const ENV_TEST: boolean = true;

export const APP_NAME: string = "VCC Trade";
export const APP_TERM: string = "vcc-trade";

// https://stackoverflow.com/a/27093173
export const MAX_DATE: Date = new Date(8640000000000000);

export const CONTRACT = Object.freeze({
  COLLECTION: "ETHEREUM:0x0a36453Ce8645Df38c8aadAaf002b8CC24C0Fc81",
  // https://www.circle.com/en/usdc/developers#usdc-multichain
  USDC: ENV_TEST
    ? "ETHEREUM:0x07865c6e87b9f70255377e024ace6630c1eaa37f"
    : "ETHEREUM:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
});

export const TENDERS = [
  Object.freeze({value: "usdc", label: "$ USDC"}),
  Object.freeze({value: "eth", label: "⧫ Ethereum"}),
];

export const TRADERS_HOST: [string, string] = ENV_TEST
  ? ["~zod", "master"]
  : ["~dister-dister-sidnym-ladrut", "master"];
export const TRADERS_HOST_FLAG: string = TRADERS_HOST.join("/");

export const AUTHORS = [
  "~labtug-doztec",
  "~sidnym-ladrut",
];
