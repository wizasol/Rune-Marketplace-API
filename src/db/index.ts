import {
    updatePlansAndDeleteUserData,
} from "./migration"
import {
    getSolanaTokens,
    getSolanaWallets,
    getUniqueWalletAddresses
} from "./solana_msg"
import {
    addToken,
    deleteTokenInfoByUser,
    getTokenByKey,
    getTokensByName,
    setTokenNotification,
    setTokenPriceAlert,
    updateTokenPrice
} from "./token_info"
import {
    createUserInfo,
    getUserInfoByName,
    setExpireTime,
    setLastTx,
    setSettingFilterScam,
    setSettingIncomeOutgoing,
    setSettingMaxTradeMC,
    setSettingMaxTradeSol,
    setSettingMinTradeMC,
    setSettingMinTradeSol,
    setSettingPauseResume,
    setTempTokenSol,
    setTempWalletSol,
    setUserInputState
} from "./user_info"
import {
    addWallet,
    getWalletByKey,
    getWalletNameByAddress,
    getWalletsByName,
    removeWalletByAddress,
    renameWallet,
    setManageWalletFilterTxValue
} from "./wallet_info"

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export {
    prisma,
    updatePlansAndDeleteUserData,
    getUniqueWalletAddresses,
    getSolanaWallets,
    getSolanaTokens,
    addToken,
    getTokenByKey,
    getTokensByName,
    deleteTokenInfoByUser,
    setTokenNotification,
    setTokenPriceAlert,
    updateTokenPrice,
    setUserInputState,
    setExpireTime,
    setLastTx,
    setSettingFilterScam,
    setSettingIncomeOutgoing,
    setSettingPauseResume,
    setSettingMaxTradeMC,
    setSettingMinTradeMC,
    setSettingMaxTradeSol,
    setSettingMinTradeSol,
    setTempTokenSol,
    setTempWalletSol,
    createUserInfo,
    getUserInfoByName,
    addWallet,
    getWalletsByName,
    getWalletByKey,
    getWalletNameByAddress,
    setManageWalletFilterTxValue,
    renameWallet,
    removeWalletByAddress
}