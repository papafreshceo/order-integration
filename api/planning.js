// /api/planning.js
import { google } from 'googleapis';

// 환경변수에서 스프레드시트 ID 가져오기
const SPREADSHEET_ID = process.env.SPREADSHEET_ID_PLANNING || '1PhLfmWEP-XZ_3cv85okVksG3Q28zwS8qE7L5kyW76SY';

async function authorize() {
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return await auth.getClient();
}


export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { action, range, data, rowIndex } = req.body;

    try {
        const auth = await authorize();
        const sheets = google.sheets({ version: 'v4', auth });

        switch(action) {
            case 'getData':
                const getResult = await sheets.spreadsheets.values.get({
                    spreadsheetId: SPREADSHEET_ID,
                    range: range
                });
                return res.json({ 
                    success: true, 
                    data: getResult.data.values || [] 
                });

            case 'appendData':
                // 데이터를 배열로 변환
                const headers = Object.keys(data);
                const values = [Object.values(data)];
                
                await sheets.spreadsheets.values.append({
                    spreadsheetId: SPREADSHEET_ID,
                    range: range,
                    valueInputOption: 'USER_ENTERED',
                    insertDataOption: 'INSERT_ROWS',
                    requestBody: { values }
                });
                
                return res.json({ success: true });

            case 'updateData':
                if (!rowIndex) {
                    return res.json({ 
                        success: false, 
                        error: 'Row index is required for update' 
                    });
                }
                
                // 특정 행 업데이트
                const updateRange = range.replace('!A:Z', `!A${rowIndex}:Z${rowIndex}`);
                const updateValues = [Object.values(data)];
                
                await sheets.spreadsheets.values.update({
                    spreadsheetId: SPREADSHEET_ID,
                    range: updateRange,
                    valueInputOption: 'USER_ENTERED',
                    requestBody: { values: updateValues }
                });
                
                return res.json({ success: true });

            case 'deleteData':
                if (!rowIndex) {
                    return res.json({ 
                        success: false, 
                        error: 'Row index is required for delete' 
                    });
                }
                
                // 행 삭제 (빈 값으로 덮어쓰기)
                const deleteRange = range.replace('!A:Z', `!A${rowIndex}:Z${rowIndex}`);
                const emptyRow = [Array(26).fill('')]; // 26 columns with empty values
                
                await sheets.spreadsheets.values.update({
                    spreadsheetId: SPREADSHEET_ID,
                    range: deleteRange,
                    valueInputOption: 'USER_ENTERED',
                    requestBody: { values: emptyRow }
                });
                
                return res.json({ success: true });

            default:
                return res.json({ 
                    success: false, 
                    error: 'Invalid action' 
                });
        }
    } catch (error) {
        console.error('Planning API Error:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
}