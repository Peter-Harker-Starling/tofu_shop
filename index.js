const express = require('express');
require('dotenv').config();
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const orderRoutes = require('./routes/order');
const adminRoutes = require('./routes/admin');

const app = express();

app.set('view engine', 'ejs');
app.use(express.json());
app.use(methodOverride('_method')); //讓伺服器檢查網址是否有?_method=DELETE或?_method=PATCH
app.use(express.urlencoded({ extended: true })); //讓Express能夠讀懂HTML(Form)送來的資料
app.use(cookieParser());
app.use(express.static('public')); //在Express設定「靜態檔案」
app.use('/tofu', orderRoutes);
app.use('/admin', adminRoutes);

app.get('/', async (req, res) => {
    res.render('home');
});

const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`Running on ${PORT}`);
});