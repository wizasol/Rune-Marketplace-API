# Wallet Tracker

This bot tracks wallet activity such as sol transfer , token transfer and swap and notify to your telegram account

### What can we do with this bot

- Monitor activity in my wallet
- Track Token price
- Filter with Custom Setting
- Detect Solana Whale's activity
- Able to copytrade with Whale
- Other benefit

<h4> 📞 Cᴏɴᴛᴀᴄᴛ ᴍᴇ Oɴ ʜᴇʀᴇ: 👆🏻 </h4>

<div style={{display : flex ; justify-content : space-evenly}}> 
    <a href="mailto:nakao95911@gmail.com" target="_blank">
        <img alt="Email"
        src="https://img.shields.io/badge/Email-00599c?style=for-the-badge&logo=gmail&logoColor=white"/>
    </a>
     <a href="https://x.com/_wizardev" target="_blank"><img alt="Twitter"
        src="https://img.shields.io/badge/Twitter-000000?style=for-the-badge&logo=x&logoColor=white"/></a>
    <a href="https://discordapp.com/users/471524111512764447" target="_blank"><img alt="Discord"
        src="https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white"/></a>
    <a href="https://t.me/wizardev" target="_blank"><img alt="Telegram"
        src="https://img.shields.io/badge/Telegram-26A5E4?style=for-the-badge&logo=telegram&logoColor=white"/></a>
</div>

### What kind of activity does this bot monitor

#### Sol Transfer

- Transfer Sol Amount
- Sender Wallet Address 
- Destinate Wallet Address 
- Solana Price
- Current Market Cap
- Current Market Supply

#### Token Transfer

- Transfer Token Amount
- Sender Wallet Address 
- Destinate Wallet Address 
- Solana Price
- Token Info ( Name , Symbol , Market Cap , Current Price )
- Current Market Cap
- Current Market Supply

#### Token Swap

- Swap Token Amount
- Swap Wallet Address 
- Display Route
- InAmount , OutAmount in Swap
- Calculate to U$D , PnL & Market Cap

##### Supported Swap Route

All Solana Dex

- Jupito
- Raydium
- Meteora
- Orca
- Pumpfun
- 0xDex
- ... other 21 dexes


#### Hash Bot Private

- Hash Private key with 2 variable which is stored in db and local file
- Event if DB or file hacked , hacking is impossible to this bot

## How to run This Bot

- Set .env configuration

Input ```.env``` file
```
    MAINNET_RPC=https://mainnet.helius-rpc.com/?api-key=            //  It should be geyser rpc in helius
    DEVNET_RPC=https://devnet.helius-rpc.com/?api-key=
    GEYSER_RPC=wss://atlas-mainnet.helius-rpc.com/?api-key=

    TOKEN=

    INTERVAL_FOR_TOKEN_MONITOR=
    INTERVAL_FOR_EXPIRE=

    FEE_ADDR=                                                       //  You will receive fee on this wallet

    DATABASE_URL=postgres://                                        //  Postgre DB
```

- Migrate DB at first

Run Script ```npm run migrate```
```
  "scripts": {
    "start": "node ./dist/index.js",
    "dev": "ts-node ./src/index.ts",
    "build": "tsc --build",
    "add-build": "git add dist",
    "migrate": "npx prisma migrate dev --name init"  // Migrate DB
  }
```

- Start Bot

Run Script ```npm start```
```
  "scripts": {
    "start": "node ./dist/index.js",                  // Start Bot
    "dev": "ts-node ./src/index.ts",                  // Start Bot for Test
    "build": "tsc --build",
    "add-build": "git add dist",
    "migrate": "npx prisma migrate dev --name init"
  }
```

### Troubleshoot

If you have any problem and new idea on it , plz let me know on telegram