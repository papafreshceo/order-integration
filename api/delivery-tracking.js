const axios = require('axios');

// 스마트택배 API 설정
const SMART_DELIVERY_API = 'https://info.sweettracker.co.kr/api/v1/trackingInfo';
const API_KEY = process.env.SMART_DELIVERY_API_KEY || 'YOUR_API_KEY_HERE'; // 환경변수에 추가 필요

// 택배사 코드 매핑
const CARRIER_CODES = {
  'CJ대한통운': '04',
  '한진택배': '05', 
  '롯데택배': '08',
  '우체국택배': '01',
  '로젠택배': '06',
  '쿠팡': '99',  // 쿠팡 로켓배송
  'GS25편의점택배': '24',
  'CU편의점택배': '46',
  '경동택배': '23',
  '대신택배': '22'
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { carrier, trackingNumber } = req.body;
    
    if (!carrier || !trackingNumber) {
      return res.status(400).json({ 
        error: '택배사와 송장번호가 필요합니다.' 
      });
    }

    // 스마트택배 API 키 확인
    const API_KEY = process.env.SMART_DELIVERY_API_KEY;
    
    if (!API_KEY || API_KEY === 'your_smart_delivery_api_key_here') {
      console.log('스마트택배 API 키가 설정되지 않았습니다. 기본 응답 반환');
      
      // API 키가 없을 때 기본 응답 반환
      return res.status(200).json({
        invoiceNo: trackingNumber,
        itemName: '상품',
        senderName: '판매자',
        receiverName: '구매자',
        receiverAddr: '-',
        level: 3,
        complete: false,
        completeYN: 'N',
        status: '배송중',
        statusCode: 3,
        trackingDetails: [
          {
            timeString: new Date().toLocaleString('ko-KR'),
            where: '확인중',
            kind: '스마트택배 API 키가 필요합니다'
          }
        ],
        estimate: null,
        productInfo: null,
        zipCode: null,
        lastDetail: null,
        lastStateTime: null
      });
    }

    // axios 동적 import
    let axios;
    try {
      axios = require('axios');
    } catch (e) {
      console.error('axios가 설치되지 않았습니다');
      return res.status(500).json({ 
        error: 'axios 라이브러리가 설치되지 않았습니다.' 
      });
    }

    // 택배사 코드 매핑
    const CARRIER_CODES = {
      'CJ대한통운': '04',
      '한진택배': '05', 
      '롯데택배': '08',
      '우체국택배': '01',
      '로젠택배': '06',
      '쿠팡': '99',
      'GS25편의점택배': '24',
      'CU편의점택배': '46',
      '경동택배': '23',
      '대신택배': '22'
    };

    const carrierCode = CARRIER_CODES[carrier] || carrier;
    
    // 스마트택배 API 호출
    const response = await axios.get('https://info.sweettracker.co.kr/api/v1/trackingInfo', {
      params: {
        t_key: API_KEY,
        t_code: carrierCode,
        t_invoice: trackingNumber
      }
    });

    const data = response.data;
    
    if (!data || data.status === false) {
      return res.status(404).json({ 
        error: '배송 정보를 찾을 수 없습니다.' 
      });
    }

    // 응답 데이터 정제
    const result = {
      invoiceNo: data.invoiceNo,
      itemName: data.itemName || '상품',
      senderName: data.senderName || '-',
      receiverName: data.receiverName || '-',
      receiverAddr: data.receiverAddr || '-',
      level: data.level || 1,
      complete: data.complete || false,
      completeYN: data.completeYN || 'N',
      status: getStatusText(data.level),
      statusCode: data.level,
      trackingDetails: data.trackingDetails || [],
      estimate: data.estimate || null,
      productInfo: data.productInfo || null,
      zipCode: data.zipCode || null,
      lastDetail: data.lastDetail || null,
      lastStateTime: data.lastStateTime || null
    };

    return res.status(200).json(result);

  } catch (error) {
    console.error('배송 조회 오류:', error.message);
    
    // axios 오류인 경우
    if (error.response?.status === 401) {
      return res.status(401).json({ 
        error: 'API 인증 실패. API 키를 확인해주세요.' 
      });
    }
    
    return res.status(500).json({ 
      error: '배송 조회 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
};

// 배송 상태 텍스트 변환
function getStatusText(level) {
  const statusMap = {
    1: '배송준비중',
    2: '집하완료',
    3: '배송중',
    4: '지점도착',
    5: '배송출발',
    6: '배송완료'
  };
  return statusMap[level] || '알 수 없음';
}
