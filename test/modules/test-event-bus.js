// test-event-bus.js - 事件总线测试模块
import { EventBus, Events } from '../../src/js/utils/event-bus.js';

/**
 * 事件总线测试
 */
export class TestEventBus {
    /**
     * 运行测试
     * @param {Object} TestUtils - 测试工具对象
     */
    static runTests(TestUtils) {
        console.log('📋 运行事件总线测试...');
        
        // 测试事件订阅与发布
        this.testSubscribeAndPublish(TestUtils);
        
        // 测试取消订阅
        this.testUnsubscribe(TestUtils);
        
        // 测试事件定义
        this.testEventDefinitions(TestUtils);
    }
    
    /**
     * 测试事件订阅与发布
     * @param {Object} TestUtils - 测试工具对象
     */
    static testSubscribeAndPublish(TestUtils) {
        const eventBus = new EventBus();
        let receivedData = null;
        
        // 订阅事件
        eventBus.subscribe('test-event', (data) => {
            receivedData = data;
        });
        
        // 发布事件
        const testData = { message: 'Hello World' };
        eventBus.publish('test-event', testData);
        
        // 断言
        TestUtils.assertEquals(receivedData, testData, '事件订阅与发布');
    }
    
    /**
     * 测试取消订阅
     * @param {Object} TestUtils - 测试工具对象
     */
    static testUnsubscribe(TestUtils) {
        const eventBus = new EventBus();
        let counter = 0;
        
        // 订阅事件
        const callback = () => counter++;
        const unsubscribe = eventBus.subscribe('test-event', callback);
        
        // 发布事件
        eventBus.publish('test-event');
        
        // 取消订阅
        unsubscribe();
        
        // 再次发布事件
        eventBus.publish('test-event');
        
        // 断言
        TestUtils.assertEquals(counter, 1, '取消订阅');
    }
    
    /**
     * 测试事件定义
     * @param {Object} TestUtils - 测试工具对象
     */
    static testEventDefinitions(TestUtils) {
        // 检查常用事件是否已定义
        const requiredEvents = [
            'FILE_LOADED',
            'FILE_SELECTED',
            'ELEMENT_SELECTED',
            'PROPERTY_CHANGED',
            'HISTORY_SNAPSHOT',
            'EXPORT_REQUESTED',
            'UI_ERROR'
        ];
        
        let allDefined = true;
        for (const event of requiredEvents) {
            if (!Events[event]) {
                allDefined = false;
                console.error(`事件未定义: ${event}`);
            }
        }
        
        TestUtils.assert(allDefined, '所有必需的事件类型已定义');
    }
}
