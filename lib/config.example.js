/*
 * Create and export configurtion variables
 */

 // Container for all the environments
 let environments = {}

 // Staging (default) environment
 environments.staging = {
   appName:'cheap eats',
   companyAddress: 'Riruta, Kikuyu Road - Nairobi, Kenya.',
   customerSupportURL: 'cheapeats@support.co.ke',
   httpPort:3000,
   httpsPort:3001,
   envName:'staging',
   hashingSecret:'<some hashing secret>',
   STRIPE_SECRET_KEY:'<sk_test_...>',
   MAILGUN_API_KEY:'<api-key>',
   MAILGUN_DOMAIN:'<sandbox-------mailgun.org>',
   MAILGUN_EMAIL:'<postmaster@sandbox-------.mailgun.org>',
   templateGlobals:{
     appName : 'pizzaOnCall',
     companyName : 'cheap eats, Inc',
     yearCreated : '2021',
     baseUrl : 'http://localhost:3000'
   }
 }

 //Production environment
 environments.production = {
   appName:'cheap eats',
   companyAddress: 'Riruta, Kikuyu Road - Nairobi, Kenya.',
   customerSupportURL: 'cheapeats@support.co.ke',
   httpPort:5000,
   httpsPort:5001,
   envName:'production',
   hashingSecret:'<some hashing secret>',
   STRIPE_SECRET_KEY:'<sk_test_...>',
   MAILGUN_API_KEY:'<api-key>',
   MAILGUN_DOMAIN:'<sandbox-------mailgun.org>',
   MAILGUN_EMAIL:'<postmaster@sandbox-------.mailgun.org>',
   templateGlobals:{
     appName : 'pizzaOnCall',
     companyName : 'cheap eats, Inc',
     yearCreated : '2021',
     baseUrl : 'http://localhost:5000'
   }
 }

 // Determine which environment was passed as a command-line argument
 let currentEnvironment = typeof process.env.NODE_ENV == 'string' ? process.env.NODE_ENV.toLowerCase():''

// Check that the current environment is one of the environments above, if not default to staging
let environmentToExport = typeof environments[currentEnvironment] == 'object' ? environments[currentEnvironment] : environments.staging

//  Export the module
module.exports  = environmentToExport
