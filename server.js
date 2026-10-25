const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); // للسماح لموقعك بالاتصال بالخادم

// إعداد عميل الواتساب (يستخدم LocalAuth لحفظ الجلسة)
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

// توليد باركود للمسح عبر هاتف المدرسة
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('📱 امسح هذا الباركود باستخدام "الأجهزة المرتبطة" في تطبيق الواتساب الخاص بالإدارة');
});

client.on('ready', () => {
    console.log('✅ تم الربط بنجاح! خادم الواتساب جاهز لإرسال الإشعارات تلقائياً.');
});

// تشغيل العميل
client.initialize();

// إنشاء رابط استقبال الطلبات من موقع أفق الفاروق
app.post('/api/send-sms', async (req, res) => {
    const { phone, message } = req.body;
    
    if (!phone || !message) {
        return res.status(400).json({ error: 'رقم الهاتف والرسالة مطلوبان' });
    }

    try {
        // تجهيز الرقم بالصيغة التي يقبلها واتساب (يجب أن يبدأ بمفتاح الدولة 968)
        let cleanPhone = phone.toString().replace(/\D/g, '');
        if (!cleanPhone.startsWith('968')) {
            cleanPhone = '968' + cleanPhone;
        }
        const chatId = `${cleanPhone}@c.us`;
        
        // إرسال الرسالة
        await client.sendMessage(chatId, message);
        console.log(`تم إرسال رسالة بنجاح إلى المعلم رقم: ${cleanPhone}`);
        
        res.status(200).json({ success: true, message: 'تم الإرسال بنجاح' });
    } catch (error) {
        console.error('فشل الإرسال:', error);
        res.status(500).json({ error: 'تعذر إرسال الرسالة' });
    }
});

// تشغيل الخادم على المنفذ 3000
app.listen(3000, () => {
    console.log('🚀 خادم الواتساب يعمل الآن على http://localhost:3000');
});