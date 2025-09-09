// test-view-manager.js - 视图管理测试模块

/**
 * 视图管理器测试
 */
export class TestViewManager {
    /**
     * 运行测试
     * @param {Object} TestUtils - 测试工具对象
     */
    static runTests(TestUtils) {
        console.log('📋 运行视图管理器测试...');
        
        // 测试 DOM 元素存在
        this.testDOMElementsExist(TestUtils);
        
        // 测试缩放功能
        this.testZoomFunctions(TestUtils);
    }
    
    /**
     * 测试 DOM 元素存在
     * @param {Object} TestUtils - 测试工具对象
     */
    static testDOMElementsExist(TestUtils) {
        const canvasContainer = document.getElementById('canvas-container');
        const svgCanvas = document.getElementById('svg-canvas');
        const zoomInBtn = document.getElementById('zoom-in-btn');
        const zoomOutBtn = document.getElementById('zoom-out-btn');
        const resetViewBtn = document.getElementById('reset-view-btn');
        const fitViewBtn = document.getElementById('fit-view-btn');
        
        TestUtils.assert(canvasContainer !== null, '画布容器元素存在');
        TestUtils.assert(svgCanvas !== null, 'SVG 画布元素存在');
        TestUtils.assert(zoomInBtn !== null, '放大按钮元素存在');
        TestUtils.assert(zoomOutBtn !== null, '缩小按钮元素存在');
        TestUtils.assert(resetViewBtn !== null, '重置视图按钮元素存在');
        TestUtils.assert(fitViewBtn !== null, '适配视图按钮元素存在');
    }
    
    /**
     * 测试缩放功能
     * @param {Object} TestUtils - 测试工具对象
     */
    static testZoomFunctions(TestUtils) {
        // 获取视图管理器实例
        const viewManager = window.svgStudio ? window.svgStudio.viewManager : null;
        
        if (!viewManager) {
            TestUtils.assert(false, '无法获取视图管理器实例');
            return;
        }
        
        try {
            // 保存初始缩放值
            const initialScale = viewManager.scale;
            
            // 测试放大
            viewManager.zoomIn();
            TestUtils.assert(viewManager.scale > initialScale, '放大功能正常工作');
            
            // 测试缩小
            viewManager.zoomOut();
            TestUtils.assertEquals(viewManager.scale, initialScale, '缩小功能正常工作');
            
            // 测试重置视图
            viewManager.resetView();
            TestUtils.assertEquals(viewManager.scale, 1, '重置视图功能正常工作');
            
            // 测试自定义缩放
            viewManager.zoom(2);
            TestUtils.assertEquals(viewManager.scale, 2, '自定义缩放功能正常工作');
            
            // 恢复初始状态
            viewManager.resetView();
        } catch (error) {
            TestUtils.assert(false, `缩放功能测试失败: ${error.message}`);
        }
    }
}
