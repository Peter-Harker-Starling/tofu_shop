const express = require('express');
const supabase = require('../supabaseClient');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const auth = require('../auth');

const router = express.Router();

router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.render('login', { error: '帳號跟密碼都要填！' });
        };

        const { data: user, error } = await supabase
            .from("admin")
            .select("id, username, password")
            .eq("username", username)
            .single(); 

        if (error || !user) {
            return res.render('login', { error: '帳號或密碼錯誤' });
        };

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.render('login', { error: '帳號或密碼錯誤' });
        };

        const token = jwt.sign(
            { id: user.id, name: user.username },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );
        
        res.cookie('admin_token', token, {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 1000 
        });

        res.redirect('/tofu/dashboard');
    } catch (err) {
        return res.render('login', { error: '伺服器發生錯誤' });
    };
});

router.post('/logout', auth, (req, res) => {
    res.clearCookie('admin_token');
    res.redirect('/admin/login');
});

module.exports = router;