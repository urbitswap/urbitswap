import axios from 'axios';
import { add as offsetDate, formatDistance } from 'date-fns';
import { readContract } from '@wagmi/core'
import { checksumAddress, truncateAddress } from '@/logic/utils';
import { wagmiAPI } from '@/api';
import { APP_DBUG, CONTRACT } from '@/constants';
import type { Address } from 'viem';
import type { Config as WagmiConfig } from '@wagmi/core'
import type { Item as RaribleItem, Meta as RaribleItemMeta } from '@rarible/api-client';
import type { KYCData, TransferData } from '@/types/app';

interface VentureAuthEth {
  countryCode: string;
  accreditationStatus: number;
  kycStatus: number;
};

interface VentureAuthWeb {
  known: boolean;
  details: string;
};

type VentureCompEth = readonly [VentureAuthEth, BigInt];

const VC_URL: string = `https://${APP_DBUG
  ? "staging--venture-club-platform.netlify.app"
  : "app.ventureclub.club"
}/`;

export async function requestVentureKYC(
  wallet: Address,
): Promise<KYCData> {
  const checksumWallet: Address = checksumAddress(wallet);

  return Promise.all([
    readContract({
      chainId: wagmiAPI.chains?.[0].id,
      abi: VC_CONTRACT.ABI.DATA,
      address: VC_CONTRACT.ADDRESS.DATA,
      functionName: "getAccount",
      args: [checksumWallet],
    }),
    axios.request<VentureAuthWeb>({
      method: "get",
      baseURL: VC_URL,
      url: "/.netlify/functions/get-kyc",
      params: { wallets: checksumWallet },
    }),
  ]).then(([eth, {data: web}]: [VentureAuthEth, {data: VentureAuthWeb}]): KYCData => {
    const isEthKYCd: boolean = eth.kycStatus === VC_CONTRACT.STATUS.KYC.VALID;
    const isWebKYCd: boolean = web.known;

    return {
      kyc: isEthKYCd && isWebKYCd,
      details: (isEthKYCd && isWebKYCd)
        ? undefined
        : (isEthKYCd === isWebKYCd)
          ? web.details
          : vcError(`Your account has a Web/Eth KYC mismatch`)
    };
  });
}

export async function requestVentureTransfer(
  fromWallet: Address,
  toWallet: Address,
  tokenId: string,
): Promise<TransferData> {
  return readContract({
    chainId: wagmiAPI.chains?.[0].id,
    abi: VC_CONTRACT.ABI.NFT,
    address: VC_CONTRACT.ADDRESS.NFT,
    functionName: "tokenIdToDealId",
    args: [BigInt(tokenId)],
  }).then((dealId: Address) => Promise.all([
    Promise.resolve(dealId),
    readContract({
      chainId: wagmiAPI.chains?.[0].id,
      abi: VC_CONTRACT.ABI.COMPLIANCE,
      address: VC_CONTRACT.ADDRESS.COMPLIANCE,
      functionName: "transferAllowed",
      args: [
        CONTRACT.EXCHANGE,
        checksumAddress(fromWallet),
        checksumAddress(toWallet),
        dealId,
      ],
    }),
  ])).then(([dealId, approved]: [Address, boolean]) => Promise.all([
      Promise.resolve(dealId),
      Promise.resolve(approved),
      approved
        ? Promise.resolve<VentureCompEth>([
          {
            countryCode: "",
            accreditationStatus: VC_CONTRACT.STATUS.ACC.VERIFIED,
            kycStatus: VC_CONTRACT.STATUS.KYC.VALID,
          },
          BigInt(Math.floor(Date.now() / 1000)),
        ]) : readContract({
          chainId: wagmiAPI.chains?.[0].id,
          abi: VC_CONTRACT.ABI.DATA,
          address: VC_CONTRACT.ADDRESS.DATA,
          functionName: "getComplianceData",
          args: [checksumAddress(toWallet), dealId],
        }),
  ])).then((
    [dealId, approved, [{countryCode, accreditationStatus, kycStatus}, unixDealTime]]:
    [Address, boolean, VentureCompEth]
  ): TransferData => {
    let details: string | undefined = undefined;
    if (!approved) {
      const isKYCd: boolean = kycStatus === VC_CONTRACT.STATUS.KYC.VALID;
      const isUS: boolean = countryCode === "US";
      const isAccredited: boolean = ([
        VC_CONTRACT.STATUS.ACC.SELF,
        VC_CONTRACT.STATUS.ACC.VERIFIED,
      ] as number[]).includes(accreditationStatus);

      const currentDate: Date = new Date(Date.now());
      const tokenDealDate: Date = new Date(Number(unixDealTime.valueOf() * 1000n));
      const tokenAccrDate: Date = offsetDate(tokenDealDate, {months: 6});
      const tokenFreeDate: Date = offsetDate(tokenDealDate, {months: 12});

      const shortToWallet: string = truncateAddress(toWallet);
      const shortFromWallet: string = truncateAddress(fromWallet);

      // VC_CONTRACT.ADDRESS.DATA: `transferAllowed` implementation
      details =
        !isKYCd
          ? vcError(`
            The wallet '${shortToWallet}'
            has invalid KYC information
          `)
        : (unixDealTime === 0n)
          ? vcError(`
            The token '${tokenId}'
            does not have an issue date yet so is locked
          `)
        : (isUS && (currentDate < tokenAccrDate))
          ? vcError(`
            '${shortToWallet}' must wait at least 6 months after
            the token issuance to trade token '${tokenId}'
            (i.e. ${formatDistance(currentDate, tokenAccrDate)} from now)
          `)
        : (isUS && !isAccredited && (currentDate < tokenFreeDate))
          ? vcError(`
            '${shortToWallet}' must wait at least 12 months after
            the token issuance to trade token '${tokenId}'
            (i.e. ${formatDistance(currentDate, tokenFreeDate)} from now)
          `)
        : vcError(`
          The transfer of token '${tokenId}'
          from '${shortFromWallet}' to '${shortToWallet}'
          encountered an unrecognized error
        `);
    }

    return {
      approved: approved,
      details: details,
    };
  });
}

function vcError(content: string): string {
  return `${content.trim()}; please visit ${VC_URL} for assistance`;
}

const VC_CONTRACT = Object.freeze({
  STATUS: Object.freeze({
    // enum AccreditationStatus { Unknown, NotAccredited, SelfAccredited, VerifiedAccredited }
    ACC: Object.freeze({UNKNOWN: 0, NO: 1, SELF: 2, VERIFIED: 3}),
    // enum KYCStatus { Unknown, Valid, Lapased, Rejected }
    KYC: Object.freeze({UNKNOWN: 0, VALID: 1, LAPSED: 2, REJECTED: 3}),
  }),
  ADDRESS: Object.freeze({
    DATA: APP_DBUG
      ? "0xA57EF53286A7F6FAce06E41C7F0cE4D0662Bf553"
      : "0x0000000000000000000000000000000000000000",
    COMPLIANCE: APP_DBUG
      ? "0xf79D2eda57fA4c6e4905273D583182815d18762D"
      : "0x0000000000000000000000000000000000000000",
    NFT: APP_DBUG
      ? "0x7374d1CbdCd648e13F5DD64389b73443074a12c1"
      : "0x0000000000000000000000000000000000000000",
  }),
  ABI: Object.freeze({
    DATA: [{"inputs":[{"internalType":"address","name":"_accountAdmin","type":"address"},{"internalType":"address","name":"_dealAdmin","type":"address"},{"internalType":"address","name":"_contractAdmin","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"accountId","type":"uint256"},{"indexed":false,"internalType":"string","name":"countryCode","type":"string"},{"indexed":false,"internalType":"enum VCData.AccreditationStatus","name":"accreditationStatus","type":"uint8"},{"indexed":false,"internalType":"enum VCData.KYCStatus","name":"kycStatus","type":"uint8"},{"indexed":false,"internalType":"address[]","name":"addresses","type":"address[]"}],"name":"AccountAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"accountId","type":"uint256"},{"indexed":false,"internalType":"string","name":"countryCode","type":"string"},{"indexed":false,"internalType":"enum VCData.AccreditationStatus","name":"accreditationStatus","type":"uint8"},{"indexed":false,"internalType":"enum VCData.KYCStatus","name":"kycStatus","type":"uint8"}],"name":"AccountUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"newAddress","type":"address"},{"indexed":true,"internalType":"uint256","name":"accountId","type":"uint256"}],"name":"AddressAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"addr","type":"address"}],"name":"AddressRemoved","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"_contract","type":"address"},{"indexed":false,"internalType":"bool","name":"allowed","type":"bool"}],"name":"AllowedContractSet","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"dealId","type":"bytes32"},{"indexed":false,"internalType":"uint256","name":"assetIssueDate","type":"uint256"}],"name":"DealAssetIssueDateSet","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"previousAdminRole","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"newAdminRole","type":"bytes32"}],"name":"RoleAdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleGranted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleRevoked","type":"event"},{"inputs":[],"name":"ACCOUNT_ADMIN","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"CONTRACT_ADMIN","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"DEAL_ADMIN","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"DEFAULT_ADMIN_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"accountIds","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"accounts","outputs":[{"internalType":"string","name":"countryCode","type":"string"},{"internalType":"enum VCData.AccreditationStatus","name":"accreditationStatus","type":"uint8"},{"internalType":"enum VCData.KYCStatus","name":"kycStatus","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"_countryCode","type":"string"},{"internalType":"enum VCData.AccreditationStatus","name":"_accreditationStatus","type":"uint8"},{"internalType":"enum VCData.KYCStatus","name":"_kycStatus","type":"uint8"},{"internalType":"address[]","name":"addresses","type":"address[]"},{"internalType":"bytes32","name":"nonce","type":"bytes32"},{"internalType":"uint256","name":"expiryBlock","type":"uint256"},{"internalType":"bytes","name":"grant","type":"bytes"}],"name":"addAccount","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address[]","name":"addresses_","type":"address[]"},{"internalType":"uint256[]","name":"accountIds_","type":"uint256[]"},{"internalType":"bytes32","name":"nonce","type":"bytes32"},{"internalType":"uint256","name":"expiryBlock","type":"uint256"},{"internalType":"bytes","name":"grant","type":"bytes"}],"name":"addAddresses","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"allowedContracts","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"dealAssetIssueDates","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"executedNonces","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_addr","type":"address"}],"name":"getAccount","outputs":[{"components":[{"internalType":"string","name":"countryCode","type":"string"},{"internalType":"enum VCData.AccreditationStatus","name":"accreditationStatus","type":"uint8"},{"internalType":"enum VCData.KYCStatus","name":"kycStatus","type":"uint8"}],"internalType":"struct VCData.Account","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_addr","type":"address"},{"internalType":"bytes32","name":"dealId","type":"bytes32"}],"name":"getComplianceData","outputs":[{"components":[{"internalType":"string","name":"countryCode","type":"string"},{"internalType":"enum VCData.AccreditationStatus","name":"accreditationStatus","type":"uint8"},{"internalType":"enum VCData.KYCStatus","name":"kycStatus","type":"uint8"}],"internalType":"struct VCData.Account","name":"","type":"tuple"},{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"}],"name":"getRoleAdmin","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"grantRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes","name":"","type":"bytes"}],"name":"grants","outputs":[{"internalType":"bytes","name":"signature","type":"bytes"},{"internalType":"bytes32","name":"nonce","type":"bytes32"},{"internalType":"uint256","name":"expiryBlock","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"hasRole","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"registeredNonces","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"addr","type":"address"},{"internalType":"bytes32","name":"nonce","type":"bytes32"},{"internalType":"uint256","name":"expiryBlock","type":"uint256"},{"internalType":"bytes","name":"grant","type":"bytes"}],"name":"removeAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"renounceRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"revokeRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_contract","type":"address"},{"internalType":"bool","name":"allowed","type":"bool"}],"name":"setAllowedContract","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_dealId","type":"bytes32"},{"internalType":"uint256","name":"_assetIssueDate","type":"uint256"},{"internalType":"bytes32","name":"nonce","type":"bytes32"},{"internalType":"uint256","name":"expiryBlock","type":"uint256"},{"internalType":"bytes","name":"grant","type":"bytes"}],"name":"setDealAssetIssueDate","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes","name":"callId","type":"bytes"},{"internalType":"bytes","name":"signature","type":"bytes"},{"internalType":"bytes32","name":"nonce","type":"bytes32"},{"internalType":"uint256","name":"expiryBlock","type":"uint256"}],"name":"setGranted","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"accountId","type":"uint256"},{"internalType":"string","name":"_countryCode","type":"string"},{"internalType":"enum VCData.AccreditationStatus","name":"_accreditationStatus","type":"uint8"},{"internalType":"enum VCData.KYCStatus","name":"_kycStatus","type":"uint8"},{"internalType":"bytes32","name":"nonce","type":"bytes32"},{"internalType":"uint256","name":"expiryBlock","type":"uint256"},{"internalType":"bytes","name":"grant","type":"bytes"}],"name":"updateAccount","outputs":[],"stateMutability":"nonpayable","type":"function"}] as const,
    COMPLIANCE: [{"inputs":[{"internalType":"address","name":"_vcData","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"previousAdminRole","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"newAdminRole","type":"bytes32"}],"name":"RoleAdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleGranted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleRevoked","type":"event"},{"inputs":[],"name":"DEFAULT_ADMIN_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"}],"name":"getRoleAdmin","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"grantRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"hasRole","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"renounceRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"revokeRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_vcData","type":"address"}],"name":"setVCData","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"transferCaller","type":"address"},{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"bytes32","name":"dealId","type":"bytes32"}],"name":"transferAllowed","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"vcData","outputs":[{"internalType":"contract VCData","name":"","type":"address"}],"stateMutability":"view","type":"function"}] as const,
      NFT: [{"inputs":[{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"symbol","type":"string"},{"internalType":"address","name":"_feeAddress","type":"address"},{"internalType":"address","name":"_compliance","type":"address"},{"internalType":"address","name":"_default_admin","type":"address"},{"internalType":"string","name":"_tokenURIprefix","type":"string"},{"internalType":"string","name":"_tokenURIsuffix","type":"string"},{"internalType":"address","name":"_migrateFrom","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"approved","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"bytes32","name":"dealId","type":"bytes32"},{"indexed":false,"internalType":"uint256","name":"membershipUnits","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"fromTokenId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"toTokenId","type":"uint256"}],"name":"AssetOnboarded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"fromTokenId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"toTokenId","type":"uint256"},{"indexed":true,"internalType":"address","name":"fromAddress","type":"address"},{"indexed":true,"internalType":"address","name":"toAddress","type":"address"}],"name":"ConsecutiveTransfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes32","name":"id","type":"bytes32"},{"indexed":false,"internalType":"address","name":"spvManager","type":"address"},{"indexed":false,"internalType":"address","name":"raiseCurrency","type":"address"},{"indexed":false,"internalType":"address","name":"feeCurrency","type":"address"}],"name":"DealCreated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"feeAddress","type":"address"}],"name":"FeeAddressUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"bytes32","name":"dealId","type":"bytes32"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"fee","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"fromTokenId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"toTokenId","type":"uint256"}],"name":"InvestInDeal","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"previousAdminRole","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"newAdminRole","type":"bytes32"}],"name":"RoleAdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleGranted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleRevoked","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":false,"internalType":"bool","name":"locked","type":"bool"},{"indexed":false,"internalType":"string","name":"reason","type":"string"}],"name":"SetLocked","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"string","name":"exampleURI","type":"string"}],"name":"URIupdated","type":"event"},{"inputs":[],"name":"DEAL_ADMIN","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"DEFAULT_ADMIN_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"INVESTMENT_ADMIN","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"TOKEN_ADMIN","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes32","name":"dealId","type":"bytes32"}],"name":"adminMint","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"batches","outputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint8","name":"size","type":"uint8"},{"internalType":"bytes32","name":"dealId","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"burn","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"burnedTokens","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"compliance","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"id","type":"bytes32"},{"internalType":"address","name":"spvManager","type":"address"},{"internalType":"address","name":"raiseCurrency","type":"address"},{"internalType":"address","name":"feeCurrency","type":"address"}],"name":"createDeal","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"deals","outputs":[{"internalType":"address","name":"spvManager","type":"address"},{"internalType":"address","name":"raiseCurrency","type":"address"},{"internalType":"address","name":"feeCurrency","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"executedNonces","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"feeAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"}],"name":"getRoleAdmin","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"grantRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes","name":"","type":"bytes"}],"name":"grants","outputs":[{"internalType":"bytes","name":"signature","type":"bytes"},{"internalType":"bytes32","name":"nonce","type":"bytes32"},{"internalType":"uint256","name":"expiryBlock","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"hasRole","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"bytes32","name":"dealId","type":"bytes32"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"fees","type":"uint256"},{"internalType":"uint128","name":"batchSize","type":"uint128"},{"internalType":"bytes","name":"grant","type":"bytes"},{"internalType":"bytes32","name":"nonce","type":"bytes32"},{"internalType":"uint256","name":"expiryBlock","type":"uint256"}],"name":"investInDeal","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"lockedTokens","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes32","name":"dealId","type":"bytes32"}],"name":"migrate","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"migrateFrom","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"bytes32","name":"dealId","type":"bytes32"},{"internalType":"uint256","name":"membershipUnits","type":"uint256"},{"internalType":"uint128","name":"batchSize","type":"uint128"},{"internalType":"bytes","name":"grant","type":"bytes"},{"internalType":"bytes32","name":"nonce","type":"bytes32"},{"internalType":"uint256","name":"expiryBlock","type":"uint256"}],"name":"onboardAsset","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"registeredNonces","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"renounceRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"revokeRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newFeeAddress","type":"address"}],"name":"setFeeAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes","name":"callId","type":"bytes"},{"internalType":"bytes","name":"signature","type":"bytes"},{"internalType":"bytes32","name":"nonce","type":"bytes32"},{"internalType":"uint256","name":"expiryBlock","type":"uint256"}],"name":"setGranted","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bool","name":"locked","type":"bool"},{"internalType":"string","name":"reason","type":"string"}],"name":"setLocked","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"prefix","type":"string"},{"internalType":"string","name":"suffix","type":"string"}],"name":"setTokenURI","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"tokenIdToDealId","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"tokenURIprefix","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"tokenURIsuffix","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"}] as const,
  }),
});
