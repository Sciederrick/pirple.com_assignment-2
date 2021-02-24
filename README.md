# Client use guidelines
## Creating a new user
### POST    
``` localhost:3000/users ```

#### Body
``` javascript
{
 "firstName" : "Derrick",
 "lastName" : "Mbarani",
 "email" : "derrickmbarani@gmail.com",
 "streetAddress" : "kikuyu road",
 "password" : "myPassword"
}
```

## Creating a new token

### POST

```localhost:3000/tokens```

```javascript
{
    "email" : "derrickmbarani@gmail.com",
    "password" : "myPassword"       
}
```

## Update user

### PUT

```localhost:3000/users```

**Request Headers** (token)

```javascript
{
    "email" : "derrickmbarani@gmail.com",
    "password" : "myPassword"
}
```



## Get user

### GET

```localhost:3000/users?email=derrickmbarani@gmail.com```

**Request Headers (token)**

**Request Params (email)**

## Delete user

### DEL

```localhost:3000/users?email=derrickmbarani@gmail.com```

**Request Headers (token)**

**Request Params (email)**

## Extend token

### PUT

```localhost:3000/tokens```

```javascript
{
	"id" : "token-id",
    "extend" : true
}
```

## Get token information

### GET

```localhost:3000/tokens?id=token-id```

**Request Params (id)**

```javascript
{
    "id" : "token-id",
    "extend" : true
}
```



## Delete token

### DEL

```localhost:3000/tokens?id=token-id```

**Request Params (id)**

## Get the menu

### GET

```localhost:3000/menu?email=derrickmbarani@gmail.com&category=special```

**Request Headers (token)**

**Request Params (email, category)**

Required data: email

Optional: id, category, name

## Create a new menu item

### POST

```localhost:3000/menu?email="derrickmbarani@gmail.com"```

**Request Headers (token)**

```javascript
{
    "email" : "derrickmbarani@gmail.com",
    "name" : "Pizzette Capresse",
    "price" : "15",
    "category" : "pizza"
}
```

 Required data: email, name, price, category

Optional data: image

## Update a menu item

### PUT

```localhost:3000/menu?email=derrickmbarani@gmail.com```

**Request Headers (token)**

```javascript
{
    "email" : "derrickmbarani@gmail.com",
    "id" : "product-id",
    "price" : "30"
}
```

Required data: email, at least one of optional data

Optional data: name, category, price, image

## Delete a menu item

### DEL

```localhost:3000/menu?email=derrickmbarani@gmail.com&id=product-id```

**Request Headers (token)**

**Request Params (email, id)**

## View Cart

### GET

```localhost:3000/cart
localhost:3000/cart?email=derrickmbarani@gmail.com
```

**Request Headers (token)**

**Request Params (email)**

## Empty or remove items from cart

### DEL

```localhost:3000/cart?email=derrickmbarani@gmail.com```

**Request Headers (token)**

**Request Params (email, id)**

Required data: email

Optional data: id

## Add items to cart

### POST

```localhost:3000/cart?email=derrickmbarani@gmail.com```

**Request Headers (token)**

**Request Params (email)**

```javascript
{
    "productId" : "product-id",
    "quantity" : "10"
}
```



## Update cart items

### PUT

```localhost:3000/cart?email=derrickmbarani@gmail.com```

**Request Headers (token)**

**Request Params (email)**

```javascript
{
	"id" : "product-id",
    "quantity": "2"
}
```



## Checkout

### POST

```localhost:3000/checkout?email=derrickmbarani@gmail.com```

**Request Headers (token)**

```javascript
{
	"email" : "derrickmbarani@gmail.com"
}
```



## Checkout success url

### GET

```localhost:3000/success?id="session-id"&email="derrickmbarani@gmail.com"```

**Request Params (id, email)**



## Configuration Variables

### Config.js

```javascript
/*
 * Create and export configurtion variables
 */

 // Container for all the environments
 let environments = {}

 // Staging (default) environment
 environments.staging = {
   httpPort:3000,
   httpsPort:3001,
   envName:'staging',
   hashingSecret:'<hashing secret>',
   STRIPE_SECRET_KEY:'<stripe-secret>',
   MAILGUN_API_KEY:'<api-key>',
   MAILGUN_DOMAIN:'<sandbox.......mailgun.org>',
   MAILGUN_EMAIL:'<postmaster@sandbox......mailgun.org>'
 }

 //Production environment
 environments.production = {
   httpPort:5000,
   httpsPort:5001,
   envName:'production',
   hashingSecret:'<stripe-secret>',
   STRIPE_SECRET_KEY:'<stripe-secret>',
   MAILGUN_API_KEY:'<api-key>',
   MAILGUN_DOMAIN:'<sandbox.......mailgun.org>',
   MAILGUN_EMAIL:'<postmaster@sandbox......mailgun.org>'
 }

 // Determine which environment was passed as a command-line argument
 let currentEnvironment = typeof process.env.NODE_ENV == 'string' ? process.env.NODE_ENV.toLowerCase():''

// Check that the current environment is one of the environments above, if not default to staging
let environmentToExport = typeof environments[currentEnvironment] == 'object' ? environments[currentEnvironment] : environments.staging

//  Export the module
module.exports  = environmentToExport
```

