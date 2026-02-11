const express = require('express');
require('dotenv').config();
const supabase = require('./supabaseClient');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');

const app = express();

app.set('view engine', 'ejs');
app.use(express.json());
app.use(methodOverride('_method')); //讓伺服器檢查網址是否有?_method=DELETE或?_method=PATCH
app.use(express.urlencoded({ extended: true })); //讓Express能夠讀懂HTML(Form)送來的資料
app.use(cookieParser());
app.use(express.static('public')); //在Express設定「靜態檔案」

app.get('/', async (req, res) => {
    res.json({ message: "success" });
});

const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`Running on ${PORT}`);
});