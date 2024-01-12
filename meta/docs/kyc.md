# KYC Implementation #

The source code for the "Know Your Customer" (KYC) screening logic related to
the "Venture Club" collection can be found in the
[`ui/src/logic/ventureclub.ts`][kyc-code] source file. This screening logic has
two stages: a wallet-specific KYC check and a transfer-specific compliance
check.

The KYC check pulls from both the Ethereum blockchain and the "Venture Club"
website to determine if a wallet has valid KYC for the collection, implementing
something like the following pseudocode:

```python
isKYCd(walletAddress):
  isEthKYCd = readFromEthBlockchain(
    contract=vcDataContractAddress,
    function="getAccount",
    arguments=[walletAddress],
  )
  isWebKYCd = readFromWeb(
    url="https://" + vcAuthWebsite + "/?wallet=" + walletAddress,
  )
  return isEthKYCd and isWebKYCd
```

The compliance check uses only Ethereum blockchain data, and implements an
algorithm like the following:


```python
isTransferOk(fromWalletAddress, toWalletAddress, nftId):
  ethTransferOk = readFromEthBlockchain(
    contract=vcComplianceContractAddress,
    function="transferAllowed",
    arguments=[
      raribleExchangeContractAddress,  # exchange broker (NFT *sender*)
      fromWalletAddress,               # provider (NFT *seller*)
      toWalletAddress,                 # recipient (NFT *buyer*)
      nftId,                           # NFT unique identifier
    ],
  )
  return ethTransferOk
```

[kyc-code]: https://github.com/urbitswap/urbitswap/blob/6618b69b9950e4f989370f60906e8776f0af965d/ui/src/logic/ventureclub.ts
