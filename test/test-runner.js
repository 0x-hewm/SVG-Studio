// test-runner.js - 测试运行器
import { runTests } from './test-suite.js';

// 当 DOM 加载完成后运行测试
document.addEventListener('DOMContentLoaded', () => {
    // 检查是否处于测试模式
    const urlParams = new URLSearchParams(window.location.search);
    const testMode = urlParams.get('test') === 'true';
    
    // 如果处于测试模式，则运行测试
    if (testMode) {
        console.log('🧪 开始运行测试...');
        
        // 延迟运行测试，确保应用已完全初始化
        setTimeout(() => {
            runTests();
        }, 1000);
    }
});
