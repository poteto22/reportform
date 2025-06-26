# Reportform

โปรเจกต์นี้เป็นระบบบันทึกและแสดงผลรายงานปัญหาประจำวัน โดยใช้ Node.js (Express) เชื่อมต่อกับ Google Sheets และแสดงผลผ่านหน้าเว็บแบบ Responsive

## คุณสมบัติ
- ส่งข้อมูลจากฟอร์มไปบันทึกใน Google Sheets
- ดึงข้อมูลจาก Google Sheets มาแสดงผลในรูปแบบ Card/Modal
- รองรับการแนบและแสดงรูปภาพ (Google Drive URL หรือ =IMAGE)
- UI สวยงาม ใช้งานง่ายทั้งบนคอมพิวเตอร์และมือถือ

## การติดตั้ง
1. **Clone โปรเจกต์**
   ```bash
   git clone https://github.com/poteto22/reportform.git
   cd reportform
   ```
2. **ติดตั้ง dependencies**
   ```bash
   npm install
   ```
3. **เตรียมไฟล์ credentials.json**
   - ดาวน์โหลดไฟล์ service account จาก Google Cloud Console
   - วางไฟล์ `credentials.json` ไว้ในโฟลเดอร์โปรเจกต์

## การตั้งค่า Google Sheets
- สร้าง Google Sheet และแชร์ให้ service account email สามารถแก้ไขได้
- กำหนด `SPREADSHEET_ID` และ `SHEET_NAME` ในไฟล์ `index.js`
- ถ้าต้องการแนบรูปภาพ ให้ใส่ URL หรือสูตร `=IMAGE("url")` ในคอลัมน์ J-N

## การรันเซิร์ฟเวอร์
```bash
node index.js
```

## การใช้งานหน้าเว็บ
### 1. เปิดไฟล์ list.html ตรง ๆ
- ดับเบิลคลิกไฟล์ `list.html` หรือเปิดผ่าน browser
- เหมาะกับการทดสอบบนเครื่องเดียวกับ server

### 2. ให้ Express เสิร์ฟหน้าเว็บ
เพิ่มใน `index.js`:
```js
const path = require('path');
app.get('/list-page', (req, res) => {
  res.sendFile(path.join(__dirname, 'list.html'));
});
```
แล้วเข้าใช้งานที่ [http://localhost:3000/list-page](http://localhost:3000/list-page)

### 3. การใช้งานจากเครื่องอื่นในเครือข่าย
- เปลี่ยน URL ใน `list.html` จาก `localhost` เป็น IP ของเครื่อง server เช่น `http://192.168.1.10:3000/list`
- ตรวจสอบ firewall และ network ให้อนุญาต port 3000

## Proxy รูปภาพ (แก้ปัญหา Google Drive ไม่แสดงรูป)
เพิ่มใน `index.js`:
```js
const axios = require('axios');
app.get('/image-proxy', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send('Missing url parameter');
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    res.set('Content-Type', response.headers['content-type']);
    res.send(response.data);
  } catch (err) {
    res.status(500).send('Error loading image');
  }
});
```
แล้วใน HTML ให้ใช้
```html
<img src="http://localhost:3000/image-proxy?url=URLของรูป" ... >
```

## หมายเหตุ
- ต้องตั้งค่า Google Drive ให้ไฟล์รูปเป็น "ทุกคนที่มีลิงก์ดูได้"
- หากมีปัญหาเรื่อง CORS หรือรูปไม่แสดง ให้ใช้ proxy ตามตัวอย่าง

---

**ผู้พัฒนา:** [poteto22](https://github.com/poteto22) 