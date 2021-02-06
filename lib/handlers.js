/*
 *  Request handlers : @users, @tokens, @ping, @not_found
 *
 */

//  Dependencies
const _data = require('./data')
const helpers = require('./helpers')
const config = require('./config')
const { list } = require('./data')
//  Define the handlers
let handlers = {}

//  @users
handlers.users = (data, callback)=>{
  const acceptableMethods = ['post', 'get', 'put', 'delete']
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._users[data.method](data, callback)
  }else{
    callback(405)
  }
}

//  Container for the users submethods
handlers._users = {}

//  @users - post
//  Required data: firstName, lastName, email, street Address, password
//  Optional data: none
handlers._users.post = (data, callback)=>{
  //  Check that all required fields are filled out
  const firstName = typeof data.payload.firstName == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false
  const lastName = typeof data.payload.lastName == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false
  const email = typeof data.payload.email == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false  
  const streetAddress = typeof data.payload.streetAddress == 'string' && data.payload.streetAddress.trim().length > 0 ? data.payload.streetAddress.trim() : false
  const password = typeof data.payload.password == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false

  if(firstName && lastName && email && streetAddress && password){
    //  Make sure that the user doesn't already exist
    _data.read('users', email, (err, data)=>{
      if(err){
        //  Hash the password
        const hashedPassword = helpers.hash(password)

        //  Create the user object
        if(hashedPassword){
          const userObject = {
            firstName:firstName,
            lastName:lastName,
            email:email,
            streetAddress:streetAddress,
            hashedPassword:hashedPassword
          }

          //  Store the user
          _data.create('users', email, userObject, (err)=>{
            if(!err){
              callback(200)
            }else{
              callback(500,{'Error':'Could not create the new user'})
            }
          })
        }else{
          callback(500,{'Error':`Could not hash the users password`})
        }
      }else{
        //  User already exists
        callback(400,{'Error':'A user with that email address already exists'})
      }
    })
  }else{
    callback(400, {'Error':'Missing required fields'})
  }

}

//  @users - get
//  Required data: email
//  Optional data: none
handlers._users.get = (data, callback)=>{
  //  Check that the email address provided is valid
  const email = typeof data.queryStringObject.email == 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false

  if(email){
    //  Get the token from the headers
    const token = typeof data.headers.token == 'string' ? data.headers.token :false
    //  verify that the given token is valid for the email address
    handlers._tokens.verifyToken(token, email, (tokenIsValid)=>{
      if(tokenIsValid){
        //  Look up the user
        _data.read('users', email, (err, data)=>{
          if(!err && data){
            //  Remove the hashed password from the user object before returning it to the requester
            delete data.hashedPassword
            callback(200, data)
          }else{
            callback(404)
          }
        })
      }else{
        callback(403, {'Error':'Missing required token in header, or token is invalid'})
      }
    })

  }else{
    callback(400, {'Error':'Missing required field'})
  }
}

//  @users - put
//  Required data : email
//  Optional data : firstName, lastName, password (at least one must be specified)
handlers._users.put = (data, callback)=>{
  //  Check for the required field
    const email = typeof data.payload.email == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : faname
    //  Check for the optional fields
    const firstName = typeof data.payload.firstName == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false
    const lastName = typeof data.payload.lastName == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false
    const password = typeof data.payload.password == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false

    //  Error if the email is invalid
    if(email){
      //  Error if nothing is sent to update
      if(firstName || lastName || password){
        //  Get the token from the headers
        const token = typeof data.headers.token == 'string' ? data.headers.token :false
        //  verify that the given token is valid for the email address
        handlers._tokens.verifyToken(token, email, (tokenIsValid)=>{
          if(tokenIsValid){
            //  Look up the user
            _data.read('users', email, (err, userData)=>{
              if(!err && userData){
                //  Update the fields necessary
                if(firstName){
                  userData.firstName = firstName
                }
                if(lastName){
                  userData.lastName = lastName
                }
                if(password){
                  userData.hashedPassword = helpers.hash(password)
                }
                //  Store the new updates
                _data.update('users', email, userData, (err)=>{
                  if(!err){
                    callback(200)
                  }else{
                    callback(500,{'Error':'Could not update the user'})
                  }
                })
              }else{
                callback(400, {'Error':'The specified user does not exist'})
              }
            })
          }else{
            callback(403,{'Error':'Missing required token in header, or token is invalid'})
          }
        })

      }else{
        callback(400,{'Error':'Missing fields to update'})
      }
    }else{
      callback(400,{'Error':'Missing required fields'})
    }
}

//  @users - delete
//  Required field : email
handlers._users.delete = (data, callback)=>{
  //  Check that the email provided is valid
  const email = typeof data.queryStringObject.email == 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false

  if(email){
    //  Get the token from the headers
    const token = typeof data.headers.token == 'string' ? data.headers.token :false
    //  verify that the given token is valid for the email address
    handlers._tokens.verifyToken(token, email, (tokenIsValid)=>{
      if(tokenIsValid){
        //  Look up the user
        _data.read('users', email, (err, userData)=>{
          if(!err && data){
            _data.delete('users', email, (err)=>{
              if(!err){
                //  Delete each of the checks associated with the user
                const userChecks = typeof userData.checks == 'object' && userData.checks instanceof Array ? userData.checks : []
                const checksToDelete = userChecks.length
                if(checksToDelete > 0){
                  let checksDeleted = 0
                  let deletionErrors = false
                  //  Loop through the checks
                  userChecks.forEach((checkId)=>{
                    //  Delete the check
                    _data.delete('checks', checkId, (err)=>{
                      if(err){
                        deletionErrors = true
                      }
                      checksDeleted++
                      if(checksDeleted == checksToDelete){
                        if(!deletionErrors){
                          callback(200)
                        }else{
                          callback(500, {'Error' : 'Errors encountered while attempting to delete all of the user\'s checks, all checks may not have been deleted from the system successfully'})
                        }
                      }
                    })
                  })
                }else{
                  callback(200)
                }
              }else{
                callback(500,{'Error':'Could not delete the specified user'})
              }
            })
          }else{
            callback(400,{'Error':'Could not find the specified user'})
          }
        })
      }else{
        callback(403,{'Error':'Missing required token in header, or token is invalid'})
      }
    })

  }else{
    callback(400, {'Error':'Missing required field'})
  }
}

//  @menu
handlers.menu = (data, callback)=>{
  const acceptableMethods = ['get', 'post', 'put', 'delete']
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._menu[data.method](data, callback)
  }else{
    callback(405)
  }
}

//  Container for all menu methods
handlers._menu = {}

//  @menu - post
//  Required data: name, price, category
//  Optional data: image
handlers._menu.post = (data, callback)=>{
  const name = typeof data.payload.name == 'string' && data.payload.name.trim().length > 0 ? data.payload.name.trim() : false
  const price = typeof data.payload.price == 'string' && data.payload.price.trim().length > 0 ? data.payload.price.trim() : false
  const category = typeof data.payload.category == 'string' && data.payload.category.trim().length > 0 ? data.payload.category.trim() : false
  const image = typeof data.payload.image == 'string' && data.payload.image.trim().length > 0 ? data.payload.image.trim() : false
  const email = typeof data.queryStringObject.email == 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false
  //  Get the token from the headers
  const token = typeof data.headers.token == 'string' ? data.headers.token :false
  //  verify that the given token is valid for the email address
  if(email){
    handlers._tokens.verifyToken(token, email, (tokenIsValid)=>{
      if(tokenIsValid){
        if(name, price, category){
          const data = {
            id:helpers.createRandomString(12),
            name:name,
            price:price,
            category:category,
            image:image||''
          }
          _data.create('menu', data.id, data, (err)=>{
            if(!err){
              callback(200)
            }else{
              callback(500, {'Error':'Creating menu item failed'})
            }
          })
        }else{
          callback(400, {'Error':'Missing required field(s)'})
        }
      }else{
        callback(403, {'Error':'Missing required token in header, or token is invalid'})
      }
    })
  }else{
    callback(403, {'Error':'Missing email address'})
  }
}

//  @menu - get
//  Required data: none
//  Optional data: id, category, name

handlers._menu.get = (data, callback)=>{
  const id = typeof data.queryStringObject.id == 'string' && data.queryStringObject.id.trim().length > 0 ? data.queryStringObject.id.trim() : false
  const category = typeof data.queryStringObject.category == 'string' && data.queryStringObject.category.trim().length > 0 ? data.queryStringObject.category.trim() : false
  const name = typeof data.queryStringObject.name == 'string' && data.queryStringObject.name.trim().length > 0 ? data.queryStringObject.name.trim() : false
  const email = typeof data.queryStringObject.email == 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false
  //  Get the token from the headers
  const token = typeof data.headers.token == 'string' ? data.headers.token : false
  //  verify that the given token is valid for the email address
  if(email){
    handlers._tokens.verifyToken(token, email, (tokenIsValid)=>{
      if(tokenIsValid){
        let menuList = []
        _data.list('menu', (err, data)=>{
          const dataLength = data.length;
          if(!err){            
            if(data.length > 0){
              data.forEach((el, index)=>{
                _data.read('menu', el, (err, data)=>{
                  if(!err){
                    menuList.push(data)
                    if(dataLength == index + 1){    
                      if(name){
                        menuList = menuList.filter(el=>{
                          return el.name == name
                        })
                        callback(200, menuList)
                      }else if(category){
                        menuList = menuList.filter(el=>{
                          return el.category == category
                        })
                        callback(200, menuList)
                      }else if(id){
                        menuList = menuList.filter(el=>{
                          return el.id == id
                        })
                        callback(200, menuList)
                      }else{
                        callback(200, menuList)
                      }
                    }
                  }else{
                    callback(500, {'Error':'Error reading the menu'})
                  }
                })
              })
            }else{
              callback(200, {'Info':'Sorry, our menu is empty, try again later'})
            }
          }else{
            callback(500, {'Error':'Error listing the menu'})
          }
        })
      }else{
        callback(403, {'Error':'Missing required token in header, or token is invalid'})
      }
    })
  }else{
    callback(403, {'Error':'Missing email address'})
  }
}

//  @menu - put
//  Required data: id, at least one of optional data
//  Optional data: name, category, price, image
handlers._menu.put = (data, callback)=>{
  const id = typeof data.payload.id == 'string' && data.payload.id.trim().length > 0 ? data.payload.id.trim() : false
  const name = typeof data.payload.name == 'string' && data.payload.name.trim().length > 0 ? data.payload.name.trim() : false
  const category = typeof data.payload.category == 'string' && data.payload.category.trim().length > 0 ? data.payload.category.trim() : false
  const price = typeof data.payload.price == 'string' && data.payload.price.trim().length > 0 ? data.payload.price.trim() : false
  const image = typeof data.payload.image == 'string' && data.payload.image.trim().length > 0 ? data.payload.image.trim() : false
  const email = typeof data.queryStringObject.email == 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false
  
  //  Get the token from the headers
  const token = typeof data.headers.token == 'string' ? data.headers.token : false
  //  verify that the given token is valid for the email address
  if(email && id){
    handlers._tokens.verifyToken(token, email, (tokenIsValid)=>{
      if(tokenIsValid){
        _data.list('menu', (err, data)=>{
          if(!err){
            if(data.indexOf(id) > -1){              
              _data.read('menu', id, (err, data)=>{
                if(!err){
                  if(name){
                    data.name = name
                    _data.update('menu', id, data, (err)=>{
                      if(!err){
                        callback(200)
                      }else{
                        callback(500, {'Error':'Failed updating file'})
                      }
                    })
                  }else if(category){
                    data.category = category
                    _data.update('menu', id, data, (err)=>{
                      if(!err){
                        callback(200)
                      }else{
                        callback(500, {'Error':'Failed updating file'})
                      }
                    })
                  }else if(price){
                    data.price = price
                    _data.update('menu', id, data, (err)=>{
                      if(!err){
                        callback(200)
                      }else{
                        callback(500, {'Error':'Failed updating file'})
                      }
                    })
                  }else if(image){
                    data.image = image
                    _data.update('menu', id, data, (err)=>{
                      if(!err){
                        callback(200)
                      }else{
                        callback(500, {'Error':'Failed updating file'})
                      }
                    })
                  }else{
                    callback(400, {'Error':'Missing field, at least one filed required'})
                  }
                }else{
                  callback(500, {'Error':'Error reading file'})
                }
              })
            }else{
              callback(404, {'Error':`menu item with the id of ${id} not found`})
            }
          }else{
            callback(500, {'Error':'Error listing files'})
          }        
        })
        
      }else{
        callback(403, {'Error':'Missing required token in header, or token is invalid'})
      }
    })
  }else{
    callback(403, {'Error':'Missing required field(s)'})
  }

}

//  @menu - delete
//  Required data: id
//  Optional data: none
handlers._menu.delete = (data, callback)=>{
  const id = typeof data.queryStringObject.id == 'string' && data.queryStringObject.id.trim().length > 0 ? data.queryStringObject.id.trim() : false
  const email = typeof data.queryStringObject.email == 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false
  //  Get the token from the headers
  const token = typeof data.headers.token == 'string' ? data.headers.token : false
  //  verify that the given token is valid for the email address
  if(email && id){
    handlers._tokens.verifyToken(token, email, (tokenIsValid)=>{
      if(tokenIsValid){
        _data.list('menu', (err, data)=>{
          if(!err){
            if(data.indexOf(id) > -1){
              _data.delete('menu', id, (err)=>{
                if(!err){
                  callback(200)
                }else{
                  callback(500, {'Error':'Error deleting file'})
                }
              })
            }else{
              callback(500, {'Error':'Menu Item might have been already deleted or is missing'})
            }
          }else{
            callback(500, {'Error':'Error listing files'})
          }
        })
      }else{
        callback(403, {'Error':'Missing required token in header, or token is invalid'})
      }
    })
  }else{
    callback(400, {'Error':'Missing required fields (id, email)'})
  }
}

//  @cart
handlers.cart = (data, callback)=>{
  const acceptableMethods = ['post', 'get', 'delete']
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._cart[data.method](data, callback)
  }else{
    callback(405)
  }
}

//  Container for all the cart methods
handlers._cart = {}

//  @cart - post
//  Required data: email, items
//  Optional data: none

handlers._cart.post = (data, callback)=>{
  const email = typeof data.queryStringObject.email == 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false
  const productId = typeof data.payload.productId == 'string' && data.payload.productId.trim().length > 0 ? data.payload.productId.trim() : false
  const quantity = typeof data.payload.quantity == 'string' && data.payload.quantity.trim().length > 0 ? data.payload.quantity.trim() : false

  //  Get the token from the headers
  const token = typeof data.headers.token == 'string' ? data.headers.token :false
  //  verify that the given token is valid for the email address
  handlers._tokens.verifyToken(token, email, (tokenIsValid)=>{
    if(tokenIsValid){
      if(email && productId && quantity){
        let product = {
          productId:productId,
          quantity:quantity
        }
        //  Check if the user has a cart
        _data.list(`cart`, (err, data)=>{
          if(!err){
            //  Otherwise, the user has no cart
            console.log(data)
            if(data.indexOf(email) > -1){
              //  Add item to cart
              _data.create(`cart\/${email}`, productId, product, (err)=>{
                if(!err){
                  callback(200)
                }else{
                  callback(500, {'Error':'Error adding items to cart'})
                }
              })
            }else{
              _data.mkdir(`cart\/${email}`, (err)=>{
                if(!err){
                  //  Add item to cart
                  _data.create(`cart\/${email}`, productId, product, (err)=>{
                    if(!err){
                      callback(200)
                    }else{
                      callback(500, {'Error':'Error adding items to cart'})
                    }
                  })
                }else{
                  callback(500, {'Error':'Error creating directory'})
                }
              })
            }
          }else{
            callback(500, {'Error':'Error listing '})
          }
        })
      }else{
        callback(400, {'Error':'Missing required field(s)'})
      }
    }else{
      callback(403, {'Error':'Missing required token in header, or token is invalid'})
    }
  })
}

//  @cart - get
//  Required data: email
//  Optional data: none

handlers._cart.get = (data, callback)=>{
  const email = typeof data.queryStringObject.email == 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email : false
  //  Get the token from the headers
  const token = typeof data.headers.token == 'string' ? data.headers.token :false
  //  verify that the given token is valid for the email address
  handlers._tokens.verifyToken(token, email, (tokenIsValid)=>{
    if(tokenIsValid){
      if(email){
        _data.read('cart', email, (err, data)=>{
          if(!err){
            callback(200, data)
          }else{
            callback(500, {'Error':'Error reading cart'})
          }
        })
      }else{
        callback(400, {'Error':'Missing required field(s)'})
      }
    }else{
      callback(403, {'Error':'Missing required token in header, or token is invalid'})
    }
  })
}

//  @cart - delete (Clear cart, Remove items from cart)
//  Required data: email
//  Optional data: id
handlers._cart.delete = (data, callback)=>{
  const email = typeof data.queryStringObject.email == 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false
  const id = typeof data.queryStringObject.id == 'string' && data.queryStringObject.id.trim().length > 0 ? data.queryStringObject.id.trim() : false
  //  Get the token from the headers
  const token = typeof data.headers.token == 'string' ? data.headers.token :false
  //  verify that the given token is valid for the email address
  handlers._tokens.verifyToken(token, email, (tokenIsValid)=>{
    if(tokenIsValid){
      if(email){
        _data.list('cart', (err, data)=>{
          if(!err){
            if(data.length > 0){
              _data.list(`cart\/${email}`, (err, data)=>{
                if(!err){
                  //  Delete one item in the cart
                  if(id){
                    console.log(data)
                    if(data.indexOf(id) > -1){
                      _data.delete(`cart\/${email}`, id, (err)=>{
                        if(!err){
                          callback(200)
                        }else{
                          callback(500, {'Error':'Error deleting file'})
                        }
                      })
                    }else{
                      callback(200, {'Info':`Nothing to delete`})
                    }
                  }else{
                    //  Empty cart
                    _data.rm(`cart\/${email}`, (err)=>{
                      if(!err){
                        callback(200)
                      }else{
                        callback(500, {'Error':'Error removing files'})
                      }
                    })
      
                  }
                }else{
                  callback(500, {'Error':'Error listing files'})
                }
              })
            }else{
              callback(200, {'Info':'Nothing to delete'})
            }
          }else{
            callback(500, {'Error':'Error listing files'})
          }
        })

      }else{
        callback(400, {'Error':'Missing required field(s)'})
      }
    }else{
      callback(403, {'Error':'Missing required token in header, or token is invalid'})
    }
  })
}

//  @tokens
handlers.tokens = (data, callback)=>{
  const acceptableMethods = ['post', 'get', 'put', 'delete']
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._tokens[data.method](data, callback)
  }else{
    callback(405)
  }
}

//  Container for all the tokens methods
handlers._tokens = {}

//  @tokens - post
//  Required data: email, password
//  Optional data: name
handlers._tokens.post = (data, callback)=>{
    const email = typeof data.payload.email == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false
    const password = typeof data.payload.password == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false
    if(email && password){
      //  Lookup the user who matches that email address
      _data.read('users', email, (err, userData)=>{
        if(!err && userData){
          //  Hash the sent password, and compare it to the password stored in the user object
          const hashedPassword = helpers.hash(password)
          if(hashedPassword == userData.hashedPassword){
            //  if valid, create a new token with a random name. Set expiration date 1 hour in the future
            const tokenId = helpers.createRandomString(20)
            const expires = Date.now() + 1000 * 60 *60 //milliseconds
            const tokenObject = {
              email : email,
              id : tokenId,
              expires : expires
            }

            //  Store the token
            _data.create('tokens', tokenId, tokenObject, (err)=>{
              if(!err){
                callback(200, tokenObject)
              }else{
                callback(500, {'Error':'Could not create the new token'})
              }
            })
          }else{
            callback(400,{'Error':'Password did not match the specified user\'s stored password'})
          }
        }else{
          callback(400,{'Error':'Could not find the specified user'})
        }
      })
    }else{
      callback(400,{'Error':'Missing required field(s)'})
    }
}
//  @tokens - get
//  Required data : id
//  Optional data : name
handlers._tokens.get = (data, callback)=>{
  //  Check that the id is valid
  const id = typeof data.queryStringObject.id == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false
  if(id){
    //  Look up the token
    _data.read('tokens', id, (err, tokenData)=>{
      if(!err && tokenData){
        callback(200, tokenData)
      }else{
        callback(404)
      }
    })
  }else{
    callback(400, {'Error':'Missing required field'})
  }
}

//  @tokens - put
//  Required data : id, extend
//  Optional data : none
handlers._tokens.put = (data, callback)=>{
  const id = typeof data.payload.id == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false
  const extend = typeof data.payload.extend == 'boolean' && data.payload.extend == true ? true : false
  if(id && extend){
    //  Look up the token
    _data.read('tokens', id, (err, tokenData)=>{
      if(!err && tokenData){
        //  Check to make sure the token isn't already expired
        if(tokenData.expires > Date.now()){
          //  Set the expiration an hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60
          //  Store the new updates
          _data.update('tokens', id, tokenData, (err)=>{
            if(!err){
              callback(200)
            }else{
              callback(500, {'Error':'Could not update the token\'s expiration'})
            }
          })
        }else{
          callback(400, {'Error':'The token has already expired, and cannot be extended'})
        }
      }else{
        callback(400,{'Error':'Specified token does not exist'})
      }
    })
  }else{
    callback(400,{'Error':'Missing required field(s) or field(s) are invalid'})
  }
}
//  @tokens - delete
//  Required data: id
//  Optional data: none
handlers._tokens.delete = (data, callback)=>{
  //  Check that the id is valid
  const id = typeof data.queryStringObject.id == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false

  if(id){
    //  Look up the user
    _data.read('tokens', id, (err, data)=>{
      if(!err && data){
        _data.delete('tokens', id, (err)=>{
          if(!err){
            callback(200)
          }else{
            callback(500,{'Error':'Could not delete the specified token'})
          }
        })
      }else{
        callback(400,{'Error':'Could not find the specified token'})
      }
    })
  }else{
    callback(400, {'Error':'Missing required field'})
  }
}

//  Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = (id, email, callback)=>{
  //  Look up the token
  _data.read('tokens', id, (err, tokenData)=>{
    if(!err && tokenData){
      //  Check that the token is for the given user and has not expired
      if(tokenData.email == email && tokenData.expires > Date.now()){
        callback(true)
      }else{
        callback(false)
      }
    }else{
      callback(false)
    }
  })
}


//  @ping handler
handlers.ping = (data, callback)=>{
  callback(200)
}

// @not_found handler
handlers.notFound = (data, callback)=>{
  callback(404)
}

// Export the module
module.exports = handlers
