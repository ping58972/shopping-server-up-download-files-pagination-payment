const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');

const adminRoute = require('./routes/admin');
const shopRoute = require('./routes/shop');
const authRoute = require('./routes/auth');
const productController = require('./controllers/error');
const User = require('./modles/user');

// const MONGODB_URI = 'mongodb+srv://ping:pink58972@cluster0-5aiyx.mongodb.net/mongoose-shop?retryWrites=true&w=majority';
const MONGODB_URI = 'mongodb+srv://ping:pink58972@cluster0-5aiyx.mongodb.net/mongoose-shop';


const app = express();
const store =  new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});
const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename:(req, file, cb) => {
        cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if( 
        file.mimetype === 'image/png' || 
        file.mimetype === 'image/jpg' || 
        file.mimetype === 'image/jpeg'
        ){
        cb(null, true);
    } else {
        cb(null, false);
    }
}
 
app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser.urlencoded({extended:false}));
app.use(multer({storage: fileStorage, fileFilter: fileFilter }).single('image'));
// app.use(multer({dest:'images' }).single('image'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(session({
    secret:'my secret',   
    resave: false, 
    saveUninitialized: false, 
    store: store
}));
app.use(csrfProtection);
app.use(flash());
app.use((req, res, next) => {
    if (req.url === "/create-order") {
      next();
    } else {
      csrfProtection(req, res, next);
    }
  });
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    //res.locals.csrfToken = req.csrfToken();
    res.locals.csrfToken = req["csrfToken"] ? req.csrfToken() : "";
    next();
});


app.use((req, res, next) => {
    if(!req.session.user){
       return next();
    }
    User.findById(req.session.user._id)
    .then(user => {
       
        if(!user){
            return next();
        }
      req.user = user;
      next();
    })
    .catch(err=> {
        next(new Error(err));
    });
});
 


app.use('/admin', adminRoute);
app.use(shopRoute);
app.use(authRoute);

app.use('/500', productController.get500);
app.use(productController.get404);
app.use((error, req, res, next) => {
    //res.status(error.httpStateCode).render(...);
    console.log(error);
    res.redirect('/500');
});


mongoose.connect(MONGODB_URI, { useNewUrlParser: true })
.then(result => {
    
    app.listen(3000);
}).catch(err=>console.log(err));


