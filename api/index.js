export default async function handler(req, res) {
  // 1. إعدادات السماح (CORS)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // التعامل مع طلبات المتصفح الأولية
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // السماح بطلبات POST فقط
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 405, message: 'Method Not Allowed' });
  }

  try {
    // 2. قراءة رقم السنوية المرسل من الواجهة
    const vid = req.body.vid;

    if (!vid) {
      return res.status(400).json({ status: 400, message: "رقم السنوية مفقود" });
    }

    // 3. التوكنات الخاصة بك
    const AUTH_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2FwaS5heW5pcS5hcHAvdjMvYXBpL2F1dGgvbG9naW4iLCJpYXQiOjE3NjYwNTU5ODIsImV4cCI6MTc5NzU5MTk4MiwibmJmIjoxNzY2MDU1OTgyLCJqdGkiOiJaWE1nQlZDUzEwZHdlVkQ3Iiwic3ViIjoiMjAyNzU2NSIsInBydiI6ImUzYWNhMWNmYTM2ZmIxYTU2ODkwZGEwMWY3ZWVhNGU2NDY5YjUzODYiLCJwaG9uZV9udW1iZXIiOiIrOTY0NzgwMzQzNjE4MyIsImNpdGl6ZW5fbmFtZSI6bnVsbCwiY2l0aXplbl9uYXRpb25hbF9pZCI6bnVsbCwiY2l0aXplbl9waG9uZSI6Iis5NjQ3ODAzNDM2MTgzIiwiY2l0aXplbl9nZW5kZXIiOm51bGx9.u5sD6ROESvg0K-zAOzkUV886geizdqfcJdv49bIXD-I";
    const FCM_TOKEN = "d1I7YTGvQt-WA7WFIt25_S:APA91bHKJ5nMrVIT8JEZjWPfP0XR4KgOjyKMuzxWWs4-i1VZ6GtXJ0jSlNzWl9NH6AHeMnGwsvQcO5I0rPeTDwHkFAKW_9rXNft_lSEmnIVwOyUihHZ5rFk";

    // 4. بناء الطلب بصيغة Form-Data ليقبله سيرفر المرور
    const targetFormData = new FormData();
    targetFormData.append("vid", vid);

    // 5. الاتصال بسيرفر المرور من خلال سيرفرات Vercel (AWS)
    const response = await fetch("https://api.ayniq.app/v3/api/fines/query/vid", {
      method: "POST",
      headers: {
        "authorization": `Bearer ${AUTH_TOKEN}`,
        "x-firebase-messaging-token": FCM_TOKEN,
        "x-firebase-installations-id": "d1I7YTGvQt-WA7WFIt25_S",
        "device-id": "BP2A.250605.015",
        "timezone": "Asia/Baghdad",
        "accept-language": "ar-IQ",
        "user-agent": "com.moi.ayniq 1.11.10; Dalvik/2.1.0 (Linux; U; Android 16; CPH2747 Build/BP2A.250605.015)",
        "x-firebase-appcheck": ""
      },
      body: targetFormData
    });

    const rawText = await response.text();
    let data;
    
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      return res.status(502).json({ 
          status: 502, 
          message: "رفض الخادم الأصلي الاتصال أو أعاد بيانات غير صالحة.", 
          details: rawText.substring(0, 150) 
      });
    }

    // 6. إعادة البيانات للواجهة
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ status: 500, message: "خطأ في السيرفر الوسيط", details: error.message });
  }
}
