export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { carrier, trackingNumber } = req.body;
  
  try {
    // 스마트택배 API 키 (환경변수로 관리)
    const apiKey = process.env.SWEETTRACKER_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'API 키가 설정되지 않았습니다.' });
    }
    
    const response = await fetch(
      `https://info.sweettracker.co.kr/api/v1/trackingInfo?t_key=${apiKey}&t_code=${carrier}&t_invoice=${trackingNumber}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    
    const data = await response.json();
    
    if (data.status === false) {
      return res.status(400).json({ 
        error: data.msg || '배송 정보를 찾을 수 없습니다.' 
      });
    }
    
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('배송 조회 오류:', error);
    return res.status(500).json({ error: '배송 정보 조회 실패' });
  }
}
