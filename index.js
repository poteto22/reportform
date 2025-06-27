const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { google } = require('googleapis');
const axios = require('axios');
const path = require('path');
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

const SPREADSHEET_ID = '1UxVL2nHjLYhVMG5mSlsJyGhNgaq57pd3dd3ccezlANY';
const SHEET_NAME = 'Reports';

const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

app.post('/add', async (req, res) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    const { values } = req.body; // ตัวอย่าง: { values: ["ชื่อ", "อีเมล", "ข้อความ"] }
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: 'RAW',
      resource: { values: [values] },
    });
    res.status(200).send('เพิ่มข้อมูลสำเร็จ');
  } catch (err) {
    res.status(500).send('เกิดข้อผิดพลาด: ' + err);
  }
});

app.get('/list', async (req, res) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:N1000`, // ปรับช่วงข้อมูลเป็น A ถึง N
    });
    res.status(200).json(response.data.values || []);
  } catch (err) {
    res.status(500).send('เกิดข้อผิดพลาด: ' + err);
  }
});

app.get('/image-proxy', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).send('Missing url parameter');
  }
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    res.set('Content-Type', response.headers['content-type']);
    res.send(response.data);
  } catch (err) {
    res.status(500).send('Error loading image');
  }
});


app.post('/update-status', async (req, res) => {
  try {
    const { id, status } = req.body;
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // ดึงข้อมูลทั้งหมดเพื่อหา row ที่ตรงกับ id
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:N1000`,
    });
    const rows = response.data.values;
    const header = rows[0];
    const idCol = 0; // สมมติว่า ID อยู่คอลัมน์ A (index 0)
    const statusCol = 6; // สมมติว่าสถานะอยู่คอลัมน์ G (index 6)

    // หาแถวที่ตรงกับ id
    const rowIndex = rows.findIndex((row, idx) => idx > 0 && row[idCol] === id);
    if (rowIndex === -1) {
      return res.status(404).send('ไม่พบข้อมูล');
    }

    // อัปเดตสถานะ
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!${String.fromCharCode(65 + statusCol)}${rowIndex + 1}`,
      valueInputOption: 'RAW',
      resource: { values: [[status]] },
    });

    res.status(200).send('อัปเดตสถานะสำเร็จ');
  } catch (err) {
    res.status(500).send('เกิดข้อผิดพลาด: ' + err);
  }
});

app.post('/update-note', async (req, res) => {
  try {
    const { id, note } = req.body;
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // ดึงข้อมูลทั้งหมดเพื่อหา row ที่ตรงกับ id
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:N1000`,
    });
    const rows = response.data.values;
    const idCol = 0; // ID อยู่คอลัมน์ A (index 0)
    const noteCol = 8; // หมายเหตุอยู่คอลัมน์ H (index 7)

    // หาแถวที่ตรงกับ id
    const rowIndex = rows.findIndex((row, idx) => idx > 0 && row[idCol] === id);
    if (rowIndex === -1) {
      return res.status(404).send('ไม่พบข้อมูล');
    }

    // อัปเดตหมายเหตุ
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!${String.fromCharCode(65 + noteCol)}${rowIndex + 1}`,
      valueInputOption: 'RAW',
      resource: { values: [[note]] },
    });

    res.status(200).send('อัปเดตหมายเหตุสำเร็จ');
  } catch (err) {
    res.status(500).send('เกิดข้อผิดพลาด: ' + err);
  }
});

app.post('/update-status-note', async (req, res) => {
  try {
    const { id, status, note } = req.body;
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // ดึงข้อมูลทั้งหมดเพื่อหา row ที่ตรงกับ id
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:N1000`,
    });
    const rows = response.data.values;
    const idCol = 0; // ID อยู่คอลัมน์ A (index 0)
    const statusCol = 6; // สถานะอยู่คอลัมน์ G (index 6)
    const noteCol = 8; // หมายเหตุอยู่คอลัมน์ I (index 8)

    // หาแถวที่ตรงกับ id
    const rowIndex = rows.findIndex((row, idx) => idx > 0 && row[idCol] === id);
    if (rowIndex === -1) {
      return res.status(404).send('ไม่พบข้อมูล');
    }

    // อัปเดตสถานะและหมายเหตุแยกกันเพื่อไม่ให้กระทบคอลัมน์อื่น
    // 1. อัปเดตสถานะ
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!${String.fromCharCode(65 + statusCol)}${rowIndex + 1}`,
      valueInputOption: 'RAW',
      resource: { values: [[status]] },
    });

    // 2. อัปเดตหมายเหตุ
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!${String.fromCharCode(65 + noteCol)}${rowIndex + 1}`,
      valueInputOption: 'RAW',
      resource: { values: [[note]] },
    });

    res.status(200).send('อัปเดตสถานะและหมายเหตุสำเร็จ');
  } catch (err) {
    res.status(500).send('เกิดข้อผิดพลาด: ' + err);
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'list.html'));
});

app.listen(3000, () => console.log('Server started on port 3000'));
