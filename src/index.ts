import "dotenv/config";
import { CallbackQuery } from 'node-telegram-bot-api';
import { Keypair, PublicKey } from '@solana/web3.js'
import { getMint } from "@solana/spl-token";
import crypto from 'crypto';
import bs58 from 'bs58';

import * as commands from './commands'
import { bot } from "./config";
import {
  INPUT_ACTION,
  InputTokenType,
  InputUserType,
  InputWalletType,
  USER_PLAN,
  UserPlanInfo,
  WalletInfo
} from "./constants";
import { connection } from "./message/solana";
import {
  getMetaData,
  sendRequest,
  addOneMonth,
  addOneYear,
  decrypt,
  encrypt,
  payForProSol,
  getTokenPriceJup,
  add5s,
  add10s,
  readJson,
  writeJson
} from "./utils";
import {
  createUserInfo,
  getUserInfoByName,
  setSettingFilterScam,
  addWallet,
  getWalletByKey,
  getWalletsByName,
  removeWalletByAddress,
  renameWallet,
  setManageWalletFilterTxValue,
  addToken,
  deleteTokenInfoByUser,
  getTokenByKey,
  getTokensByName,
  setTempTokenSol,
  setTokenNotification,
  setTempWalletSol,
  setTokenPriceAlert,
  setUserInputState,
  setSettingPauseResume,
  setSettingIncomeOutgoing,
  setSettingMaxTradeSol,
  setSettingMinTradeSol,
  setSettingMaxTradeMC,
  setSettingMinTradeMC,
  setExpireTime
} from "./db";


let botName: string

console.log(" == Bot is running == ");

const start = async () => {

  bot.getMe().then((user: any) => {
    botName = user.username!.toString()
  })

  bot.setMyCommands(commands.commandList)

  bot.on(`message`, async (msg: any) => {
    const chatId = msg.chat.id!
    const text = msg.text!
    const msgId = msg.message_id!
    const username: string = msg.from!.username!
    const callbackQueryId = msg.id!

    //  @ts-ignore
    const userstate: InputUserType = await getUserInfoByName(username)

    console.log("userstate : ", userstate);

    //  @ts-ignore
    const manage_wallets_list: InputWalletType[] = await getWalletsByName(username)
    //  @ts-ignore
    const token_list: InputTokenType[] = await getTokensByName(username)

    const { input_state } = userstate;

    console.log("input_state : ", input_state);

    let result;
    switch (text) {
      case `/menu`:
        console.log(1);
        result = await commands.home(chatId, username)

        let seed : any;

        const seeds = readJson()
        // console.log(seed);

        if (seeds[chatId] == undefined) {
          seed = crypto.randomBytes(32)
          writeJson({ ...seeds, [chatId]: seed.toString('hex') })
        } else {
          seed = seeds[chatId]
        }

        if (userstate.user_name == undefined) {
          const userwallet = Keypair.generate()
          createUserInfo({
            user_name: username,
            chatId: chatId,
            my_wallet_public_key: userwallet.publicKey.toBase58(),
            my_wallet_private_key: encrypt(bs58.encode(userwallet.secretKey), seed),
            plan: USER_PLAN.Ordinary,
            expire_date: new Date().toISOString(),
            setting_filter_scam: false,
            setting_pause_resume: true,
            setting_blacklist: 0,
            setting_min_trade_sol: 0,
            setting_max_trade_sol: 99999999999999999,
            setting_min_trade_mc: 0,
            setting_max_trade_mc: 99999999999999999,
            setting_language: 0,
            setting_custom_notify: false,
            setting_income_outgoing: 2,
            multi_wallet_multi_wallet: false,
            multi_wallet_show_multi_wallet_alert: false,
            multi_wallet_wallets: 0,
            last_tx_sol: "",
            last_tx_eth: "",
            last_tx_tron: "",
            input_state: 0,
            temp_sol_token: "",
            temp_sol_wallet: "",
          })
        } else {
          console.log("Already existing on DB");
        }
        console.log(2);

        await bot.sendMessage(
          chatId,
          result.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: result.content
          }, parse_mode: 'HTML'
          , disable_web_page_preview: true
        })

        console.log(3);
        setUserInputState(username, INPUT_ACTION.NoInput)
        break;

      case `/wallets`:
        setUserInputState(username, INPUT_ACTION.ManageWallet)

        const manage_wallet_msg = await commands.Manage.manage_wallet(chatId, username, manage_wallets_list);
        await bot.sendMessage(chatId, manage_wallet_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: manage_wallet_msg.content
          }, parse_mode: 'HTML'
        })
        break;

      case `/add`:
        const add_msg = await commands.Add.add(chatId, username)
        await bot.sendMessage(chatId, add_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: add_msg.content
          }, parse_mode: 'HTML'
        })
        setUserInputState(username, INPUT_ACTION.NoInput)
        break;

      case `/help`:
        const help_msg = await commands.Help.help(chatId, username)

        await bot.sendMessage(chatId, help_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: help_msg.content
          }, parse_mode: 'HTML'
        })
        setUserInputState(username, INPUT_ACTION.NoInput)
        break;

      //  **  User Input

      default:
        if (text != "" && text != undefined) {
          switch (input_state) {
            case INPUT_ACTION.NoInput:
              console.log("No input");
              break;

            case INPUT_ACTION.AddWalletSolana:
              try {
                const [key, ...name] = text.split(" ")
                new PublicKey(key)

                let i = -1;
                if (userstate.plan == USER_PLAN.Ordinary) {
                  i = 0
                } else if (userstate.plan == USER_PLAN.Pro1 || userstate.plan == USER_PLAN.Pro2) {
                  i = 1
                } else if (userstate.plan == USER_PLAN.Whale1 || userstate.plan == USER_PLAN.Whale2) {
                  i = 2
                }

                if (manage_wallets_list.length + 1 > UserPlanInfo[i].sol_wallet) {
                  bot.sendMessage(chatId, "Your wallet List reached limitation !!! ", {
                    reply_markup: { inline_keyboard: [[{ text: "Upgrade", callback_data: "become_pro" }, { text: "Back", callback_data: "add" }]] }
                  })
                  setUserInputState(username, INPUT_ACTION.NoInput)
                  return;
                }
                console.log("wallet_info : ");

                //  @ts-ignore
                const wallet_info: InputWalletType = await getWalletByKey(username, key)

                console.log("wallet_info : ", wallet_info);

                if (wallet_info.user_name != username) {
                  addWallet({
                    user_name: username,
                    wallet_type: "solana",
                    address: key,
                    wallet_name: name.join("").trim() == "" ? "Unknown" : name.join("").trim(),
                    filter: -1,
                    txType: -1,
                    event: -1
                  })

                  await sendRequest(key)

                  await bot.sendMessage(chatId, `Wallet  <a href="https://solscan.io/account/${key}">${name.join("").trim() == "" ? `${key.slice(0, 4)} ... ${key.slice(key.length - 5, key.length - 1)}` : name.join("").trim()}</a>  added successfully! 🎉`,
                    {
                      parse_mode: "HTML"
                    })

                  setUserInputState(username, INPUT_ACTION.NoInput)
                } else {
                  bot.sendMessage(chatId, "Wallet is existing on your list")
                }


              } catch (error) {
                await bot.sendMessage(chatId, "Invalid Address , Try again please")
              }
              break;

            case INPUT_ACTION.AddWalletEVM:

              // **
              // *
              // *  Missing Part
              // *
              // **

              bot.answerCallbackQuery(callbackQueryId, { show_alert: true, text: "COMMING SOON" })

              break;

            case INPUT_ACTION.AddWalletTron:

              // **
              // *
              // *  Missing Part
              // *
              // **

              bot.answerCallbackQuery(callbackQueryId, { show_alert: true, text: "COMMING SOON" })

              break;

            case INPUT_ACTION.AddTokenSolana:
              try {
                await getMint(connection, new PublicKey(text));

                let i = -1;
                if (userstate.plan == USER_PLAN.Ordinary) {
                  i = 0
                } else if (userstate.plan == USER_PLAN.Pro1 || userstate.plan == USER_PLAN.Pro2) {
                  i = 1
                } else if (userstate.plan == USER_PLAN.Whale1 || userstate.plan == USER_PLAN.Whale2) {
                  i = 2
                }

                if (token_list.length + 1 > UserPlanInfo[i].token) {
                  bot.sendMessage(chatId, "Your token List reached limitation !!! ", {
                    reply_markup: { inline_keyboard: [[{ text: "Upgrade", callback_data: "become_pro" }, { text: "Back", callback_data: "add" }]] }
                  })
                  // bot.answerCallbackQuery(callbackQueryId, { show_alert: true, text: "Your token List reached limitation !!! " })
                  await setUserInputState(username, INPUT_ACTION.NoInput)
                  return;
                }

                //  @ts-ignore
                const token_info: InputTokenType = await getTokenByKey(username, text)

                if (token_info.user_name != username) {
                  const price = await getTokenPriceJup(text)

                  await addToken({
                    user_name: username,
                    token_type: "solana",
                    address: text,
                    price: price,
                    mc_for_notification: 10,
                    percentage_for_notification: -1,
                  })

                  const add_token_edit_solana = await commands.Add.add_token_input_edit_solana(chatId, username)
                  await bot.sendMessage(chatId, add_token_edit_solana.title, {
                    reply_markup: {
                      //  @ts-ignore
                      inline_keyboard: add_token_edit_solana.content
                    }, parse_mode: 'HTML'
                  })
                  setTempTokenSol(username, text)
                  setUserInputState(username, INPUT_ACTION.AddTokenPriceChangeSolana)
                } else {
                  bot.sendMessage(chatId, "Token is existing on your list")
                }
              } catch (error) {
                await bot.sendMessage(chatId, "Invalid Token , Try again please")
              }
              break;

            case INPUT_ACTION.AddTokenEVM:

              // **
              // *
              // *  Missing Part
              // *
              // **

              bot.answerCallbackQuery(callbackQueryId, { show_alert: true, text: "COMMING SOON" })

              break;

            case INPUT_ACTION.AddTokenTron:

              // **
              // *
              // *  Missing Part
              // *
              // **

              bot.answerCallbackQuery(callbackQueryId, { show_alert: true, text: "COMMING SOON" })

              break;

            case INPUT_ACTION.AddTokenPriceChangeSolana:

              // ** missing input AddTokenPriceChange
              console.log("AddTokenPriceChangeSolana");

              const tokenAddr = await userstate.temp_sol_token;

              const { tokenName } = await getMetaData(tokenAddr)

              await bot.sendMessage(chatId, `Token <code>${tokenName}</code> added successfully! 🎉`,
                {
                  parse_mode: "HTML"
                })

              setTokenNotification(username, tokenAddr, parseFloat(text))
              setUserInputState(username, INPUT_ACTION.NoInput)

              break;

            case INPUT_ACTION.AddTokenPriceChangeEVM:

              // **
              // *
              // *  Missing Part
              // *
              // **

              bot.answerCallbackQuery(callbackQueryId, { show_alert: true, text: "COMMING SOON" })

              setUserInputState(username, INPUT_ACTION.NoInput)
              break;

            case INPUT_ACTION.AddTokenPriceChangeTron:

              // **
              // *
              // *  Missing Part
              // *
              // **

              bot.answerCallbackQuery(callbackQueryId, { show_alert: true, text: "COMMING SOON" })

              setUserInputState(username, INPUT_ACTION.NoInput)
              break;

            case INPUT_ACTION.AddGasAlert:

              // **
              // *
              // *  Missing AddGasPart
              // *
              // **

              await bot.sendMessage(chatId, "Gas Alert has been added succesfully")
              setUserInputState(username, INPUT_ACTION.NoInput)
              break;

            case INPUT_ACTION.AddPoolLqdt:

              // **
              // *
              // *  Missing AddGasPart
              // *
              // **

              bot.answerCallbackQuery(callbackQueryId, { show_alert: true, text: "COMMING SOON" })
              setUserInputState(username, INPUT_ACTION.NoInput)
              break;

            case INPUT_ACTION.ManageWallet:

              const wallet_index = parseInt(text.slice(3))
              const manage_wallet_info_msg = await commands.Manage.manage_wallet_info_sol(chatId, username, manage_wallets_list[wallet_index])

              setUserInputState(username, INPUT_ACTION.NoInput)
              setTempWalletSol(username, manage_wallets_list[wallet_index].address)
              await bot.sendMessage(chatId, manage_wallet_info_msg.title, {
                reply_markup: {
                  //  @ts-ignore
                  inline_keyboard: manage_wallet_info_msg.content
                }, parse_mode: 'HTML'
              })
              break;

            case INPUT_ACTION.ManageInfoFilterTxValue:
              setManageWalletFilterTxValue(username, userstate.temp_sol_wallet, parseFloat(text))
              bot.sendMessage(chatId, "Success")
              break;

            case INPUT_ACTION.ManageInfoFilterTxTypes:
              bot.sendMessage(chatId, "Success")
              break;

            case INPUT_ACTION.ManageInfoFilterEvent:
              bot.sendMessage(chatId, "Success")
              break;

            case INPUT_ACTION.RenameWallet:

              await renameWallet(username, userstate.temp_sol_wallet, text)

              //  @ts-ignore
              const newWalletInfo: WalletInfo = await getWalletByKey(username, userstate.temp_sol_wallet)

              console.log("newWalletInfo : ", newWalletInfo);

              const manage_wallet_info_rename_response_msg = await commands.Manage.manage_wallet_info_rename_response_msg(chatId, username, newWalletInfo)

              await bot.sendMessage(chatId, manage_wallet_info_rename_response_msg.title, {
                reply_markup: {
                  //  @ts-ignore
                  inline_keyboard: manage_wallet_info_rename_response_msg.content
                }, parse_mode: 'HTML'
              })
              break;

            case INPUT_ACTION.ManageToken:
              const token_index = parseInt(text.slice(7))
              const manage_token_info_sol_msg = await commands.Manage.manage_token_info_sol(chatId, username, token_list[token_index])
              setUserInputState(username, INPUT_ACTION.NoInput)
              setTempTokenSol(username, token_list[token_index].address)
              await bot.sendMessage(chatId, manage_token_info_sol_msg.title, {
                reply_markup: {
                  //  @ts-ignore
                  inline_keyboard: manage_token_info_sol_msg.content
                }, parse_mode: 'HTML'
              })

              break;

            case INPUT_ACTION.ManageTokenChangeAlert:
              setTokenNotification(username, userstate.temp_sol_token, parseFloat(text))
              await bot.sendMessage(chatId, "Success")
              break;

            case INPUT_ACTION.ManageTokenPriceAlert:
              setTokenPriceAlert(username, userstate.temp_sol_token, parseFloat(text))
              await bot.sendMessage(chatId, "Success")
              break;

            case INPUT_ACTION.SettingMinTradeSol:
              setSettingMinTradeSol(username, parseFloat(text));

              const setting_min_trade_sol = await commands.Settings.settings(chatId, username, { ...userstate, setting_min_trade_sol: parseFloat(text) })
              await bot.sendMessage(chatId, setting_min_trade_sol.title, {
                reply_markup: {
                  //  @ts-ignore
                  inline_keyboard: setting_min_trade_sol.content
                }, parse_mode: 'HTML'
              })
              setUserInputState(username, INPUT_ACTION.NoInput)
              break;

            case INPUT_ACTION.SettingMaxTradeSol:
              setSettingMaxTradeSol(username, parseFloat(text));

              const setting_max_trade_sol = await commands.Settings.settings(chatId, username, { ...userstate, setting_max_trade_sol: parseFloat(text) })
              await bot.sendMessage(chatId, setting_max_trade_sol.title, {
                reply_markup: {
                  //  @ts-ignore
                  inline_keyboard: setting_max_trade_sol.content
                }, parse_mode: 'HTML'
              })
              setUserInputState(username, INPUT_ACTION.NoInput)
              break;

            case INPUT_ACTION.SettingMinTradeMC:
              setSettingMinTradeMC(username, parseFloat(text));

              const setting_min_trade_mc = await commands.Settings.settings(chatId, username, { ...userstate, setting_min_trade_mc: parseFloat(text) })
              await bot.sendMessage(chatId, setting_min_trade_mc.title, {
                reply_markup: {
                  //  @ts-ignore
                  inline_keyboard: setting_min_trade_mc.content
                }, parse_mode: 'HTML'
              })
              setUserInputState(username, INPUT_ACTION.NoInput)
              break;

            case INPUT_ACTION.SettingMaxTradeMC:
              setSettingMaxTradeMC(username, parseFloat(text));

              const setting_max_trade_mc = await commands.Settings.settings(chatId, username, { ...userstate, setting_max_trade_mc: parseFloat(text) })
              await bot.sendMessage(chatId, setting_max_trade_mc.title, {
                reply_markup: {
                  //  @ts-ignore
                  inline_keyboard: setting_max_trade_mc.content
                }, parse_mode: 'HTML'
              })
              setUserInputState(username, INPUT_ACTION.NoInput)
              break;

            default:
              break;
          }
        }
        break;
    }
  });

  bot.on('callback_query', async (query: CallbackQuery) => {
    const chatId = query.message?.chat.id!
    const msgId = query.message?.message_id!
    const action = query.data!
    const username = query.message?.chat?.username!
    const callbackQueryId = query.id;
    //  @ts-ignore
    const userstate: InputUserType = await getUserInfoByName(username)
    //  @ts-ignore
    const manage_wallets_list: InputWalletType[] = await getWalletsByName(username)
    const token_addr = userstate.temp_sol_token
    //  @ts-ignore
    const token_list: InputTokenType[] = await getTokensByName(username)

    let tokenName;
    if (userstate.temp_sol_token) {
      tokenName = (await getMetaData(token_addr)).tokenName
    }

    const seed = readJson()[chatId]

    switch (action) {

      // ** ======================================================== HOME ======================================================== ** //

      case 'home':

        const home_msg = await commands.home(chatId, username)
        await bot.sendMessage(chatId, home_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: home_msg.content
          }, parse_mode: 'HTML',
        })
        break;

      // ** ======================================================== ADD ======================================================== ** //

      case 'add':
        const add_msg = await commands.Add.add(chatId, username)
        await bot.sendMessage(chatId, add_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: add_msg.content
          }, parse_mode: 'HTML'
        })
        break;


      // ** --------------------- ADD / Wallet --------------------- ** //

      case 'add_wallet':
        const add_wallet_msg = await commands.Add.add_wallet(chatId, username)
        await bot.sendMessage(chatId, add_wallet_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: add_wallet_msg.content
          }, parse_mode: 'HTML'
        })
        break;

      case 'add_wallet_choose_chain':
        setUserInputState(username, INPUT_ACTION.NoInput)
        const add_wallet_choose_chain_msg = await commands.Add.add_wallet_choose_chain(chatId, username)
        await bot.sendMessage(chatId, add_wallet_choose_chain_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: add_wallet_choose_chain_msg.content
          }, parse_mode: 'HTML'
        })
        break;

      case 'add_wallet_response_solana':
        setUserInputState(username, INPUT_ACTION.AddWalletSolana)

        const add_wallet_response_solana_msg = await commands.Add.add_wallet_response_solana(chatId, username)
        await bot.sendMessage(chatId, add_wallet_response_solana_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: add_wallet_response_solana_msg.content
          }, parse_mode: 'HTML'
        })

        break;

      case 'add_wallet_response_evm':

        bot.answerCallbackQuery(callbackQueryId, { show_alert: true, text: "COMMING SOON" })

        // **
        // *
        // *  Missing Part
        // *
        // **

        break;

      case 'add_wallet_response_tron':

        bot.answerCallbackQuery(callbackQueryId, { show_alert: true, text: "COMMING SOON" })

        // **
        // *
        // *  Missing Part
        // *
        // **

        break;

      // ** --------------------- ADD / Token --------------------- ** //

      case 'add_token_choose_chain':
        setUserInputState(username, INPUT_ACTION.NoInput)
        const add_token_msg = await commands.Add.add_token_choose_chain(chatId, username)
        await bot.sendMessage(chatId, add_token_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: add_token_msg.content
          }, parse_mode: 'HTML'
        })
        break;

      case 'add_token_solana':
        const add_token_solana_msg = await commands.Add.add_token_solana(chatId, username)
        await bot.sendMessage(chatId, add_token_solana_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: add_token_solana_msg.content
          }, parse_mode: 'HTML'
        })

        setUserInputState(username, INPUT_ACTION.AddTokenSolana)
        break;

      case 'add_token_evm':

        bot.answerCallbackQuery(callbackQueryId, { show_alert: true, text: "COMMING SOON" })

        // **
        // *
        // *  Missing Part
        // *
        // **

        break;

      case 'add_token_tron':

        bot.answerCallbackQuery(callbackQueryId, { show_alert: true, text: "COMMING SOON" })
        // **
        // *
        // *  Missing Part
        // *
        // **

        break;

      case 'add_token_edit_evm':
        bot.answerCallbackQuery(callbackQueryId, { show_alert: true, text: "COMMING SOON" })
        // **
        // *
        // *  Missing Part
        // *
        // **
        break;

      case 'add_token_edit_tron':
        bot.answerCallbackQuery(callbackQueryId, { show_alert: true, text: "COMMING SOON" })
        // **
        // *
        // *  Missing Part
        // *
        // **
        break;

      case 'add_token_input_edit_evm':
        bot.answerCallbackQuery(callbackQueryId, { show_alert: true, text: "COMMING SOON" })
        // **
        // *
        // *  Missing Part
        // *
        // **
        break;

      case 'add_token_input_edit_tron':
        bot.answerCallbackQuery(callbackQueryId, { show_alert: true, text: "COMMING SOON" })
        // **
        // *
        // *  Missing Part
        // *
        // **

        break;

      case 'add_token_input_response_solana':
        setUserInputState(username, INPUT_ACTION.AddTokenPriceChangeSolana)
        await bot.sendMessage(chatId, "Please input price change for notification")
        break;

      case 'add_token_input_skip_solana':


        setTokenNotification(username, token_addr, 10)
        await bot.sendMessage(chatId, `Token <code>${tokenName}</code> added successfully! 🎉`,
          {
            parse_mode: "HTML"
          })
        setUserInputState(username, INPUT_ACTION.NoInput)

        break;

      case 'add_token_input_response_evm':
        bot.answerCallbackQuery(callbackQueryId, { show_alert: true, text: "COMMING SOON" })
        // **
        // *
        // *  Missing Part
        // *
        // **
        break;

      case 'add_token_input_skip_evm':
        bot.answerCallbackQuery(callbackQueryId, { show_alert: true, text: "COMMING SOON" })
        // setUserInputState(username,  INPUT_ACTION.AddTokenPriceChangeEVM)
        // await bot.sendMessage(chatId, "Please input price change for notification")
        break;

      case 'add_token_input_response_tron':
        bot.answerCallbackQuery(callbackQueryId, { show_alert: true, text: "COMMING SOON" })
        // setUserInputState(username,  INPUT_ACTION.AddTokenPriceChangeTron)
        // await bot.sendMessage(chatId, "Please input price change for notification")
        break;

      case 'add_token_input_skip_tron':
        bot.answerCallbackQuery(callbackQueryId, { show_alert: true, text: "COMMING SOON" })
        // **
        // *
        // *  Missing Part
        // *
        // **
        break;

      // ** --------------------- ADD / Gas Alert --------------------- ** //

      case 'add_gas_alert':
        const add_gas_alert_edit = await commands.Add.add_gas_alert_edit(chatId, username)
        await bot.sendMessage(chatId, add_gas_alert_edit.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: add_gas_alert_edit.content
          }, parse_mode: 'HTML'
        })

        setUserInputState(username, INPUT_ACTION.AddGasAlert)
        break;

      // ** --------------------- ADD / Liquidity --------------------- ** //

      case 'add_pool_liquidity':
        const add_pool_liquidity_edit = await commands.Add.add_pool_liquidity_edit(chatId, username)
        await bot.sendMessage(chatId, add_pool_liquidity_edit.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: add_pool_liquidity_edit.content
          }, parse_mode: 'HTML'
        })
        setUserInputState(username, INPUT_ACTION.AddPoolLqdt)
        break;

      // ** ======================================================== MANAGE ======================================================== ** //

      case 'manage':
        setUserInputState(username, INPUT_ACTION.NoInput)
        const manage_msg = await commands.Manage.manage(chatId, username)

        await bot.sendMessage(chatId, manage_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: manage_msg.content
          }, parse_mode: 'HTML'
        })
        break;

      // ** --------------------- MANAGE / Wallet --------------------- ** //

      case 'manage_wallet':
        setUserInputState(username, INPUT_ACTION.ManageWallet)

        const manage_wallet_msg = await commands.Manage.manage_wallet(chatId, username, manage_wallets_list);
        await bot.sendMessage(chatId, manage_wallet_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: manage_wallet_msg.content
          }, parse_mode: 'HTML'
        })
        break;

      case 'manage_wallet_export_all':
        const manage_wallet_export_all_msg = await commands.Manage.manage_wallet_export_all(chatId, username, manage_wallets_list);
        await bot.sendMessage(chatId, manage_wallet_export_all_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: manage_wallet_export_all_msg.content
          }, parse_mode: 'HTML'
        })
        break;

      case "manage_wallet_info_filter":
        const manage_wallet_info_filter_msg = await commands.Manage.manage_wallet_info_filter(chatId, username);
        await bot.sendMessage(chatId, manage_wallet_info_filter_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: manage_wallet_info_filter_msg.content
          }, parse_mode: 'HTML'
        })
        break

      case "manage_wallet_info_filter_tx_value":
        const manage_wallet_info_filter_tx_value_msg = await commands.Manage.manage_wallet_info_filter_tx_value(chatId, username);
        await bot.sendMessage(chatId, manage_wallet_info_filter_tx_value_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: manage_wallet_info_filter_tx_value_msg.content
          }, parse_mode: 'HTML'
        })
        setUserInputState(username, INPUT_ACTION.ManageInfoFilterTxValue)
        break;

      case "manage_wallet_info_filter_tx_types":
        const manage_wallet_info_filter_tx_types_msg = await commands.Manage.manage_wallet_info_filter_tx_types(chatId, username);
        await bot.sendMessage(chatId, manage_wallet_info_filter_tx_types_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: manage_wallet_info_filter_tx_types_msg.content
          }, parse_mode: 'HTML'
        })
        setUserInputState(username, INPUT_ACTION.ManageInfoFilterTxTypes)
        break;

      case "manage_wallet_info_filter_event":
        const manage_wallet_info_filter_event_msg = await commands.Manage.manage_wallet_info_filter_event(chatId, username);
        await bot.sendMessage(chatId, manage_wallet_info_filter_event_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: manage_wallet_info_filter_event_msg.content
          }, parse_mode: 'HTML'
        })
        setUserInputState(username, INPUT_ACTION.ManageInfoFilterEvent)
        break;

      case "manage_wallet_info_network":
        bot.answerCallbackQuery(callbackQueryId, { show_alert: true, text: "COMMING SOON" })
        break

      case "manage_wallet_info_rename":
        const manage_wallet_info_rename_msg = await commands.Manage.manage_wallet_info_rename(chatId, username, userstate.temp_sol_wallet);
        await bot.sendMessage(chatId, manage_wallet_info_rename_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: manage_wallet_info_rename_msg.content
          }, parse_mode: 'HTML'
        })
        setUserInputState(username, INPUT_ACTION.RenameWallet)
        break

      case "manage_wallet_info_delete":
        const manage_wallet_info_delete_msg = await commands.Manage.manage_wallet_info_delete(chatId, username, userstate.temp_sol_wallet);
        await bot.sendMessage(chatId, manage_wallet_info_delete_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: manage_wallet_info_delete_msg.content
          }, parse_mode: 'HTML'
        })
        break

      case "manage_wallet_info_delete_response":

        //  @ts-ignore
        const user_wallet: InputWalletType = await getWalletByKey(username, userstate.temp_sol_wallet)
        const manage_wallet_info_delete_response_msg = await commands.Manage.manage_wallet_info_delete_response(chatId, username, user_wallet);
        await removeWalletByAddress(username, userstate.temp_sol_wallet)

        await bot.sendMessage(chatId, manage_wallet_info_delete_response_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: manage_wallet_info_delete_response_msg.content
          }, parse_mode: 'HTML'
        })

        break

      // ** --------------------- MANAGE / Token --------------------- ** //

      case 'manage_token':
        setUserInputState(username, INPUT_ACTION.ManageToken)


        const manage_token_msg = await commands.Manage.manage_token(chatId, username, token_list);
        await bot.sendMessage(chatId, manage_token_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: manage_token_msg.content
          }, parse_mode: 'HTML'
        })
        break;

      case 'manage_token_coin_link':
        bot.answerCallbackQuery(callbackQueryId, { show_alert: true, text: "COMMING SOON" })
        break;

      case 'manage_token_sol_change_for_alert':
        const manage_token_sol_change_for_alert_msg = await commands.Manage.manage_token_sol_change_for_alert(chatId, username)
        await bot.sendMessage(chatId, manage_token_sol_change_for_alert_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: manage_token_sol_change_for_alert_msg.content
          }, parse_mode: 'HTML'
        })
        setUserInputState(username, INPUT_ACTION.ManageTokenChangeAlert)
        break;


      case 'manage_token_sol_price_alert':
        const manage_token_sol_price_alert_msg = await commands.Manage.manage_token_sol_price_alert(chatId, username)
        await bot.sendMessage(chatId, manage_token_sol_price_alert_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: manage_token_sol_price_alert_msg.content
          }, parse_mode: 'HTML'
        })
        setUserInputState(username, INPUT_ACTION.ManageTokenPriceAlert)
        break;

      case 'manage_token_sol_delete':

        await deleteTokenInfoByUser(username, userstate.temp_sol_token)
        const manage_token_sol_delete_msg = await commands.Manage.manage_token_sol_delete(chatId, username, tokenName || "")
        await bot.sendMessage(chatId, manage_token_sol_delete_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: manage_token_sol_delete_msg.content
          }, parse_mode: 'HTML'
        })
        break;

      case 'manage_token_sol_delete_response':
        await bot.sendMessage(chatId, "Please input Market Cap for notification")
        break;

      // ** --------------------- MANAGE / Alert --------------------- ** //

      case 'manage_alert':
        bot.answerCallbackQuery(callbackQueryId, { show_alert: true, text: "COMMING SOON" })
        break;

      // ** --------------------- MANAGE / Liquidity --------------------- ** //

      case 'manage_pool':
        bot.answerCallbackQuery(callbackQueryId, { show_alert: true, text: "COMMING SOON" })
        break;

      // ** ======================================================== BECOMING PRO ======================================================== ** //

      case 'become_pro':
        const become_pro_msg = await commands.BecomingPro.become_pro(chatId, username, {
          user_plan: userstate.plan,
          sol_wallet: manage_wallets_list,
          sol_token: token_list,
          expire_date: userstate.expire_date
        })
        bot.sendPhoto(chatId, "https://ibb.co/L6WdBby", {
          caption: become_pro_msg.title,
          reply_markup: {
            inline_keyboard: become_pro_msg.content
          }, parse_mode: 'HTML'
        })
        break;

      case 'become_pro_pro_0.25':
        if (await connection.getBalance(new PublicKey(userstate.my_wallet_public_key)) > 0.25 * (10 ** 9)) {
          await payForProSol(0.25, decrypt(userstate.my_wallet_private_key, seed))
          setExpireTime(username, addOneMonth(), USER_PLAN.Pro1)
          // setExpireTime(username, add5s(), USER_PLAN.Pro1)
          const become_pro_enough_bal_msg = await commands.BecomingPro.become_pro_enough_bal(chatId, username)
          await bot.sendMessage(chatId, become_pro_enough_bal_msg.title, {
            reply_markup: {
              //  @ts-ignore
              inline_keyboard: become_pro_enough_bal_msg.content
            }, parse_mode: 'HTML'
          })
        } else {
          const become_pro_insufficient_bal_msg = await commands.BecomingPro.become_pro_insufficient_bal(chatId, username)
          await bot.sendMessage(chatId, become_pro_insufficient_bal_msg.title, {
            reply_markup: {
              //  @ts-ignore
              inline_keyboard: become_pro_insufficient_bal_msg.content
            }, parse_mode: 'HTML'
          })
        }
        break;

      case 'become_pro_pro_2.5':
        if (await connection.getBalance(new PublicKey(userstate.my_wallet_public_key)) > 2.5 * (10 ** 9)) {
          await payForProSol(2.5, decrypt(userstate.my_wallet_private_key, seed))
          setExpireTime(username, addOneYear(), USER_PLAN.Pro2)
          // setExpireTime(username, add10s(), USER_PLAN.Pro2)
          const become_pro_enough_bal_msg = await commands.BecomingPro.become_pro_enough_bal(chatId, username)
          await bot.sendMessage(chatId, become_pro_enough_bal_msg.title, {
            reply_markup: {
              //  @ts-ignore
              inline_keyboard: become_pro_enough_bal_msg.content
            }, parse_mode: 'HTML'
          })
        } else {
          const become_pro_insufficient_bal_msg = await commands.BecomingPro.become_pro_insufficient_bal(chatId, username)
          await bot.sendMessage(chatId, become_pro_insufficient_bal_msg.title, {
            reply_markup: {
              //  @ts-ignore
              inline_keyboard: become_pro_insufficient_bal_msg.content
            }, parse_mode: 'HTML'
          })
        }
        break;

      case 'become_pro_whale_1':
        if (await connection.getBalance(new PublicKey(userstate.my_wallet_public_key)) > (10 ** 9)) {
          await payForProSol(1, decrypt(userstate.my_wallet_private_key, seed))
          setExpireTime(username, addOneMonth(), USER_PLAN.Whale1)
          // setExpireTime(username, add5s(), USER_PLAN.Whale1)
          const become_pro_enough_bal_msg = await commands.BecomingPro.become_pro_enough_bal(chatId, username)
          await bot.sendMessage(chatId, become_pro_enough_bal_msg.title, {
            reply_markup: {
              //  @ts-ignore
              inline_keyboard: become_pro_enough_bal_msg.content
            }, parse_mode: 'HTML'
          })
        } else {
          const become_pro_insufficient_bal_msg = await commands.BecomingPro.become_pro_insufficient_bal(chatId, username)
          await bot.sendMessage(chatId, become_pro_insufficient_bal_msg.title, {
            reply_markup: {
              //  @ts-ignore
              inline_keyboard: become_pro_insufficient_bal_msg.content
            }, parse_mode: 'HTML'
          })
        }
        break;

      case 'become_pro_whale_10':
        if (await connection.getBalance(new PublicKey(userstate.my_wallet_public_key)) > (10 ** 9)) {
          await payForProSol(10, decrypt(userstate.my_wallet_private_key, seed))
          // setExpireTime(username, add10s(), USER_PLAN.Whale2)
          setExpireTime(username, addOneYear(), USER_PLAN.Whale2)
          const become_pro_enough_bal_msg = await commands.BecomingPro.become_pro_enough_bal(chatId, username)
          await bot.sendMessage(chatId, become_pro_enough_bal_msg.title, {
            reply_markup: {
              //  @ts-ignore
              inline_keyboard: become_pro_enough_bal_msg.content
            }, parse_mode: 'HTML'
          })
        } else {
          const become_pro_insufficient_bal_msg = await commands.BecomingPro.become_pro_insufficient_bal(chatId, username)
          await bot.sendMessage(chatId, become_pro_insufficient_bal_msg.title, {
            reply_markup: {
              //  @ts-ignore
              inline_keyboard: become_pro_insufficient_bal_msg.content
            }, parse_mode: 'HTML'
          })
        }
        break;

      case 'contact_support_pro':
        const contact_support_pro_msg = await commands.BecomingPro.contact_support_pro(chatId, username)
        await bot.sendMessage(chatId, contact_support_pro_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: contact_support_pro_msg.content
          }, parse_mode: 'HTML'
        })
        break;

      case 'contact_support':
        const contact_support_msg = await commands.BecomingPro.become_pro_contact_us(chatId, username)
        await bot.sendMessage(chatId, contact_support_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: contact_support_msg.content
          }, parse_mode: 'HTML'
        })
        break;

      case 'become_pro_enough_bal':
        const become_pro_enough_bal_msg = await commands.BecomingPro.become_pro_enough_bal(chatId, username)
        await bot.sendMessage(chatId, become_pro_enough_bal_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: become_pro_enough_bal_msg.content
          }, parse_mode: 'HTML'
        })
        break;

      case 'become_pro_insufficient_bal':
        const become_pro_insufficient_bal_msg = await commands.BecomingPro.become_pro_insufficient_bal(chatId, username)
        await bot.sendMessage(chatId, become_pro_insufficient_bal_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: become_pro_insufficient_bal_msg.content
          }, parse_mode: 'HTML'
        })
        break;

      // ** ======================================================== CUSTOM BOT ======================================================== ** //

      case 'custom_bot':

        bot.answerCallbackQuery(callbackQueryId, { show_alert: true, text: "COMMING SOON" })

        break;

      // ** ======================================================== SETTINGS ======================================================== ** //

      case 'settings':

        const settings_msg = await commands.Settings.settings(chatId, username, userstate)

        await bot.sendMessage(chatId, settings_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: settings_msg.content
          }, parse_mode: 'HTML'
        })

        break;

      case 'setting_filter_response':

        setSettingFilterScam(username, !userstate.setting_filter_scam)
        const settings_filter_scam_msg = await commands.Settings.settings(chatId, username, { ...userstate, setting_filter_scam: !userstate.setting_filter_scam })


        await bot.sendMessage(chatId, settings_filter_scam_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: settings_filter_scam_msg.content
          }, parse_mode: 'HTML'
        })

        break;

      case 'settings_blacklist':
        bot.answerCallbackQuery(callbackQueryId, { show_alert: true, text: "COMMING SOON" })
        break;

      case 'settings_pause_resume':
        const settings_pause_resume_msg = await commands.Settings.settings_pause_resume(chatId, username, userstate.setting_pause_resume)
        await bot.sendMessage(chatId, settings_pause_resume_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: settings_pause_resume_msg.content
          }, parse_mode: 'HTML'
        })

        break;

      case 'settings_pause_resume_response':
        setSettingPauseResume(username, !userstate.setting_pause_resume)
        const settings_pause_resume_response_msg = await commands.Settings.settings(chatId, username, { ...userstate, setting_pause_resume: !userstate.setting_pause_resume })
        await bot.sendMessage(chatId, settings_pause_resume_response_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: settings_pause_resume_response_msg.content
          }, parse_mode: 'HTML'
        })
        break;

      case 'setting_min_trade_sol':
        const setting_min_trade_sol_msg = await commands.Settings.setting_min_trade_sol(chatId, username, userstate.setting_min_trade_sol)
        await bot.sendMessage(chatId, setting_min_trade_sol_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: setting_min_trade_sol_msg.content
          }, parse_mode: 'HTML'
        })
        setUserInputState(username, INPUT_ACTION.SettingMinTradeSol)
        break;


      case 'setting_max_trade_sol':
        const setting_max_trade_sol_msg = await commands.Settings.setting_max_trade_sol(chatId, username, userstate.setting_max_trade_sol)
        await bot.sendMessage(chatId, setting_max_trade_sol_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: setting_max_trade_sol_msg.content
          }, parse_mode: 'HTML'
        })
        setUserInputState(username, INPUT_ACTION.SettingMaxTradeSol)
        break;


      case 'setting_min_trade_mc':
        const setting_min_trade_mc_msg = await commands.Settings.setting_min_trade_mc(chatId, username, userstate.setting_min_trade_mc)
        await bot.sendMessage(chatId, setting_min_trade_mc_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: setting_min_trade_mc_msg.content
          }, parse_mode: 'HTML'
        })
        setUserInputState(username, INPUT_ACTION.SettingMinTradeMC)
        break;


      case 'setting_max_trade_mc':
        const setting_max_trade_mc_msg = await commands.Settings.setting_max_trade_mc(chatId, username, userstate.setting_max_trade_mc)
        await bot.sendMessage(chatId, setting_max_trade_mc_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: setting_max_trade_mc_msg.content
          }, parse_mode: 'HTML'
        })
        setUserInputState(username, INPUT_ACTION.SettingMaxTradeMC)
        break;


      case 'settings_income_outgoing_response':
        setSettingIncomeOutgoing(username, (userstate.setting_income_outgoing + 1) % 3);

        const settings_income_outgoing_msg = await commands.Settings.settings(chatId, username, { ...userstate, setting_income_outgoing: (userstate.setting_income_outgoing + 1) % 3 })
        await bot.sendMessage(chatId, settings_income_outgoing_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: settings_income_outgoing_msg.content
          }, parse_mode: 'HTML'
        })
        break;

      case 'setting_lanugage':
        bot.answerCallbackQuery(callbackQueryId, { show_alert: true, text: "COMMING SOON" })
        break;

      case 'settings_custom_notify':
        bot.answerCallbackQuery(callbackQueryId, { show_alert: true, text: "COMMING SOON" })
        break;

      case 'contact_us':
        const contact_us_msg = await commands.Settings.setting_contact_support(chatId, username)
        await bot.sendMessage(chatId, contact_us_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: contact_us_msg.content
          }, parse_mode: 'HTML'
        })
        break;
      // ** ======================================================== REFERALS ======================================================== ** //

      case 'referals':

        const referals_msg = await commands.Referal.referals(chatId, username)

        await bot.sendMessage(chatId, referals_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: referals_msg.content
          }, parse_mode: 'HTML'
        })

        break;

      // ** ======================================================== MULTI WALLET ======================================================== ** //

      case 'multi_wallets':

        const multi_wallets_msg = await commands.MultiWallet.multi_wallets(chatId, username)

        await bot.sendMessage(chatId, multi_wallets_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: multi_wallets_msg.content
          }, parse_mode: 'HTML'
        })

        break;

      // ** ======================================================== MY WALLET ======================================================== ** //

      case 'my_wallet':

        const my_wallet_msg = await commands.MyWallet.my_wallet(chatId, username, userstate)

        await bot.sendMessage(chatId, my_wallet_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: my_wallet_msg.content
          }, parse_mode: 'HTML'
        })

        break;

      case 'my_wallet_show_key':

        const my_wallet_show_key_msg = await commands.MyWallet.my_wallet_show_key(chatId, username, userstate)

        await bot.sendMessage(chatId, my_wallet_show_key_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: my_wallet_show_key_msg.content
          }, parse_mode: 'HTML'
        })

        break;

      // ** ======================================================== HELP ======================================================== ** //

      case 'help':

        const help_msg = await commands.Help.help(chatId, username)

        await bot.sendMessage(chatId, help_msg.title, {
          reply_markup: {
            //  @ts-ignore
            inline_keyboard: help_msg.content
          }, parse_mode: 'HTML'
        })

        break;

      // ** ======================================================== COMING SOON ======================================================== ** //

      case 'coming_soon':
        bot.answerCallbackQuery(callbackQueryId, { show_alert: true, text: "COMMING SOON" })
        break;

    }
  })
}

start()