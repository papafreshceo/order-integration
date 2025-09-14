// js/modules/search.js - 주문조회 모듈

window.SearchModule = {
    // 주문 조회
    search() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const resultDiv = document.getElementById('searchResult');
        
        if (!startDate || !endDate) {
            if (resultDiv) {
                resultDiv.innerHTML = '<p class="info-text">날짜를 선택하세요</p>';
            }
            return;
        }
        
        // staff는 당일만 조회 가능
        if (window.currentUserRole === 'staff') {
            const today = new Date().toISOString().split('T')[0];
            if (startDate !== today || endDate !== today) {
                if (resultDiv) {
                    resultDiv.innerHTML = '<p class="info-text" style="color: #f59e0b;">직원 권한은 당일 조회만 가능합니다</p>';
                }
                document.getElementById('startDate').value = today;
                document.getElementById('endDate').value = today;
                return;
            }
        }
        
        if (resultDiv) {
            resultDiv.innerHTML = `<p class="info-text">조회 중...</p>`;
            
            // API 호출 시뮬레이션
            setTimeout(() => {
                resultDiv.innerHTML = `
                    <table>
                        <thead>
                            <tr>
                                <th>주문번호</th>
                                <th>주문일시</th>
                                <th>고객명</th>
                                <th>상품</th>
                                <th>금액</th>
                                <th>상태</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>ORD-2024-001</td>
                                <td>${startDate} 10:30</td>
                                <td>${window.currentUserRole === 'admin' ? '김철수' : '***'}</td>
                                <td>노트북</td>
                                <td>₩1,250,000</td>
                                <td>완료</td>
                            </tr>
                        </tbody>
                    </table>
                `;
            }, 1000);
        }
    }
};

// 전역 함수로 등록
window.searchOrders = function() {
    SearchModule.search();
};