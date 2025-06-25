const { google } = require('googleapis');

const SPREADSHEET_ID = '1UxVL2nHjLYhVMG5mSlsJyGhNgaq57pd3dd3ccezlANY';
const SHEET_NAME = 'Reports';

const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function testConnection() {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:A1`,
    });
    console.log('เชื่อมต่อสำเร็จ! ข้อมูลที่อ่านได้:', res.data.values);
  } catch (err) {
    console.error('เชื่อมต่อไม่สำเร็จ:', err);
  }
}

testConnection();
