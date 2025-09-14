// api/auth.js

const { google } = require('googleapis');
const admin = require('firebase-admin');

// Firebase Admin 초기화 (환경변수에서 서비스 계정 키 가져오기)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
}

module.exports = async (req, res) => {
    // CORS 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    try {
        // Google Sheets 인증
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
        const auth = new google.auth.JWT(
            credentials.client_email,
            null,
            credentials.private_key,
            ['https://www.googleapis.com/auth/spreadsheets']
        );
        
        const sheets = google.sheets({ version: 'v4', auth });
        
        // 사용자 역할 조회
        if (req.method === 'POST' && req.url === '/api/getUserRole') {
            const { email } = req.body;
            
            // Google Sheets에서 사용자 정보 조회
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId: process.env.USERS_SHEET_ID, // 사용자 정보 시트 ID
                range: 'Users!A:D', // 이메일, 이름, 역할, 상태
            });
            
            const users = response.data.values;
            const userRow = users.find(row => row[0] === email);
            
            if (userRow && userRow[3] === 'active') {
                res.status(200).json({ 
                    role: userRow[2], // 역할
                    name: userRow[1]  // 이름
                });
            } else {
                // 기본값으로 staff 권한 부여
                res.status(200).json({ 
                    role: 'staff',
                    name: email.split('@')[0]
                });
            }
        }
        
        // 새 사용자 저장
        else if (req.method === 'POST' && req.url === '/api/saveUser') {
            const { email, name, role, createdAt } = req.body;
            
            // Google Sheets에 새 사용자 추가
            await sheets.spreadsheets.values.append({
                spreadsheetId: process.env.USERS_SHEET_ID,
                range: 'Users!A:E',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [[email, name, role, 'active', createdAt]]
                }
            });
            
            res.status(200).json({ success: true });
        }
        
        // Firebase 토큰 검증
        else if (req.method === 'POST' && req.url === '/api/verifyToken') {
            const authHeader = req.headers.authorization;
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                res.status(401).json({ error: '인증 토큰이 없습니다' });
                return;
            }
            
            const token = authHeader.split('Bearer ')[1];
            
            try {
                const decodedToken = await admin.auth().verifyIdToken(token);
                
                // Google Sheets에서 사용자 역할 조회
                const response = await sheets.spreadsheets.values.get({
                    spreadsheetId: process.env.USERS_SHEET_ID,
                    range: 'Users!A:D',
                });
                
                const users = response.data.values;
                const userRow = users.find(row => row[0] === decodedToken.email);
                
                res.status(200).json({
                    uid: decodedToken.uid,
                    email: decodedToken.email,
                    role: userRow ? userRow[2] : 'staff'
                });
            } catch (error) {
                res.status(401).json({ error: '유효하지 않은 토큰입니다' });
            }
        }
        
        else {
            res.status(404).json({ error: 'Not found' });
        }
        
    } catch (error) {
        console.error('API 오류:', error);
        res.status(500).json({ error: error.message });
    }
};