// test-suite.js - 测试套件
import { TestFileManager } from './modules/test-file-manager.js';
import { TestViewManager } from './modules/test-view-manager.js';
import { TestEventBus } from './modules/test-event-bus.js';
import { 
    TestElementSelector,
    TestPropertyEditor,
    TestLayerManager,
    TestExportManager,
    TestHistoryManager,
    TestSvgOptimizer,
    TestCodeEditor,
    TestColorPicker
} from './modules/test-modules.js';

// 测试工具函数
class TestUtils {
    static passingTests = 0;
    static failingTests = 0;
    static totalTests = 0;
    
    /**
     * 断言条件为真
     * @param {boolean} condition - 要测试的条件
     * @param {string} message - 测试消息
     */
    static assert(condition, message) {
        this.totalTests++;
        
        if (condition) {
            console.log(`✅ 通过: ${message}`);
            this.passingTests++;
        } else {
            console.error(`❌ 失败: ${message}`);
            this.failingTests++;
        }
    }
    
    /**
     * 断言两个值相等
     * @param {any} actual - 实际值
     * @param {any} expected - 期望值
     * @param {string} message - 测试消息
     */
    static assertEquals(actual, expected, message) {
        const isEqual = typeof actual === 'object' && actual !== null && expected !== null ?
            JSON.stringify(actual) === JSON.stringify(expected) :
            actual === expected;
        
        this.assert(isEqual, `${message}: 期望 ${JSON.stringify(expected)}, 实际 ${JSON.stringify(actual)}`);
    }
    
    /**
     * 输出测试总结
     */
    static printSummary() {
        console.log('--- 测试总结 ---');
        console.log(`总测试数: ${this.totalTests}`);
        console.log(`通过: ${this.passingTests}`);
        console.log(`失败: ${this.failingTests}`);
        console.log(`通过率: ${(this.passingTests / this.totalTests * 100).toFixed(2)}%`);
        console.log('-----------------');
    }
}

/**
 * 运行所有测试
 */
export function runTests() {
    console.log('🧪 SVG Studio 测试套件');
    
    // 运行各模块测试
    TestEventBus.runTests(TestUtils);
    TestFileManager.runTests(TestUtils);
    TestViewManager.runTests(TestUtils);
    TestElementSelector.runTests(TestUtils);
    TestPropertyEditor.runTests(TestUtils);
    TestLayerManager.runTests(TestUtils);
    TestExportManager.runTests(TestUtils);
    TestHistoryManager.runTests(TestUtils);
    TestSvgOptimizer.runTests(TestUtils);
    TestCodeEditor.runTests(TestUtils);
    TestColorPicker.runTests(TestUtils);
    
    // 输出测试总结
    TestUtils.printSummary();
}

/**
 * 测试套件基类
 */
export class TestSuite {
    constructor(name) {
        this.name = name;
        this.results = {
            passed: 0,
            failed: 0,
            total: 0
        };
    }
    
    /**
     * 断言条件为真
     * @param {boolean} condition - 要测试的条件
     * @param {string} message - 测试消息
     */
    assert(condition, message) {
        this.results.total++;
        
        if (condition) {
            console.log(`✅ 通过: ${message}`);
            this.results.passed++;
        } else {
            console.error(`❌ 失败: ${message}`);
            this.results.failed++;
        }
    }
    
    /**
     * 断言两个值相等
     * @param {any} actual - 实际值
     * @param {any} expected - 期望值
     * @param {string} message - 测试消息
     */
    assertEquals(actual, expected, message) {
        const isEqual = typeof actual === 'object' && actual !== null && expected !== null ?
            JSON.stringify(actual) === JSON.stringify(expected) :
            actual === expected;
        
        this.assert(isEqual, `${message}: 期望 ${JSON.stringify(expected)}, 实际 ${JSON.stringify(actual)}`);
    }
    
    /**
     * 输出测试结果
     */
    logResults() {
        console.log(`--- ${this.name} 测试结果 ---`);
        console.log(`总测试数: ${this.results.total}`);
        console.log(`通过: ${this.results.passed}`);
        console.log(`失败: ${this.results.failed}`);
        
        if (this.results.total > 0) {
            console.log(`通过率: ${(this.results.passed / this.results.total * 100).toFixed(2)}%`);
        }
        
        console.log('------------------------');
    }
}
