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
          
          console.log('CS 기록 저장 시작:', { 
            spreadsheetId: ordersSpreadsheetId,
            data: data 
          });
          
          // CS기록 시트에 데이터 추가
          const rowData = [[
            data.마켓명 || '',
            '', // 연번은 시트에서 수식으로 자동 계산
            data.접수일 || new Date().toLocaleDateString('ko-KR'),
            data.해결방법 || '',
            data.결제일 || '',
            data.주문번호 || '',
            data.주문자 || '',
            data['주문자 전화번호'] || '',
            data.수령인 || '',
            data['수령인 전화번호'] || '',
            data.주소 || '',
            data.배송메세지 || '',
            data.옵션명 || '',
            data.수량 || '',
            data.재발송상품 || '',
            data.재발송수량 || '',
            data.부분환불금액 || ''
          ]];
          
          // appendSheetData 함수 호출 - 세 번째 매개변수로 spreadsheetId 전달
          const result = await appendSheetData('CS기록!A:Q', rowData, ordersSpreadsheetId);
          
          console.log('CS 기록 저장 완료:', result);
          
          return res.status(200).json({
            success: true,
            message: 'CS 기록이 저장되었습니다'
          });
          
        } catch (error) {
          console.error('saveCsRecord 오류:', error.message, error.stack);
          return res.status(500).json({
            success: false,
            error: error.message || 'CS 기록 저장 실패',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
          const { data } = req.body;
          
          // CS 접수일자로 시트명 생성 (오늘 날짜)
          const today = new Date();
          const sheetName = today.getFullYear() + 
            String(today.getMonth() + 1).padStart(2, '0') + 
            String(today.getDate()).padStart(2, '0');
          
          console.log('CS 주문 접수 - 시트명:', sheetName);
          
          // 1. 날짜 시트 존재 확인
          let sheetExists = false;
          let headers = [];
          
          try {
            const existingData = await getOrderData(`${sheetName}!1:1`);
            if (existingData && existingData.length > 0) {
              sheetExists = true;
              headers = existingData[0];
            }
          } catch (err) {
            sheetExists = false;
          }
          
          // 2. 시트가 없으면 생성
          if (!sheetExists) {
            console.log('새 시트 생성 필요');
            
            // mapping.js와 동일한 방식으로 표준필드 가져오기
            const mappingData = await getSheetData('매핑!A:AZ');
            console.log('매핑 시트 데이터 행 수:', mappingData.length);

            headers = [];

            if (mappingData.length >= 2) {
              // 2행(인덱스 1)에서 "표준필드시작" 마커 찾기
              const markerRow = mappingData[1];
              let standardFieldsStartCol = -1;
              
              for (let i = 0; i < markerRow.length; i++) {
                if (String(markerRow[i]).trim() === '표준필드시작') {
                  standardFieldsStartCol = i + 1;
                  break;
                }
              }
              
              console.log('표준필드시작 열 인덱스:', standardFieldsStartCol);
              
              if (standardFieldsStartCol !== -1) {
                // 표준필드 목록 생성 (표준필드시작 다음 열부터)
                for (let i = standardFieldsStartCol; i < markerRow.length; i++) {
                  const fieldName = String(markerRow[i] || '').trim();
                  if (fieldName === '') break;  // 빈 값이면 중단
                  headers.push(fieldName);
                }
              }
            }

            console.log('추출된 표준필드:', headers);
            console.log('표준필드 개수:', headers.length);

            // 표준필드를 못 찾았거나 비어있으면 기본 헤더 사용
            if (headers.length === 0) {
              console.log('표준필드를 찾을 수 없어 기본 헤더 사용');
              headers = [
                '연번', '마켓명', '마켓', '결제일', '주문번호', '상품주문번호',
                '주문자', '주문자전화번호', '수령인', '수령인전화번호', '주소',
                '배송메세지', '옵션명', '수량', '특이/요청사항', '발송요청일',
                '확인', '셀러', '셀러공급가', '출고처', '송장주체', '벤더사',
                '발송지명', '발송지주소', '발송지연락처', '출고비용',
                '정산예정금액', '정산대상금액', '상품금액', '최종결제금액',
                '할인금액', '마켓부담할인금액', '판매자할인쿠폰할인',
                '구매쿠폰적용금액', '쿠폰할인금액', '기타지원금할인금',
                '수수료1', '수수료2', '판매아이디', '분리배송 Y/N',
                '택배비', '발송일(송장입력일)', '택배사', '송장번호'
              ];
            }
            
            // 새 시트 생성
            await createOrderSheet(sheetName);
            
            // 표준필드 헤더 설정
            await saveOrderData(`${sheetName}!A1`, [headers]);
            console.log('시트 생성 및 헤더 설정 완료');
          }
          
          // 3. 제품 정보 가져오기 (재발송 상품 기준)
let productInfo = {};
if (data['옵션명']) {
    try {
        const productSpreadsheetId = process.env.SPREADSHEET_ID_PRODUCTS || '17MGwbu1DZf5yg-BLhfZr-DO-OPiau3aeyBMtSssv7Sg';

        
        const productSheetData = await getSheetData('통합상품마스터!A:DZ', productSpreadsheetId);
        
        if (productSheetData && productSheetData.length > 1) {
            const headers = productSheetData[0];
            const optionIdx = headers.indexOf('옵션명');
            const 출고처Idx = headers.indexOf('출고처');
            const 송장주체Idx = headers.indexOf('송장주체');
            const 벤더사Idx = headers.indexOf('벤더사');
            const 발송지명Idx = headers.indexOf('발송지명');
            const 발송지주소Idx = headers.indexOf('발송지주소');
            const 발송지연락처Idx = headers.indexOf('발송지연락처');
            
            // 옵션명으로 제품 찾기
            for (let i = 1; i < productSheetData.length; i++) {
                const optionName = String(productSheetData[i][optionIdx] || '').trim();
                if (optionName === data['옵션명']) {
                    productInfo = {
                        출고처: productSheetData[i][출고처Idx] || '',
                        송장주체: productSheetData[i][송장주체Idx] || '',
                        벤더사: productSheetData[i][벤더사Idx] || '',
                        발송지명: productSheetData[i][발송지명Idx] || '',
                        발송지주소: productSheetData[i][발송지주소Idx] || '',
                        발송지연락처: productSheetData[i][발송지연락처Idx] || ''
                    };
                    console.log(`제품 정보 찾음: ${data['옵션명']}`, productInfo);
                    break;
                }
            }
        }
    } catch (error) {
        console.error('제품 정보 조회 오류:', error);
    }
}

// 4. CS 번호 생성 (마켓 필드에 CS001, CS002...)
const ordersSpreadsheetId = process.env.SPREADSHEET_ID_ORDERS || '1UsUMd_haNOsRm2Yn8sFpFc7HUlJ_CEQ-91QctlkSjJg';
const allRows = await getOrderData(`${sheetName}!A:E`);
let csNumber = 1;

if (allRows && allRows.length > 1) {
    // 마켓 컬럼 찾기
    const marketIdx = headers.indexOf('마켓');
    
    // 기존 CS 번호 확인
    for (let i = 1; i < allRows.length; i++) {
        const market = allRows[i][marketIdx] || '';
        if (market.startsWith('CS')) {
            const num = parseInt(market.replace('CS', ''));
            if (!isNaN(num) && num >= csNumber) {
                csNumber = num + 1;
            }
        }
    }
}

const csMarketNumber = `CS${String(csNumber).padStart(3, '0')}`;
const csOrderNumber = `${sheetName}CS${String(csNumber).padStart(3, '0')}`;
console.log('생성된 CS 마켓번호:', csMarketNumber);
console.log('생성된 CS 주문번호:', csOrderNumber);

// 5. 연번 계산
const existingRows = await getOrderData(`${sheetName}!A:A`, ordersSpreadsheetId);
const nextSerial = existingRows ? existingRows.length : 1;
          
          // 6. 데이터 행 생성
const rowData = headers.map(header => {
    // header가 문자열이 아닌 경우 처리
    const headerStr = String(header || '');
    
    if (headerStr === '연번') {
        return nextSerial;
    }
    if (headerStr === '마켓') {
        return csMarketNumber;  // CS001, CS002...
    }
    if (headerStr === '주문번호') {
        return csOrderNumber;  // CS 주문번호 사용
    }
    if (headerStr === '발송요청일') {
        return data['발송요청일'] || '';  // 비어있으면 빈 값으로
    }
    
    // 제품 정보에서 가져올 필드들
    if (productInfo[headerStr]) {
        return productInfo[headerStr];
    }
    
    // 헤더명 정규화하여 데이터 매칭
    const normalizedHeader = headerStr.replace(/\s/g, '').replace(/[_-]/g, '');
    
    // 먼저 정확한 매칭 시도
    if (data[headerStr] !== undefined) {
        return data[headerStr] || '';
    }
    
    // 정규화된 키로 매칭
    for (const key of Object.keys(data)) {
        const normalizedKey = key.replace(/\s/g, '').replace(/[_-]/g, '');
        if (normalizedKey === normalizedHeader) {
            return data[key] || '';
        }
    }
    
    // 특수 케이스 처리
    if (headerStr === '주문자전화번호' && data['주문자 전화번호']) {
        return data['주문자 전화번호'];
    }
    if (headerStr === '수령인전화번호' && data['수령인 전화번호']) {
        return data['수령인 전화번호'];
    }
    
    return '';
});
    


          console.log('저장할 CS 주문 데이터:', rowData);
          
          // 6. 데이터 저장
          const targetRow = existingRows ? existingRows.length + 1 : 2;
          await saveOrderData(`${sheetName}!A${targetRow}`, [rowData]);
          
          console.log('CS 주문 저장 완료');
          
          return res.status(200).json({
            success: true,
            message: 'CS 재발송 주문이 접수되었습니다',
            sheetName: sheetName,
            csOrderNumber: csOrderNumber,
            row: targetRow
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

      case 'fetchVendorTemplates':
        try {
          const { spreadsheetId, range } = req.body;
          
          if (!spreadsheetId || !range) {
            return res.status(400).json({ 
              success: false, 
              error: 'spreadsheetId와 range가 필요합니다.' 
            });
          }
          
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
