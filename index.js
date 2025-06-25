const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { google } = require('googleapis');
const app = express();
app.use(cors());
app.use(bodyParser.json());

const SPREADSHEET_ID = '1UxVL2nHjLYhVMG5mSlsJyGhNgaq57pd3dd3ccezlANY';
const SHEET_NAME = 'sheet2';

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

app.listen(3000, () => console.log('Server started on port 3000'));
