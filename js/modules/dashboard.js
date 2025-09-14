// js/modules/dashboard.js - 대시보드 모듈

window.DashboardModule = {
    // 대시보드 데이터 로드
    load() {
        const stats = STATS_CONFIG[window.currentUserRole];
        
        // 통계 카드 표시
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
        
        // 요약 테이블 로드
        this.loadSummary();
    },

    // 대시보드 요약 데이터 로드
    async loadSummary() {
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
                    const customerName = window.currentUserRole === 'admin' ? 
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
};