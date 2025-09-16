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
  mergeAndSaveOrderData
} = require('../lib/google-sheets');

// 마켓별 색상 매핑 (매핑 데이터에서 가져와야 하지만, 일단 하드코딩)
const marketColorMapping = {
  '스마트스토어': { color: '76,175,80', textColor: '#fff' },
  '쿠팡': { color: '229,57,53', textColor: '#fff' },
  '11번가': { color: '244,67,54', textColor: '#fff' },
  'G마켓': { color: '76,175,80', textColor: '#fff' },
  '옥션': { color: '255,152,0', textColor: '#000' },
  '위메프': { color: '233,30,99', textColor: '#fff' },
  'GS샵': { color: '233,30,99', textColor: '#fff' },
  '카카오': { color: '255,235,59', textColor: '#000' },
  '티몬': { color: '229,57,53', textColor: '#fff' },
  'SSG': { color: '244,67,54', textColor: '#fff' },
  '인터파크': { color: '255,87,34', textColor: '#fff' },
  '롯데온': { color: '244,67,54', textColor: '#fff' },
  '텐바이텐': { color: '156,39,176', textColor: '#fff' },
  '에이블리': { color: '233,30,99', textColor: '#fff' },
  '브랜디': { color: '103,58,183', textColor: '#fff' },
  '무신사': { color: '33,33,33', textColor: '#fff' },
  '지그재그': { color: '233,30,99', textColor: '#fff' },
  '29CM': { color: '33,33,33', textColor: '#fff' },
  '룩핀': { color: '233,30,99', textColor: '#fff' },
  '스타일쉐어': { color: '156,39,176', textColor: '#fff' },
  '우먼스톡': { color: '233,30,99', textColor: '#fff' },
  'W컨셉': { color: '33,33,33', textColor: '#fff' },
  '하이버': { color: '103,58,183', textColor: '#fff' },
  '올리브영': { color: '142,195,31', textColor: '#000' },
  'CJ온스타일': { color: '0,70,140', textColor: '#fff' },
  '아이디어스': { color: '255,87,34', textColor: '#fff' },
  '오늘의집': { color: '53,197,240', textColor: '#fff' },
  '카카오쇼핑': { color: '255,235,59', textColor: '#000' },
  '트렌비': { color: '233,30,99', textColor: '#fff' },
  'AK몰': { color: '139,0,0', textColor: '#fff' }
};

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
      case 'getSalesInfo':
        const salesData = await getSheetData('판매정보!A:G');
        const salesInfo = {};
        
        for (let i = 1; i < salesData.length; i++) {
          const optionName = String(salesData[i][0] || '').trim();
          if (!optionName) continue;
          
          salesInfo[optionName] = {
            rawMaterialCost: Number(salesData[i][1]) || 0,
            supplyCost: Number(salesData[i][2]) || 0,
            printCost: Number(salesData[i][3]) || 0,
            productCost: Number(salesData[i][4]) || 0,
            sellingPrice: Number(salesData[i][5]) || 0,
            optionPrice: Number(salesData[i][6]) || 0
          };
        }
        
        return res.status(200).json(salesInfo);

      case 'getOptionProductInfo':
        const optionData = await getSheetData('옵션상품통합관리!A:Z');
        if (optionData.length < 2) {
          return res.status(200).json({});
        }
        
        const headers = optionData[0];
        const optionNameIdx = headers.indexOf('옵션명');
        const shipmentIdx = headers.indexOf('출고');
        const invoiceIdx = headers.indexOf('송장');
        const shippingLocationIdx = headers.indexOf('발송지');
        const shippingAddressIdx = headers.indexOf('발송지주소');
        const shippingContactIdx = headers.indexOf('발송지연락처');
        const totalCostIdx = headers.indexOf('총원가');
        const vendorIdx = headers.indexOf('벤더사');
        
        const optionInfo = {};
        
        for (let i = 1; i < optionData.length; i++) {
          const optionName = String(optionData[i][optionNameIdx] || '').trim();
          if (!optionName) continue;
          
          optionInfo[optionName] = {
            shipment: shipmentIdx !== -1 ? String(optionData[i][shipmentIdx] || '').trim() : '',
            invoice: invoiceIdx !== -1 ? String(optionData[i][invoiceIdx] || '').trim() : '',
            shippingLocation: shippingLocationIdx !== -1 ? String(optionData[i][shippingLocationIdx] || '').trim() : '',
            shippingAddress: shippingAddressIdx !== -1 ? String(optionData[i][shippingAddressIdx] || '').trim() : '',
            shippingContact: shippingContactIdx !== -1 ? String(optionData[i][shippingContactIdx] || '').trim() : '',
            totalCost: totalCostIdx !== -1 ? parseNumber(optionData[i][totalCostIdx]) : 0,
            vendor: vendorIdx !== -1 ? String(optionData[i][vendorIdx] || '').trim() : ''
          };
        }
        
        return res.status(200).json(optionInfo);

      case 'getPriceCalculation':
        const priceData = await getSheetData('가격계산!A:Z');
        if (priceData.length < 2) {
          return res.status(200).json({});
        }
        
        const priceHeaders = priceData[0];
        const priceOptionIdx = priceHeaders.indexOf('옵션명');
        const sellerSupplyPriceIdx = priceHeaders.indexOf('셀러공급가');
        
        const priceInfo = {};
        
        for (let i = 1; i < priceData.length; i++) {
          const optionName = String(priceData[i][priceOptionIdx] || '').trim();
          if (!optionName) continue;
          
          const supplyPrice = sellerSupplyPriceIdx !== -1 ? 
            parseNumber(priceData[i][sellerSupplyPriceIdx]) : 0;
          
          priceInfo[optionName] = {
            sellerSupplyPrice: supplyPrice
          };
        }
        
        return res.status(200).json(priceInfo);

      case 'getDashboard':
        const dashboardData = await getSheetData('대시보드!A:Z');
        return res.status(200).json({ values: dashboardData });

      case 'saveToSheet':
        // 시트 생성 또는 확인
        const sheetResult = await createOrderSheet(sheetName);
        
        // 헤더와 데이터 분리
        const headerRow = values[0];
        const dataRows = values.slice(1);
        
        // 데이터를 배열 형태로 변환
        const formattedData = dataRows.map(row => row);
        
        // 중복 체크 및 병합 저장
        const result = await mergeAndSaveOrderData(
          sheetName, 
          formattedData, 
          headerRow,
          marketColorMapping
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
