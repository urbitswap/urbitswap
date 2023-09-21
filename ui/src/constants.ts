// eslint-disable-next-line import/prefer-default-export
export const ENV_TEST: boolean = true;

export const APP_NAME: string = "VCC Trade";
export const APP_TERM: string = "vcc-trade";

export const CONTRACT = Object.freeze({
  COLLECTION: "ETHEREUM:0xa144C7E81398B90680bBb34320e062f4bFE37564",
  // https://www.circle.com/en/usdc/developers#usdc-multichain
  USDC: ENV_TEST
    ? "ETHEREUM:0x07865c6e87b9f70255377e024ace6630c1eaa37f"
    : "ETHEREUM:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
});

export const TENDERS = [
  Object.freeze({value: "eth", label: "Ethereum"}),
  Object.freeze({value: "usdc", label: "USDC"}),
];

export const AUTHORS = [
  "~labtug-doztec",
  "~sidnym-ladrut",
];
