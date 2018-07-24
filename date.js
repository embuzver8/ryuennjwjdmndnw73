function time(){
    var d = new Date((1532028043000));
    var f = d.getFullYear();
    var m = d.getMonth()
    var day = d.getDay()
    var hours = d.getHours();
    var mins = d.getMinutes();
    var secs = d.getSeconds();
    var unix = Math.floor(d.getTime()/1000);
    var dd = d.getTime()
    
  
    console.log(`Год:  ${f}, Месяц: ${m}, День: ${day}, Часов: ${hours}, Минут: ${mins}, Секунд: ${secs}`);

   
  }
  setInterval(time, 1000);
