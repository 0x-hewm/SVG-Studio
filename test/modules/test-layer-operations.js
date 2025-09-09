// test-layer-operations.js - 测试图层操作功能

/**
 * 图层操作测试套件
 * 测试图层删除和隐藏功能是否正常工作
 */
export class LayerOperationsTest {
    constructor() {
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0
        };
    }
    
    /**
     * 运行所有测试
     */
    async runTests() {
        console.log('🧪 开始测试图层操作功能...');
        
        try {
            await this.testLayerVisibilityToggle();
            await this.testLayerDeletion();
            
            this.printSummary();
        } catch (error) {
            console.error('❌ 测试过程中发生错误:', error);
        }
    }
    
    /**
     * 测试图层可见性切换
     */
    async testLayerVisibilityToggle() {
        console.log('📋 测试图层可见性切换...');
        
        // 1. 创建一个临时SVG
        const svgDoc = this.createTestSvg();
        const container = document.getElementById('svg-canvas');
        container.innerHTML = '';
        container.appendChild(svgDoc);
        
        // 2. 初始化图层管理器（通过应用的事件总线）
        const eventBus = window.app ? window.app.eventBus : null;
        if (!eventBus) {
            this.assert(false, '无法访问应用程序的事件总线');
            return;
        }
        
        // 3. 发布文件加载事件，让图层管理器处理这个SVG
        eventBus.publish('file-loaded', {
            id: 'test-file',
            name: 'test.svg',
            svgDoc: svgDoc,
            originalContent: svgDoc.outerHTML
        });
        
        // 4. 等待图层管理器处理完成
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // 5. 获取图层管理器创建的图层项
        const layersPanel = document.getElementById('layers-panel');
        const layerItems = layersPanel.querySelectorAll('.layer-item');
        
        this.assert(layerItems.length > 0, '应该至少有一个图层项');
        
        if (layerItems.length === 0) return;
        
        // 6. 点击第一个图层的可见性按钮
        const firstLayerVisibilityBtn = layerItems[0].querySelector('.layer-visibility');
        const firstLayerId = layerItems[0].dataset.layerId;
        const svgElement = svgDoc.getElementById(firstLayerId);
        
        this.assert(svgElement !== null, `应该能找到ID为${firstLayerId}的SVG元素`);
        
        // 记录元素的初始可见性状态
        const initialDisplay = window.getComputedStyle(svgElement).display;
        
        // 点击隐藏按钮
        firstLayerVisibilityBtn.click();
        
        // 等待图层管理器处理完成
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // 验证元素现在是隐藏的
        const hiddenDisplay = window.getComputedStyle(svgElement).display;
        this.assert(hiddenDisplay === 'none', '点击隐藏按钮后，元素应该被隐藏');
        
        // 再次点击可见性按钮，使元素重新显示
        firstLayerVisibilityBtn.click();
        
        // 等待图层管理器处理完成
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // 验证元素现在是可见的
        const visibleDisplay = window.getComputedStyle(svgElement).display;
        this.assert(visibleDisplay !== 'none', '再次点击隐藏按钮后，元素应该重新显示');
    }
    
    /**
     * 测试图层删除
     */
    async testLayerDeletion() {
        console.log('📋 测试图层删除...');
        
        // 1. 创建一个临时SVG
        const svgDoc = this.createTestSvg();
        const container = document.getElementById('svg-canvas');
        container.innerHTML = '';
        container.appendChild(svgDoc);
        
        // 2. 初始化图层管理器（通过应用的事件总线）
        const eventBus = window.app ? window.app.eventBus : null;
        if (!eventBus) {
            this.assert(false, '无法访问应用程序的事件总线');
            return;
        }
        
        // 3. 发布文件加载事件，让图层管理器处理这个SVG
        eventBus.publish('file-loaded', {
            id: 'test-file',
            name: 'test.svg',
            svgDoc: svgDoc,
            originalContent: svgDoc.outerHTML
        });
        
        // 4. 等待图层管理器处理完成
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // 5. 获取图层管理器创建的图层项
        const layersPanel = document.getElementById('layers-panel');
        const layerItems = layersPanel.querySelectorAll('.layer-item');
        
        this.assert(layerItems.length > 0, '应该至少有一个图层项');
        
        if (layerItems.length === 0) return;
        
        // 记录初始图层数量
        const initialLayerCount = layerItems.length;
        
        // 修改确认对话框，让它自动返回true
        const originalConfirm = window.confirm;
        window.confirm = () => true;
        
        // 6. 点击第一个图层的删除按钮
        const firstLayerDeleteBtn = layerItems[0].querySelector('.delete');
        const firstLayerId = layerItems[0].dataset.layerId;
        
        // 记录SVG元素的数量
        const initialElementCount = svgDoc.querySelectorAll('*').length;
        
        // 点击删除按钮
        firstLayerDeleteBtn.click();
        
        // 等待图层管理器处理完成
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // 恢复确认对话框
        window.confirm = originalConfirm;
        
        // 7. 验证图层项已被删除
        const newLayerItems = layersPanel.querySelectorAll('.layer-item');
        this.assert(newLayerItems.length === initialLayerCount - 1, '删除后，图层数量应该减少1');
        
        // 8. 验证SVG元素已被移除
        const remainingElement = svgDoc.getElementById(firstLayerId);
        this.assert(remainingElement === null, `ID为${firstLayerId}的SVG元素应该已被删除`);
        
        // 9. 验证SVG元素总数减少
        const newElementCount = svgDoc.querySelectorAll('*').length;
        this.assert(newElementCount < initialElementCount, 'SVG元素总数应该减少');
    }
    
    /**
     * 创建测试用的SVG文档
     */
    createTestSvg() {
        const svgNS = 'http://www.w3.org/2000/svg';
        const svgDoc = document.createElementNS(svgNS, 'svg');
        svgDoc.setAttribute('width', '200');
        svgDoc.setAttribute('height', '200');
        svgDoc.setAttribute('viewBox', '0 0 200 200');
        
        // 创建几个不同的图形作为图层
        const rect1 = document.createElementNS(svgNS, 'rect');
        rect1.setAttribute('id', 'layer1');
        rect1.setAttribute('x', '10');
        rect1.setAttribute('y', '10');
        rect1.setAttribute('width', '50');
        rect1.setAttribute('height', '50');
        rect1.setAttribute('fill', 'red');
        
        const circle1 = document.createElementNS(svgNS, 'circle');
        circle1.setAttribute('id', 'layer2');
        circle1.setAttribute('cx', '100');
        circle1.setAttribute('cy', '100');
        circle1.setAttribute('r', '40');
        circle1.setAttribute('fill', 'blue');
        
        const rect2 = document.createElementNS(svgNS, 'rect');
        rect2.setAttribute('id', 'layer3');
        rect2.setAttribute('x', '130');
        rect2.setAttribute('y', '130');
        rect2.setAttribute('width', '60');
        rect2.setAttribute('height', '60');
        rect2.setAttribute('fill', 'green');
        
        svgDoc.appendChild(rect1);
        svgDoc.appendChild(circle1);
        svgDoc.appendChild(rect2);
        
        return svgDoc;
    }
    
    /**
     * 断言方法
     */
    assert(condition, message) {
        this.testResults.total++;
        
        if (condition) {
            console.log(`✅ ${message}`);
            this.testResults.passed++;
        } else {
            console.error(`❌ ${message}`);
            this.testResults.failed++;
        }
    }
    
    /**
     * 打印测试结果
     */
    printSummary() {
        console.log('--- 图层操作测试结果 ---');
        console.log(`总测试数: ${this.testResults.total}`);
        console.log(`通过: ${this.testResults.passed}`);
        console.log(`失败: ${this.testResults.failed}`);
        
        if (this.testResults.total > 0) {
            console.log(`通过率: ${(this.testResults.passed / this.testResults.total * 100).toFixed(2)}%`);
        }
        
        console.log('------------------------');
    }
}

/**
 * 导出函数，用于在测试页面中直接调用
 */
export function testLayerOperations() {
    // 创建测试实例并运行
    const test = new LayerOperationsTest();
    return test.runTests();
}
