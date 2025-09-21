const { 
  getSheetData, 
  updateSheetData, 
  appendSheetData, 
  clearSheet,
  createSheet,
  // 주문 시트 함수들
  createOrderSheet,
  clearOrderSheet,
  saveOrderData,
  mergeAndSaveOrderData,
  getOrderData
} = require('../lib/google-sheets');

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action, sheetName, range, values } = req.body || req.query;

    switch (action) {
       case 'saveCsRecord':
        try {
          const { data } = req.body;
          const ordersSpreadsheetId = process.env.SPREADSHEET_ID_ORDERS;
          
          // Google Sheets API 직접 사용
          const { google } = require('googleapis');
          const auth = await getAuth(); // 인증 함수
          const sheets = google.sheets({ version: 'v4', auth });
          
          // CS기록 시트의 헤더 읽기 (2행이 헤더)
          const headerResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: ordersSpreadsheetId,
            range: 'CS기록!2:2'
          });
          
          const headers = headerResponse.data.values?.[0];
          
          if (!headers || headers.length === 0) {
            throw new Error('CS기록 시트 헤더를 찾을 수 없습니다');
          }
          
          // 현재 데이터 읽어서 다음 연번 계산
          const dataResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: ordersSpreadsheetId,
            range: 'CS기록!A3:A'
          });
          
          const existingData = dataResponse.data.values;
          const nextSerial = existingData ? existingData.length + 1 : 1;
          
          // 데이터 배열 생성
          const rowData = headers.map(header => {
            if (header === '연번') {
              return nextSerial;
            }
            // 헤더명에서 공백 제거하여 매칭
            const normalizedHeader = header.replace(/\s/g, '');
            
            for (const key of Object.keys(data)) {
              if (key.replace(/\s/g, '') === normalizedHeader) {
                return data[key] || '';
              }
            }
            
            return data[header] || '';
          });
          
          // CS기록 시트에 추가
          const targetRow = 3 + (existingData ? existingData.length : 0);
          
          await sheets.spreadsheets.values.update({
            spreadsheetId: ordersSpreadsheetId,
            range: `CS기록!A${targetRow}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
              values: [rowData]
            }
          });
          
          return res.status(200).json({
            success: true,
            message: 'CS 기록이 저장되었습니다',
            serial: nextSerial
          });
          
        } catch (error) {
          console.error('saveCsRecord 오류:', error);
          return res.status(500).json({
            success: false,
            error: error.message || 'CS 기록 저장 중 오류 발생'
          });
        }

      case 'getNextCsNumber':
        try {
          const { sheetName } = req.body;
          const ordersSpreadsheetId = process.env.SPREADSHEET_ID_ORDERS;
          
          // 해당 날짜 시트가 있는지 확인
          try {
            const sheetData = await getOrderData(`${sheetName}!B:B`, ordersSpreadsheetId);
            
            if (sheetData && sheetData.length > 1) {
              // B열(마켓) 데이터에서 CS로 시작하는 번호 찾기
              let maxCsNumber = 0;
              
              for (let i = 1; i < sheetData.length; i++) {
                const market = sheetData[i][0] || '';
                if (market.startsWith('CS')) {
                  const numberPart = parseInt(market.replace('CS', ''));
                  if (!isNaN(numberPart) && numberPart > maxCsNumber) {
                    maxCsNumber = numberPart;
                  }
                }
              }
              
              const nextNumber = maxCsNumber + 1;
              return res.status(200).json({
                success: true,
                csNumber: `CS${String(nextNumber).padStart(3, '0')}`
              });
            }
          } catch (err) {
            // 시트가 없는 경우
          }
          
          // 기본값 반환
          return res.status(200).json({
            success: true,
            csNumber: 'CS001'
          });
          
        } catch (error) {
          console.error('getNextCsNumber 오류:', error);
          return res.status(200).json({
            success: true,
            csNumber: 'CS001'
          });
        }

      case 'addCsOrder':
        try {
          const { sheetName, data } = req.body;
          const ordersSpreadsheetId = process.env.SPREADSHEET_ID_ORDERS;
          const mainSpreadsheetId = process.env.SPREADSHEET_ID;
          
          // 날짜 시트 존재 확인
          let sheetExists = false;
          let headers = [];
          
          try {
            const existingData = await getOrderData(`${sheetName}!1:1`, ordersSpreadsheetId);
            if (existingData && existingData.length > 0) {
              sheetExists = true;
              headers = existingData[0];
            }
          } catch (err) {
            sheetExists = false;
          }
          
          // 시트가 없으면 생성
          if (!sheetExists) {
            // 매핑 시트에서 표준필드 가져오기
            const mappingData = await getSheetData('매핑!A:B', mainSpreadsheetId);
            
            if (!mappingData || mappingData.length < 2) {
              throw new Error('매핑 시트에서 표준필드를 찾을 수 없습니다');
            }
            
            // 표준필드 찾기 (B열)
            const standardFields = [];
            let foundHeader = false;
            
            for (let i = 0; i < mappingData.length; i++) {
              if (mappingData[i][1] === '표준필드') {
                foundHeader = true;
                continue;
              }
              if (foundHeader && mappingData[i][1]) {
                standardFields.push(mappingData[i][1]);
              }
            }
            
            if (standardFields.length === 0) {
              // 기본 헤더 사용
              headers = [
                '연번', '마켓명', '마켓', '결제일', '주문번호', '상품주문번호',
                '주문자', '주문자전화번호', '수령인', '수령인전화번호', '주소',
                '배송메세지', '옵션명', '수량', '특이/요청사항', '발송요청일'
              ];
            } else {
              headers = standardFields;
            }
            
            // 새 시트 생성
            await createSheet(sheetName, ordersSpreadsheetId);
            
            // 헤더 설정
            await updateSheetData(`${sheetName}!A1:${columnToLetter(headers.length)}1`, 
              [headers], ordersSpreadsheetId);
          }
          
          // 연번 계산
          const existingRows = await getOrderData(`${sheetName}!A:A`, ordersSpreadsheetId);
          const nextSerial = existingRows ? existingRows.length : 1;
          
          // 데이터 행 생성
          const rowData = headers.map(header => {
            if (header === '연번') {
              return nextSerial;
            }
            
            // 헤더명 정규화
            const normalizedHeader = header.replace(/\s/g, '').replace(/[_-]/g, '');
            
            // 데이터에서 매칭되는 키 찾기
            for (const key of Object.keys(data)) {
              const normalizedKey = key.replace(/\s/g, '').replace(/[_-]/g, '');
              if (normalizedKey === normalizedHeader) {
                return data[key] || '';
              }
            }
            
            return data[header] || '';
          });
          
          // 데이터 추가
          const targetRow = existingRows ? existingRows.length + 1 : 2;
          const targetRange = `${sheetName}!A${targetRow}:${columnToLetter(headers.length)}${targetRow}`;
          
          await updateSheetData(targetRange, [rowData], ordersSpreadsheetId);
          
          return res.status(200).json({
            success: true,
            message: 'CS 재발송 주문이 접수되었습니다',
            sheetName: sheetName,
            row: targetRow
          });
          
        } catch (error) {
          console.error('addCsOrder 오류:', error);
          return res.status(500).json({
            success: false,
            error: error.message
          });
        }

      case 'getProductData':
        try {
          // 기존 코드 유지
          const productSpreadsheetId = process.env.SPREADSHEET_ID_PRODUCTS || '17MGwbu1DZf5yg-BLhfZr-DO-OPiau3aeyBMtSssv7Sg';
          
          const { getProductSheetData } = require('../lib/google-sheets');
          
          const productSheetData = await getProductSheetData(productSpreadsheetId, '통합상품마스터!A:DZ');
          const productInfo = {};
          
          if (productSheetData && productSheetData.length > 1) {
              const headers = productSheetData[0];
              const optionIdx = headers.indexOf('옵션명');
              
              for (let i = 1; i < productSheetData.length; i++) {
                  const optionName = String(productSheetData[i][optionIdx] || '').trim();
                  if (!optionName) continue;
                  
                  const rowData = {};
                  headers.forEach((header, idx) => {
                      if (header && header !== '옵션명') {
                          const value = productSheetData[i][idx];
                          if (header.includes('비용') || header.includes('가격') || header.includes('금액')) {
                              rowData[header] = parseNumber(value);
                          } else {
                              rowData[header] = String(value || '').trim();
                          }
                      }
                  });
                  
                  productInfo[optionName] = rowData;
              }
          }
          
          return res.status(200).json({
              productData: productInfo,
              priceData: productInfo
          });
          
        } catch (error) {
          console.error('getProductData 오류:', error);
          return res.status(500).json({
              error: 'Failed to load product data',
              details: error.message
          });
        }

      case 'getOrdersByDate':
        try {
          const { sheetName, spreadsheetId } = req.body;
          const { getOrderData } = require('../lib/google-sheets');
          
          const orderData = await getOrderData(`${sheetName}!A:ZZ`, spreadsheetId || process.env.SPREADSHEET_ID_ORDERS);
          
          if (!orderData || orderData.length < 2) {
            return res.status(200).json({ success: true, data: [] });
          }
          
          const headers = orderData[0];
          const rows = orderData.slice(1);
          
          const formattedData = rows.map(row => {
            const obj = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || '';
            });
            return obj;
          });
          
          return res.status(200).json({ success: true, data: formattedData });
        } catch (error) {
          console.error('getOrdersByDate 오류:', error);
          return res.status(200).json({ success: true, data: [] });
        }

      case 'getTodayOrders':
        try {
          const today = new Date().toLocaleDateString('ko-KR', {
            timeZone: 'Asia/Seoul',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).replace(/\. /g, '').replace(/\./g, '').replace(/-/g, '');
          
          const { getOrderData } = require('../lib/google-sheets');
          const targetSpreadsheetId = process.env.SPREADSHEET_ID_ORDERS;
          
          const orderData = await getOrderData(`${today}!A:ZZ`, targetSpreadsheetId);
          
          if (!orderData || orderData.length < 2) {
            return res.status(200).json({ success: true, data: [] });
          }
          
          const headers = orderData[0];
          const rows = orderData.slice(1);
          
          const formattedData = rows.map(row => {
            const obj = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || '';
            });
            return obj;
          });
          
          const mappingData = await getSheetData('매핑!A:D');
          const colors = {};
          
          if (mappingData && mappingData.length > 2) {
            let headerRowIndex = -1;
            for (let i = 0; i < Math.min(5, mappingData.length); i++) {
              if (mappingData[i] && mappingData[i][0] === '마켓명') {
                headerRowIndex = i;
                break;
              }
            }
            
            if (headerRowIndex !== -1) {
              for (let i = headerRowIndex + 1; i < mappingData.length; i++) {
                const row = mappingData[i];
                if (row && row[0]) {
                  const marketName = String(row[0]).trim();
                  const colorValue = row[2] ? String(row[2]).trim() : '';
                  
                  if (marketName && colorValue) {
                    if (colorValue.match(/^\d+,\s*\d+,\s*\d+$/)) {
                      colors[marketName] = `rgb(${colorValue})`;
                    } else if (colorValue.startsWith('rgb(')) {
                      colors[marketName] = colorValue;
                    }
                  }
                }
              }
            }
          }
          
          return res.status(200).json({ 
            success: true, 
            data: formattedData,
            colors: colors
          });
          
        } catch (error) {
          console.error('getTodayOrders 오류:', error);
          return res.status(500).json({ 
            success: false, 
            error: error.message 
          });
        }

      case 'getOrdersByDateRange':
        try {
          const { startDate, endDate } = req.body;
          const { getOrderData } = require('../lib/google-sheets');
          const targetSpreadsheetId = process.env.SPREADSHEET_ID_ORDERS;
          
          if (!startDate || !endDate) {
            const today = new Date().toLocaleDateString('ko-KR', {
              timeZone: 'Asia/Seoul',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }).replace(/\. /g, '').replace(/\./g, '').replace(/-/g, '');
            
            const orderData = await getOrderData(`${today}!A:ZZ`, targetSpreadsheetId);
            
            if (!orderData || orderData.length < 2) {
              return res.status(200).json({ 
                success: true, 
                orders: [],
                colors: {},
                headers: []
              });
            }
            
            const headers = orderData[0];
            const rows = orderData.slice(1);
            
            const formattedData = rows.map((row, index) => {
              const obj = { '연번': index + 1 };
              headers.forEach((header, idx) => {
                obj[header] = row[idx] || '';
              });
              return obj;
            });
            
            const mappingData = await getSheetData('매핑!A:D');
            const colors = {};
            
            if (mappingData && mappingData.length > 2) {
              let headerRowIndex = -1;
              for (let i = 0; i < 5 && i < mappingData.length; i++) {
                if (mappingData[i] && mappingData[i][0] === '마켓명') {
                  headerRowIndex = i;
                  break;
                }
              }
              
              if (headerRowIndex !== -1) {
                for (let i = headerRowIndex + 1; i < mappingData.length; i++) {
                  const row = mappingData[i];
                  if (row && row[0]) {
                    const marketName = String(row[0]).trim();
                    const colorValue = row[2] ? String(row[2]).trim() : '';
                    
                    if (marketName && colorValue) {
                      if (colorValue.match(/^\d+,\s*\d+,\s*\d+$/)) {
                        colors[marketName] = `rgb(${colorValue})`;
                      } else if (colorValue.startsWith('rgb(')) {
                        colors[marketName] = colorValue;
                      }
                    }
                  }
                }
              }
            }
            
            return res.status(200).json({ 
              success: true, 
              orders: formattedData,
              colors: colors,
              headers: headers,
              totalCount: formattedData.length
            });
          }
          
          const orders = [];
          let allHeaders = new Set(['연번']);
          
          const start = new Date(startDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'));
          const end = new Date(endDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'));
          
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0].replace(/-/g, '');
            
            try {
              const dayData = await getOrderData(`${dateStr}!A:ZZ`, targetSpreadsheetId);
              
              if (dayData && dayData.length > 1) {
                const headers = dayData[0];
                headers.forEach(h => allHeaders.add(h));
                
                for (let i = 1; i < dayData.length; i++) {
                  const row = dayData[i];
                  const order = {};
                  
                  headers.forEach((header, index) => {
                    order[header] = row[index] || '';
                  });
                  
                  orders.push(order);
                }
              }
            } catch (err) {
              console.log(`날짜 ${dateStr} 시트 없음`);
            }
          }
          
          orders.forEach((order, index) => {
            order['연번'] = index + 1;
          });
          
          const mappingData = await getSheetData('매핑!A:D');
          const colors = {};
          
          if (mappingData && mappingData.length > 2) {
            let headerRowIndex = -1;
            for (let i = 0; i < 5 && i < mappingData.length; i++) {
              if (mappingData[i] && mappingData[i][0] === '마켓명') {
                headerRowIndex = i;
                break;
              }
            }
            
            if (headerRowIndex !== -1) {
              for (let i = headerRowIndex + 1; i < mappingData.length; i++) {
                const row = mappingData[i];
                if (row && row[0]) {
                  const marketName = String(row[0]).trim();
                  const colorValue = row[2] ? String(row[2]).trim() : '';
                  
                  if (marketName && colorValue) {
                    if (colorValue.match(/^\d+,\s*\d+,\s*\d+$/)) {
                      colors[marketName] = `rgb(${colorValue})`;
                    } else if (colorValue.startsWith('rgb(')) {
                      colors[marketName] = colorValue;
                    }
                  }
                }
              }
            }
          }
          
          return res.status(200).json({ 
            success: true, 
            orders: orders,
            colors: colors,
            headers: Array.from(allHeaders),
            totalCount: orders.length
          });
          
        } catch (error) {
          console.error('getOrdersByDateRange 오류:', error);
          return res.status(500).json({ 
            success: false, 
            error: error.message 
          });
        }

      case 'updateTracking':
        try {
          const { sheetName, updates } = req.body;
          const { getOrderData, updateOrderCell } = require('../lib/google-sheets');
          const targetSpreadsheetId = process.env.SPREADSHEET_ID_ORDERS;
          
          const headerData = await getOrderData(`${sheetName}!1:1`, targetSpreadsheetId);
          const headers = headerData[0];
          
          const orderNumCol = headers.indexOf('주문번호');
          const carrierCol = headers.indexOf('택배사');
          const trackingCol = headers.indexOf('송장번호');
          const dateCol = headers.indexOf('발송일(송장입력일)');
          
          const getColumnLetter = (col) => {
            let letter = '';
            let num = col;
            while (num >= 0) {
              letter = String.fromCharCode((num % 26) + 65) + letter;
              num = Math.floor(num / 26) - 1;
            }
            return letter;
          };
          
          const orderNumLetter = getColumnLetter(orderNumCol);
          const orderData = await getOrderData(`${sheetName}!${orderNumLetter}:${orderNumLetter}`, targetSpreadsheetId);
          
          const today = new Date().toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).replace(/\. /g, '-').replace(/\./g, '');
          
          let updateCount = 0;
          
          for (const update of updates) {
            let targetRow = -1;
            for (let i = 1; i < orderData.length; i++) {
              if (orderData[i][0] === update.orderNumber) {
                targetRow = i + 1;
                break;
              }
            }
            
            if (targetRow > 0) {
              if (update.carrier && carrierCol >= 0) {
                const cell = `${sheetName}!${getColumnLetter(carrierCol)}${targetRow}`;
                await updateOrderCell(cell, update.carrier, targetSpreadsheetId);
              }
              
              if (update.trackingNumber && trackingCol >= 0) {
                const cell = `${sheetName}!${getColumnLetter(trackingCol)}${targetRow}`;
                await updateOrderCell(cell, update.trackingNumber, targetSpreadsheetId);
              }
              
              if (update.trackingNumber && dateCol >= 0) {
                const cell = `${sheetName}!${getColumnLetter(dateCol)}${targetRow}`;
                await updateOrderCell(cell, today, targetSpreadsheetId);
              }
              
              updateCount++;
            }
          }
          
          return res.status(200).json({ 
            success: true, 
            updated: updateCount,
            message: `${updateCount}건의 송장번호가 업데이트되었습니다`
          });
          
        } catch (error) {
          console.error('updateTracking 오류:', error);
          return res.status(500).json({ 
            success: false, 
            error: error.message || '송장번호 업데이트 실패'
          });
        }

      case 'getMarketFormats':
        try {
          const formatData = await getSheetData('마켓별송장업로드양식!A:Z');
          
          const formats = {};
          
          if (formatData && formatData.length > 0) {
            const markets = formatData[0].filter(cell => cell);
            
            markets.forEach((market, colIndex) => {
              formats[market] = [];
              for (let rowIndex = 1; rowIndex < formatData.length; rowIndex++) {
                const field = formatData[rowIndex][colIndex];
                if (field) {
                  formats[market].push(field);
                }
              }
            });
          }
          
          if (Object.keys(formats).length === 0) {
            formats['쿠팡'] = ['주문번호', '택배사', '송장번호'];
            formats['네이버'] = ['상품주문번호', '택배사코드', '송장번호'];
            formats['11번가'] = ['배송번호', '택배사', '송장번호'];
            formats['지마켓'] = ['주문번호', '택배사', '운송장번호'];
            formats['옥션'] = ['주문번호', '택배사', '운송장번호'];
            formats['인터파크'] = ['주문번호', '택배사', '송장번호'];
            formats['티몬'] = ['주문번호', '택배사', '송장번호'];
            formats['위메프'] = ['주문번호', '택배사', '송장번호'];
          }
          
          return res.status(200).json({ 
            success: true, 
            formats: formats 
          });
          
        } catch (error) {
          console.error('getMarketFormats 오류:', error);
          return res.status(200).json({ 
            success: true, 
            formats: {
              '쿠팡': ['주문번호', '택배사', '송장번호'],
              '네이버': ['상품주문번호', '택배사코드', '송장번호'],
              '11번가': ['배송번호', '택배사', '송장번호']
            }
          });
        }

      case 'getMarketData':
        try {
          const { useMainSpreadsheet } = req.body;
          
          if (useMainSpreadsheet) {
            const today = new Date().toLocaleDateString('ko-KR', {
              timeZone: 'Asia/Seoul',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }).replace(/\. /g, '').replace(/\./g, '').replace(/-/g, '');
            
            const { getOrderData } = require('../lib/google-sheets');
            let orderData = [];
            
            try {
              const rawOrderData = await getOrderData(`${today}!A:ZZ`, process.env.SPREADSHEET_ID_ORDERS);
              
              if (rawOrderData && rawOrderData.length >= 2) {
                const headers = rawOrderData[0];
                const rows = rawOrderData.slice(1);
                
                orderData = rows.map(row => {
                  const obj = {};
                  headers.forEach((header, index) => {
                    obj[header] = row[index] || '';
                  });
                  return obj;
                });
              }
            } catch (orderError) {
              console.log('주문 데이터 로드 실패:', orderError.message);
            }
            
            let markets = [];
            let colors = {};
            
            try {
              const mappingData = await getSheetData('매핑!A:D');
              
              if (mappingData && mappingData.length > 2) {
                let headerRowIndex = -1;
                for (let i = 0; i < Math.min(5, mappingData.length); i++) {
                  if (mappingData[i] && mappingData[i][0] === '마켓명') {
                    headerRowIndex = i;
                    break;
                  }
                }
                
                if (headerRowIndex !== -1) {
                  for (let i = headerRowIndex + 1; i < mappingData.length; i++) {
                    const row = mappingData[i];
                    if (row && row[0]) {
                      const marketName = String(row[0]).trim();
                      const colorValue = row[2] ? String(row[2]).trim() : '';
                      
                      if (marketName) {
                        markets.push(marketName);
                        
                        if (colorValue) {
                          if (colorValue.match(/^\d+,\s*\d+,\s*\d+$/)) {
                            colors[marketName] = `rgb(${colorValue})`;
                          } else if (colorValue.startsWith('rgb(')) {
                            colors[marketName] = colorValue;
                          }
                        }
                      }
                    }
                  }
                }
              }
            } catch (mappingError) {
              console.log('매핑 데이터 로드 실패:', mappingError.message);
            }
            
            return res.status(200).json({ 
              success: true,
              data: orderData,
              markets: markets,
              colors: colors
            });
            
          } else {
            const mappingData = await getSheetData('매핑!A:D');
            
            const markets = [];
            const colors = {};
            
            if (mappingData && mappingData.length > 2) {
              let headerRowIndex = -1;
              for (let i = 0; i < Math.min(5, mappingData.length); i++) {
                if (mappingData[i] && mappingData[i][0] === '마켓명') {
                  headerRowIndex = i;
                  break;
                }
              }
              
              if (headerRowIndex !== -1) {
                for (let i = headerRowIndex + 1; i < mappingData.length; i++) {
                  const row = mappingData[i];
                  if (row && row[0]) {
                    const marketName = String(row[0]).trim();
                    const colorValue = row[2] ? String(row[2]).trim() : '';
                    
                    if (marketName) {
                      markets.push(marketName);
                      
                      if (colorValue) {
                        if (colorValue.match(/^\d+,\s*\d+,\s*\d+$/)) {
                          colors[marketName] = `rgb(${colorValue})`;
                        } else if (colorValue.startsWith('rgb(')) {
                          colors[marketName] = colorValue;
                        }
                      }
                    }
                  }
                }
              }
            }
            
            return res.status(200).json({ 
              success: true, 
              markets: markets.length > 0 ? markets : ['쿠팡', '네이버', '11번가'],
              colors: colors
            });
          }
        } catch (error) {
          console.error('getMarketData 오류:', error);
          return res.status(200).json({ 
            success: true, 
            markets: ['쿠팡', '네이버', '11번가'],
            colors: {}
          });
        }

      case 'saveToSheet':
        const sheetResult = await createOrderSheet(sheetName);
        
        const headerRow = values[0];
        const dataRows = values.slice(1);
        
        const marketColorMap = req.body.marketColors || {};
        
        const result = await mergeAndSaveOrderData(
          sheetName, 
          dataRows, 
          headerRow,
          marketColorMap
        );
        
        return res.status(200).json({ 
          success: true, 
          sheetName: sheetName,
          ...result
        });

      case 'appendToSheet':
        const appendResult = await appendSheetData(range, values);
        return res.status(200).json({ 
          success: true, 
          result: appendResult 
        });

      default:
        return res.status(400).json({ 
          error: '알 수 없는 액션입니다.' 
        });
    }
  } catch (error) {
    console.error('Sheets API 오류:', error);
    res.status(500).json({ 
      error: error.message || '서버 오류가 발생했습니다.' 
    });
  }
}

// 컬럼 번호를 알파벳으로 변환하는 헬퍼 함수
function columnToLetter(column) {
  let temp, letter = '';
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}

function parseNumber(value) {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  if (typeof value === 'number') {
    return value;
  }
  let strValue = String(value).trim();
  strValue = strValue.replace(/[,₩￦$¥£€\s]/g, '');
  if (strValue.startsWith('(') && strValue.endsWith(')')) {
    strValue = '-' + strValue.substring(1, strValue.length - 1);
  }
  const num = parseFloat(strValue);
  return isNaN(num) ? 0 : num;
}