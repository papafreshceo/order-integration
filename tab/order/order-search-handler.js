window.OrderSearchHandler = {
    panel: null,
    data: [],
    marketColors: {},
    
    async init() {
        this.panel = document.getElementById('om-panel-search');
        this.createUI();
        await this.loadMarkets();
        this.setupEvents();
        await this.loadData();
    },
    
    createUI() {
        this.panel.innerHTML = `
            <div class="om-table-header">
                <h3 class="om-table-title">주문 목록</h3>
                <div class="om-table-controls">
                    <input type="date" id="om-search-date" class="om-btn">
                    <select id="om-search-market" class="om-btn">
                        <option value="">전체 마켓</option>
                    </select>
                    <input type="text" id="om-search-keyword" placeholder="검색어" class="om-btn" style="width:200px">
                </div>
                <div class="om-table-actions">
                    <button class="om-btn" onclick="OrderSearchHandler.refresh()">새로고침</button>
                    <button class="om-btn om-btn-primary" onclick="OrderSearchHandler.export()">내보내기</button>
                </div>
            </div>
            <div class="om-table-wrapper">
                <table class="om-table">
                    <thead></thead>
                    <tbody></tbody>
                </table>
            </div>
        `;
        
        document.getElementById('om-search-date').value = new Date().toISOString().split('T')[0];
    },
    
    async loadMarkets() {
        try {
            const response = await fetch('/api/sheets', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    action: 'getMarketData',
                    useMainSpreadsheet: false
                })
            });
            
            const result = await response.json();
            if (result.success) {
                this.marketColors = result.colors || {};
                
                const select = document.getElementById('om-search-market');
                if (result.markets) {
                    select.innerHTML = '<option value="">전체 마켓</option>' +
                        Object.keys(result.markets).map(name => 
                            `<option value="${name}">${name}</option>`
                        ).join('');
                }
            }
        } catch (error) {
            console.error('마켓 로드 실패:', error);
        }
    },
    
    setupEvents() {
        document.getElementById('om-search-date').addEventListener('change', () => this.loadData());
        document.getElementById('om-search-market').addEventListener('change', () => this.applyFilter());
        document.getElementById('om-search-keyword').addEventListener('keyup', (e) => {
            if (e.key === 'Enter') this.applyFilter();
        });
    },
    
    async loadData() {
        const date = document.getElementById('om-search-date').value.replace(/-/g, '');
        
        OrderManage.showLoading(true);
        
        try {
            const response = await fetch('/api/sheets', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    action: 'getOrdersByDate',
                    sheetName: date
                })
            });
            
            const result = await response.json();
            this.data = result.success && result.data ? result.data : [];
            this.applyFilter();
            
        } catch (error) {
            console.error('주문 로드 실패:', error);
            this.data = [];
            this.renderTable([]);
        } finally {
            OrderManage.showLoading(false);
        }
    },
    
    applyFilter() {
        let filtered = [...this.data];
        
        const market = document.getElementById('om-search-market').value;
        if (market) {
            filtered = filtered.filter(order => order['마켓명'] === market);
        }
        
        const keyword = document.getElementById('om-search-keyword').value.toLowerCase();
        if (keyword) {
            filtered = filtered.filter(order => {
                return Object.values(order).some(value => 
                    String(value).toLowerCase().includes(keyword)
                );
            });
        }
        
        this.renderTable(filtered);
    },
    
    renderTable(data) {
        const table = this.panel.querySelector('.om-table');
        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');
        
        if (!data || data.length === 0) {
            thead.innerHTML = '';
            tbody.innerHTML = '<tr><td colspan="100%" style="padding:40px">조회된 주문이 없습니다</td></tr>';
            return;
        }
        
        const headers = Object.keys(data[0]);
        
        thead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
        
        tbody.innerHTML = data.map(order => {
            return `<tr>${headers.map(h => {
                if (h === '마켓명' && this.marketColors[order[h]]) {
                    const color = this.marketColors[order[h]];
                    return `<td><span style="padding:2px 8px;background:${color};color:#fff;border-radius:4px;font-size:11px;">${order[h]}</span></td>`;
                }
                return `<td>${order[h] || ''}</td>`;
            }).join('')}</tr>`;
        }).join('');
    },
    
    refresh() {
        this.loadData();
    },
    
    export() {
        if (!this.data || this.data.length === 0) {
            alert('내보낼 데이터가 없습니다');
            return;
        }
        
        const ws = XLSX.utils.json_to_sheet(this.data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '주문목록');
        
        const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
        XLSX.writeFile(wb, `주문조회_${date}.xlsx`);
    }
};