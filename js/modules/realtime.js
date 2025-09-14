// js/modules/realtime.js - 실시간 주문현황 모듈

window.RealtimeModule = {
    // 실시간 데이터 로드
    async load() {
        const loadingElement = document.getElementById('realtimeLoading');
        const table = document.getElementById('realtimeTable');
        
        try {
            if (loadingElement) {
                loadingElement.style.display = 'block';
                loadingElement.textContent = '주문 데이터를 불러오는 중...';
            }
            if (table) {
                table.style.display = 'none';
            }
            
            // 두 개의 API를 동시에 호출
            const [sheetsResponse, coupangResponse] = await Promise.all([
                fetch('/api/orders'),
                fetch('/api/coupang?action=fetch').catch(() => ({ ok: false }))
            ]);
            
            let allOrders = [];
            
            // Google Sheets 데이터 처리
            if (sheetsResponse && sheetsResponse.ok) {
                const sheetsData = await sheetsResponse.json();
                if (sheetsData.data && sheetsData.data.length > 1) {
                    for (let i = 1; i < sheetsData.data.length; i++) {
                        const row = sheetsData.data[i];
                        allOrders.push({
                            date: row[0] || new Date().toISOString().split('T')[0],
                            orderId: row[1] || `ORD${1000 + i}`,
                            customerName: row[2] || `고객${i}`,
                            product: row[3] || '-',
                            quantity: row[4] || 1,
                            amount: row[5] || '0',
                            channel: row[6] || 'Google Sheets',
                            status: row[7] || '처리중'
                        });
                    }
                }
            }
            
            // 쿠팡 데이터 처리
            if (coupangResponse && coupangResponse.ok) {
                const coupangData = await coupangResponse.json();
                if (coupangData.orders && coupangData.orders.length > 0) {
                    coupangData.orders.forEach(order => {
                        allOrders.push({
                            date: order.orderedAt ? 
                                new Date(order.orderedAt).toLocaleDateString('ko-KR') : 
                                new Date().toLocaleDateString('ko-KR'),
                            orderId: order.orderId || '-',
                            customerName: order.orderer?.name || '쿠팡고객',
                            product: order.orderItems?.[0]?.sellerProductName || '-',
                            quantity: order.orderItems?.[0]?.quantity || 1,
                            amount: order.orderItems?.[0]?.orderPrice ? 
                                `₩${order.orderItems[0].orderPrice.toLocaleString()}` : '₩0',
                            channel: '쿠팡',
                            status: this.translateCoupangStatus(order.status)
                        });
                    });
                }
            }
            
            // 날짜 기준 정렬 (최신순)
            allOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // 테이블에 표시
            this.displayData(allOrders);
            
        } catch (error) {
            console.error('데이터 로드 실패:', error);
            if (loadingElement) {
                loadingElement.textContent = '데이터를 불러올 수 없습니다';
            }
        }
    },

    // 쿠팡 상태 한글 변환
    translateCoupangStatus(status) {
        const statusMap = {
            'ACCEPT': '접수',
            'INSTRUCT': '배송지시',
            'DEPARTURE': '출고',
            'DELIVERING': '배송중',
            'FINAL_DELIVERY': '배송완료',
            'NONE_TRACKING': '트래킹없음'
        };
        return statusMap[status] || status || '처리중';
    },

    // 데이터 표시
    displayData(orders) {
        const loadingElement = document.getElementById('realtimeLoading');
        const table = document.getElementById('realtimeTable');
        const thead = document.getElementById('realtimeHead');
        const tbody = document.getElementById('realtimeBody');
        
        if (!orders || orders.length === 0) {
            if (loadingElement) {
                loadingElement.textContent = '주문 데이터가 없습니다';
            }
            return;
        }
        
        if (thead) {
            thead.innerHTML = '';
            const headerRow = document.createElement('tr');
            const headers = ['날짜', '주문번호', '고객명', '상품명', '수량', '금액', '판매채널', '상태'];
            
            headers.forEach(header => {
                const th = document.createElement('th');
                th.textContent = header;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
        }
        
        if (tbody) {
            tbody.innerHTML = '';
            const displayOrders = orders.slice(0, 50);
            
            displayOrders.forEach(order => {
                const row = document.createElement('tr');
                const customerName = window.currentUserRole === 'admin' ? order.customerName : '***';
                const channelClass = order.channel === '쿠팡' ? 'channel-coupang' : 'channel-sheets';
                
                row.innerHTML = `
                    <td>${order.date}</td>
                    <td>${order.orderId}</td>
                    <td>${customerName}</td>
                    <td>${order.product}</td>
                    <td>${order.quantity}</td>
                    <td>${order.amount}</td>
                    <td><span class="channel-badge ${channelClass}">${order.channel}</span></td>
                    <td><span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></td>
                `;
                
                tbody.appendChild(row);
            });
            
            this.updateStats(orders);
        }
        
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        if (table) {
            table.style.display = 'table';
        }
    },

    // 통계 업데이트
    updateStats(orders) {
        const statsGrid = document.getElementById('statsGrid');
        if (!statsGrid) return;
        
        const coupangOrders = orders.filter(o => o.channel === '쿠팡').length;
        const sheetsOrders = orders.filter(o => o.channel !== '쿠팡').length;
        const todayOrders = orders.filter(o => {
            const orderDate = new Date(o.date).toDateString();
            const today = new Date().toDateString();
            return orderDate === today;
        }).length;
        
        statsGrid.innerHTML = '';
        
        const stats = [
            { label: '전체 주문', value: orders.length, change: `오늘 ${todayOrders}건`, positive: true },
            { label: '쿠팡 주문', value: coupangOrders, change: '실시간 동기화', positive: true },
            { label: '기타 채널', value: sheetsOrders, change: 'Sheets 연동', positive: true },
            { label: '처리 대기', value: orders.filter(o => o.status === '접수' || o.status === '처리중').length, change: '즉시 처리 필요', positive: false }
        ];
        
        const displayStats = window.currentUserRole === 'admin' ? stats : stats.slice(0, 2);
        
        displayStats.forEach(stat => {
            const card = document.createElement('div');
            card.className = 'stat-card';
            card.innerHTML = `
                <div class="stat-label">${stat.label}</div>
                <div class="stat-value">${stat.value}</div>
                <div class="stat-change ${stat.positive ? 'positive' : 'negative'}">
                    ${stat.positive ? '▲' : '▼'} ${stat.change}
                </div>
            `;
            statsGrid.appendChild(card);
        });
    },

    // 새로고침
    async refresh(event) {
        const button = event?.target;
        if (button) {
            button.disabled = true;
            button.textContent = '새로고침 중...';
        }
        
        this.updateLastUpdateTime();
        
        try {
            await this.load();
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = '↻ 새로고침';
            }
        }
    },

    // 마지막 업데이트 시간 갱신
    updateLastUpdateTime() {
        const element = document.getElementById('lastUpdateTime');
        if (element) {
            const now = new Date();
            const timeString = now.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            element.textContent = timeString;
        }
    }
};

// 전역 함수로 등록 (onclick 호출용)
window.refreshRealtimeData = function(event) {
    RealtimeModule.refresh(event);
};

window.updateLastUpdateTime = function() {
    RealtimeModule.updateLastUpdateTime();
};