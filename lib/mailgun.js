/*
*   Dependencies
*/
const config = require('./config')
const mailgun = require("mailgun-js")({apiKey: config.MAILGUN_API_KEY, domain: config.MAILGUN_DOMAIN})

//  Container for all methods
const mail = {}
mail.send = (to, msg, callback)=>{
    const data = {
        from: `uptime-monitoring-tool <${config.MAILGUN_EMAIL}>`,
        to: to,
        subject: 'Stripe Payment',
        text: msg
    }
    mailgun.messages().send(data, (err, body)=>{
        if(!err && body){
            callback(false, body);
        }else{
            callback(err, false)
        }
    })
}

module.exports = mail