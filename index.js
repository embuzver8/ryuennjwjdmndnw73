const config = require('./config');
const TeleBot = require('telebot');
const bot = new TeleBot(config.settingsBot.botToken);
const mongoose = require('mongoose');
mongoose.connect(config.settingsBot.mongoUrl);
const Schema = mongoose.Schema;
const Schems = config.schems;
const CMD = config.cmd;
const SYS = config.sys;

const UserSchema = new Schema(Schems.user[0]);
const User = mongoose.model('users', UserSchema);

 const DepositsSchema = new Schema(Schems.deposits);
 //const Deposits = mongoose.model('deposits', DepositsSchema);


 const InvoicesSchema = new Schema(Schems.invoices);
// const Invoices = mongoose.model('invoices', InvoicesSchema);

 const PayoutsSchema = new Schema(Schems.payouts);
 //const Payouts = mongoose.model('payouts', PayoutsSchema);


//Обрабатываем сообщения
bot.on('*', async function(msg){
    console.log(msg)

    // проверим, есть ли пользователь в базе
    let user = await User.findOne({ user_id: msg.from.id });
    if(!user) {
        // пришел новый пользователь, создаем его
        user = await User.create({ 
            user_id: msg.from.id, 
            username: msg.from.username, 
        })
    } 
    
    // //Получаем дату
    // var d = new Date();
    // var unix = Math.floor(d.getTime()/1000);// Время ы Unix
    // User.findOneAndUpdate({'user_id':msg.from.id}, {'date_activity': unix},{upsert:true}, function(err, doc){});//записываем время активнсти
    
    //Разбиваем сообщение на части
    let param = await msg.text.split(' ');
    

      // /start
    if(param[0] == '/start'){
        let answer = '';          
        // Если вторая часть есть
        if(param[1]){       
            // Если нету реф ид в бд или реф ид не равно 0
            if(!user.referer_id && user.referer_id != 0){
               
                //  если нету рефера в бд и пользователь прешел по реф ссылке, то записать рефера в бд
               User.findOneAndUpdate({'user_id':msg.from.id}, {'referer_id':param[1]},{upsert:true}, async function(err, doc){
                // Записываем в статистику
                let Statistics = mongoose.model('statistics', StatisticsSchema);
                let statistics = await Statistics.findOne({ id: 1 })
                let countU = statistics.count_user_day + 1
             
                Statistics.findOneAndUpdate({ id: 1 }, {count_user_day: countU},{upsert:true}, function(err, doc){})
               
            });
            
               answer = 'вы успешно зарегистрировались по реф ссылке'
            }else if(user.referer_id != 0){
               answer = 'вы уже были зарегистрированы по реф ссылке '
            }else if(user.referer_id == 0){
                answer = 'вы уже были зарегистрированы  вы пришли свми'
            }

        } 
        // Если нет второй части и нету в бд реф ид и реф ид не равно 0 то записываем как пришел сам
        else if(!user.referer_id && user.referer_id != 0){
            answer = 'Вы успешно зарегистрированы\nВы пришли сами'
            // 0 - Значит чел пришел сам, мы это записываем
            User.findOneAndUpdate({'user_id':msg.from.id}, {'referer_id': '0'},{upsert:true}, function(err, doc){});

        } else {
            answer = 'Клавиатура обновлена\nВы возращены на главное меню'
        }


        let keyboard = bot.keyboard([
            [CMD[1]],
            [CMD[2], CMD[3]],
            [CMD[4], CMD[5]]
        ], {resize: true})
        
        
        // Отправляем сообщение
        
        User.findOneAndUpdate({'user_id':msg.from.id}, {'section_id': '0'},{upsert:true}, function(err, doc){});
        return bot.sendMessage(msg.from.id, answer, {parseMode: 'Markdown', replyMarkup: keyboard});
    }

    




    // /статистика
    if(msg.text == CMD[5]){
    
        console.log('created',user.createdAt)
        let count_user = ''
        let userCount = await User.aggregate([
            {  $count :  "count_user"  }
        ])
        .then(function(res){
            console.log(res)
            count_user = res[0].count_user
            
        })
       
        let userCountDay = await User.aggregate([
            {
                $group :{
                    // _id :  {  day :  {  $dayOfYear :  "$ date" },  year :  {  $year :  "$ date"  }  },
                    totalAmount: { $sum: "$ balance"},
                    count: {$sum : 1}

                }
            }
        ])
        .then(function(res){

            console.log(res)
        })
        .catch(function(err){
            console.log(err)
        })
       
        let keyboard = bot.keyboard([
            [CMD[1]],
            [CMD[2], CMD[3]],
            [CMD[4], CMD[5]]
        ], {resize: true})


        let answer = `Всего пользователей:* ${count_user}* \n`;
        // answer += `*Новых за 24 часа:* ${statistics.count_user_day}\n`
        // answer += `*Инвестировано:* ${statistics.invest} рублей\n`
        // answer += `*Выплачено:* ${statistics.payout} рублей\n`
        
        return bot.sendMessage(msg.from.id, answer, {parseMode: 'Markdown', replyMarkup: keyboard});
    } 
   
    // Партнерка
    else if(msg.text == CMD[2]){
        let answer = '';
        if(user.referer_id != 0){var reff = 'Вы пришли по реф ссылке';} else if(user.referer_id == 0){var reff = 'Вы пришли сами';}
        
        
        answer += `👤 ${reff}\n\n`;
        answer += `👥 У вас ${user.count_referals} рефералов\n`;
        answer += `👥 Доход с рефералов: ${user.ref_balance} руб\n\n`;
        answer += 'Ваша реферальная ссылка: \n' + '```https:/t.me/botinvest2_0_bot?start=' + msg.from.id + '```\n';
        answer += `[Ссылка](https://t.me/botinvest2_0_bot?start=${msg.from.id})`;

        let keyboard = bot.keyboard([
            [CMD[1]],
            [CMD[2], CMD[3]],
            [CMD[4], CMD[5]]
        ], {resize: true})


        return bot.sendMessage(msg.from.id, answer, {parseMode: 'Markdown', replyMarkup: keyboard});
    }
    
    //FAQ
    else if(msg.text == CMD[4]){
        
        let keyboard = bot.keyboard([
            [CMD[1]],
            [CMD[2], CMD[3]],
            [CMD[4], CMD[5]]
        ], {resize: true})

        let answer = `*Какая минимальная сумма вклада?*\n-Минимальная сумма 30 руб\n\n*Какой доход я получаю?*\n-Все зависит от тарифного плана\n\n*Какие платежные системы принимаются?*\n-Мы принимаем более 5 платежных систем\n\n*Какая минимальная сумма для выплаты?*\n-Минимальная сумма 15 руб\n\n*Как быстро выводят деньги?*\n-Заявки на вывод обрабатываются в течении 48 часов`;

        return bot.sendMessage(msg.from.id, answer, {parseMode: 'Markdown', replyMarkup: keyboard});

    }

    // Баланс
    else if(msg.text == CMD[3]){

        let keyboard = bot.keyboard([
            [CMD[6]],
            [CMD[7]],
            [CMD[8]],
            [CMD[12]]
        ], {resize: true})

        let answer = `Ваш баланс: *${parseFloat(user.balance).toFixed(2)} руб*`;

        return bot.sendMessage(msg.from.id, answer, {parseMode: 'Markdown', replyMarkup: keyboard});



    }

    // Выплаты
    else if(msg.text == CMD[8]){
        
        let Payouts =  mongoose.model('payouts', PayoutsSchema);
    
   
        let payouts = await Payouts.find({user_id: msg.chat.id});
        let count_payouts =  payouts.length
        let answer = ''
        //console.log(count_payouts)
        //console.log(payouts)
        
        if(count_payouts == 0){
            answer = `У вас еще небыло выплат!`;
        }
        else{
            
            answer = `*Ваши выплаты:*\n`;
            
            payouts.forEach(function(item){
                let status = '';
                
                if(item.status == 0) status = 'в процессе';
                else if(item.status == 1) status = 'выплачен';
                else if(item.status == 2) status = 'отказано';

                answer += `Сумма: *${(item['sum'])} руб*\n`;
                answer += `*${SYS[item['system']]}*\n`;
                answer += `Счет: *${item['num']}*\n`;
                answer += `Статус: *${status}*\n\n`;
                
              //console.log(item.sum)
            })
          
        }
      
     
        let keyboard = bot.keyboard([
            [CMD[6]],
            [CMD[7]],
            [CMD[8]],
            [CMD[12]]
        ], {resize: true})

        return bot.sendMessage(msg.from.id, answer, {parseMode: 'Markdown', replyMarkup: keyboard});
    }

    // Заказать выплату
    else if(msg.text == CMD[7]){
        let answer = `Введите сумму, которую вы хотите вывести.\nМинимальная сумма для выплаты: *50 рублей*`;
        
        let keyboard = bot.keyboard([
            [CMD[12]]
        ], {resize: true});


        User.findOneAndUpdate({'user_id':msg.from.id}, {'section_id': '2'},{upsert:true}, function(err, doc){});

        return bot.sendMessage(msg.from.id, answer, {parseMode: 'Markdown', replyMarkup: keyboard});
    }

    //Вклады
    else if(msg.text == CMD[1]){
        let Deposits = mongoose.model('deposits', DepositsSchema);
        let deposits = await Deposits.find({user_id: msg.from.id});
        let answer = ''

        //console.log(deposits)
        if(deposits.length == 0) answer = "У вас еще не было вкладов.";
        else{
            answer += `*Активные вклады:*\n\n`;
            let plan = '';
            let status = ''
            let d, year, month, day, hours, minutes;
            let date_add = '' 
            let date_end = '';
            deposits.forEach(function(item){
                if(item['plan'] == 1) plan = 'START';
                else if(item['plan'] == 2) plan = 'NORMAL';
                else if(item['plan'] == 3) plan = 'PRO';
                else if(item['plan'] == 4) plan = 'SPEED';
                
                if(item.status == 0) status = 'работает';
                else if(item.status == 1 ) status = 'уже закрыт';
                
                date_add = transformationUnix(item.date_add)
                date_end = transformationUnix(item.date_end)

                console.log('date_add',date_add)
                console.log('date_end',date_end)

                answer += `🔘 Вклад по тарифу *${plan}*:\n`;
                answer += `Депозит: *${item['start_sum']} руб*\n`
                answer += `Уже выплачено: *${item['now_sum']} руб*\n`
                answer += `Статус вклада: *${status}*\n`
                answer += `Вклад сделан: *${date_add.day}.${date_add.month}.${date_add.year}*, в *${date_add.hours}:${date_add.minutes}*\n`
                answer += `Вклад будет закрыт: *${date_end.day}.${date_end.month}.${date_end.year}*, в *${date_end.hours}:${date_end.minutes}*\n`
                answer += `ID вклада: *${item.id}*\n\n`;

            });
        }
        let keyboard = bot.keyboard([
            [CMD[9]],
            [CMD[10]],
            [CMD[11]],
            [CMD[12]]
        ], {resize: true});

        return bot.sendMessage(msg.from.id, answer, {parseMode: 'Markdown', replyMarkup: keyboard});
    }


    // На главную
    else if(msg.text == CMD[12]){
        let answer = 'Вы в главном меню';
        let keyboard = bot.keyboard([
            [CMD[1]],
            [CMD[2], CMD[3]],
            [CMD[4], CMD[5]]
        ], {resize: true})


        User.findOneAndUpdate({'user_id':msg.from.id}, {'last_out_sum': 0, 'last_out_system': 0, 'section_id': 0},{upsert:true}, function(err, doc){})
        return bot.sendMessage(msg.from.id, answer, {parseMode: 'Markdown', replyMarkup: keyboard});
    }

    //Планы вкладов
    else if(msg.text == CMD[10]){
        let plans = config.settingsHolding;
        let paymentDeposit = ''
        let answer = ''
        
        
        answer = `*Основные условия:*\n\nПроценты будут зачисляться к вам на счет каждый день.\nДепозит будет зачислен в конце срока. \n\n`;
        for(i=1;i<=4;i++){
            let plang = 'plan' + [i];

            if(plans[plang].paymentDeposit == 0){paymentDeposit = '*не входит*';}
            else if(plans[plang].paymentDeposit == 1){paymentDeposit = '*входит*';}
           
            answer += `*План ${plans[plang].name}:*\n`;
            answer += `🔘 Минимальная сумма вклада: *${plans[plang].fromMoney} рублей*\n`;
            answer += `🔘 Максимальная сумма вклада: *${plans[plang].toMoney} рублей*\n`;
            answer += `🔺 Процент: *${plans[plang].percent}% в час*\n`;
            answer += `🕚 Срок вклада: *${plans[plang].dayDeposit} дн*\n(депозит ${paymentDeposit} входит в выплаты)\n\n`;


        }

       

        let keyboard = bot.keyboard([
            [CMD[9]],
            [CMD[10]],
            [CMD[11]],
            [CMD[12]]
        ], {resize: true});

        
        
        return bot.sendMessage(msg.from.id, answer, {parseMode: 'Markdown', replyMarkup: keyboard});
    }

    //Калькулятор
    else if(msg.text == CMD[11]){
        let answer = 'Введите сумму, чтобы посчитать доход'
        
        let keyboard = bot.keyboard([
            [CMD[12]]
        ], {resize: true});

        
        User.findOneAndUpdate({'user_id':msg.from.id}, {'section_id': '6'},{upsert:true}, function(err, doc){});
        return bot.sendMessage(msg.from.id, answer, {parseMode: 'Markdown', replyMarkup: keyboard});

    }

    else if(msg.text == CMD[9]){
        let answer = `Введите сумму, которую хотите проинвестировать.\nПлан вклада будет определен автоматически.\n\nВнимание! Деньги спишутся с баланса. Перед этим его нужно пополнить.`;
        
        let keyboard = bot.keyboard([
            [CMD[12]]
        ], {resize: true});


        User.findOneAndUpdate({'user_id':msg.from.id}, {'section_id': '1'},{upsert:true}, function(err, doc){});

        return bot.sendMessage(msg.from.id, answer, {parseMode: 'Markdown', replyMarkup: keyboard});
    }

    //Команда не известна или находится в section id
    else{

        // Сделать вклад
        if(user.section_id == 1){
            let answer = '';
            let keyboard = '';
            let deposit = '';

            if(parseFloat(user.balance) < parseFloat(msg.text)){
                answer = "Ваш баланс меньше указанной суммы.\nПополните его в разделе 'Баланс'.";

                keyboard = bot.keyboard([
                 [CMD[1]],
                 [CMD[2], CMD[3]],
                 [CMD[4], CMD[5]]
                ], {resize: true})
                
               
                User.findOneAndUpdate({'user_id':msg.from.id}, {'section_id': '0'},{upsert:true}, function(err, doc){});
            }
            
            else if(parseFloat(msg.text) < 30){
                answer = "Минимальная сумма для инвестирования - 30 рублей.\nВведите большую сумму.";

                keyboard = bot.keyboard([
                    [CMD[12]]
                ], {resize: true});  

                

            }

            else if(parseFloat(msg.text) > 25000){
                answer = "Максимальная сумма для инвестирования - 25000 рублей.\nВведите меньшую сумму.";

                keyboard = bot.keyboard([
                    [CMD[12]]
                ], {resize: true}); 

               

            }

            // Все норм делаем вклад
            else {
                let plans = config.settingsHolding;

                let depositD = await create_deposit(msg.chat.id, parseFloat(msg.text));

                User.findOneAndUpdate({'user_id':msg.from.id}, {'section_id': '0'},{upsert:true}, function(err, doc){});

            }
            
            return bot.sendMessage(msg.from.id, answer, {parseMode: 'Markdown', replyMarkup: keyboard});
        }

        // Вывести деньги
        else if(user.section_id == 2){

            let answer = '',
                keyboard = ''

            if(parseFloat(user.balance).toFixed(2) < parseFloat(msg.text)) {
                answer = "Ваш баланс меньше указанной суммы.\nВведите сумму, которую вы хотите вывести.";

                keyboard = bot.keyboard([
                    [CMD[12]]
                ], {resize: true});  

                return bot.sendMessage(msg.from.id, answer, {parseMode: 'Markdown', replyMarkup: keyboard});
            }

            else if(parseFloat(msg.text).toFixed(2) < 50){
                answer = "Минимальная сумма для выплаты: 50 рублей.\nВведите сумму, которую вы хотите вывести.";

                keyboard = bot.keyboard([
                    [CMD[12]]
                ], {resize: true});  

                return bot.sendMessage(msg.from.id, answer, {parseMode: 'Markdown', replyMarkup: keyboard});
            }
            
            else{
                answer = 'Укажите платежную систему для вывода.'

                keyboard = bot.keyboard([
                    [SYS[0]], 
                    [SYS[1]], 
                    [SYS[2]], 
                    [SYS[3]], 
                    [SYS[4]], 
                    [CMD[12]]

                    
                ], {resize: true});  
                
                
                 User.findOneAndUpdate({'user_id':msg.from.id}, {'section_id': '3', 'last_out_sum': msg.text},{upsert:true}, function(err, doc){});
                 return bot.sendMessage(msg.from.id, answer, {parseMode: 'Markdown', replyMarkup: keyboard});
            }
        }
        
        else if(user.section_id == 3){
            let answer = '',
                keyboard = '';

            if(msg.text == SYS[0] || msg.text == SYS[1] || msg.text == SYS[2] || msg.text == SYS[3] ||  msg.text == SYS[4]){

                let system = '';

                if(msg.text == SYS[0]){
                    system = 0;
                    answer = 'Введите номер кошелька от Яндекс.деньги\nБез пробелов!\nПример: *410000000000000*'
                }
                else if(msg.text == SYS[1]){
                    system = 1 
                    answer = 'Введите номер кошелька от AdvCash\nБез пробелов!\nПример: *R123412341234*'
                }
                else if(msg.text == SYS[2]){ 
                    system = 2;
                    answer = 'Введите номер кошелька от банковской карты\nБез пробелов!\nПример: *278900000000000*'
                }
                else if(msg.text == SYS[3]){ 
                    system = 3;
                    answer = 'Введите номер кошелька от Perfect Money\nБез пробелов!\nПример: *U12345678*'
                }
                else if(msg.text == SYS[4]){ 
                    system = 4;
                    answer = 'Введите номер кошелька от Payeer\nБез пробелов!\nПример: *P12345678*'
                }

               

                keyboard = bot.keyboard([
                    [CMD[12]]
                ], {resize: true});  

                
                User.findOneAndUpdate({'user_id':msg.from.id}, {'section_id': '4','last_out_system': system},{upsert:true}, function(err, doc){});
                return bot.sendMessage(msg.from.id, answer, {parseMode: 'Markdown', replyMarkup: keyboard});


            }  

        }

        else if(user.section_id == 4){

            create_payout(msg.chat.id, msg.text)
            
            
            User.findOneAndUpdate({'user_id':msg.from.id}, {'section_id': 0,'last_out_sum': 0,'last_out_system': 0},{upsert:true}, function(err, doc){});
            
        }


        // Пополнение счета
        else if(user.section_id == 5){
            let answer = '',
                keyboard = '';
            
            if(msg.text <= 0){
                answer = "Ошибка! Введите корректную сумму, на которую вы хотите пополнить счет."
                keyboard = bot.keyboard([
                    [CMD[12]]
                ], {resize: true});  


                
                User.findOneAndUpdate({'user_id':msg.from.id}, {'section_id': 5},{upsert:true}, function(err, doc){});
                return bot.sendMessage(msg.from.id, answer, {parseMode: 'Markdown', replyMarkup: keyboard});
            }

            else{

            let invoices_id = create_invoice(msg.from.id, msg.text);
            let url = ''

            url = "https://free-kassa.ru/merchant/cash.php/Index.aspx";
            url = '';
            url = '';
            url = '';
            url = '';
            }
        }

        //Калькулятор
        else if(user.section_id == 6){
            let answer = '',
                keyboard = '';


            if(parseFloat(msg.text) < 29){
                answer = 'Минимальная сумма для инвестирования - 30 рублей.\nВведите большую сумму.';
                keyboard = bot.keyboard([
                    [CMD[12]]
                ], {resize: true});  

                return bot.sendMessage(msg.from.id, answer, {parseMode: 'Markdown', replyMarkup: keyboard});
            }

            else if(parseFloat(msg.text) > 25000){
                answer = 'Максимальная сумма для инвестирования - 25000 рублей.\nВведите меньшую сумму.';
                keyboard = bot.keyboard([
                    [CMD[12]]
                ], {resize: true});  

                return bot.sendMessage(msg.from.id, answer, {parseMode: 'Markdown', replyMarkup: keyboard});
            }

            else if(parseFloat(msg.text) >= 30 && parseFloat(msg.text) < 25000){
                let plan = ''
                let pay = ''
                let pay1 = ''
                let pay2 = ''
                let pay3 = ''
                let n = parseFloat(msg.text)
                let percent = '',
                percentH = '',
                percentD = '',
                aerrors = '',
                parcentDays = '';
                let plans = config.settingsHolding;
                let information = '',
                    paymentDeposit = '',
                    dayDeposit = '',
                    msgPaymentDeposit = '',
                    clearPercent = '';
                
                    // План 1
                if(parseFloat(msg.text) >= parseFloat(plans.plan1.fromMoney) && parseFloat(msg.text) <= parseFloat(plans.plan1.toMoney)){

                  
                  information = plans.plan1; // информация о плане 1
                    plan = information.name; //название плана
                    percent = information.percent; // процент в час
                    paymentDeposit = information.paymentDeposit; //// депозит входит в выплатны или нет
                    dayDeposit = information.dayDeposit; // сколько дней работает депозит


                    percentH = percent / 100; // Процент в час
                    percentD = percentH * 24; // Процент в День
                    percentDays = percentD * information.dayDeposit; // проценты за n дня
                  

                    pay = parseFloat(n * percentH).toFixed(2) // заработок в час
                    pay1 = parseFloat(n * (percentD)).toFixed(2) // заработок в день
                    
                    if(paymentDeposit == 0){ // депозит не входит в выплату
                        pay3 = parseFloat(n * percentDays).toFixed(2) // столько денег вернется на баланс
                        pay2 = parseFloat(pay3 - n).toFixed(2) // чистая прибыль
                        msgPaymentDeposit = `Депозит не входит в выплату`;
                    }
                    else if(paymentDeposit == 1){ // Депозит входит в выплату
                        pay3 = parseFloat(n + (n * percentDays)).toFixed(2) // столько денег вернется на баланс
                        pay2 = parseFloat(pay3 - n).toFixed(2) // чистая прибыль
                        
                        msgPaymentDeposit = `Депозит входит в выплату`;
                        
                    }
                    
                    clearPercent = (pay2 * 100) / n;
                    //console.log(n)

                    answer += `*План: ${plan}*\n\n`;
                    answer += `Сумма инвестирования: *${n.toFixed(2)} руб*\n`;
                    answer += `Каждый час вы будете получать: *${pay} руб* (${parseFloat(percent).toFixed(2)}%)\n`;
                    answer += `За 24 ч вы получите: *${pay1} руб* (${(percent * 24).toFixed(2)}%)\n`;
                    answer += `Чистая прибыль за ${information.dayDeposit} дн: *${pay2} руб* (${clearPercent.toFixed(2)}%)\n\n(${msgPaymentDeposit})\n`;
                    answer += `Вернется вам на баланс: *${pay3} руб* (${((pay3 * 100) / n).toFixed(2)}%)\n`;
                    

                   
                }

                // План 2
                else if(parseFloat(msg.text) >= parseFloat(plans.plan2.fromMoney) && parseFloat(msg.text) <= parseFloat(plans.plan2.toMoney)){
                    
                    information = plans.plan2; // информация о плане 1
                    plan = information.name; //название плана
                    percent = information.percent; // процент в час
                    paymentDeposit = information.paymentDeposit; //// депозит входит в выплатны или нет
                    dayDeposit = information.dayDeposit; // сколько дней работает депозит


                    percentH = percent / 100; // Процент в час
                    percentD = percentH * 24; // Процент в День
                    percentDays = percentD * information.dayDeposit; // проценты за n дня
                  

                    pay = parseFloat(n * percentH).toFixed(2) // заработок в час
                    pay1 = parseFloat(n * (percentD)).toFixed(2) // заработок в день
                    
                    if(paymentDeposit == 0){ // депозит не входит в выплату
                        pay3 = parseFloat(n * percentDays).toFixed(2) // столько денег вернется на баланс
                        pay2 = parseFloat(pay3 - n).toFixed(2) // чистая прибыль
                        msgPaymentDeposit = `Депозит не входит в выплату`;
                    }
                    else if(paymentDeposit == 1){ // Депозит входит в выплату
                        pay3 = parseFloat(n + (n * percentDays)).toFixed(2) // столько денег вернется на баланс
                        pay2 = parseFloat(pay3 - n).toFixed(2) // чистая прибыль
                        
                        msgPaymentDeposit = `Депозит входит в выплату`;
                        
                    }
                    
                    clearPercent = (pay2 * 100) / n;
                    //console.log(n)

                    answer += `*План: ${plan}*\n\n`;
                    answer += `Сумма инвестирования: *${n.toFixed(2)} руб*\n`;
                    answer += `Каждый час вы будете получать: *${pay} руб* (${parseFloat(percent).toFixed(2)}%)\n`;
                    answer += `За 24 ч вы получите: *${pay1} руб* (${(percent * 24).toFixed(2)}%)\n`;
                    answer += `Чистая прибыль за ${information.dayDeposit} дн: *${pay2} руб* (${clearPercent.toFixed(2)}%)\n\n(${msgPaymentDeposit})\n`;
                    answer += `Вернется вам на баланс: *${pay3} руб* (${((pay3 * 100) / n).toFixed(2)}%)\n`;
                    

                 
                }

                // План 3
                else if(parseFloat(msg.text) >= parseFloat(plans.plan3.fromMoney) && parseFloat(msg.text) <= parseFloat(plans.plan3.toMoney)){

                    information = plans.plan3; // информация о плане 1
                    plan = information.name; //название плана
                    percent = information.percent; // процент в час
                    paymentDeposit = information.paymentDeposit; //// депозит входит в выплатны или нет
                    dayDeposit = information.dayDeposit; // сколько дней работает депозит


                    percentH = percent / 100; // Процент в час
                    percentD = percentH * 24; // Процент в День
                    percentDays = percentD * information.dayDeposit; // проценты за n дня
                  

                    pay = parseFloat(n * percentH).toFixed(2) // заработок в час
                    pay1 = parseFloat(n * (percentD)).toFixed(2) // заработок в день
                    
                    if(paymentDeposit == 0){ // депозит не входит в выплату
                        pay3 = parseFloat(n * percentDays).toFixed(2) // столько денег вернется на баланс
                        pay2 = parseFloat(pay3 - n).toFixed(2) // чистая прибыль
                        msgPaymentDeposit = `Депозит не входит в выплату`;
                    }
                    else if(paymentDeposit == 1){ // Депозит входит в выплату
                        pay3 = parseFloat(n + (n * percentDays)).toFixed(2) // столько денег вернется на баланс
                        pay2 = parseFloat(pay3 - n).toFixed(2) // чистая прибыль
                        
                        msgPaymentDeposit = `Депозит входит в выплату`;
                        
                    }
                    
                    clearPercent = (pay2 * 100) / n;
                    //console.log(n)

                    answer += `*План: ${plan}*\n\n`;
                    answer += `Сумма инвестирования: *${n.toFixed(2)} руб*\n`;
                    answer += `Каждый час вы будете получать: *${pay} руб* (${parseFloat(percent).toFixed(2)}%)\n`;
                    answer += `За 24 ч вы получите: *${pay1} руб* (${(percent * 24).toFixed(2)}%)\n`;
                    answer += `Чистая прибыль за ${information.dayDeposit} дн: *${pay2} руб* (${clearPercent.toFixed(2)}%)\n\n(${msgPaymentDeposit})\n`;
                    answer += `Вернется вам на баланс: *${pay3} руб* (${((pay3 * 100) / n).toFixed(2)}%)\n`;
                    

                    

                }


                // План 4
                else if(parseFloat(msg.text) >= parseFloat(plans.plan4.fromMoney) && parseFloat(msg.text) <= parseFloat(plans.plan4.toMoney)){

                    information = plans.plan4; // информация о плане 1
                    plan = information.name; //название плана
                    percent = information.percent; // процент в час
                    paymentDeposit = information.paymentDeposit; //// депозит входит в выплатны или нет
                    dayDeposit = information.dayDeposit; // сколько дней работает депозит


                    percentH = percent / 100; // Процент в час
                    percentD = percentH * 24; // Процент в День
                    percentDays = percentD * information.dayDeposit; // проценты за n дня
                  

                    pay = parseFloat(n * percentH).toFixed(2) // заработок в час
                    pay1 = parseFloat(n * (percentD)).toFixed(2) // заработок в день
                    
                    if(paymentDeposit == 0){ // депозит не входит в выплату
                        pay3 = parseFloat(n * percentDays).toFixed(2) // столько денег вернется на баланс
                        pay2 = parseFloat(pay3 - n).toFixed(2) // чистая прибыль
                        msgPaymentDeposit = `Депозит не входит в выплату`;
                    }
                    else if(paymentDeposit == 1){ // Депозит входит в выплату
                        pay3 = parseFloat(n + (n * percentDays)).toFixed(2) // столько денег вернется на баланс
                        pay2 = parseFloat(pay3 - n).toFixed(2) // чистая прибыль
                        
                        msgPaymentDeposit = `Депозит входит в выплату`;
                        
                    }
                    
                    clearPercent = (pay2 * 100) / n;
                    //console.log(n)

                    answer += `*План: ${plan}*\n\n`;
                    answer += `Сумма инвестирования: *${n.toFixed(2)} руб*\n`;
                    answer += `Каждый час вы будете получать: *${pay} руб* (${parseFloat(percent).toFixed(2)}%)\n`;
                    answer += `За 24 ч вы получите: *${pay1} руб* (${(percent * 24).toFixed(2)}%)\n`;
                    answer += `Чистая прибыль за ${information.dayDeposit} дн: *${pay2} руб* (${clearPercent.toFixed(2)}%)\n\n(${msgPaymentDeposit})\n`;
                    answer += `Вернется вам на баланс: *${pay3} руб* (${((pay3 * 100) / n).toFixed(2)}%)\n`;
                    
 
                } 
            } 
            
            //это когда чел ввел не число
            else {
                answer = 'Введите число!';
            }

            keyboard = bot.keyboard([
                [CMD[12]]
            
             ], {resize: true})

            return bot.sendMessage(msg.from.id, answer, {parseMode: 'Markdown', replyMarkup: keyboard});


        } 
        
        // если человек не находитьс не в одном section id и команда не известна
        else {

            answer = `Команда не известна\nВы возвращены на главное меню`;

            let keyboard = bot.keyboard([
                [CMD[1]],
                [CMD[2], CMD[3]],
                [CMD[4], CMD[5]]
            ], {resize: true})


            return bot.sendMessage(msg.chat.id, answer, {parseMode: 'Markdown', replyMarkup: keyboard});
        }


    
    } 
    
   

    
    
    
 
})
bot.start()


/*async function create_invoice(user_id, sum) {

    invoice = await Invoice.create({ 
    user_id: user_id, 
    sum: sum 
    })
    return invoices;
}*/

async function create_deposit(user_id, sum) {
     let Deposits = mongoose.model('deposits', DepositsSchema);
     let plans = config.settingsHolding;
     let answer = ''
     let datas = ''
     let user = await User.findOne({ user_id: user_id });
     let plan = '',
        days = '',
        user_date,
        user_balance = '',
        dayDeposit = '',
        user_new_balance = '',
        d = new Date(),
        date_add = '',
        date_end = ''
    if(parseFloat(sum) >= parseFloat(plans.plan1.fromMoney) && parseFloat(sum) <= parseFloat(plans.plan1.toMoney)) {
        plan = 1;
        days = plans.plan1.dayDeposit;
    }
    else if(parseFloat(sum) >= parseFloat(plans.plan2.fromMoney) && parseFloat(sum) <= parseFloat(plans.plan2.toMoney)) {
        plan = 2;
        days = plans.plan2.dayDeposit;
    }
    else if(parseFloat(sum) >= parseFloat(plans.plan3.fromMoney) && parseFloat(sum) <= parseFloat(plans.plan3.toMoney)) {
        plan = 3;
        days = plans.plan3.dayDeposit;
    }
    else if(parseFloat(sum) >= parseFloat(plans.plan4.fromMoney) && parseFloat(sum) <= parseFloat(plans.plan4.toMoney)) {
        plan = 4;
        days = plans.plan3.dayDeposit;
    }
    
    if(plan == 1){  dayDeposit = plans.plan1.dayDeposit;}
     else if(plan == 2) {dayDeposit = plans.plan2.dayDeposit;}
     else if(plan == 3) {dayDeposit = plans.plan3.dayDeposit;}
     else if(plan == 4) {dayDeposit = plans.plan4.dayDeposit;}


     let unix = Math.floor(d.getTime()/1000);

     let  data_end = await unix + (dayDeposit * 86400)
 
     user_new_balance = user.balance - sum


     let keyboard =''
     let deposits = await Deposits.find({})

        countDeposits = deposits.length
        let id = countDeposits + 1

        let response = '';
        deposits = await new Deposits({
            id: id,
            user_id: user_id,
            start_sum: sum.toFixed(2),
            status: 0,
            now_sum: 0,
            plan: plan,
            date_add: unix,
            date_end: data_end,
        })
        
        deposits.save().then(async function(res){
             if(res){
            datas = res;
        
            //console.log('datas',datas.id)
            //console.log('err',err)
            await User.findOneAndUpdate({'user_id':user_id}, {'balance': user_new_balance});
           
            
            let plan1 = ''

      
            answer = "🔘 Вклад успешно создан\n";
                 if(datas['plan'] == 1) plan1 = plans.plan1.name;
               	     else if(datas['plan'] == 2) plan1 = plans.plan2.name;
               	     else if(datas['plan'] == 3) plan1 = plans.plan3.name;
               	     else if(datas['plan'] == 4) plan1 = plans.plan4.name;

                date_add = transformationUnix(datas.date_add)
                date_end = transformationUnix(datas.date_end)

                 answer += `План: *${plan1}*\n`;
                 answer += `Депозит: *${datas.start_sum}*\n`;
                 answer += `Вклад сделан: *${date_add.day}.${date_add.month}.${date_add.year}*, в *${date_add.hours}:${date_add.minutes}*\n`
                 answer += `Вклад будет закрыт: *${date_end.day}.${date_end.month}.${date_end.year}*, в *${date_end.hours}:${date_end.minutes}*\n`
                 answer += `ID вклада: *${datas.id}*\n`
                  keyboard = bot.keyboard([
                    [CMD[1]],
                    [CMD[2], CMD[3]],
                    [CMD[4], CMD[5]]
                ], {resize: true})

            }

            // если бд не сохранила
            else {

            }

                
            return bot.sendMessage(user_id, answer, {parseMode: 'Markdown', replyMarkup: keyboard} );

        });


        


}

function transformationUnix(unix){
    let d, year, month, day, hours, minutes;
    d = new Date((unix * 1000));
    
    year = d.getFullYear();
    month = d.getMonth();
    day = d.getDate();
    hours = d.getHours();
    minutes = d.getMinutes();

    if(minutes < 10) minutes = '0' + minutes;
    if(month < 10) month = '0' + month;
    if(day < 10) day = '0' + day;
    if(hours < 10) hours = '0' + hours;

    return {
        year: year,
        month: month ,
        day: day,
        hours: hours,
        minutes: minutes
    };
 }

 async function create_payout(user_id, num) {
    let user = await User.findOne({ user_id: user_id }); 
    let Payouts = mongoose.model('payouts', PayoutsSchema);
    let answer = '',
        keyboard = ''

    let payouts = await Payouts.find({})

        let countPayouts = payouts.length
        let id = countPayouts + 1



    await User.findOneAndUpdate({'user_id':user_id}, {'balance': `${user.balance - user.last_out_sum.toFixed(2)}`});
    

    let payouts1 = await new Payouts({
        id: id,
        user_id: user_id,
        sum: user.last_out_sum.toFixed(2),
        system: user.last_out_system.toFixed(2),
        num: num,
        status: 0,
        
    })

    payouts1.save().then(function(res){
         if(res){

            answer += `Заявка на вывод успешно создана\n\n`;
            answer += `ID заявки: *${res.id}*\n`;
            answer += `Сумма выплаты: *${res.sum}*\n`;
            answer += `Система: *${SYS[res.system]}*\n`;
            answer += `Номер счета: *${res.num}*\n`;

           keyboard = bot.keyboard([
            [CMD[1]],
            [CMD[2], CMD[3]],
            [CMD[4], CMD[5]]
           ], {resize: true})

          //console.log(res)

        }

        return bot.sendMessage(user_id, answer, {parseMode: 'Markdown', replyMarkup: keyboard} );
        
    });
 

    

}