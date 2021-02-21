/*
 *  Helpers for various tasks: @hash_password, @parseJsonToObject, @createRandomString
 *
 */

//  Dependencies
const crypto = require('crypto')
const config = require('./config')
const https = require('https')
const querystring = require('querystring')

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

//  Export the module
module.exports = helpers
