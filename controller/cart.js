var models = require('./../models/sequelize');
var sequelize = models.sequelize;
var Product = models.Product;
var Category = models.Category;

module.exports.cartIndex = function(req, res, next) {
  let cartObj = {};
  let cartitems = [];

  if (req.session.cart != undefined) {
    let cart = req.session.cart;

    // build array of product ID's from the cart to use in query
    cart.forEach(function(item, index, array) {
      cartitems.push(item.id);
      cartObj[item.id] = item.quantity;
    });

    let criteria = {
      include: [{
        model: Category
      }],
      where: {
        id: {
          $in: cartitems
        }
      }
    };


    Product.findAll(criteria)
      .then((products) => {
        let total = 0;
        // now insert the quantity ordered into the return result
        products.forEach(function(item, index, array) {
          item.quantityOrdered = cartObj[item.id];
          total += item.price * item.quantityOrdered;
        });

        res.render('cart/index', {
          title: "Mimir's Market",
          cart: products,
          cart_count: req.session.cart.length || 0,
          total: total.toFixed(2)
        });

      })
      .catch((e) => res.status(500)
        .send(e.stack));

  }


};

module.exports.cartAdd = function(req, res, next) {
  let cartItem = {
    id: req.params.productID,
    quantity: 1
  };

  if (req.session.cart === undefined) {
    // no cart yet, create one and then add the item
    req.session.cart = [];
    req.session.cart.push(cartItem);
  } else {
    // check cart for existing item and increment quantity if already there
    let cart = req.session.cart;
    let itemID = req.params.productID;
    let idxItem = null;

    cart.forEach(function(item, index, array) {
      if (item.id === itemID) {
        idxItem = index;
      }
    });

    if (idxItem != null) {
      cart[idxItem].quantity++;
    } else {
      req.session.cart.push(cartItem);
    }

  }

  console.log(req.session.cart);

  res.redirect(req.headers.referer);
}

module.exports.cartRemove = function(req, res, next) {
  // search cart for item and then delete it

  let cart = req.session.cart;
  let itemID = req.params.productID;
  let idxItem = null;

  if (cart != undefined) {
    cart.forEach(function(item, index, array) {
      if (item.id === itemID) {
        idxItem = index;
      }
    });

    if (idxItem != null) {
      cart.splice(idxItem, 1);
    }

    req.session.cart = cart;
  };

  res.redirect(req.headers.referer);
}

module.exports.cartUpdateItemQuantity = function(req, res, next) {


  let cart = req.session.cart;
  let itemID = req.params.productID;
  let idxItem = null;

  if (cart != undefined) {
    cart.forEach(function(item, index, array) {
      if (item.id === itemID) {
        idxItem = index;
      }
    });

    if (idxItem != null) {
      cart[idxItem].quantity = req.body.newQuantity;
      if (cart[idxItem].quantity <= 0) {
        cart.splice(idxItem, 1);
      }
    }

    req.session.cart = cart;
  };

  res.redirect('/cart');
}

module.exports.cartDelete = function(req, res, next) {
  req.session.cart = [];
  res.redirect('/products');
}
