
const Product = require('../modles/product');
const Order = require('../modles/order');
//const Cart = require('../modles/cart');
//const Order = require('../modles/order');



exports.getProducts = (req, res, next)=>{
    Product.find()
    .then((products) =>{
       res.render('shop/product-list', 
    {prods: products,
     pageTitle: 'All Products', 
     path: '/products',
    // isAuthenticated: req.session.isLoggedIn
    });
    }).catch(err=>{ 
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); 
  });
 }
exports.getProduct = (req, res, next)=>{
   const prodId = req.params.productId;
   Product.findById(prodId).then((product)=>{
      res.render('shop/product-detail', 
      {product: product, 
         pageTitle: product.title, 
         path:'/products',
        // isAuthenticated: req.session.isLoggedIn
      });
   }).catch(err=>{ 
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error); 
});
 }

 exports.getIndex = (req, res, next) => {
    Product.find()
    .then(products=>{
      res.render('shop/index', 
    {prods: products,
     pageTitle: 'Shop', 
     path: '/',
    //  isAuthenticated: req.session.isLoggedIn,
    //  csrfToken: req.csrfToken()
    });
    }).catch(err=>{ 
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); 
  });
    
 }
 exports.getCart = (req, res, next) => {
    //console.log(req.user.cart);
    req.user.populate('cart.items.productId')
    .execPopulate()
    .then(function(user){
      const products = user.cart.items;
    // console.log(products[0].productId.price);
    res.render('shop/cart', 
           {
            pageTitle: 'Your Cart', 
            path: '/cart',
            products: products,
           // isAuthenticated: req.session.isLoggedIn
           });
       }).catch(err=>{ 
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error); 
    });
 }

// exports.getCart = (req, res, next) => {
//   req.user
//     .populate('cart.items.productId')
//     .execPopulate()
//     .then(user => {
//       const products = user.cart.items;
//       res.render('shop/cart', {
//         path: '/cart',
//         pageTitle: 'Your Cart',
//         products: products
//       });
//     })
//     .catch(err => console.log(err));
// };

 exports.postCart = (req, res, next) => {
   const prodId = req.body.productId;
   Product.findById(prodId)
   .then(product=>{
     return req.user.addToCart(product)
   }).then(result=>{
    res.redirect('/cart');
   }).catch(err=>{ 
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error); 
    });
  
 };

//  exports.postCart = (req, res, next) => {
//     const prodId = req.body.productId;
//     let fetchedCart;
//     let newQuantity = 1;
//       req.user.getCart().then(cart=>{
//          fetchedCart = cart;
//          return cart.getProducts({where: { id: prodId }});
//       }).then(products => {
//          let product;
//          if(products.length > 0 ){
//             product = products[0];
//          }
         
//          if(product) {
//             const oldQuantity = product.cartItem.quantity;
//             newQuantity = oldQuantity + 1;
//             return product;
//          }

//          return Product.findByPk(prodId);})
//          .then(product=> {
//                   return fetchedCart.addProduct(product, {through: {quantity: newQuantity}});
//                 }).then(()=>{
//                      res.redirect('/cart');
//                }).catch(err=> console.log(err));
//  }


 exports.postCartDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    req.user.removeFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    }).catch(err=> { 
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); 
  });
 }

//  exports.postOrder = (req, res, next) => {
//     req.user.getCart().then(cart=> {
//        return cart.getProducts();
//     }).then(products=>{
//       return req.user.createOrder(order=>{
//          return order.addProducts(products.map(product=>{
//             product.orderItem = {quantity: product.cartItem.quantity }; 
//             return product;
//           }))
//        }).catch(err=> console.log(err));
//     }).then(result => {
//        res.redirect('/orders');
//     }).catch(err=> console.log(err));
//  }
exports.postOrder = (req, res, next) => {
  req.user.populate('cart.items.productId')
    .execPopulate()
    .then(function(user){
      //console.log(user.cart.items);
      const products = user.cart.items.map(i => {
        return {quantity: i.quantity, product: {...i.productId._doc}}
      });
      const order = new Order({
        user: {
          // name: req.user.name,
          email: req.user.email,
          userId: req.user
        },
        products: products
      });
      order.save();
    })
     .then(result => {
       return req.user.clearCart();
      }).then(()=>{
        res.redirect('/orders');
     })
     .catch(err => { 
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); 
  });
 };
//  exports.getOrders = (req, res, next) => {
//     req.user.getOrders({include: ['products']}).then(orders =>{
//        res.render('shop/orders', 
//         {
//          pageTitle: 'Your Orders', 
//          path: '/orders',
//          orders: orders
//         });
//     }).catch(err => console.log(err));
//  }

exports.getOrders = (req, res, next) => {
  Order.find({'user.userId': req.user._id})
     .then(orders => {
       res.render('shop/orders', {
         path: '/orders',
         pageTitle: 'Your Orders',
         orders: orders,
        // isAuthenticated: req.session.isLoggedIn
       });
     })
     .catch(err => { 
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); 
  });
 };

//  exports.getOrders = (req, res, next) => {
//    // req.user
//    //   .getOrders({include: ['products']})
//    //   .then(orders => {
//    //      //console.log("hahhaaaaaaaaaa", orders);
//    //     res.render('shop/orders', {
//    //       path: '/orders',
//    //       pageTitle: 'Your Orders',
//    //       orders: orders
//    //     });
//    //   })
//    //   .catch(err => console.log(err));
//    res.render('shop/orders', {
//       path: '/orders',
//       pageTitle: 'Your Orders',
//       //orders: orders
//       orders: []
//     });
//  };

//  exports.getCheckout = (req, res, next) => {
//     res.render('shop/checkout', 
//      {
//       pageTitle: 'Checkout', 
//       path: '/chectout'
//      });
//  }