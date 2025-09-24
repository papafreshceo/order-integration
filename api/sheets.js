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
  getOrderData,
  updateOrderCell
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
    const ordersSpreadsheetId = process.env.SPREADSHEET_ID_ORDERS || '1UsUMd_haNOsRm2Yn8sFpFc7HUlJ_CEQ-91QctlkSjJg';
    
    console.log('CS 기록 저장 시작:', data);
    
    // CS기록 시트의 현재 데이터 개수 확인 (연번 계산용)
    let currentData;
    try {
      currentData = await getSheetData('CS기록!A2:B', ordersSpreadsheetId);
    } catch (error) {
      console.log('CS기록 시트가 없거나 비어있음');
      currentData = [];
    }
    
    // 연번 계산
    const newRowNumber = currentData.length + 1;
    
    // 접수번호 생성 (CS + YYYYMMDD + 3자리 일련번호)
    const today = new Date();
    const dateStr = today.getFullYear() + 
      String(today.getMonth() + 1).padStart(2, '0') + 
      String(today.getDate()).padStart(2, '0');
    
    // 오늘 날짜의 마지막 CS 번호 찾기
    let lastNumber = 0;
    if (currentData && currentData.length > 0) {
      for (let i = 0; i < currentData.length; i++) {
        const receiptNo = currentData[i][1] || '';  // B열이 접수번호
        if (receiptNo.startsWith(`CS${dateStr}`)) {
          const numPart = receiptNo.substring(10);  // CS20250924XXX에서 XXX 추출
          const num = parseInt(numPart);
          if (!isNaN(num) && num > lastNumber) {
            lastNumber = num;
          }
        }
      }
    }
    
    const sequenceNumber = String(lastNumber + 1).padStart(3, '0');
    const receiptNumber = `CS${dateStr}${sequenceNumber}`;
    
    console.log('생성된 접수번호:', receiptNumber);
    
    // CS기록 시트에 저장할 데이터 (22개 필드)
    const csRowData = [[
      newRowNumber,                      // 연번
      receiptNumber,                     // 접수번호
      data['마켓명'] || '',             // 마켓명
      new Date().toLocaleDateString('ko-KR'), // 접수일
      data['해결방법'] || '',           // 해결방법
      data['재발송상품'] || '',         // 재발송상품
      data['재발송수량'] || '',         // 재발송수량
      data['CS 내용'] || '',            // CS 내용
      data['부분환불금액'] || '',       // 부분환불금액
      data['결제일'] || '',             // 결제일
      data['주문번호'] || '',           // 주문번호
      data['주문자'] || '',             // 주문자
      data['주문자 전화번호'] || '',    // 주문자 전화번호
      data['수령인'] || '',             // 수령인
      data['수령인 전화번호'] || '',    // 수령인 전화번호
      data['주소'] || '',               // 주소
      data['배송메세지'] || '',         // 배송메세지
      data['옵션명'] || '',             // 옵션명
      data['수량'] || '',               // 수량
      data['특이/요청사항'] || '',      // 특이/요청사항
      data['발송요청일'] || '',         // 발송요청일
      '접수'                            // 상태
    ]];
    
    // CS기록 시트에 저장
    await appendSheetData('CS기록!A:V', csRowData, ordersSpreadsheetId);
    console.log('CS기록 시트 저장 완료');
    
    // 재발송 또는 부분재발송인 경우에만 임시저장 시트에도 저장
    if (data['해결방법'] === '재발송' || data['해결방법'] === '부분재발송') {
      console.log('재발송/부분재발송 - 임시저장 시트에도 저장');
      
      // 임시저장 시트 구조에 맞춰 저장
      const tempRowData = [[
        data['userEmail'] || '',          // 사용자 이메일
        receiptNumber,                     // 동일한 접수번호 사용
        new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }), // 저장시간
        data['마켓명'] || '',             // 마켓명
        data['옵션명'] || '',             // 옵션명
        data['수량'] || '1',              // 수량
        '',                                // 단가 (비워둠)
        '',                                // 택배비 (비워둠)
        '',                                // 상품금액 (비워둠)
        data['주문자'] || '',             // 주문자
        data['주문자 전화번호'] || '',    // 주문자 전화번호
        data['수령인'] || '',             // 수령인
        data['수령인 전화번호'] || '',    // 수령인 전화번호
        data['주소'] || '',               // 주소
        data['배송메세지'] || '',         // 배송메세지
        data['특이/요청사항'] || '',      // 특이/요청사항
        data['발송요청일'] || ''          // 발송요청일
      ]];
      
      await appendSheetData('임시저장!A:Q', tempRowData, ordersSpreadsheetId);
      console.log('임시저장 시트 저장 완료');
    }
    
    return res.status(200).json({
      success: true,
      message: 'CS 기록이 저장되었습니다',
      receiptNumber: receiptNumber
    });
    
  } catch (error) {
    console.error('saveCsRecord 오류:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      error: error.message || 'CS 기록 저장 실패',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }

case 'addCsOrder':
        try {
          const { data } = req.body;
          const ordersSpreadsheetId = process.env.SPREADSHEET_ID_ORDERS || '1UsUMd_haNOsRm2Yn8sFpFc7HUlJ_CEQ-91QctlkSjJg';
          
          console.log('CS 재발송 임시저장 시작:', data);
          
          // 임시저장 시트 확인 및 생성
          let tempHeaders = [];
          try {
              const tempData = await getOrderData('임시저장!1:1', ordersSpreadsheetId);
              if (tempData && tempData.length > 0) {
                  tempHeaders = tempData[0];
              }
          } catch (err) {
              // 시트가 없으면 생성
              console.log('임시저장 시트 생성 필요');
              await createOrderSheet('임시저장', ordersSpreadsheetId);
              tempHeaders = ['사용자이메일', '접수번호', '저장시간', '마켓명', '옵션명', '수량', '단가', '택배비', 
                            '상품금액', '주문자', '주문자 전화번호', '수령인', '수령인 전화번호', 
                            '주소', '배송메세지', '특이/요청사항', '발송요청일'];
              await saveOrderData('임시저장!A1', [tempHeaders], ordersSpreadsheetId);
          }
          
          // CS번호 생성
          const today = new Date();
          const dateStr = today.getFullYear() + 
            String(today.getMonth() + 1).padStart(2, '0') + 
            String(today.getDate()).padStart(2, '0');
            
          let csNumber = 1;
          try {
              const existingData = await getOrderData('임시저장!A:C', ordersSpreadsheetId);
              if (existingData && existingData.length > 1) {
                  for (let i = 1; i < existingData.length; i++) {
                      const email = existingData[i][0] || '';
                      if (email.startsWith('CS')) {
                          const match = email.match(/CS(\d+)/);
                          if (match) {
                              const num = parseInt(match[1]);
                              if (num >= csNumber) {
                                  csNumber = num + 1;
                              }
                          }
                      }
                  }
              }
          } catch (err) {
              console.log('CS 번호 확인 실패, 기본값 사용');
          }
          
          const csOrderNumber = `${dateStr}CS${String(csNumber).padStart(3, '0')}`;
          
          // 임시저장 데이터 추가
          // 한국 시간 생성
          const koreaTime = new Date().toLocaleString('ko-KR', {
              timeZone: 'Asia/Seoul',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
          });
          
          const tempRowData = [[
              data['userEmail'] || '',  // 로그인한 사용자 이메일
              csOrderNumber,  // 접수번호
              koreaTime,  // 한국 시간으로 저장
              data['마켓명'] || 'CS재발송',
              data['옵션명'] || '',
              data['수량'] || '1',
              '',  // 단가
              '',  // 택배비
              '',  // 상품금액
              data['주문자'] || '',
              data['주문자 전화번호'] || '',
              data['수령인'] || '',
              data['수령인 전화번호'] || '',
              data['주소'] || '',
              data['배송메세지'] || '',
              data['특이/요청사항'] || '',
              data['발송요청일'] || ''
          ]];
          
          await appendSheetData('임시저장!A:Q', tempRowData, ordersSpreadsheetId);
          
          console.log('CS 재발송 임시저장 완료:', csOrderNumber);
          
          return res.status(200).json({
            success: true,
            message: 'CS 재발송이 임시저장되었습니다',
            csOrderNumber: csOrderNumber
          });
          
        } catch (error) {
          console.error('addCsOrder 오류:', error.message, error.stack);
          return res.status(500).json({
            success: false,
            error: error.message || 'CS 주문 접수 실패'
          });
        }

      case 'getProductData':
        try {
          const productSpreadsheetId = process.env.SPREADSHEET_ID_PRODUCTS || '17MGwbu1DZf5yg-BLhfZr-DO-OPiau3aeyBMtSssv7Sg';
          
          // getSheetData 사용 (이미 import됨)
          const productSheetData = await getSheetData('통합상품마스터!A:DZ', productSpreadsheetId);
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



      case 'fetchVendorTemplates':
        try {
          const { range } = req.body;
          
          if (!range) {
            return res.status(400).json({ 
              success: false, 
              error: 'range가 필요합니다.' 
            });
          }
          
          // 환경변수에서 SPREADSHEET_ID 가져오기
          const spreadsheetId = process.env.SPREADSHEET_ID || '1kLjYKemytOfaH6kSXD7dqdiolx3j09Ir-V9deEnNImA';
          
          // getSheetData 함수 사용 (이미 import 되어 있음)
          const templateData = await getSheetData(range, spreadsheetId);
          
          if (!templateData || templateData.length === 0) {
            return res.status(200).json({ 
              success: true, 
              data: [] 
            });
          }
          
          return res.status(200).json({ 
            success: true, 
            data: templateData
          });
          
        } catch (error) {
          console.error('벤더 템플릿 조회 오류:', error);
          return res.status(500).json({ 
            success: false, 
            error: error.message || '벤더 템플릿 조회 실패'
          });
        }

     

      case 'getVendorTemplates':
        try {
          const { range } = req.body;
          
          if (!range) {
            return res.status(400).json({ 
              success: false, 
              error: 'range가 필요합니다.' 
            });
          }
          
          // 환경변수에서 SPREADSHEET_ID 가져오기
          const templateData = await getSheetData(range);
          
          if (!templateData || templateData.length === 0) {
            return res.status(200).json({ 
              success: true, 
              data: [] 
            });
          }
          
          return res.status(200).json({ 
            success: true, 
            data: templateData
          });
          
        } catch (error) {
          console.error('벤더 템플릿 조회 오류:', error);
          return res.status(500).json({ 
            success: false, 
            error: error.message || '벤더 템플릿 조회 실패'
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


case 'checkCsDuplicate':
        try {
          const { orderData } = req.body;
          const ordersSpreadsheetId = process.env.SPREADSHEET_ID_ORDERS || '1UsUMd_haNOsRm2Yn8sFpFc7HUlJ_CEQ-91QctlkSjJg';
          
          let csRecordExists = false;
          let tempSaveExists = false;
          
          // CS기록 시트 체크 - 4개 필드 모두 일치 확인
          try {
            const csData = await getSheetData('CS기록!A:Z', ordersSpreadsheetId);
            if (csData && csData.length > 1) {
              const headers = csData[0];
              
              // 헤더 인덱스 찾기
              const orderNoIdx = headers.indexOf('주문번호');
              const ordererIdx = headers.indexOf('주문자');
              const receiverIdx = headers.indexOf('수령인');
              const optionIdx = headers.indexOf('옵션명');
              
              // 데이터 행 검사
              for (let i = 1; i < csData.length; i++) {
                const row = csData[i];
                
                // 4개 필드 모두 일치하는지 확인 (빈값도 일치로 처리)
                const orderNoMatch = (row[orderNoIdx] || '') === (orderData.주문번호 || '');
                const ordererMatch = (row[ordererIdx] || '') === (orderData.주문자 || '');
                const receiverMatch = (row[receiverIdx] || '') === (orderData.수령인 || '');
                const optionMatch = (row[optionIdx] || '') === (orderData.옵션명 || '');
                
                if (orderNoMatch && ordererMatch && receiverMatch && optionMatch) {
                  csRecordExists = true;
                  console.log('CS기록 중복 발견:', {
                    주문번호: row[orderNoIdx],
                    주문자: row[ordererIdx],
                    수령인: row[receiverIdx],
                    옵션명: row[optionIdx]
                  });
                  break;
                }
              }
            }
          } catch (err) {
            console.log('CS기록 시트 체크 실패:', err);
          }
          
          // 임시저장 시트 체크 - 동일한 로직
          try {
            const tempData = await getSheetData('임시저장!A:Q', ordersSpreadsheetId);
            if (tempData && tempData.length > 1) {
              // 임시저장은 주문번호가 없을 수 있으므로 다른 필드로 체크
              for (let i = 1; i < tempData.length; i++) {
                const row = tempData[i];
                // 임시저장 구조: [사용자이메일, 접수번호, 저장시간, 마켓명, 옵션명, 수량, ..., 주문자, ..., 수령인, ...]
                const optionMatch = (row[4] || '') === (orderData.옵션명 || '');
                const ordererMatch = (row[9] || '') === (orderData.주문자 || '');
                const receiverMatch = (row[11] || '') === (orderData.수령인 || '');
                
                if (optionMatch && ordererMatch && receiverMatch) {
                  tempSaveExists = true;
                  console.log('임시저장 중복 발견');
                  break;
                }
              }
            }
          } catch (err) {
            console.log('임시저장 시트 체크 실패:', err);
          }
          
          return res.status(200).json({
            success: true,
            duplicate: {
              csRecord: csRecordExists,
              tempSave: tempSaveExists
            }
          });
          
        } catch (error) {
          console.error('checkCsDuplicate 오류:', error);
          return res.status(200).json({
            success: true,
            duplicate: { csRecord: false, tempSave: false }
          });
        }

 case 'getCsRecords':
        try {
          const ordersSpreadsheetId = process.env.SPREADSHEET_ID_ORDERS || '1UsUMd_haNOsRm2Yn8sFpFc7HUlJ_CEQ-91QctlkSjJg';
          
          // CS기록 시트의 모든 데이터 가져오기
          const csData = await getSheetData('CS기록!A2:V', ordersSpreadsheetId);
          
          if (!csData || csData.length === 0) {
            return res.status(200).json({ 
              success: true, 
              data: [] 
            });
          }
          
          // 헤더 정의 (시트의 실제 순서대로)
          const headers = [
            '연번', '접수번호', '마켓명', '접수일', '해결방법', 
            '재발송상품', '재발송수량', 'CS 내용', '부분환불금액', 
            '결제일', '주문번호', '주문자', '주문자 전화번호', 
            '수령인', '수령인 전화번호', '주소', '배송메세지', 
            '옵션명', '수량', '특이/요청사항', '발송요청일', '상태'
          ];
          
          // 데이터를 객체 배열로 변환
          const formattedData = csData.map(row => {
            const obj = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || '';
            });
            
            // 추가 필드 설정
            obj['처리일시'] = obj['접수일'];
            obj['CS사유'] = obj['CS 내용'];
            obj['처리내용'] = obj['해결방법'];
            obj['처리상태'] = obj['상태'] || '접수';
            obj['담당자'] = '-';
            
            return obj;
          }).filter(row => row['주문번호']); // 빈 행 제거
          
          console.log('CS기록 로드:', formattedData.length + '건');
          
          return res.status(200).json({ 
            success: true, 
            data: formattedData 
          });
          
        } catch (error) {
          console.error('getCsRecords 오류:', error);
          return res.status(500).json({ 
            success: false, 
            error: error.message || 'CS 기록 조회 실패' 
          });
        }




        case 'updateCsStatus':
        try {
          const { orderNumber, status } = req.body;
          const ordersSpreadsheetId = process.env.SPREADSHEET_ID_ORDERS || '1UsUMd_haNOsRm2Yn8sFpFc7HUlJ_CEQ-91QctlkSjJg';
          
          // CS기록 시트 데이터 가져오기
          const csData = await getSheetData('CS기록!A:T', ordersSpreadsheetId);
          
          if (!csData || csData.length < 2) {
            return res.status(404).json({ 
              success: false, 
              error: '데이터를 찾을 수 없습니다.' 
            });
          }
          
          // 주문번호 컬럼 찾기
          const headers = csData[0];
          const orderNoIndex = headers.indexOf('주문번호');
          const statusIndex = headers.indexOf('처리상태');
          
          if (orderNoIndex === -1) {
            return res.status(400).json({ 
              success: false, 
              error: '주문번호 컬럼을 찾을 수 없습니다.' 
            });
          }
          
          // 해당 주문번호 행 찾기
          let rowIndex = -1;
          for (let i = 1; i < csData.length; i++) {
            if (csData[i][orderNoIndex] === orderNumber) {
              rowIndex = i + 1; // 시트는 1부터 시작
              break;
            }
          }
          
          if (rowIndex === -1) {
            return res.status(404).json({ 
              success: false, 
              error: '해당 주문번호를 찾을 수 없습니다.' 
            });
          }
          
          // 처리상태 업데이트
          const range = `CS기록!T${rowIndex}`; // T열이 처리상태 (실제 컬럼 위치에 맞게 조정 필요)
          await updateSheetData(range, [[status]], ordersSpreadsheetId);
          
          return res.status(200).json({ 
            success: true, 
            message: '상태가 업데이트되었습니다.' 
          });
          
        } catch (error) {
          console.error('updateCsStatus 오류:', error);
          return res.status(500).json({ 
            success: false, 
            error: error.message || 'CS 상태 업데이트 실패' 
          });
        }


        case 'getTempOrders':
    try {
        const { userEmail } = req.body;
        const ordersSpreadsheetId = process.env.SPREADSHEET_ID_ORDERS;
        const tempData = await getOrderData('임시저장!A:O', ordersSpreadsheetId);
        
        if (!tempData || tempData.length < 2) {
            return res.status(200).json({ success: true, orders: [] });
        }
        
        const userOrders = [];
        for (let i = 1; i < tempData.length; i++) {
            if (tempData[i][0] === userEmail) {
                userOrders.push({
                    마켓명: tempData[i][2],
                    옵션명: tempData[i][3],
                    수량: parseInt(tempData[i][4]) || 1,
                    단가: parseFloat(tempData[i][5]) || 0,
                    택배비: parseFloat(tempData[i][6]) || 0,
                    상품금액: parseFloat(tempData[i][7]) || 0,
                    주문자: tempData[i][8],
                    '주문자 전화번호': tempData[i][9],
                    수령인: tempData[i][10],
                    '수령인 전화번호': tempData[i][11],
                    주소: tempData[i][12],
                    배송메세지: tempData[i][13],
                    발송요청일: tempData[i][14] || ''
                });
            }
        }
        
        return res.status(200).json({ success: true, orders: userOrders });
    } catch (error) {
        console.error('getTempOrders 오류:', error);
        return res.status(500).json({ success: false, error: error.message });
    }

case 'deleteTempOrders':
    try {
        const { userEmail } = req.body;
        const ordersSpreadsheetId = process.env.SPREADSHEET_ID_ORDERS;
        const tempData = await getOrderData('임시저장!A:O', ordersSpreadsheetId);
        
        if (!tempData || tempData.length < 2) {
            return res.status(200).json({ success: true });
        }
        
        const newData = [tempData[0]];
        
        for (let i = 1; i < tempData.length; i++) {
            if (tempData[i][0] !== userEmail) {
                newData.push(tempData[i]);
            }
        }
        
        await clearOrderSheet('임시저장!A:O');
        if (newData.length > 0) {
            await saveOrderData('임시저장!A1', newData);
        }
        
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('deleteTempOrders 오류:', error);
        return res.status(500).json({ success: false, error: error.message });
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
