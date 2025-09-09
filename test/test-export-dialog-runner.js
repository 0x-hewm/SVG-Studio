// test-export-dialog-runner.js - 导出对话框测试运行器
import { testExportDialog } from './modules/test-export-dialog.js';

/**
 * 运行导出对话框测试
 */
async function runTests() {
    console.log('开始导出对话框测试...');
    
    try {
        await testExportDialog();
        console.log('导出对话框测试成功完成');
    } catch (error) {
        console.error('导出对话框测试失败:', error);
    }
}

// 运行测试
runTests();
