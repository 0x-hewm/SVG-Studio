// test-property-panel-layout.js - 测试属性面板布局

/**
 * 属性面板布局测试套件
 * 测试属性面板的布局是否正确
 */
export class PropertyPanelLayoutTest {
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
        console.log('🧪 开始测试属性面板布局...');
        
        try {
            await this.testPanelOverflow();
            await this.testInputWidths();
            
            this.printSummary();
        } catch (error) {
            console.error('❌ 测试过程中发生错误:', error);
        }
    }
    
    /**
     * 测试面板是否溢出
     */
    async testPanelOverflow() {
        console.log('📋 测试属性面板是否溢出...');
        
        // 获取右侧面板
        const rightPanel = document.querySelector('.right-panel');
        
        // 检查右侧面板是否存在
        this.assert(rightPanel !== null, '右侧面板应该存在');
        
        if (!rightPanel) return;
        
        // 检查右侧面板是否有overflow属性
        const overflow = window.getComputedStyle(rightPanel).overflow;
        this.assert(overflow === 'auto' || overflow.includes('scroll') || overflow === 'hidden', 
                  '右侧面板应该有overflow属性以防止内容溢出');
        
        // 获取属性面板
        const propertiesPanel = document.querySelector('.properties-panel');
        
        // 检查属性面板是否存在
        this.assert(propertiesPanel !== null, '属性面板应该存在');
        
        if (!propertiesPanel) return;
        
        // 检查属性面板是否有overflow-y:auto属性
        const overflowY = window.getComputedStyle(propertiesPanel).overflowY;
        this.assert(overflowY === 'auto' || overflowY === 'scroll', 
                  '属性面板应该有overflow-y:auto或scroll属性以允许内容滚动');
        
        // 验证面板的宽度
        const panelWidth = rightPanel.getBoundingClientRect().width;
        this.assert(panelWidth >= 240, '面板宽度应该至少为240px');
        
        // 模拟添加一个具有长字符串的元素
        this.simulatePropertyPanelWithLongContent();
        
        // 检查新内容是否导致水平滚动条出现
        const horizontalOverflow = document.body.scrollWidth > window.innerWidth;
        this.assert(!horizontalOverflow, '添加长内容后不应该出现水平滚动条');
    }
    
    /**
     * 测试输入框宽度是否合适
     */
    async testInputWidths() {
        console.log('📋 测试输入框宽度是否合适...');
        
        // 获取属性行中的所有输入框
        const inputs = document.querySelectorAll('.property-row input');
        
        this.assert(inputs.length > 0, '应该至少有一个输入框');
        
        if (inputs.length === 0) return;
        
        // 检查输入框是否有合适的宽度
        let allInputsHaveAppropriateWidth = true;
        let problemInput = null;
        
        inputs.forEach(input => {
            const inputWidth = input.getBoundingClientRect().width;
            const containerWidth = input.parentElement.getBoundingClientRect().width;
            
            // 检查输入框是否比容器窄
            if (inputWidth > containerWidth) {
                allInputsHaveAppropriateWidth = false;
                problemInput = input;
            }
        });
        
        this.assert(allInputsHaveAppropriateWidth, 
                  '所有输入框的宽度应该合适，不应超出其容器' + 
                  (problemInput ? `(问题元素: ${problemInput.id || problemInput.type})` : ''));
    }
    
    /**
     * 模拟添加具有长字符串的属性面板内容
     */
    simulatePropertyPanelWithLongContent() {
        const propertiesPanel = document.querySelector('.properties-panel');
        
        if (!propertiesPanel) return;
        
        // 创建一个临时的属性组
        const tempGroup = document.createElement('div');
        tempGroup.className = 'property-group temp-test-group';
        tempGroup.innerHTML = `
            <h5>测试长内容</h5>
            <div class="property-row">
                <label>超长文本：</label>
                <input type="text" value="这是一个非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常长的文本，用于测试属性面板的换行和溢出处理。">
            </div>
            <div class="property-row">
                <label>路径数据：</label>
                <input type="text" value="M10,10 L50,10 L50,50 L10,50 Z M20,20 L40,20 L40,40 L20,40 Z M100,100 C150,100 150,150 100,150 C50,150 50,100 100,100 Z">
            </div>
        `;
        
        propertiesPanel.appendChild(tempGroup);
        
        // 在测试完成后删除临时内容
        setTimeout(() => {
            const tempElement = document.querySelector('.temp-test-group');
            if (tempElement) {
                tempElement.remove();
            }
        }, 1000);
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
        console.log('--- 属性面板布局测试结果 ---');
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
export function testPropertyPanelLayout() {
    // 创建测试实例并运行
    const test = new PropertyPanelLayoutTest();
    return test.runTests();
}
