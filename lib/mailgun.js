/*
*   Dependencies
*/
const config = require('./config')
const mailgun = require("mailgun-js")({apiKey: config.MAILGUN_API_KEY, domain: config.MAILGUN_DOMAIN})

//  Container for all methods
const mail = {}
mail.send = (to, msg, callback)=>{
    if(to.indexOf('"')!=-1 && to.lastIndexOf('"')!=-1){
        to = to.replace(/"/g, '') // remove double quotes from stripe payload
    }
    // Using mailgun billing template
    const data = {
        "from": `uptime-monitoring-tool <${config.MAILGUN_EMAIL}>`,
        "to": to,
        "subject": 'Stripe Payment',
        "template": 'payment_received',
        'v:appName': config.appName,
        'v:totalBilled': msg.totalBilled,
        'v:customer': msg.customer,
        'v:transactionDate': msg.transactionDate,
        'v:purchasedProducts': msg.purchasedProducts,
        'v:companyAddress': msg.companyAddress,
        'v:customerSupportURL': msg.customerSupportURL
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