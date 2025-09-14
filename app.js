// app.js - 주문통합 시스템 메인 애플리케이션

// 권한별 메뉴 설정
const MENU_CONFIG = {
    'admin': [
        { id: 'dashboard', name: '대시보드' },
        { id: 'realtime', name: '실시간 주문현황' },
        { id: 'search', name: '주문조회' },
        { id: 'excel', name: '주문통합(Excel)' },
        { id: 'invoice', name: '송장등록' },
        { id: 'analytics', name: '통계 분석' }
    ],
    'staff': [
        { id: 'dashboard', name: '대시보드' },
        { id: 'realtime', name: '실시간 주문현황' },
        { id: 'search', name: '주문조회' }
    ]
};

// 권한별 통계 카드 설정
const STATS_CONFIG = {
    'admin': [
        { label: '오늘 주문', value: 42, change: '+12%', positive: true },
        { label: '처리 대기', value: 8, change: '-2', positive: false },
        { label: '배송 중', value: 27, change: '+5', positive: true },
        { label: '완료', value: 156, change: '+23%', positive: true }
    ],
    'staff': [
        { label: '오늘 주문', value: 42, change: '+12%', positive: true },
        { label: '처리 대기', value: 8, change: '-2', positive: false }
    ]
};

// 현재 사용자 역할
let currentUserRole = 'staff';

// 역할에 따른 UI 초기화
function initializeUIByRole(role) {
    currentUserRole = role;
    
    // 탭 메뉴 생성
    createTabMenu(role);
    
    // 첫 번째 탭 활성화 (대시보드)
    const firstTab = MENU_CONFIG[role][0];
    showTab(firstTab.id);
}

// 탭 메뉴 생성
function createTabMenu(role) {
    const tabMenu = document.getElementById('tabMenu');
    const menus = MENU_CONFIG[role];
    
    tabMenu.innerHTML = '';
    menus.forEach((menu, index) => {
        const button = document.createElement('button');
        button.className = 'tab-btn';
        button.textContent = menu.name;
        button.onclick = () => showTab(menu.id);
        
        if (index === 0) {
            button.classList.add('active');
        }
        
        tabMenu.appendChild(button);
    });
}

// 탭 전환
function showTab(tabId) {
    // 모든 탭 콘텐츠 숨기기
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // 모든 탭 버튼 비활성화
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 선택한 탭 표시
    const tabContent = document.getElementById(tabId);
    if (tabContent) {
        tabContent.classList.add('active');
    }
    
    // 선택한 버튼 활성화
    const buttons = document.querySelectorAll('.tab-btn');
    const menus = MENU_CONFIG[currentUserRole];
    const menuIndex = menus.findIndex(m => m.id === tabId);
    if (menuIndex !== -1 && buttons[menuIndex]) {
        buttons[menuIndex].classList.add('active');
    }
    
    // 탭별 데이터 로드
    if (tabId === 'dashboard') {
        loadDashboard();
    } else if (tabId === 'realtime') {
        loadRealtimeData();
    }
}

// 대시보드 데이터 로드
function loadDashboard() {
    const stats = STATS_CONFIG[currentUserRole];
    
    // 대시보드 통계 카드 표시
    const dashboardStats = document.getElementById('dashboardStats');
    if (dashboardStats) {
        dashboardStats.innerHTML = '';
        stats.forEach(stat => {
            const card = document.createElement('div');
            card.className = 'stat-card';
            card.innerHTML = `
                <div class="stat-label">${stat.label}</div>
                <div class="stat-value">${stat.value}</div>
                <div class="stat-change ${stat.positive ? 'positive' : 'negative'}">
                    ${stat.positive ? '▲' : '▼'} ${stat.change}
                </div>
            `;
            dashboardStats.appendChild(card);
        });
    }
    
    // 대시보드 요약 테이블 로드
    loadDashboardSummary();
}

// 대시보드 요약 데이터 로드
async function loadDashboardSummary() {
    const loadingElement = document.getElementById('dashboardLoading');
    const summaryTable = document.getElementById('dashboardSummaryTable');
    const summaryBody = document.getElementById('dashboardSummaryBody');
    
    try {
        if (loadingElement) {
            loadingElement.style.display = 'block';
        }
        if (summaryTable) {
            summaryTable.style.display = 'none';
        }
        
        const response = await fetch('/api/orders');
        const data = await response.json();
        
        if (summaryBody && data.data && data.data.length > 1) {
            summaryBody.innerHTML = '';
            
            // 최근 5개 주문만 표시
            for (let i = 1; i < Math.min(6, data.data.length); i++) {
                const row = data.data[i];
                const tr = document.createElement('tr');
                
                // 고객명 마스킹 처리
                const customerName = currentUserRole === 'admin' ? 
                    (row[2] || `고객${i}`) : '***';
                
                tr.innerHTML = `
                    <td>${row[0] || '-'}</td>
                    <td>ORD${1000 + i}</td>
                    <td>${customerName}</td>
                    <td>${row[3] || '-'}</td>
                    <td>처리중</td>
                `;
                summaryBody.appendChild(tr);
            }
            
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
            if (summaryTable) {
                summaryTable.style.display = 'table';
            }
        } else {
            if (loadingElement) {
                loadingElement.textContent = '데이터가 없습니다';
            }
        }
    } catch (error) {
        console.error('대시보드 데이터 로드 실패:', error);
        if (loadingElement) {
            loadingElement.textContent = '데이터를 불러올 수 없습니다';
        }
    }
}

// 실시간 데이터 로드
async function loadRealtimeData() {
    const loadingElement = document.getElementById('realtimeLoading');
    const table = document.getElementById('realtimeTable');
    
    try {
        if (loadingElement) {
            loadingElement.style.display = 'block';
        }
        if (table) {
            table.style.display = 'none';
        }
        
        const response = await fetch('/api/orders');
        const data = await response.json();
        
        displayRealtimeData(data.data);
    } catch (error) {
        console.error('데이터 로드 실패:', error);
        if (loadingElement) {
            loadingElement.textContent = '데이터를 불러올 수 없습니다';
        }
    }
}

// 실시간 데이터 표시
function displayRealtimeData(data) {
    const loadingElement = document.getElementById('realtimeLoading');
    const table = document.getElementById('realtimeTable');
    const thead = document.getElementById('realtimeHead');
    const tbody = document.getElementById('realtimeBody');
    
    if (!data || data.length === 0) {
        if (loadingElement) {
            loadingElement.textContent = '데이터가 없습니다';
        }
        return;
    }
    
    if (thead) {
        // 헤더 생성
        thead.innerHTML = '';
        const headerRow = document.createElement('tr');
        data[0].forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
    }
    
    if (tbody) {
        // 데이터 행 생성
        tbody.innerHTML = '';
        for (let i = 1; i < Math.min(data.length, 20); i++) {
            const row = document.createElement('tr');
            data[i].forEach((cell, index) => {
                const td = document.createElement('td');
                
                // 고객명 마스킹 (staff 권한일 때 3번째 컬럼)
                if (currentUserRole === 'staff' && index === 2) {
                    td.textContent = '***';
                } else {
                    td.textContent = cell || '';
                }
                
                row.appendChild(td);
            });
            tbody.appendChild(row);
        }
    }
    
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
    if (table) {
        table.style.display = 'table';
    }
}

// 주문 조회
function searchOrders() {
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
    if (currentUserRole === 'staff') {
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
                            <td>${currentUserRole === 'admin' ? '김철수' : '***'}</td>
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

// 엑셀 처리
function processExcel() {
    const file = document.getElementById('excelFile').files[0];
    if (!file) {
        alert('파일을 선택해주세요');
        return;
    }
    
    const resultDiv = document.getElementById('excelResult');
    if (resultDiv) {
        resultDiv.innerHTML = `<p class="info-text">파일 처리 중...</p>`;
        
        // 파일 업로드 시뮬레이션
        setTimeout(() => {
            resultDiv.innerHTML = `
                <p class="info-text" style="color: #10b981;">
                    ✓ ${file.name} 파일 처리 완료<br>
                    - 총 100개 주문 처리<br>
                    - 성공: 98개, 실패: 2개
                </p>
            `;
        }, 1500);
    }
}

// 송장 등록
function registerInvoice() {
    const orderNo = document.getElementById('orderNo').value;
    const invoiceNo = document.getElementById('invoiceNo').value;
    const courier = document.getElementById('courier').value;
    
    if (!orderNo || !invoiceNo) {
        alert('주문번호와 송장번호를 입력해주세요');
        return;
    }
    
    const resultDiv = document.getElementById('invoiceResult');
    if (resultDiv) {
        resultDiv.innerHTML = `<p class="info-text">등록 중...</p>`;
        
        // API 호출 시뮬레이션
        setTimeout(() => {
            resultDiv.innerHTML = `
                <p class="info-text" style="color: #10b981;">
                    ✓ 송장 등록 완료<br>
                    주문번호: ${orderNo}<br>
                    송장번호: ${invoiceNo}<br>
                    택배사: ${courier}
                </p>
            `;
            
            // 입력 필드 초기화
            document.getElementById('orderNo').value = '';
            document.getElementById('invoiceNo').value = '';
        }, 1000);
    }
}

// 쿠팡 주문 가져오기 (쿠팡 API 연동 시 사용)
async function fetchCoupangOrders() {
    const button = event.target;
    
    // LoadingManager가 있는 경우에만 사용
    if (typeof LoadingManager !== 'undefined') {
        LoadingManager.startButtonLoading(button, '쿠팡 주문 가져오는 중...');
    }
    
    try {
        const response = await fetch('/api/coupang', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'fetch',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0]
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (typeof ToastManager !== 'undefined') {
                ToastManager.success(data.message);
            } else {
                alert(data.message);
            }
            
            // 대시보드 새로고침
            if (document.getElementById('dashboard').classList.contains('active')) {
                loadDashboard();
            }
            
            // 실시간 주문 탭 새로고침
            if (document.getElementById('realtime').classList.contains('active')) {
                loadRealtimeData();
            }
        } else {
            if (typeof ToastManager !== 'undefined') {
                ToastManager.error('쿠팡 주문 동기화 실패');
            } else {
                alert('쿠팡 주문 동기화 실패');
            }
        }
    } catch (error) {
        console.error('쿠팡 동기화 오류:', error);
        if (typeof ToastManager !== 'undefined') {
            ToastManager.error('네트워크 오류가 발생했습니다');
        } else {
            alert('네트워크 오류가 발생했습니다');
        }
    } finally {
        if (typeof LoadingManager !== 'undefined') {
            LoadingManager.stopButtonLoading(button);
        }
    }
}

// 자동 동기화 설정
let coupangSyncInterval = null;

function startCoupangAutoSync() {
    // 5분마다 자동 동기화
    coupangSyncInterval = setInterval(() => {
        fetchCoupangOrders();
    }, 5 * 60 * 1000); // 5분
    
    // 즉시 한 번 실행
    fetchCoupangOrders();
}

function stopCoupangAutoSync() {
    if (coupangSyncInterval) {
        clearInterval(coupangSyncInterval);
        coupangSyncInterval = null;
    }
}

// 자동 동기화 토글
function toggleCoupangAutoSync(checkbox) {
    if (checkbox.checked) {
        startCoupangAutoSync();
        if (typeof ToastManager !== 'undefined') {
            ToastManager.info('쿠팡 자동 동기화가 시작되었습니다 (5분 간격)');
        }
        const statusElement = document.getElementById('coupangStatus');
        if (statusElement) {
            statusElement.textContent = '자동 동기화 중';
            statusElement.classList.add('active');
        }
    } else {
        stopCoupangAutoSync();
        if (typeof ToastManager !== 'undefined') {
            ToastManager.info('쿠팡 자동 동기화가 중지되었습니다');
        }
        const statusElement = document.getElementById('coupangStatus');
        if (statusElement) {
            statusElement.textContent = '대기 중';
            statusElement.classList.remove('active');
        }
    }
    
    // 마지막 동기화 시간 업데이트
    const now = new Date();
    const timeString = now.getHours().toString().padStart(2, '0') + ':' + 
                      now.getMinutes().toString().padStart(2, '0');
    const lastSyncElement = document.getElementById('coupangLastSync');
    if (lastSyncElement) {
        lastSyncElement.textContent = timeString;
    }
}

// 페이지 로드 시 초기화
window.addEventListener('DOMContentLoaded', () => {
    // Firebase Auth가 초기화될 때까지 대기
    // auth.js의 onAuthStateChanged에서 처리됨
    console.log('App.js loaded successfully');
});
