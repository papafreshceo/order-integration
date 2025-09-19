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

    // 택배사명을 코드로 변환
    const carrierCode = CARRIER_CODES[carrier] || carrier;
    
    // 스마트택배 API 호출
    const response = await axios.get(SMART_DELIVERY_API, {
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
      // 기본 정보
      invoiceNo: data.invoiceNo,
      itemName: data.itemName,
      senderName: data.senderName,
      receiverName: data.receiverName,
      receiverAddr: data.receiverAddr,
      
      // 배송 상태
      level: data.level,
      complete: data.complete,
      completeYN: data.completeYN,
      
      // 상태별 정보
      status: getStatusText(data.level),
      statusCode: data.level,
      
      // 배송 추적 상세
      trackingDetails: data.trackingDetails || [],
      
      // 예상 배송일 (있는 경우)
      estimate: data.estimate || null,
      
      // 추가 정보
      productInfo: data.productInfo || null,
      zipCode: data.zipCode || null,
      
      // 마지막 업데이트 시간
      lastDetail: data.lastDetail || null,
      lastStateTime: data.lastStateTime || null
    };

    return res.status(200).json(result);

  } catch (error) {
    console.error('배송 조회 오류:', error);
    
    // API 키 오류
    if (error.response?.status === 401) {
      return res.status(401).json({ 
        error: 'API 인증 실패. API 키를 확인해주세요.' 
      });
    }
    
    // 기타 오류
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
