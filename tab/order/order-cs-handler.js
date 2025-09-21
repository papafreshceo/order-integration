window.OrderCsHandler = {
    panel: null,
    
    init() {
        this.panel = document.getElementById('om-panel-cs');
        this.createUI();
    },
    
    createUI() {
        this.panel.innerHTML = `
            <div class="om-table-header">
                <h3 class="om-table-title">CS 관리</h3>
                <div class="om-table-controls">
                    <select id="om-cs-filter" class="om-btn">
                        <option value="">전체</option>
                        <option value="반품">반품</option>
                        <option value="교환">교환</option>
                        <option value="취소">취소</option>
                    </select>
                </div>
                <div class="om-table-actions">
                    <button class="om-btn om-btn-primary" onclick="OrderCsHandler.save()">저장</button>
                </div>
            </div>
            <div class="om-table-wrapper">
                <table class="om-table">
                    <thead>
                        <tr>
                            <th>주문번호</th>
                            <th>마켓명</th>
                            <th>수령인</th>
                            <th>이슈유형</th>
                            <th>처리상태</th>
                            <th>메모</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="6" style="padding:40px;text-align:center;color:#6c757d">CS 데이터가 없습니다</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    },
    
    save() {
        alert('CS 저장 기능 구현 예정');
    }
};