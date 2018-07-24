const config = require('./config');
const TeleBot = require('telebot');
const bot = new TeleBot(config.settingsBot.botToken);
const mongoose = require('mongoose');
mongoose.connect(config.settingsBot.mongoUrl);
const Schema = mongoose.Schema;
const Schems = config.schems;

const UserSchema = new Schema(Schems.user);
const User = mongoose.model('users', UserSchema);

const DepositsSchema = new Schema(Schems.deposits);
const Deposits = mongoose.model('deposits', DepositsSchema);

const StatisticsSchema = new Schema(Schems.statistics);
const Statistics = mongoose.model('statistics', StatisticsSchema);

const InvoicesSchema = new Schema(Schems.invoices);
const Invoices = mongoose.model('invoices', InvoicesSchema);

const PayoutsSchema = new Schema(Schems.payoutss);
const Payouts = mongoose.model('payouts', PayoutsSchema);





bot.on('*', async function(msg) {
    var message = msg.text,
        user_id = msg.from.id,
        username = msg.from.username,
        first_name = msg.from.first_name,
        last_name = msg.from.last_name

    // проверим, есть ли пользователь в базе
    let user = await User.findOne({ user_id: msg.from.id });
 
    var d = new Date();
    var unix = Math.floor(d.getTime()/1000);
    User.findOneAndUpdate({'user_id':msg.from.id}, {'date_activity': unix},{upsert:true}, function(err, doc){});//записываем рефера

    //console.log('user', user)
console.log(user)
if (!user) {
    // пришел новый пользователь, создаем его
     user = await User.create({ 
         user_id: chat_id, 
         username: username, 
        })
     } 


  // return bot.sendMessage(msg.from.id, `Ваш баланс : ${user.balance} руб`)
 //console.log(msg);
    let param = await msg.text.split(' ');
 
    
    if(param[0] == '/start'){
     let answer
        
        if(param[1]){
            //let isUser = await User.findOne({ id: msg.from.id });
            if(!user.ref_id){
            //  если нету рефера в бд и пользователь прешел по реф ссылке, то записать рефера в бд
            User.findOneAndUpdate({'id':msg.from.id}, {'ref_id':param[1]},{upsert:true}, function(err, doc){});//записываем рефера
            console.log(param + ' записали ид')
            answer = 'вы успешно зарегистрировались по реф ссылке'
            }else {
                answer = 'вы уже были зарегистрированы'
            }
        

        } else {
            answer = 'Добро пожаловать в бота для инвестирования денег под проценты'
            
        
            //console.log(param + ' нету рефера')
        }
        //let answer = 'Здарова' + user.dir['menu'].sections;
    
     return bot.sendMessage(msg.from.id, answer, {parseMode: 'Markdown', replyMarkup: RM_default});
    }

switch(msg.text){
    case '☁ FAQ':{
     let answer = 'Тут FAQ' + ' Твой username: ' + username + '';
      return bot.sendMessage(msg.from.id, message, {parseMode: 'Markdown', replyMarkup: RM_default});
    break;}
     
    case '💵 Баланс':{
      
       let message = '*Ваш баланс:* ' + String(user.balance) + ' руб';
      
      return bot.sendMessage(msg.from.id, message, {parseMode: 'Markdown', replyMarkup: RM_ballance});
    break;}
     
     
    case '⬅ Главное меню':{
        let message = 'Вы в главном меню';
      return bot.sendMessage(msg.from.id, message, {parseMode: 'Markdown', replyMarkup: RM_default});
    break;}

   
    case '🔰 Партнерка':{
        let message = `*Вы привели:* 0 рефералов\n*Сумма пополнений ваших рефералов:* 0 рублей\n\n*Ваша реферальная ссылка:* https://t.me/toorboiinvest_bot?start=1\n\nИли [Ссылка](https://t.me/toorboiinvest_bot?start=1)\n\nОт пополнений ваших рефералов вы будете получать *10 процентов суммы*.`;
        return bot.sendMessage(msg.from.id, message, {parseMode: 'Markdown', replyMarkup: RM_default})
    break;}
  
     
    case '📊 Статистика':{

        
        let statistics = await Statistics.findOne({ id: 1 });
        let message = `*Всего пользователей:* ${statistics.count_user} \n*Новых за 24 часа:* ${statistics.count_user_day}\n*Инвестировано:* ${statistics.invest} рублей\n*Выплачено:* ${statistics.payout} рублей\n`;
      return bot.sendMessage(msg.from.id, message, {parseMode: 'Markdown', replyMarkup: RM_default});
    break;}
  

    case '💳 Вклады':{
     let message = 'Активные вклады:\n🔘 Вклад по тарифу *Start*:\n*Депозит:* 100.00 руб\n*Накопившаяся сумма:* 110.00 руб\nВклад сделан сегодня в 11:12\nВклад будет закрыт завтра в 11:12\n';
      return bot.sendMessage(msg.from.id, message, {parseMode: 'Markdown', replyMarkup: RM_holding});
    break;}
  
    case '📆 Мои выплаты':{
     let message = 'Последние 3 выплаты:\n\n*1.* 12.06.2018\n*Сумма:* 32.50\n*Статус выплаты:* в процессе\n';
      return bot.sendMessage(msg.from.id, message, {parseMode: 'Markdown', replyMarkup: RM_ballance});
    break;}

    default:{
        let message = 'Такой команды нет!\nВы возвращены на главное меню' + user.dir
         
         let str = user.dir;
         
         //console.log(user.dir);


   
        return bot.sendMessage(msg.from.id, message, {parseMode: 'Markdown', replyMarkup: RM_default});
        break;
    }
}
});




bot.start();

const RM_default = bot.keyboard([
    ['🎲 Играть'],
    ['📜 Правила', '💵 Баланс'],
    ['☁ FAQ', '📊 Статистика']
], {resize: true});

const RM_ballance = bot.keyboard([
    ['💸 Пополнить баланс'],
    ['📤 Заказать выплату'],
    ['📆 Мои выплаты'],
    ['⬅ Главное меню']
], {resize: true});