window.OrderInputHandler = {
    panel: null,
    
    init() {
        this.panel = document.getElementById('om-panel-input');
        this.createUI();
    },
    
    createUI() {
        this.panel.innerHTML = `
            <div class="om-table-header">
                <h3 class="om-table-title">수동 주문 입력</h3>
                <div class="om-table-controls"></div>
                <div class="om-table-actions">
                    <button class="om-btn" onclick="OrderInputHandler.clear()">초기화</button>
                    <button class="om-btn om-btn-primary" onclick="OrderInputHandler.save()">저장</button>
                </div>
            </div>
            <div style="padding:24px">
                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;max-width:600px">
                    <div>
                        <label style="display:block;font-size:12px;color:#6c757d;margin-bottom:4px">주문번호</label>
                        <input type="text" id="om-input-orderno" class="om-btn" style="width:100%">
                    </div>
                    <div>
                        <label style="display:block;font-size:12px;color:#6c757d;margin-bottom:4px">마켓명</label>
                        <select id="om-input-market" class="om-btn" style="width:100%">
                            <option value="">선택</option>
                            <option value="달래마켓">달래마켓</option>
                            <option value="전화주문">전화주문</option>
                            <option value="CS재발송">CS재발송</option>
                        </select>
                    </div>
                    <div>
                        <label style="display:block;font-size:12px;color:#6c757d;margin-bottom:4px">수령인</label>
                        <input type="text" id="om-input-receiver" class="om-btn" style="width:100%">
                    </div>
                    <div>
                        <label style="display:block;font-size:12px;color:#6c757d;margin-bottom:4px">전화번호</label>
                        <input type="tel" id="om-input-phone" class="om-btn" style="width:100%">
                    </div>
                    <div style="grid-column:1/-1">
                        <label style="display:block;font-size:12px;color:#6c757d;margin-bottom:4px">주소</label>
                        <input type="text" id="om-input-address" class="om-btn" style="width:100%">
                    </div>
                    <div>
                        <label style="display:block;font-size:12px;color:#6c757d;margin-bottom:4px">옵션명</label>
                        <input type="text" id="om-input-option" class="om-btn" style="width:100%">
                    </div>
                    <div>
                        <label style="display:block;font-size:12px;color:#6c757d;margin-bottom:4px">수량</label>
                        <input type="number" id="om-input-qty" class="om-btn" style="width:100%" value="1">
                    </div>
                </div>
            </div>
        `;
    },
    
    clear() {
        document.getElementById('om-input-orderno').value = '';
        document.getElementById('om-input-market').value = '';
        document.getElementById('om-input-receiver').value = '';
        document.getElementById('om-input-phone').value = '';
        document.getElementById('om-input-address').value = '';
        document.getElementById('om-input-option').value = '';
        document.getElementById('om-input-qty').value = '1';
    },
    
    async save() {
        const data = {
            '주문번호': document.getElementById('om-input-orderno').value,
            '마켓명': document.getElementById('om-input-market').value,
            '수령인': document.getElementById('om-input-receiver').value,
            '수령인전화번호': document.getElementById('om-input-phone').value,
            '수령인주소': document.getElementById('om-input-address').value,
            '옵션명': document.getElementById('om-input-option').value,
            '수량': document.getElementById('om-input-qty').value
        };
        
        if (!data['주문번호'] || !data['마켓명'] || !data['수령인']) {
            alert('필수 항목을 입력하세요');
            return;
        }
        
        alert('저장 기능 구현 예정');
    }
};