# Reportform

โปรเจกต์นี้เป็นระบบบันทึกและแสดงผลรายงานปัญหาประจำวัน โดยใช้ Node.js (Express) เชื่อมต่อกับ Google Sheets และแสดงผลผ่านหน้าเว็บแบบ Responsive

## คุณสมบัติ
- ส่งข้อมูลจากฟอร์มไปบันทึกใน Google Sheets
- ดึงข้อมูลจาก Google Sheets มาแสดงผลในรูปแบบ Card/Modal
- รองรับการแนบและแสดงรูปภาพ (Google Drive URL หรือ =IMAGE)
- UI สวยงาม ใช้งานง่ายทั้งบนคอมพิวเตอร์และมือถือ
- สามารถแก้ไขสถานะและหมายเหตุใน popup ได้ทันทีด้วยปุ่ม "บันทึก" ปุ่มเดียว
- รองรับการรันผ่าน Docker

## การติดตั้ง

### วิธีที่ 1: ติดตั้งแบบปกติ
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

### วิธีที่ 2: ใช้ Docker
1. **Clone โปรเจกต์**
   ```bash
   git clone https://github.com/poteto22/reportform.git
   cd reportform
   ```
2. **เตรียมไฟล์ credentials.json** (เช่นเดียวกับวิธีที่ 1)
3. **รันด้วย Docker Compose**
   ```bash
   docker-compose up --build
   ```

## การตั้งค่า Google Sheets
- สร้าง Google Sheet และแชร์ให้ service account email สามารถแก้ไขได้
- กำหนด `SPREADSHEET_ID` และ `SHEET_NAME` ในไฟล์ `index.js`
- **index คอลัมน์ที่สำคัญ:**
  - ID = 0 (A)
  - วันที่ = 1 (B)
  - สถานะ = 6 (G)
  - หมายเหตุ = 8 (I)
  - รูปภาพ = 9-13 (J-N)
- ถ้าต้องการแนบรูปภาพ ให้ใส่ URL หรือสูตร `=IMAGE("url")` ในคอลัมน์ J-N

## การรันเซิร์ฟเวอร์

### แบบปกติ
```bash
npm start
# หรือ
node index.js
```

### แบบ Docker
```bash
# รันในโหมด development
docker-compose up

# รันในโหมด background
docker-compose up -d

# หยุดการทำงาน
docker-compose down
```

## การใช้งานหน้าเว็บ
### 1. เข้าถึงผ่าน Express Server
- เปิดเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000)
- Express จะเสิร์ฟหน้า `list.html` โดยอัตโนมัติ

### 2. เปิดไฟล์ list.html ตรง ๆ
- ดับเบิลคลิกไฟล์ `list.html` หรือเปิดผ่าน browser
- เหมาะกับการทดสอบบนเครื่องเดียวกับ server

### 3. การใช้งานจากเครื่องอื่นในเครือข่าย
- เปลี่ยน URL ใน `list.html` จาก `localhost` เป็น IP ของเครื่อง server เช่น `http://192.168.1.10:3000/list`
- ตรวจสอบ firewall และ network ให้อนุญาต port 3000

## API Endpoints

### GET `/list`
ดึงข้อมูลทั้งหมดจาก Google Sheets

### POST `/add`
เพิ่มข้อมูลใหม่ไปยัง Google Sheets
```json
{
  "values": ["ID", "วันที่", "รายละเอียด", ...]
}
```

### POST `/update-status`
อัปเดตสถานะของรายการ
```json
{
  "id": "ID_RECORD",
  "status": "NEW_STATUS"
}
```

### POST `/update-note`
อัปเดตหมายเหตุของรายการ
```json
{
  "id": "ID_RECORD",
  "note": "NEW_NOTE"
}
```

### POST `/update-status-note`
อัปเดตสถานะและหมายเหตุพร้อมกัน
```json
{
  "id": "ID_RECORD",
  "status": "NEW_STATUS",
  "note": "NEW_NOTE"
}
```

### GET `/image-proxy`
Proxy สำหรับแสดงรูปภาพจาก Google Drive

## Proxy รูปภาพ (แก้ปัญหา Google Drive ไม่แสดงรูป)
- รูปภาพทั้งหมดจะแสดงผ่าน proxy endpoint `/image-proxy?url=...`
- ไม่ได้เก็บไฟล์รูปภาพไว้ในเครื่อง แต่ดึงแบบ real-time ทุกครั้งที่มีการร้องขอ
- ถ้า URL รูปภาพมีอักขระแปลกปลอม (เช่น ") หรือ ) ต่อท้าย จะถูกตัดออกอัตโนมัติ
- ต้องตั้งค่า Google Drive ให้ไฟล์รูปเป็น "ทุกคนที่มีลิงก์ดูได้"

## การแก้ไขสถานะและหมายเหตุใน popup
- เมื่อคลิกที่ card จะมี popup แสดงรายละเอียด
- สามารถแก้ไขสถานะและหมายเหตุได้ใน popup เดียว
- กดปุ่ม "บันทึก" เพื่ออัปเดตข้อมูลทั้งสองอย่างไปยัง Google Sheets พร้อมกัน

## Dependencies
- **express**: Web framework
- **googleapis**: Google Sheets API
- **axios**: HTTP client สำหรับ proxy รูปภาพ
- **body-parser**: Parse request body
- **cors**: Cross-Origin Resource Sharing

## หมายเหตุ
- หากมีปัญหาเรื่อง CORS หรือรูปไม่แสดง ให้ใช้ proxy ตามตัวอย่าง
- หากมีการเปลี่ยนแปลงโครงสร้างคอลัมน์ใน Google Sheets ต้องปรับ index ในโค้ดให้ตรงกัน
- สำหรับ Docker ให้แน่ใจว่าไฟล์ `credentials.json` อยู่ในโฟลเดอร์โปรเจกต์

---

**ผู้พัฒนา:** [poteto22](https://github.com/poteto22) 