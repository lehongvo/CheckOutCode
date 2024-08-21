const moment = require('moment');
const crypto = require('crypto');

function generateRandomWalletData() {
    const data = [];

    for (let i = 0; i < 40; i++) {
        const userId = Math.floor(Math.random() * 30) + 1;
        const goldChange = Math.floor(Math.random() * 901) + 100;
        const timestamp = moment("2024-08-15")
            .add(Math.floor(Math.random() * 6), 'days')
            .add(Math.floor(Math.random() * 24), 'hours')
            .valueOf();
        const reason = ["Bonus", "Purchase", "Deposit", "Game win", "Withdrawal"][Math.floor(Math.random() * 5)];
        const type = ["DEPOSIT", "WITHDRAW"][Math.floor(Math.random() * 2)];

        data.push({
            goldChange,
            timestamp,
            reason,
            type,
            userId
        });
    }

    return data;
}

// Chuyển đổi dữ liệu thành JSON
const walletDataSamples = generateRandomWalletData();
console.log(JSON.stringify(walletDataSamples, null, 4));
