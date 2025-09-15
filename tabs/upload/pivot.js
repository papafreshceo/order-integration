// 피벗테이블 모듈
const PivotTable = (function() {
    
    // 피벗 데이터 생성
    function createPivotData(data, rowField, colField, colField2, valueField) {
        // 기존 createPivotData 함수 내용
    }
    
    // 피벗 테이블 표시
    function displayPivotTable(pivotData, rowField, colField, colField2, valueField) {
        // 기존 displayPivotTable 함수 내용
    }
    
    // 값 계산
    function calculateValue(data, valueField) {
        // 기존 calculateValue 함수 내용
    }
    
    // 값 포맷팅
    function formatValue(value, valueField) {
        // 기존 formatValue 함수 내용
    }
    
    // 피벗 업데이트 (외부 호출용)
    function update() {
        if (!window.processedData || !window.processedData.data || window.processedData.data.length === 0) {
            showError('피벗테이블을 생성할 데이터가 없습니다.');
            return;
        }
        
        const rowField = document.getElementById('pivotRowField').value;
        const colField = document.getElementById('pivotColField').value;
        const colField2 = document.getElementById('pivotColField2').value;
        const valueField = document.getElementById('pivotValueField').value;
        
        const pivotData = createPivotData(window.processedData.data, rowField, colField, colField2, valueField);
        displayPivotTable(pivotData, rowField, colField, colField2, valueField);
    }
    
    // 공개 API
    return {
        update: update
    };
})();

// 전역 함수로 노출 (HTML onclick용)
window.updatePivotTable = PivotTable.update;
