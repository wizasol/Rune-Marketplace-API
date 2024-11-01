import WebSocket from "ws";
import { Connection, PublicKey } from "@solana/web3.js";
import { getAccount, getMint, NATIVE_MINT } from "@solana/spl-token";
import { Metaplex, token } from "@metaplex-foundation/js";
import {
	CombinedDataSol,
	CombinedTokenSol,
	INCOME_OUTGOING,
	PAUSE_RESUME,
	TokenInfo,
	UserPlanInfo
} from "../../constants";
import {
	abbrAddr,
	getAtaList,
	getFriendlyName,
	getGeyserList,
	getMetaData,
	getSolPrice,
	getTokenPriceJup,
	sendRequest
} from "../../utils";
import {
	bot,
	devnetRPC,
	domainList,
	geyserRPC,
	intervalForExpire,
	intervalForTokenMonitor,
	mainnetRPC
} from "../../config";
import * as commands from "../../commands";
import {
	getSolanaTokens,
	getSolanaWallets,
	getUniqueWalletAddresses,
	setLastTx,
	updatePlansAndDeleteUserData,
	updateTokenPrice
} from "../../db";

const connection = new Connection(mainnetRPC)
// const connection = new Connection(devnetRPC)
const metaplex = Metaplex.make(connection);
const ws = new WebSocket(geyserRPC);

let lastTx: any = {}

//  In case of solana

ws.on('open', async function open() {
	console.log(" == web socket is opend == ");
	//	@ts-ignore
	const allUserState: string[] = await getUniqueWalletAddresses()

	if (allUserState.length != 0) {
		allUserState.forEach(async (element: any) => {
			await sendRequest(element.address)
		});
	}
});

// ** Wallet Monitor ** //

ws.on('message', async function incoming(data: any) {

	console.log(" ==> socket message received <== ");
	const messageStr = data.toString('utf8');


	//
		Main Monitor Part
	//


});

// ** Token Monitor ** //

setInterval(async () => {
	console.log(`interval is ${intervalForTokenMonitor}`);

	//	@ts-ignore
	const targetTokens: CombinedTokenSol[] = await getSolanaTokens()

	targetTokens.forEach(async (ele: CombinedTokenSol) => {

		let returntemp: any = []

		const tokenPrice = await getTokenPriceJup(ele.address) || 0;
		const { tokenName } = await getMetaData(ele.address)
		const { supply, decimals } = await getMint(connection, new PublicKey(ele.address))
		if (
			(
				Number(supply) * tokenPrice / decimals > ele.user.setting_min_trade_mc * 1000000 &&
				Number(supply) * tokenPrice / decimals < ele.user.setting_max_trade_mc * 1000000
			)
			&&
			Number(supply) * tokenPrice / decimals > ele.mc_for_notification * 1000000
			&&
			((tokenPrice - ele.price) / ele.price) * 100 >= ele.percentage_for_notification

		) {
			const subMsg = commands.SolanaMsg.tokenPriceMsgSol(tokenName, ele.price, tokenPrice, ele.address)
			returntemp.push(subMsg)
		}

		await updateTokenPrice(ele.user_name, ele.address, tokenPrice)

		if ((ele.user.setting_pause_resume == PAUSE_RESUME.Resume) && (returntemp.length > -1)) {
			const result = returntemp.join("");
			if (result) bot.sendMessage(ele.user.chatId, result, {
				parse_mode: "HTML"
			})
		}
	})
}, intervalForTokenMonitor)

// ** Expire ** //

setInterval(() => {
	updatePlansAndDeleteUserData(UserPlanInfo[0].sol_wallet, UserPlanInfo[0].token)
}, intervalForExpire)

export {
	connection,
	ws,
	metaplex
}