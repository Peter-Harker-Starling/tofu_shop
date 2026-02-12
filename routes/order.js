const express = require('express');
const supabase = require('../supabaseClient');
const auth = require('../auth');

const router = express.Router();

// 定義品項價格（與前端一致）
const PRODUCTS = {
  momen_tofu: { name: '板豆腐', price: 30 },
  fried_tofu: { name: '油豆腐', price: 10 },
  soft_tofu: { name: '嫩豆腐', price: 30 }
};

router.get('/order', async (req, res) => {
    const timeSlots = ['01:00', '02:00', '03:00', '04:00', '05:00'];
    let slotsWithStatus = [];

    for (const time of timeSlots) {
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('delivery_time', time);

      slotsWithStatus.push({time, full: count >= 2});
    };

    res.render('order', { slotsWithStatus });
});

router.post('/order', async (req, res) => {
  try {
    const customerName = String(req.body.customerName).substring(0, 20);
    const { phone, address, deliveryTime } = req.body;

    const validSlots = ['01:00', '02:00', '03:00', '04:00', '05:00'];
    if (!validSlots.includes(deliveryTime)) {
      return res.status(400).send("非法配送時間");
    };

    let itemsToSave = [];
    let totalAmount = 0;

    // 遍歷我們定義的產品清單，看 req.body 裡面有沒有對應的數量
    for (const key in PRODUCTS) {
      const qty = Math.max(0, parseInt(req.body[key]) || 0);
      if (qty > 20) return res.status(400).send("拓海開的是 AE86，不是卡車，量太多了！");
      
      if (qty > 0) {
        totalAmount += PRODUCTS[key].price * qty;
        itemsToSave.push({name: PRODUCTS[key].name, qty, price: PRODUCTS[key].price});
      };
    };

    // 預防空單
    if (itemsToSave.length === 0) return res.status(400).send("文太：至少要買一塊豆腐吧！");

    const { error } = await supabase.rpc('create_order_with_items', {
        p_customer_name: customerName,
        p_phone: phone,
        p_address: address,
        p_delivery_time: deliveryTime,
        p_total_amount: totalAmount,
        p_items: itemsToSave
    });

    if (error) return res.status(500).send("訂單建立失敗");

    res.redirect('/tofu/success?status=done');

    } catch (err) {
        console.error(err);
        res.status(500).send("系統出錯了，請檢查後台");
    };
});

router.get('/success', (req, res) => {
    if (req.query.status !== 'done') {
        return res.redirect('/tofu/order'); // 沒帶參數就踢回去
    };
    res.render('success');
});

router.get('/select', async (req, res) => {
  try {
    const { phone } = req.query;
    let orders = null;

    if (phone) {
      const { data, error } = await supabase
        .from('orders')
        .select(`id, total_amount, status, items (id, name, qty, price)`)
        .eq('phone', phone)
        .order('created_at', { ascending: false });

      if (error) return res.status(500).send('查詢失敗');

      orders = data;
    };

    res.render('selectOrder', { orders });

  } catch (err) {
    res.status(500).send('系統錯誤');
  };
});

router.get('/dashboard', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`id, customer_name, phone, address, delivery_time, total_amount,
        status, items (id, name, qty, price)`);

    if (error) {
        // 加上 return，確保錯誤時不再執行後面的程式碼
        return res.render('login', { error: '系統出錯了，請檢查後台' });
    };

    res.render('dashboard', { orders: data });
  } catch (err) {
    res.status(500).send("系統出錯了，請檢查後台");
  };
});

router.patch('/:id/status', auth, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!['準備中', '已出貨'].includes(status)) {
        return res.status(400).send('無效的訂單狀態');
    };
    
    const { data, error } = await supabase
        .from('orders')
        .update({status: status})
        .eq('id', id)
        .select('id, status')
        .single();

    if (error) return res.status(500).send('更新狀態失敗');
    res.redirect('/tofu/dashboard');
});

router.delete('/:id', auth, async (req, res) => {
    const { id } = req.params;

    const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

    if (error) return res.status(500).send('刪除訂單失敗');
    res.redirect('/tofu/dashboard');
});

module.exports = router;