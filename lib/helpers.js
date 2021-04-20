/*
 *  Helpers for various tasks: @hash_password, @parseJsonToObject, @createRandomString
 *
 */

//  Dependencies
const crypto = require('crypto')
const config = require('./config')
const https = require('https')
const querystring = require('querystring')
const path = require('path')
const fs = require('fs')

//  Container for all the helpers
let helpers = {}

//  @hash_password: Create a SHA256 hash
helpers.hash = (str)=>{
  if(typeof str == 'string' && str.length > 0){
    let hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex')
    return hash
  }else{
    return false
  }
}

//  @parseJsonToObject: Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = (str)=>{
  try{
    const obj = JSON.parse(str)
    return obj
  }catch(e){
    return {}
  }
}

//  @createRandomString: Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = (strLength)=>{
  strLength = typeof strLength == 'number' && strLength > 0 ? strLength : false
  if(strLength){
    //  Define all the possible characters that could go into a string
    const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789'

    //  Start the final string
    let str = ''
    for(i=1; i<=strLength; i++){
      //  Get a random character from the possibleCharacters string
      let randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length))
      //  Append this character to the final string
      str += randomCharacter
    }

    //  Return the final string
    return str
  }else{
    return false
  }
}

//  @stripeErrorHandling: Gracefully handle stripe errors
helpers.stripeErrors = (err)=>{
  let msg;
  switch (err.type) {
    case 'StripeCardError':
      // A declined card error
      err.msg = `Your card's expiration year is invalid.`; 
      break;
    case 'StripeRateLimitError':
      err.msg = `Too many requests made to the API too quickly`; 
      break;
    case 'StripeInvalidRequestError':
      err.msg = `Invalid parameters were supplied to Stripe's API`; 
      break;
    case 'StripeAPIError':
      err.msg =`An error occurred internally with Stripe's API`; 
      break;
    case 'StripeConnectionError':
      err.msg = `Some kind of error occurred during the HTTPS communication`; 
      break;
    case 'StripeAuthenticationError':
      err.msg = `You probably used an incorrect API key`; 
      break;
    default:
      err.msg = `unexpected error occurred`; 
      break;
  }
  return err.msg;
}

//  Get the string content of a template
helpers.getTemplate = (templateName, data, callback)=>{
  templateName = typeof templateName == 'string' && templateName.length > 0 ? templateName : false
  data = typeof data == 'object' && data !== null ? data : {}
  if(templateName){
    let templatesDir = path.join(__dirname, '/../templates/')
    fs.readFile(`${templatesDir}${templateName}.html`, 'utf8', (err, str)=>{
      if(!err && str && str.length > 0){
        //  Do interpolation on the string
        let finalString = helpers.interpolate(str, data)
        callback(false, finalString)
      }else{
        callback('No template could be found')
      }
    })
  }else{
    callback('A valid template name was not specified')
  }
}


//  Add the universal header and footer to a string, and pass provided data object to the header and footer
helpers.addUniversalTemplates = (str, data, callback)=>{
  str = typeof str == 'string' && str.length > 0 ? str : ''
  data = typeof data == 'object' && data !== null ? data : {}
  //  Get the header
  helpers.getTemplate('_header', data, (err, headerString)=>{
    if(!err && headerString){
      //  Get the footer
      helpers.getTemplate('_footer', data, (err, footerString)=>{
        if(!err && footerString){
          //  Add them altogether
          let fullString = headerString + str + footerString
          callback(false, fullString)
        }else{
          callback('Could not find the footer template')
        }
      })
    }else{
      callback('Could not find the header template')
    }
  })
}

//  Take a given string and a data object, find/replace all the keys within it
helpers.interpolate = (str, data)=>{
  str = typeof str == 'string' && str.length > 0 ? str : ''
  data = typeof data == 'object' && data !== null ? data : {}
  //  Add the templateGlobals to the data obect, prepending their key name with `global` 
  for(let keyName in config.templateGlobals){
    if(config.templateGlobals.hasOwnProperty(keyName)){
      data[`global.${keyName}`] = config.templateGlobals[keyName]
    }
  }

  //  For each key in the data object, insert its value into the string at the corresponding placeholder
  for(var key in data){
    if(data.hasOwnProperty(key) && typeof data[key] == 'string'){
      let replace = data[key]
      let find = `{${key}}`
      str = str.replace(find, replace)
    }
  }

  return str
}

// Get the contents of a static (public) asset
helpers.getStaticAsset = (fileName,callback)=>{
  fileName = typeof fileName == 'string' && fileName.length > 0 ? fileName : false
  if(fileName){
    var publicDir = path.join(__dirname,'/../public/')
    fs.readFile(publicDir+fileName, (err, data)=>{
      if(!err && data){
        callback(false, data)
      } else {
        callback('No file could be found')
      }
    })
  } else {
    callback('A valid file name was not specified')
  }
}

//  Export the module
module.exports = helpers
