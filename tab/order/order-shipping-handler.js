window.OrderShippingHandler = {
    panel: null,
    data: [],
    
    async init() {
        this.panel = document.getElementById('om-panel-shipping');
        this.createUI();
        await this.loadData();
    },
    
    createUI() {
        this.panel.innerHTML = `
            <div class="om-stats" id="om-shipping-stats"></div>
            <div class="om-table-header">
                <h3 class="om-table-title">발송 목록</h3>
                <div class="om-table-controls">
                    <select id="om-bulk-carrier" class="om-btn">
                        <option value="">택배사 일괄선택</option>
                        <option value="CJ대한통운">CJ대한통운</option>
                        <option value="한진택배">한진택배</option>
                        <option value="롯데택배">롯데택배</option>
                        <option value="우체국택배">우체국택배</option>
                        <option value="로젠택배">로젠택배</option>
                    </select>
                    <button class="om-btn" onclick="OrderShippingHandler.applyCarrier()">적용</button>
                </div>
                <div class="om-table-actions">
                    <button class="om-btn om-btn-primary" onclick="OrderShippingHandler.save()">저장</button>
                </div>
            </div>
            <div class="om-table-wrapper">
                <table class="om-table">
                    <thead></thead>
                    <tbody></tbody>
                </table>
            </div>
        `;
    },
    
    async loadData() {
        OrderManage.showLoading(true);
        
        try {
            const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
            const response = await fetch('/api/sheets', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    action: 'getOrdersByDate',
                    sheetName: today
                })
            });
            
            const result = await response.json();
            this.data = result.success && result.data ? result.data : [];
            this.updateStats();
            this.renderTable();
            
        } catch (error) {
            console.error('발송 데이터 로드 실패:', error);
        } finally {
            OrderManage.showLoading(false);
        }
    },
    
    updateStats() {
        const total = this.data.length;
        const shipped = this.data.filter(o => o['송장번호']).length;
        const pending = total - shipped;
        
        document.getElementById('om-shipping-stats').innerHTML = `
            <div class="om-stat-card">
                <div class="om-stat-label">전체</div>
                <div class="om-stat-value" style="color:#212529">${total}</div>
            </div>
            <div class="om-stat-card">
                <div class="om-stat-label">상품준비중</div>
                <div class="om-stat-value" style="color:#f59e0b">${pending}</div>
            </div>
            <div class="om-stat-card">
                <div class="om-stat-label">발송완료</div>
                <div class="om-stat-value" style="color:#10b981">${shipped}</div>
            </div>
        `;
    },
    
    renderTable() {
        const table = this.panel.querySelector('.om-table');
        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');
        
        if (this.data.length === 0) {
            thead.innerHTML = '';
            tbody.innerHTML = '<tr><td colspan="100%" style="padding:40px">발송할 주문이 없습니다</td></tr>';
            return;
        }
        
        thead.innerHTML = `
            <tr>
                <th style="width:40px"><input type="checkbox" onchange="OrderShippingHandler.toggleAll(this)"></th>
                <th>주문번호</th>
                <th>마켓명</th>
                <th>수령인</th>
                <th>주소</th>
                <th>택배사</th>
                <th>송장번호</th>
            </tr>
        `;
        
        tbody.innerHTML = this.data.slice(0, 50).map((order, idx) => {
            const hasTracking = order['송장번호'] && order['송장번호'].trim() !== '';
            const bgColor = hasTracking ? '#f0f3f7' : '#ffffff';
            
            return `
                <tr style="background:${bgColor}">
                    <td><input type="checkbox" data-index="${idx}" ${!hasTracking ? 'checked' : ''}></td>
                    <td>${order['주문번호'] || ''}</td>
                    <td>${order['마켓명'] || ''}</td>
                    <td>${order['수령인'] || order['수취인'] || ''}</td>
                    <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis">${order['주소'] || order['수령인주소'] || ''}</td>
                    <td>
                        <select class="om-carrier" data-index="${idx}" style="width:100%;padding:2px" ${hasTracking ? 'disabled' : ''}>
                            <option value="">선택</option>
                            <option value="CJ대한통운" ${order['택배사'] === 'CJ대한통운' ? 'selected' : ''}>CJ대한통운</option>
                            <option value="한진택배" ${order['택배사'] === '한진택배' ? 'selected' : ''}>한진택배</option>
                            <option value="롯데택배" ${order['택배사'] === '롯데택배' ? 'selected' : ''}>롯데택배</option>
                            <option value="우체국택배" ${order['택배사'] === '우체국택배' ? 'selected' : ''}>우체국택배</option>
                            <option value="로젠택배" ${order['택배사'] === '로젠택배' ? 'selected' : ''}>로젠택배</option>
                        </select>
                    </td>
                    <td>
                        <input type="text" class="om-tracking" data-index="${idx}" 
                               value="${order['송장번호'] || ''}" 
                               style="width:100%;padding:2px" ${hasTracking ? 'disabled' : ''}>
                    </td>
                </tr>
            `;
        }).join('');
    },
    
    toggleAll(checkbox) {
        document.querySelectorAll('tbody input[type="checkbox"]').forEach(cb => {
            if (!cb.disabled) cb.checked = checkbox.checked;
        });
    },
    
    applyCarrier() {
        const carrier = document.getElementById('om-bulk-carrier').value;
        if (!carrier) {
            alert('택배사를 선택하세요');
            return;
        }
        
        document.querySelectorAll('tbody input[type="checkbox"]:checked').forEach(cb => {
            const idx = cb.dataset.index;
            const select = document.querySelector(`.om-carrier[data-index="${idx}"]`);
            if (select && !select.disabled) {
                select.value = carrier;
            }
        });
    },
    
    async save() {
        const updates = [];
        
        document.querySelectorAll('.om-tracking').forEach(input => {
            if (!input.disabled) {
                const idx = input.dataset.index;
                const tracking = input.value.trim();
                const carrier = document.querySelector(`.om-carrier[data-index="${idx}"]`).value;
                
                if (tracking && carrier) {
                    updates.push({
                        orderNumber: this.data[idx]['주문번호'],
                        carrier: carrier,
                        trackingNumber: tracking
                    });
                }
            }
        });
        
        if (updates.length === 0) {
            alert('저장할 송장번호가 없습니다');
            return;
        }
        
        OrderManage.showLoading(true);
        
        try {
            const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
            const response = await fetch('/api/sheets', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    action: 'updateTracking',
                    sheetName: today,
                    updates: updates
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert(`${updates.length}건 저장완료`);
                await this.loadData();
            } else {
                alert('저장 실패');
            }
        } catch (error) {
            alert('저장 중 오류 발생');
        } finally {
            OrderManage.showLoading(false);
        }
    }
};