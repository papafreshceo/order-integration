// js/modules/merge/merge-main.js

/**
 * 주문통합 메인 컨트롤러
 * 모든 모듈을 통합 관리하는 중앙 컨트롤러
 */

const MergeMain = (function() {
    'use strict';

    let isInitialized = false;
    let config = null;

    /**
     * 초기화
     */
    async function initialize() {
        if (isInitialized) {
            console.log('MergeMain: 이미 초기화됨');
            return;
        }

        try {
            console.log('주문통합 모듈 초기화 시작');

            // 설정 로드
            config = await loadConfig();

            // 모듈 초기화
            initializeModules();

            // UI 초기화
            MergeUI.initialize();

            // 이벤트 리스너 설정
            setupEventListeners();

            isInitialized = true;
            console.log('주문통합 모듈 초기화 완료');

        } catch (error) {
            console.error('초기화 실패:', error);
            MergeUI.showError('시스템 초기화에 실패했습니다');
        }
    }

    /**
     * 설정 로드
     */
    async function loadConfig() {
        try {
            // MergeConfig가 이미 로드되어 있다면 사용
            if (typeof MergeConfig !== 'undefined') {
                return MergeConfig;
            }

            // 동적 로드 시도
            const response = await fetch('/js/config/merge-config.js');
            if (response.ok) {
                const configText = await response.text();
                eval(configText);
                return MergeConfig;
            }

            // 기본 설정 반환
            return getDefaultConfig();

        } catch (error) {
            console.error('설정 로드 실패:', error);
            return getDefaultConfig();
        }
    }

    /**
     * 기본 설정
     */
    function getDefaultConfig() {
        return {
            STANDARD_FIELDS: [
                '마켓명', '연번', '마켓', '결제일', '주문번호', 
                '상품주문번호', '주문자', '수취인', '전화번호', 
                '주소', '배송메시지', '옵션명', '수량', '상품금액',
                '정산예정금액', '송장번호', '택배사', '발송일'
            ],
            MARKETS: {
                '네이버': {
                    name: '네이버',
                    initial: 'N',
                    color: '76,175,80',
                    headerRow: 1
                },
                '쿠팡': {
                    name: '쿠팡',
                    initial: 'C',
                    color: '255,87,34',
                    headerRow: 1
                },
                '11번가': {
                    name: '11번가',
                    initial: 'E',
                    color: '244,67,54',
                    headerRow: 2
                }
            }
        };
    }

    /**
     * 모듈 초기화
     */
    function initializeModules() {
        // 각 모듈에 설정 전달
        MergeReader.initialize(config);
        MergeDetector.initialize(config.MARKET_PATTERNS, config.MARKETS);
        MergeMapper.initialize(config);
        MergeProcessor.initialize(config);
        // Statistics, Pivot, Export는 별도 초기화 불필요
    }

    /**
     * 이벤트 리스너 설정
     */
    function setupEventListeners() {
        // 탭 전환 시 초기화
        document.addEventListener('tabChange', (e) => {
            if (e.detail.tabId === 'merge') {
                onTabActivate();
            }
        });

        // 파일 처리 완료 이벤트
        document.addEventListener('mergeProcessComplete', (e) => {
            handleProcessComplete(e.detail);
        });
    }

    /**
     * 탭 활성화 시
     */
    function onTabActivate() {
        if (!isInitialized) {
            initialize();
        }
    }

    /**
     * 처리 완료 핸들러
     */
    function handleProcessComplete(data) {
        console.log('처리 완료:', data);
        
        // 통계 업데이트
        updateDashboard(data.statistics);
        
        // 알림
        showNotification(`${data.processedCount}개 주문 통합 완료`);
    }

    /**
     * 대시보드 업데이트
     */
    function updateDashboard(statistics) {
        // 대시보드가 있다면 업데이트
        if (typeof DashboardManager !== 'undefined') {
            DashboardManager.updateStatistics({
                mergeStats: statistics
            });
        }
    }

    /**
     * 알림 표시
     */
    function showNotification(message) {
        if (typeof ToastManager !== 'undefined') {
            ToastManager.success(message);
        } else {
            console.log('알림:', message);
        }
    }

    /**
     * 파일 업로드 처리
     */
    async function handleFileUpload(files) {
        const results = [];
        
        for (const file of files) {
            try {
                // 파일 읽기
                const fileData = await MergeReader.readFile(file);
                
                // 마켓 감지
                const detection = MergeDetector.detectMarket(
                    file.name,
                    fileData.headers,
                    fileData.data[0]
                );
                
                // 매핑
                const mapping = MergeMapper.autoMapFields(
                    fileData.headers,
                    detection.marketName
                );
                
                results.push({
                    file,
                    fileData,
                    detection,
                    mapping
                });
                
            } catch (error) {
                console.error(`파일 처리 실패 (${file.name}):`, error);
                results.push({
                    file,
                    error: error.message
                });
            }
        }
        
        return results;
    }

    /**
     * 데이터 통합 실행
     */
    async function executeIntegration(filesData) {
        try {
            // 처리
            const result = MergeProcessor.processFiles(filesData);
            
            if (!result.success) {
                throw new Error('데이터 통합 실패');
            }
            
            // 통계 생성
            const statistics = MergeStatistics.generateStatistics(result.data);
            
            // 결과 반환
            return {
                success: true,
                data: result.data,
                statistics,
                processedCount: result.processedCount,
                skippedCount: result.skippedCount
            };
            
        } catch (error) {
            console.error('통합 실행 오류:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 내보내기
     */
    async function exportData(format, data) {
        try {
            let result;
            
            switch (format) {
                case 'excel':
                    result = MergeExport.exportToExcel(data);
                    break;
                    
                case 'csv':
                    result = MergeExport.exportToCSV(data);
                    break;
                    
                case 'sheets':
                    result = await MergeExport.exportToGoogleSheets(data);
                    break;
                    
                case 'json':
                    result = MergeExport.exportToJSON(data);
                    break;
                    
                default:
                    throw new Error('지원하지 않는 형식');
            }
            
            return result;
            
        } catch (error) {
            console.error('내보내기 오류:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 상태 가져오기
     */
    function getState() {
        return {
            isInitialized,
            config,
            uploadedFiles: MergeUI.uploadedFiles || [],
            processedData: MergeUI.processedData || null
        };
    }

    /**
     * 정리
     */
    function cleanup() {
        isInitialized = false;
        config = null;
        console.log('MergeMain 정리 완료');
    }

    // Public API
    return {
        initialize,
        handleFileUpload,
        executeIntegration,
        exportData,
        getState,
        cleanup
    };

})();

// 페이지 로드 시 자동 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 주문통합 탭이 활성화되어 있으면 초기화
    const mergeTab = document.querySelector('.tab-content#merge');
    if (mergeTab && mergeTab.classList.contains('active')) {
        MergeMain.initialize();
    }
});

// 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MergeMain;
}
