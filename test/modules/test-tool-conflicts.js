// test-tool-conflicts.js - 测试工具冲突处理

/**
 * 工具冲突测试套件
 * 测试测量工具和裁剪工具的互斥性
 */
export class ToolConflictsTest {
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
        console.log('🧪 开始测试工具冲突处理...');
        
        try {
            await this.testCropMeasureConflict();
            await this.testMeasureCropConflict();
            
            this.printSummary();
        } catch (error) {
            console.error('❌ 测试过程中发生错误:', error);
        }
    }
    
    /**
     * 测试裁剪工具激活时的测量工具冲突
     */
    async testCropMeasureConflict() {
        console.log('📋 测试裁剪工具激活时的测量工具冲突...');
        
        // 获取应用程序实例
        const app = window.svgStudio || window.app;
        if (!app) {
            this.assert(false, '无法访问应用程序实例');
            return;
        }
        
        // 获取工具实例
        const cropManager = app.cropManager;
        const measureTool = app.measureTool;
        
        if (!cropManager || !measureTool) {
            this.assert(false, '无法访问裁剪工具或测量工具');
            return;
        }
        
        // 确保工具都处于初始状态
        cropManager.cancelCrop();
        if (measureTool.active) {
            measureTool.toggleMeasureTool();
        }
        
        // 模拟错误消息发布
        let errorPublished = false;
        const originalPublish = app.eventBus.publish;
        app.eventBus.publish = (event, data) => {
            if (event === 'ui-error') {
                errorPublished = true;
            }
            originalPublish.call(app.eventBus, event, data);
        };
        
        // 1. 激活裁剪工具
        try {
            // 保存原始confirm函数
            const originalConfirm = window.confirm;
            window.confirm = () => true;
            
            // 点击裁剪按钮
            cropManager.startCrop();
            
            // 等待裁剪工具激活
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // 验证裁剪工具已激活
            this.assert(cropManager.cropActive, '裁剪工具应该处于激活状态');
            
            // 2. 尝试激活测量工具
            measureTool.toggleMeasureTool();
            
            // 等待处理
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // 3. 验证测量工具未激活并显示了错误
            this.assert(!measureTool.active, '测量工具应该无法激活');
            this.assert(errorPublished, '应该显示冲突错误消息');
            
            // 恢复原始函数
            window.confirm = originalConfirm;
        } finally {
            // 取消裁剪
            cropManager.cancelCrop();
            
            // 恢复事件发布函数
            app.eventBus.publish = originalPublish;
        }
    }
    
    /**
     * 测试测量工具激活时的裁剪工具冲突
     */
    async testMeasureCropConflict() {
        console.log('📋 测试测量工具激活时的裁剪工具冲突...');
        
        // 获取应用程序实例
        const app = window.svgStudio || window.app;
        if (!app) {
            this.assert(false, '无法访问应用程序实例');
            return;
        }
        
        // 获取工具实例
        const cropManager = app.cropManager;
        const measureTool = app.measureTool;
        
        if (!cropManager || !measureTool) {
            this.assert(false, '无法访问裁剪工具或测量工具');
            return;
        }
        
        // 确保工具都处于初始状态
        cropManager.cancelCrop();
        if (measureTool.active) {
            measureTool.toggleMeasureTool();
        }
        
        // 模拟错误消息发布
        let errorPublished = false;
        const originalPublish = app.eventBus.publish;
        app.eventBus.publish = (event, data) => {
            if (event === 'ui-error') {
                errorPublished = true;
            }
            originalPublish.call(app.eventBus, event, data);
        };
        
        try {
            // 1. 激活测量工具
            measureTool.toggleMeasureTool();
            
            // 等待测量工具激活
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // 验证测量工具已激活
            this.assert(measureTool.active, '测量工具应该处于激活状态');
            
            // 2. 尝试激活裁剪工具
            cropManager.startCrop();
            
            // 等待处理
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // 3. 验证裁剪工具未激活并显示了错误
            this.assert(!cropManager.cropActive, '裁剪工具应该无法激活');
            this.assert(errorPublished, '应该显示冲突错误消息');
        } finally {
            // 关闭测量工具
            if (measureTool.active) {
                measureTool.toggleMeasureTool();
            }
            
            // 恢复事件发布函数
            app.eventBus.publish = originalPublish;
        }
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
        console.log('--- 工具冲突测试结果 ---');
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
export function testToolConflicts() {
    // 创建测试实例并运行
    const test = new ToolConflictsTest();
    return test.runTests();
}
