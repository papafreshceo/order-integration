// js/modules/excel.js - 엑셀 처리 모듈

window.ExcelModule = {
    // 엑셀 처리
    process() {
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
};

// 전역 함수로 등록
window.processExcel = function() {
    ExcelModule.process();
};