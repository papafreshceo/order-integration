// js/modules/merge/merge-statistics.js

/**
 * 통계 생성 모듈
 * 통합된 데이터의 다양한 통계 생성
 */

const MergeStatistics = (function() {
    'use strict';

    /**
     * 전체 통계 생성
     * @param {Array} data - 통합 데이터
     * @returns {Object} 통계 결과
     */
    function generateStatistics(data) {
        const stats = {
            overall: createEmptyStats(),
            byMarket: {},
            byOption: {},
            byVendor: {},
            bySeller: {},
            byDate: {},
            summary: {
                totalOrders: 0,
                totalQuantity: 0,
                totalAmount: 0,
                averageOrderValue: 0,
                marketCount: 0,
                optionCount: 0
            }
        };

        if (!data || data.length === 0) {
            return stats;
        }

        // 데이터 처리
        for (const row of data) {
            updateOverallStats(stats.overall, row);
            updateMarketStats(stats.byMarket, row);
            updateOptionStats(stats.byOption, row);
            updateVendorStats(stats.byVendor, row);
            updateSellerStats(stats.bySeller, row);
            updateDateStats(stats.byDate, row);
        }

        // 요약 통계 계산
        calculateSummary(stats);

        return stats;
    }

    /**
     * 빈 통계 객체 생성
     */
    function createEmptyStats() {
        return {
            count: 0,
            quantity: 0,
            amount: 0,
            // 공급처 구분
            companyProduct: { count: 0, quantity: 0, amount: 0 },
            vendorProduct: { count: 0, quantity: 0, amount: 0 },
            // 판매처 구분
            companySales: { count: 0, quantity: 0, amount: 0 },
            sellerSales: { count: 0, quantity: 0, amount: 0 },
            // 발송 상태
            sent: { count: 0, quantity: 0, amount: 0 },
            unsent: { count: 0, quantity: 0, amount: 0 },
            // 발송 상태 × 공급처
            sentCompany: { count: 0, quantity: 0, amount: 0 },
            sentVendor: { count: 0, quantity: 0, amount: 0 },
            unsentCompany: { count: 0, quantity: 0, amount: 0 },
            unsentVendor: { count: 0, quantity: 0, amount: 0 }
        };
    }

    /**
     * 전체 통계 업데이트
     */
    function updateOverallStats(stats, row) {
        const quantity = parseInt(row['수량']) || 1;
        const amount = parseFloat(row['정산예정금액']) || 0;
        const vendor = String(row['벤더사'] || '').trim();
        const seller = String(row['셀러'] || '').trim();
        const hasInvoice = row['송장번호'] && String(row['송장번호']).trim() !== '';

        const isCompanyProduct = !vendor || vendor === '달래마켓';
        const isSellerSales = !!seller;

        // 전체
        stats.count++;
        stats.quantity += quantity;
        stats.amount += amount;

        // 공급처별
        if (isCompanyProduct) {
            stats.companyProduct.count++;
            stats.companyProduct.quantity += quantity;
            stats.companyProduct.amount += amount;
        } else {
            stats.vendorProduct.count++;
            stats.vendorProduct.quantity += quantity;
            stats.vendorProduct.amount += amount;
        }

        // 판매처별
        if (isSellerSales) {
            stats.sellerSales.count++;
            stats.sellerSales.quantity += quantity;
            stats.sellerSales.amount += amount;
        } else {
            stats.companySales.count++;
            stats.companySales.quantity += quantity;
            stats.companySales.amount += amount;
        }

        // 발송 상태
        if (hasInvoice) {
            stats.sent.count++;
            stats.sent.quantity += quantity;
            stats.sent.amount += amount;

            if (isCompanyProduct) {
                stats.sentCompany.count++;
                stats.sentCompany.quantity += quantity;
                stats.sentCompany.amount += amount;
            } else {
                stats.sentVendor.count++;
                stats.sentVendor.quantity += quantity;
                stats.sentVendor.amount += amount;
            }
        } else {
            stats.unsent.count++;
            stats.unsent.quantity += quantity;
            stats.unsent.amount += amount;

            if (isCompanyProduct) {
                stats.unsentCompany.count++;
                stats.unsentCompany.quantity += quantity;
                stats.unsentCompany.amount += amount;
            } else {
                stats.unsentVendor.count++;
                stats.unsentVendor.quantity += quantity;
                stats.unsentVendor.amount += amount;
            }
        }
    }

    /**
     * 마켓별 통계 업데이트
     */
    function updateMarketStats(byMarket, row) {
        const marketName = row['마켓명'];
        if (!marketName) return;

        if (!byMarket[marketName]) {
            byMarket[marketName] = createEmptyStats();
        }

        updateOverallStats(byMarket[marketName], row);
    }

    /**
     * 옵션별 통계 업데이트
     */
    function updateOptionStats(byOption, row) {
        const optionName = String(row['옵션명'] || '').trim() || '(옵션없음)';

        if (!byOption[optionName]) {
            byOption[optionName] = createEmptyStats();
        }

        updateOverallStats(byOption[optionName], row);
    }

    /**
     * 공급처별 통계 업데이트
     */
    function updateVendorStats(byVendor, row) {
        let vendor = String(row['벤더사'] || '').trim();
        if (!vendor || vendor === '달래마켓') vendor = '자사';

        if (!byVendor[vendor]) {
            byVendor[vendor] = createEmptyStats();
        }

        updateOverallStats(byVendor[vendor], row);
    }

    /**
     * 셀러별 통계 업데이트
     */
    function updateSellerStats(bySeller, row) {
        let seller = String(row['셀러'] || '').trim();
        if (!seller) seller = '자사';

        if (!bySeller[seller]) {
            bySeller[seller] = createEmptyStats();
        }

        updateOverallStats(bySeller[seller], row);
    }

    /**
     * 날짜별 통계 업데이트
     */
    function updateDateStats(byDate, row) {
        const dateValue = row['결제일'] || row['주문일'];
        if (!dateValue) return;

        const date = String(dateValue).split(' ')[0]; // YYYY-MM-DD 부분만

        if (!byDate[date]) {
            byDate[date] = {
                count: 0,
                quantity: 0,
                amount: 0
            };
        }

        const quantity = parseInt(row['수량']) || 1;
        const amount = parseFloat(row['정산예정금액']) || 0;

        byDate[date].count++;
        byDate[date].quantity += quantity;
        byDate[date].amount += amount;
    }

    /**
     * 요약 통계 계산
     */
    function calculateSummary(stats) {
        stats.summary.totalOrders = stats.overall.count;
        stats.summary.totalQuantity = stats.overall.quantity;
        stats.summary.totalAmount = stats.overall.amount;
        stats.summary.averageOrderValue = stats.overall.count > 0 ? 
            Math.round(stats.overall.amount / stats.overall.count) : 0;
        stats.summary.marketCount = Object.keys(stats.byMarket).length;
        stats.summary.optionCount = Object.keys(stats.byOption).length;
    }

    /**
     * 통계 비교
     */
    function compareStatistics(current, previous) {
        const comparison = {
            orders: {
                current: current.overall.count,
                previous: previous.overall.count,
                change: 0,
                changePercent: 0
            },
            quantity: {
                current: current.overall.quantity,
                previous: previous.overall.quantity,
                change: 0,
                changePercent: 0
            },
            amount: {
                current: current.overall.amount,
                previous: previous.overall.amount,
                change: 0,
                changePercent: 0
            }
        };

        // 변화량 계산
        for (const key of ['orders', 'quantity', 'amount']) {
            const metric = comparison[key];
            metric.change = metric.current - metric.previous;
            metric.changePercent = metric.previous > 0 ? 
                Math.round((metric.change / metric.previous) * 100) : 0;
        }

        return comparison;
    }

    /**
     * 순위 계산
     */
    function calculateRankings(stats) {
        const rankings = {
            topMarkets: [],
            topOptions: [],
            topVendors: [],
            topSellers: []
        };

        // 마켓 순위
        rankings.topMarkets = Object.entries(stats.byMarket)
            .map(([name, data]) => ({
                name,
                count: data.count,
                quantity: data.quantity,
                amount: data.amount
            }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 10);

        // 옵션 순위
        rankings.topOptions = Object.entries(stats.byOption)
            .map(([name, data]) => ({
                name,
                count: data.count,
                quantity: data.quantity,
                amount: data.amount
            }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 20);

        // 공급처 순위
        rankings.topVendors = Object.entries(stats.byVendor)
            .map(([name, data]) => ({
                name,
                count: data.count,
                quantity: data.quantity,
                amount: data.amount
            }))
            .sort((a, b) => b.amount - a.amount);

        // 셀러 순위
        rankings.topSellers = Object.entries(stats.bySeller)
            .map(([name, data]) => ({
                name,
                count: data.count,
                quantity: data.quantity,
                amount: data.amount
            }))
            .sort((a, b) => b.amount - a.amount);

        return rankings;
    }

    // Public API
    return {
        generateStatistics,
        createEmptyStats,
        compareStatistics,
        calculateRankings
    };

})();

// 모듈 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MergeStatistics;
}
