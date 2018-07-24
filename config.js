var config = {
    settingsBot:{
        botToken: '647374124:AAEcvetsmBwo_YwrkqpYYD_zHTGGb75dsfY',
        mongoUrl: 'mongodb://invest:invest1@ds125181.mlab.com:25181/invest'
    },

    settingsFK: {
        merchant_id: '',
        merchant_secret: '8v9g26fg',


    },

    //настройка вкладов
    settingsHolding: {
        // план START
        plan1:{
            name: 'START', // Название плана
            percent: '1.30', //проценты в час
            paymentDeposit: '0', // 0 - депозит не входит в выплаты, 1 - депозит входит в выплаты
            dayDeposit: '4', // срок вклада в днях
            fromMoney: '30', // от скольки начинается этот план
            toMoney: '1500', // до скольки этот план
        },
        plan2:{
            name: 'NORMAL', // Название плана
            percent: '1.10', //проценты в час
            paymentDeposit: '1', // 0 - депозит не входит в выплаты, 1 - депозит входит в выплаты
            dayDeposit: '3', // срок вклада в днях
            fromMoney: '1501', // от скольки начинается этот план
            toMoney: '5000', // до скольки этот план
        },
        plan3:{
            name: 'PRO', // Название плана
            percent: '1.30', //проценты в час
            paymentDeposit: '1', // 0 - депозит не входит в выплаты, 1 - депозит входит в выплаты
            dayDeposit: '2', // срок вклада в днях
            fromMoney: '5001', // от скольки начинается этот план
            toMoney: '15000', // до скольки этот план
        },
        plan4:{
            name: 'SPEED', // Название плана
            percent: '2.8', //проценты в час
            paymentDeposit: '1', // 0 - депозит не входит в выплаты, 1 - депозит входит в выплаты
            dayDeposit: '1', // срок вклада в днях
            fromMoney: '15001', // от скольки начинается этот план
            toMoney: '25000', // до скольки этот план
        },
    },

    cmd: {
        // Главное меню
        '1':'💳 Вклады',
        '2':'🔰 Партнерка',
        '3':'💵 Баланс',
        '4':'☁ FAQ',
        '5':'📊 Статистика',
       
        // Баланс
        '6':'💸 Пополнить баланс',
        '7':'📤 Заказать выплату',
        '8' :'📆 Мои выплаты',
        
        // Вклады
        '9' :'📥 Сделать вклад',
        '10' :'📈 Планы вкладов',
        '11' : '💱 Калькулятор',
        '12' :'⬅ Главное меню',
        
        '13' :'',
        '14' :'',
        '15' :'',
        '16' :''
        
    }, 

    sys: [
        'Вывод на Яндекс Деньги',
        'Вывод на AdvCash',
        'Вывод на банковскую карту',
        'Вывод на Perfect Money',
        'Вывод на Payeer'
    ],

    schems: {
        user: [{
            id: Number, 
            user_id: Number,
            username: String, 
            referer_id: {type: Number, default: ''},
            section_id: {type: Number, default: ''},
            last_out_sum: {type: Number, default: ''},
            last_out_system: {type: Number, default: ''},
            balance: { type: String, default: 0 },
            ref_balance: { type: String, default: 0 },
            count_referals: { type: Number, default: 0 },
            date_activity: {type: Number, default: ''},
            calculate: { type: String, default: '' },
            createdAd: { type: Date, default: Date.now() }
        }
        ],
        
        deposits: {
            id: Number,
            user_id: Number,
            status: Number,
            plan: Number,
            start_sum: String,
            now_sum: String,
            date_add: Number,
            date_end: Number,
        },
        
        invoices: {
            invoices_id: Number,
            user_id: Number,
            sum: Number,
            status: Number
        },

        payouts: {
            id: Number,
            user_id: Number,
            sum: Number,
            system: Number,
            num: String,
            status: Number
        },

        statistics: {
            id: { type: Number, default: 1 },
            count_user_day: { type: Number},
            invest: { type: String},
            payout: { type: String}
        }

    }


    


};
module.exports = config;

/*
 /start
 /статистика
 /Партнерка
 /FAQ
 / Баланс
 / На главную
 / Выплаты
 / Заказать выплату
  /Вклады
  /Планы вкладов

*/