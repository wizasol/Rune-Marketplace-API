import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const mainnetRPC = process.env.MAINNET_RPC!
const devnetRPC = process.env.DEVNET_RPC!
const geyserRPC = process.env.GEYSER_RPC!
const botToken = process.env.TOKEN!
const feeAddr = process.env.FEE_ADDR!
const intervalForTokenMonitor = parseInt(process.env.INTERVAL_FOR_TOKEN_MONITOR || '60000')
const intervalForExpire = parseInt(process.env.INTERVAL_FOR_EXPIRE || '86400000')
const bot = new TelegramBot(botToken, { polling: true });

const domainList = {
    "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P" : "Pump.fun"
}

export {
    bot,
    intervalForTokenMonitor,
    intervalForExpire,
    mainnetRPC,
    devnetRPC,
    geyserRPC,
    feeAddr,
    domainList,
    botToken,
}