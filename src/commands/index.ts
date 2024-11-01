import * as Add from './add';
import * as Manage from './manage';
import * as BecomingPro from './becoming_pro';
import * as CustomBot from './custom_bot';
import * as Settings from './settings';
import * as Referal from './referal';
import * as MyWallet from './my_wallet';
import * as MultiWallet from './multi_wallets';
import * as Help from './help';
import * as SolanaMsg from './solana_msg';

const commandList = [
    { command: 'menu', description: 'Start Bot' },
    { command: 'wallets', description: 'Manage Wallet' },
    { command: 'add', description: 'Add Wallet / Token' },
    { command: 'help', description: 'About This Bot' },
];

const home = async (chatId: number, username: string) => {
    const title = `Monitor | Wallet Tracking Bot 🤖

This bot helps you monitor transactions across your Solana / TRON / EVM wallets. You will be notified on any activity after you add wallets. 

Click PRO to get more wallets!

<a href="https://x.com/Monitor_fi">Join Twitter</a>
<a href="https://t.me/MonitorAlpha">Join Monitor Alpha Channel</a>
<a href="https://monitor-4.gitbook.io/monitor">User Guide</a>
<a href="https://monitorfi.xyz">Try Monitor App</a>
`
    const content = [
        [
            { text: 'Add', callback_data: 'add' },
            { text: 'Manage', callback_data: 'manage' }
        ],
        [
            { text: 'Become PRO', callback_data: 'become_pro' },
            { text: 'Custom Bot', callback_data: 'custom_bot' }
        ],
        [
            { text: 'Settings', callback_data: 'settings' },
            { text: 'Referrals', callback_data: 'referals' }
        ],
        [
            { text: 'Multi Wallet', callback_data: 'multi_wallets' },
            { text: 'My Wallet', callback_data: 'my_wallet' },
            { text: 'Help', callback_data: 'help' }
        ]
    ]

    return { title, content }
}

export {
    commandList,
    home,
    Add,
    BecomingPro,
    CustomBot,
    Help,
    Manage,
    MyWallet,
    MultiWallet,
    Referal,
    Settings,
    SolanaMsg,
}