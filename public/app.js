/*
 * Frontend Logic for application
 *
 */

// Container for frontend application
var app = {};

// Config
app.config = {
  'sessionToken' : false
};

// User data
app.cartData = [];

// quantity input old values
app.oldQuantityValue = [];

// AJAX Client (for RESTful API)
app.client = {}

// Interface for making API calls
app.client.request = function(headers,path,method,queryStringObject,payload,callback){

  // Set defaults
  headers = typeof(headers) == 'object' && headers !== null ? headers : {};
  path = typeof(path) == 'string' ? path : '/';
  method = typeof(method) == 'string' && ['POST','GET','PUT','DELETE'].indexOf(method.toUpperCase()) > -1 ? method.toUpperCase() : 'GET';
  queryStringObject = typeof(queryStringObject) == 'object' && queryStringObject !== null ? queryStringObject : {};
  payload = typeof(payload) == 'object' && payload !== null ? payload : {};
  callback = typeof(callback) == 'function' ? callback : false;

  // For each query string parameter sent, add it to the path
  var requestUrl = path+'?';
  var counter = 0;
  for(var queryKey in queryStringObject){
     if(queryStringObject.hasOwnProperty(queryKey)){
       counter++;
       // If at least one query string parameter has already been added, preprend new ones with an ampersand
       if(counter > 1){
         requestUrl+='&';
       }
       // Add the key and value
       requestUrl+=queryKey+'='+queryStringObject[queryKey];
     }
  }

  // Form the http request as a JSON type
  var xhr = new XMLHttpRequest();
  xhr.open(method, requestUrl, true);
  xhr.setRequestHeader("Content-type", "application/json");

  // For each header sent, add it to the request
  for(var headerKey in headers){
     if(headers.hasOwnProperty(headerKey)){
       xhr.setRequestHeader(headerKey, headers[headerKey]);
     }
  }

  // If there is a current session token set, add that as a header
  if(app.config.sessionToken){
    xhr.setRequestHeader("token", app.config.sessionToken.id);
  }

  // When the request comes back, handle the response
  xhr.onreadystatechange = function() {
      if(xhr.readyState == XMLHttpRequest.DONE) {
        var statusCode = xhr.status;
        var responseReturned = xhr.responseText;

        // Callback if requested
        if(callback){
          try{
            var parsedResponse = JSON.parse(responseReturned);
            callback(statusCode,parsedResponse);
          } catch(e){
            callback(statusCode,false);
          }

        }
      }
  }

  // Send the payload as JSON
  var payloadString = JSON.stringify(payload);
  xhr.send(payloadString);

};

// Bind the logout button
app.bindLogoutButton = function(){
  document.getElementById("logoutButton").addEventListener("click", function(e){

    // Stop it from redirecting anywhere
    e.preventDefault();

    // Log the user out
    app.logUserOut();

  });
};

// Log the user out then redirect them
app.logUserOut = function(redirectUser){
  // Set redirectUser to default to true
  redirectUser = typeof(redirectUser) == 'boolean' ? redirectUser : true;

  // Get the current token id
  var tokenId = typeof(app.config.sessionToken.id) == 'string' ? app.config.sessionToken.id : false;

  // Send the current token to the tokens endpoint to delete it
  var queryStringObject = {
    'id' : tokenId
  };
  app.client.request(undefined,'api/tokens','DELETE',queryStringObject,undefined,function(statusCode,responsePayload){
    // Set the app.config token as false
    app.setSessionToken(false);

    // Send the user to the logged out page
    if(redirectUser){
      window.location = '/session/deleted';
    }

  });
};

// Bind the forms
app.bindForms = function(){
  if(document.querySelector("form")){

    var allForms = document.querySelectorAll("form");
    for(var i = 0; i < allForms.length; i++){
        allForms[i].addEventListener("submit", function(e){

        // Stop it from submitting
        e.preventDefault();
        var formId = this.id;
        var path = this.action;
        var method = this.method.toUpperCase();

        // Hide the error message (if it's currently shown due to a previous error)
        document.querySelector("#"+formId+" .formError").style.display = 'none';

        // Hide the success message (if it's currently shown due to a previous error)
        if(document.querySelector("#"+formId+" .formSuccess")){
          document.querySelector("#"+formId+" .formSuccess").style.display = 'none';
        }


        // Turn the inputs into a payload
        var payload = {};
        var elements = this.elements;
        for(var i = 0; i < elements.length; i++){
          if(elements[i].type !== 'submit'){
            // Determine class of element and set value accordingly
            var classOfElement = typeof(elements[i].classList.value) == 'string' && elements[i].classList.value.length > 0 ? elements[i].classList.value : '';
            var valueOfElement = elements[i].type == 'checkbox' && classOfElement.indexOf('multiselect') == -1 ? elements[i].checked : classOfElement.indexOf('intval') == -1 ? elements[i].value : parseInt(elements[i].value);
            var elementIsChecked = elements[i].checked;
            // Override the method of the form if the input's name is _method
            var nameOfElement = elements[i].name;
            if(nameOfElement == '_method'){
              method = valueOfElement;
            } else {
              // Create a payload field named "method" if the elements name is actually httpmethod
              if(nameOfElement == 'httpmethod'){
                nameOfElement = 'method';
              }
              // Create a payload field named "id" if the elements name is actually uid
              if(nameOfElement == 'uid'){
                nameOfElement = 'id';
              }
              // If the element has the class "multiselect" add its value(s) as array elements
              if(classOfElement.indexOf('multiselect') > -1){
                if(elementIsChecked){
                  payload[nameOfElement] = typeof(payload[nameOfElement]) == 'object' && payload[nameOfElement] instanceof Array ? payload[nameOfElement] : [];
                  payload[nameOfElement].push(valueOfElement);
                }
              } else {
                payload[nameOfElement] = valueOfElement;
              }

            }
          }
        }


        // If the method is DELETE, the payload should be a queryStringObject instead
        var queryStringObject = method == 'DELETE' ? payload : {};

        // Call the API
        app.client.request(undefined,path,method,queryStringObject,payload,function(statusCode,responsePayload){
          // Display an error on the form if needed
          if(statusCode !== 200){

            if(statusCode == 403){
              // log the user out
              app.logUserOut();

            } else {

              // Try to get the error from the api, or set a default error message
              var error = typeof(responsePayload.Error) == 'string' ? responsePayload.Error : 'An error has occured, please try again';

              // Set the formError field with the error text
              document.querySelector("#"+formId+" .formError").innerHTML = error;

              // Show (unhide) the form error field on the form
              document.querySelector("#"+formId+" .formError").style.display = 'block';
            }
          } else {
            // If successful, send to form response processor
            app.formResponseProcessor(formId,payload,responsePayload);
          }

        });
      });
    }
  }
};

// Form response processor
app.formResponseProcessor = function(formId,requestPayload,responsePayload){
  var functionToCall = false;
  // If account creation was successful, try to immediately log the user in
  if(formId == 'accountCreate'){
    // Take the email and password, and use it to log the user in
    var newPayload = {
      'email' : requestPayload.email,
      'password' : requestPayload.password
    };

    app.client.request(undefined,'api/tokens','POST',undefined,newPayload,function(newStatusCode,newResponsePayload){
      // Display an error on the form if needed
      if(newStatusCode !== 200){

        // Set the formError field with the error text
        document.querySelector("#"+formId+" .formError").innerHTML = 'Sorry, an error has occured. Please try again.';

        // Show (unhide) the form error field on the form
        document.querySelector("#"+formId+" .formError").style.display = 'block';

      } else {
        // If successful, set the token and redirect the user
        app.setSessionToken(newResponsePayload);
        window.location = '/menu';
      }
    });
  }
  // If login was successful, set the token in localstorage and redirect the user
  if(formId == 'sessionCreate'){
    app.setSessionToken(responsePayload);
    window.location = '/menu';
  }

  // If forms saved successfully and they have success messages, show them
  var formsWithSuccessMessages = ['accountEdit1', 'accountEdit2','checksEdit1'];
  if(formsWithSuccessMessages.indexOf(formId) > -1){
    document.querySelector("#"+formId+" .formSuccess").style.display = 'block';
  }

  // If the user just deleted their account, redirect them to the account-delete page
  if(formId == 'accountEdit3'){
    app.logUserOut(false);
    window.location = '/account/deleted';
  }

  // If the user just created a new check successfully, redirect back to the dashboard
  if(formId == 'checksCreate'){
    window.location = '/checks/all';
  }

  // If the user just deleted a check, redirect them to the dashboard
  if(formId == 'checksEdit2'){
    window.location = '/checks/all';
  }

};

// Get the session token from localstorage and set it in the app.config object
app.getSessionToken = function(){
  var tokenString = localStorage.getItem('token');
  if(typeof(tokenString) == 'string'){
    try{
      var token = JSON.parse(tokenString);
      app.config.sessionToken = token;
      if(typeof(token) == 'object'){
        app.setLoggedInClass(true);
      } else {
        app.setLoggedInClass(false);
      }
    }catch(e){
      app.config.sessionToken = false;
      app.setLoggedInClass(false);
    }
  }
};

// Set (or remove) the loggedIn class from the body
app.setLoggedInClass = function(add){
  var target = document.querySelector("body");
  if(add){
    target.classList.add('loggedIn');
  } else {
    target.classList.remove('loggedIn');
  }
};

// Set the session token in the app.config object as well as localstorage
app.setSessionToken = function(token){
  app.config.sessionToken = token;
  var tokenString = JSON.stringify(token);
  localStorage.setItem('token',tokenString);
  if(typeof(token) == 'object'){
    app.setLoggedInClass(true);
  } else {
    app.setLoggedInClass(false);
  }
};

// Renew the token
app.renewToken = function(callback){
  var currentToken = typeof(app.config.sessionToken) == 'object' ? app.config.sessionToken : false;
  if(currentToken){
    // Update the token with a new expiration
    var payload = {
      'id' : currentToken.id,
      'extend' : true,
    };
    app.client.request(undefined,'api/tokens','PUT',undefined,payload,function(statusCode,responsePayload){
      // Display an error on the form if needed
      if(statusCode == 200){
        // Get the new token details
        var queryStringObject = {'id' : currentToken.id};
        app.client.request(undefined,'api/tokens','GET',queryStringObject,undefined,function(statusCode,responsePayload){
          // Display an error on the form if needed
          if(statusCode == 200){
            app.setSessionToken(responsePayload);
            callback(false);
          } else {
            app.setSessionToken(false);
            callback(true);
          }
        });
      } else {
        app.setSessionToken(false);
        callback(true);
      }
    });
  } else {
    app.setSessionToken(false);
    callback(true);
  }
};

// Load data on the page
app.loadDataOnPage = function(){
  // Get the current page from the body class
  var bodyClasses = document.querySelector("body").classList;
  var primaryClass = typeof(bodyClasses[0]) == 'string' ? bodyClasses[0] : false;

  // Logic for account settings page
  // if(primaryClass == 'accountEdit'){
  //   app.loadAccountEditPage();
  // }

  if(primaryClass == 'menuList'){
    app.loadMenuListPage();
  }
  
  if(primaryClass == 'shoppingCart'){
    app.loadCartPage();
  }
};

// Load the account edit page specifically
app.loadAccountEditPage = function(){
  // Get the phone number from the current token, or log the user out if none is there
  var phone = typeof(app.config.sessionToken.phone) == 'string' ? app.config.sessionToken.phone : false;
  if(phone){
    // Fetch the user data
    var queryStringObject = {
      'phone' : phone
    };
    app.client.request(undefined,'api/users','GET',queryStringObject,undefined,function(statusCode,responsePayload){
      if(statusCode == 200){
        // Put the data into the forms as values where needed
        document.querySelector("#accountEdit1 .firstNameInput").value = responsePayload.firstName;
        document.querySelector("#accountEdit1 .lastNameInput").value = responsePayload.lastName;
        document.querySelector("#accountEdit1 .displayPhoneInput").value = responsePayload.phone;
        
        // Put the hidden phone field into both forms
        var hiddenPhoneInputs = document.querySelectorAll("input.hiddenPhoneNumberInput");
        for(var i = 0; i < hiddenPhoneInputs.length; i++){
          hiddenPhoneInputs[i].value = responsePayload.phone;
        }
        
      } else {
        // If the request comes back as something other than 200, log the user our (on the assumption that the api is temporarily down or the users token is bad)
        app.logUserOut();
      }
    });
  } else {
    app.logUserOut();
  }
};

// Load the menu list page specifically
app.loadMenuListPage = function(){
  // Get the email address from the current token, or log the user out if none is there
  var email = typeof(app.config.sessionToken.email) == 'string' ? app.config.sessionToken.email : false;
  if(email){
    // Fetch the user data
    var queryStringObject = {
      'email' : email
    };
    // Step 1: Fetch cartItems
    app.client.request(undefined,'api/cart','GET',queryStringObject,undefined,function(statusCode, responsePayload){
      if(statusCode == 200){
        //  Determine the number of cart items the user has
        var cartItems = Array.isArray(responsePayload.data) && responsePayload.data.length > 0 ? responsePayload.data : false;
        var numberOfItems = 0;
        if(cartItems){
          numberOfItems = cartItems.length; 
          for(i = 0; i < numberOfItems; i++){
            app.cartData.push({id: cartItems[i].item.id, quantity: cartItems[i].quantity});
          }
        }
            //  Step 2: Fetch menu items
    app.client.request(undefined,'api/menu','GET',queryStringObject,undefined,function(statusCode,responsePayload){
      if(statusCode == 200){
        //  Determine the number of cart items the user has
        var menuItems = Array.isArray(responsePayload) && responsePayload.length > 0 ? responsePayload : false;
        if(menuItems){
          var numberOfItems = menuItems.length; 
          //  Append data to the DOM
          var container = document.querySelector("div.pizzaContainer");
          var elDivPizza, elDivPizzaDescription, elDivPizzaImage, elH3, elPIngredients, elPPrice, elImg, name, ingredients, price, elDivAddToCart, elAddToCartButton, elRemoveFromCartButton, elNumberInput, addToCart, removeFromCart;
          for(i = 0; i < numberOfItems; i++){
            // "div.pizza"
            elDivPizza = document.createElement('div');
            elDivPizza.setAttribute('class', 'pizza'); 
            elDivPizza.setAttribute('id', menuItems[i].id);      

            // "div.pizzaDescription"
            elDivPizzaDescription = document.createElement('div');
            elDivPizzaDescription.setAttribute('class', 'pizzaDescription');            
            elDivPizza.appendChild(elDivPizzaDescription);
            // "div.pizzaImage"
            elDivPizzaImage = document.createElement('div');
            elDivPizzaImage.setAttribute('class', 'pizzaImage');
            elDivPizza.appendChild(elDivPizzaImage);
            // "h3.name"
            elH3 = document.createElement('h3');
            elH3.setAttribute('class', 'name');
            name = document.createTextNode(menuItems[i].name);
            elH3.appendChild(name);
            elDivPizzaDescription.appendChild(elH3);
            // "h4.category"
            elH4 = document.createElement('h4');
            elH4.setAttribute('class', 'category');
            category = document.createTextNode(menuItems[i].category);
            elH4.appendChild(category);
            elDivPizzaDescription.appendChild(elH4);
            // "p.ingredients"
            elPIngredients = document.createElement('p');
            elPIngredients.setAttribute('class', 'ingredients');
            ingredients = document.createTextNode('Nam in, nulla, eget, nisi scelerisque, tempor, Maecenas, consectetur');
            elPIngredients.appendChild(ingredients);            
            elDivPizzaDescription.appendChild(elPIngredients);
            // "p.price"
            elPPrice = document.createElement('p');
            elPPrice.setAttribute('class', 'price');
            price = document.createTextNode(`$ ${menuItems[i].price}`);
            elPPrice.appendChild(price);
            elDivPizzaDescription.appendChild(elPPrice);
            // div.addToCart
            elDivAddToCart = document.createElement('div');
            elDivAddToCart.setAttribute('class', 'addToCart');
            
            elAddToCartButton = document.createElement('button');
            elAddToCartButton.setAttribute('id', `add${menuItems[i].id}`);
            elAddToCartButton.setAttribute('class', 'addToCart');
            addToCart = document.createTextNode('Add To Cart');
            
            elRemoveFromCartButton = document.createElement('button');
            elRemoveFromCartButton.setAttribute('id', `remove${menuItems[i].id}`);
            elRemoveFromCartButton.setAttribute('class', 'removeFromCart');
            removeFromCart = document.createTextNode('Remove from Cart');
            
            elNumberInput = document.createElement('input');
            elNumberInput.setAttribute('type', 'number');
            elNumberInput.setAttribute('id', `quantity${menuItems[i].id}`);
            elNumberInput.setAttribute('min', 1);
            elNumberInput.setAttribute('max', 50);
            
            app.cartData.forEach(function(item){
              if(item.id == menuItems[i].id){// if the item is already in the cart handle the state of the buttons (remove/add-to-cart)
                elAddToCartButton.setAttribute('style', 'display: none;');
                elRemoveFromCartButton.setAttribute('style', 'display: block;');
                elNumberInput.setAttribute('value', item.quantity);
              }
            });

            if(!elNumberInput.hasAttribute('value')){
              elNumberInput.setAttribute('value', 1);
            }

            elAddToCartButton.appendChild(addToCart);
            elRemoveFromCartButton.appendChild(removeFromCart);

            elDivAddToCart.appendChild(elAddToCartButton);
            elDivAddToCart.appendChild(elRemoveFromCartButton);
            elDivAddToCart.appendChild(elNumberInput);
            elDivPizzaDescription.appendChild(elDivAddToCart);

            // "img:src:[alt='pizza snapshot']"
            elImg = document.createElement('img');
            elImg.setAttribute('src', menuItems[i].image);
            elImg.setAttribute('alt', 'pizza snapshot');
            elDivPizzaImage.appendChild(elImg);

            container.appendChild(elDivPizza);
          }
        }else{
          // empty menu, log the user our (on the assumption that the api is temporarily down)
          app.logUserOut();
        }
      }else{
        // If the request comes back as something other than 200, log the user out (on the assumption that the api is temporarily down or the users token is bad)
        app.logUserOut();
      }
    })
      }else{
        // If the request comes back as something other than 200, log the user out (on the assumption that the api is temporarily down or the users token is bad)
        app.logUserOut();
      }
    });
  }else{
    app.logUserOut();
  }
}

// Load the cart page specifically
app.loadCartPage = function(){
  // Get the email address from the current token, or log the user out if none is there
  var email = typeof(app.config.sessionToken.email) == 'string' ? app.config.sessionToken.email : false;
  if(email){
    // Fetch the user data
    var queryStringObject = {
      'email' : email
    };
    // Fetch cartItems
    app.client.request(undefined,'api/cart','GET',queryStringObject,undefined,function(statusCode,responsePayload){
      if(statusCode == 200){
        //  Determine the number of cart items the user has
        var cartItems = Array.isArray(responsePayload.data) && responsePayload.data.length > 0 ? responsePayload.data : false;
        var numberOfItems = 0;
        var container = document.querySelector("div.cartContainer");
        if(cartItems){
          numberOfItems = cartItems.length; 

          //  Append data to the DOM
          var elDivCartItem, elDivProduct, elDivProductImage, elImg, elDivProductDescription, elH3, elH4, elPIngredients, name, category, ingredients, elDivSale, elDivPrice, elDivQuantity, elPPrice, elPQuantity, price, quantity, elPTag, tag, elEmptyCart, emptyCartText, emptyCartIcon;
          var totalCost = 0;
          for(i = 0; i < numberOfItems; i++){
            // - "div.cartItem"
            elDivCartItem = document.createElement('div');
            elDivCartItem.setAttribute('class', 'cartItem'); 
            elDivCartItem.setAttribute('id', cartItems[i].item.id);      

            // -- "div.product"
            elDivProduct = document.createElement('div');
            elDivProduct.setAttribute('class', 'product');            
            elDivCartItem.appendChild(elDivProduct);

            // --- "div.productImage"
            elDivProductImage = document.createElement('div');
            elDivProductImage.setAttribute('class', 'productImage');
            elDivProduct.appendChild(elDivProductImage);

            // ---- "img"
            elImg = document.createElement('img');
            elImg.setAttribute('src', cartItems[i].item.image);
            elImg.setAttribute('alt', 'product');
            elDivProductImage.appendChild(elImg);

            // --- "div.productDescription"
            elDivProductDescription = document.createElement('div');
            elDivProductDescription.setAttribute('class', 'productDescription');
            elDivProduct.appendChild(elDivProductDescription);

            // ---- "h3.name"
            elH3 = document.createElement('h3');
            elH3.setAttribute('class', 'name');
            name = document.createTextNode(cartItems[i].item.name);
            elH3.appendChild(name);
            elDivProductDescription.appendChild(elH3);
            // ---- "h4.category"
            elH4 = document.createElement('h4');
            elH4.setAttribute('class', 'category');
            category = document.createTextNode(cartItems[i].item.category);
            elH4.appendChild(category);
            elDivProductDescription.appendChild(elH4);
            // ---- "p.ingredients"
            elPIngredients = document.createElement('p');
            elPIngredients.setAttribute('class', 'ingredients');
            ingredients = document.createTextNode('Nam in, nulla, eget, nisi scelerisque, tempor, Maecenas, consectetur');
            elPIngredients.appendChild(ingredients);            
            elDivProductDescription.appendChild(elPIngredients);

            // -- "div.sale"
            elDivSale = document.createElement('div');
            elDivSale.setAttribute('class', 'sale');
            elDivCartItem.appendChild(elDivSale);
            
            // --- "div.price"
            elDivPrice = document.createElement('div');
            elDivPrice.setAttribute('class', 'price');
            elPTag = document.createElement('p');
            tag = document.createTextNode('Unit Price');
            elPTag.appendChild(tag);
            elPPrice = document.createElement('p');
            elPPrice.setAttribute('id', `price${cartItems[i].item.id}`);
            price = document.createTextNode(`$ ${cartItems[i].item.price}`);
            elPPrice.appendChild(price);
            elDivPrice.appendChild(elPTag);
            elDivPrice.appendChild(elPPrice);
            elDivSale.appendChild(elDivPrice);

            // --- "div.quantity"
            elDivQuantity = document.createElement('div');
            elDivQuantity.setAttribute('class', 'quantity');
            elPTag = document.createElement('p');
            tag = document.createTextNode('Quantity');
            elPTag.appendChild(tag);
            elNumberInput = document.createElement('input');
            elNumberInput.setAttribute('type', 'number');
            elNumberInput.setAttribute('id', `quantity${cartItems[i].item.id}`);
            elNumberInput.setAttribute('min', 1);
            elNumberInput.setAttribute('max', 50);
            elNumberInput.setAttribute('value', cartItems[i].quantity);
            elDivQuantity.appendChild(elPTag);
            elDivQuantity.appendChild(elNumberInput);
            elDivSale.appendChild(elDivQuantity);

            elRemoveFromCartButton = document.createElement('button');
            elRemoveFromCartButton.setAttribute('id', `remove${cartItems[i].item.id}`);
            elRemoveFromCartButton.setAttribute('class', 'removeFromCart');
            elRemoveFromCartButton.setAttribute('style', 'display: block;');
            removeFromCart = document.createTextNode('Remove from Cart');
            elRemoveFromCartButton.appendChild(removeFromCart);
            elDivCartItem.appendChild(elRemoveFromCartButton);

            container.appendChild(elDivCartItem);
            totalCost += ((cartItems[i].item.price * 1) * (cartItems[i].quantity * 1));
          }
          var totalDiv = document.querySelector('.checkout .total > div');
          totalDiv.textContent = `Total Cost: $ ${totalCost}`;
        }else{
          // Empty cart
          elEmptyCart = document.createElement('div');
          elEmptyCart.setAttribute('class', 'emptyCart');
          emptyCartIcon = document.createElement('i');
          emptyCartIcon.setAttribute('class', 'fab fa-opencart');
          emptyCartText = document.createTextNode('  Your cart is empty');
          emptyCartIcon.appendChild(emptyCartText);
          elEmptyCart.appendChild(emptyCartIcon);
          container.appendChild(elEmptyCart);
        }
      }else{
        // If the request comes back as something other than 200, log the user out (on the assumption that the api is temporarily down or the users token is bad)
        app.logUserOut();
      }
    })
  }else{
    app.logUserOut();
  }
}

app.addToCart = function(){
  
  // functionality only available for menu page and shopping cart only
  var menuPage = document.querySelector('body.menuList')||document.querySelector('body.shoppingCart');
  var shoppingCart = document.querySelector('body.shoppingCart') ? true : false;
  if(menuPage){
    // bind click handler to element that is added later/dynamically
    document.addEventListener('click', function(e){
      // Get the email address from the current token, or log the user out if none is there
      var email = typeof(app.config.sessionToken.email) == 'string' ? app.config.sessionToken.email : false;
      if(email){
        if(e.target && e.target.classList[0] == 'addToCart'){
          // Modify the frontend
          var addToCartId = e.target.id;
          var id = addToCartId.replace('add', '');
          var quantityInput = document.querySelector(`#quantity${id}`);
          var quantity = quantityInput.value;
  
          // Add items to cart
            if(id && quantity){
              var payload = {
                email: email,
                productId: id,
                quantity: quantity
              }
              app.client.request(undefined, 'api/cart', 'POST', undefined, payload, function(statusCode, responsePayload){
                if(statusCode == 200){
                  e.target.style.display = 'none';            
                  var removeFromCartId = `remove${id}`;
                  var removeFromCartButton = document.querySelector(`button#${removeFromCartId}`);
                  removeFromCartButton.style.display = 'block';
                }else{
                  // Error
                  console.log(statusCode, responsePayload);
                }
              });
            }else{
              console.log('Invalid id or quantity values');
            }
        }else if(e.target && e.target.classList[0] == 'removeFromCart'){
          var removeFromCartId = e.target.id;
          var id = removeFromCartId.replace('remove', '');
          
          if(id){
            var queryStringObject = {
              'email' : email,
              'id' : id
            };
            app.client.request(undefined, 'api/cart', 'DELETE', queryStringObject, undefined, function(statusCode, responsePayload){
              if(statusCode == 200){
                if(!shoppingCart){
                  e.target.style.display = 'none';            
                  var addToCartId = `add${id}`;
                  var addToCartButton = document.querySelector(`button#${addToCartId}`);
                  addToCartButton.style.display = 'block';
                }else{
                  var divCartItem = document.getElementById(id);
                  divCartItem.style.display = 'none';
                  // calculate new total cost
                  var totalCostDiv = document.querySelector('.checkout .total > div');
                  var currentDivPrice = document.querySelector(`#price${id}`);
                  var currentDivQuantity = document.querySelector(`#quantity${id}`);
                  if(totalCostDiv && currentDivPrice && currentDivQuantity){
                    var totalBillable = totalCostDiv.textContent.replace('Total Cost: $ ','');
                    totalBillable *= 1;
                    var deductibleAmount = currentDivPrice.textContent.replace('$ ','');
                    deductibleAmount *= 1;      
                    var quantity = currentDivQuantity.value;
                    quantity *= 1;          
                    totalBillable -= deductibleAmount * quantity;
                    totalCostDiv.textContent = `Total Cost: $ ${totalBillable}`;
                  }
                }
              }else{
                // Error
                console.log(statusCode, responsePayload);
              }
            });
          }else{
            console.log('Invalid id');
          }
          // Remove items from cart
        }
      }else{
        app.logUserOut();
      }
    });
  }
};

app.modifyCart = function(){
  // functionality only available for menu page and shopping cart only
  var menuPage = document.querySelector('body.menuList')||document.querySelector('body.shoppingCart');
  if(menuPage){
    document.addEventListener('change', function(e){
    // Get the email address from the current token, or log the user out if none is there
    var email = typeof(app.config.sessionToken.email) == 'string' ? app.config.sessionToken.email : false;
    if(email){
      var quantityInputId = e.target.id;
      var id = quantityInputId.replace('quantity', '');
      // check for removeFromCart button with similar id and with display property of block
      var removeFromCartButton = document.querySelector(`#remove${id}`);
      var display = removeFromCartButton.style.display;
      if(removeFromCartButton && display == 'block'){
        var quantity = e.target.value;
        var payload = {
          'id': id,
          'email': email,
          'quantity': quantity
        }
        app.client.request(undefined, 'api/cart', 'PUT', undefined, payload, function(statusCode, responsePayload){
          if(statusCode == 200){
            window.location = '/cart';
          }else{
            window.alert('Something went wrong, could not change quantity');
          }
        });
      }else{
        console.log('corresponding button missing, id:', id);
      }
    }else{
      app.logUserOut();
    }
    })
  }
};

app.checkout = function(){
  // functionality only available for menu page and shopping cart only
  var shoppingCartPage = document.querySelector('body.shoppingCart');
  if(shoppingCartPage){
    var checkoutBtn = document.querySelector('button#checkout');
    checkoutBtn.addEventListener('click', function(e){
      e.preventDefault();
      // Add a spinner
      let spinnerIcon = document.createElement('i');
      spinnerIcon.setAttribute('class', 'fas fa-spinner fa-spin')
      let y = checkoutBtn.childNodes[0]
      checkoutBtn.removeChild(y)
      checkoutBtn.appendChild(spinnerIcon)
      checkoutBtn.style.cursor = 'progress'
      // Get the email address from the current token, or log the user out if none is there
      var email = typeof(app.config.sessionToken.email) == 'string' ? app.config.sessionToken.email : false;
      if(email){
        var payload = {
          email: email
        }
        app.client.request(undefined,'api/checkout','POST',undefined,payload,function(statusCode,responsePayload){
          if(statusCode == 200){
            if(responsePayload){
              try{
                var stripe = Stripe('pk_test_51IJG3JCNlIgCXQydYsydKwVqZUpQVwvZIuXWjO1xQMZ2vkaSIpp8MEVSk31eWfexTj4nHcTcmDAsUaH1Myuj9ykT00hmvS6TaI');
                return stripe.redirectToCheckout({ sessionId: responsePayload.id });
              }catch(err){
                window.alert('Redirect to Stripe Payments failed')
              }
            }
          }else{
            window.alert('Checkout attempt failed')
          }
        });
      }else{
        app.logUserOut();
      }
    });
  }
};

// Loop to renew token often
app.tokenRenewalLoop = function(){
  setInterval(function(){
    app.renewToken(function(err){
      if(!err){
        console.log("Token renewed successfully @ "+Date.now());
      }
    });
  },1000 * 60);
};


// Init (bootstrapping)
app.init = function(){

  // Bind all form submissions
  app.bindForms();

  // Bind logout logout button
  app.bindLogoutButton();

  // Get the token from localstorage
  app.getSessionToken();

  // Renew token
  app.tokenRenewalLoop();

  // Load data on page
  app.loadDataOnPage();

  // Add to Cart & Remove from Cart
  app.addToCart();

  // Modify Cart (quantity)
  app.modifyCart();

  app.checkout();

};

// Call the init processes after the window loads
window.onload = function(){
  app.init();
};