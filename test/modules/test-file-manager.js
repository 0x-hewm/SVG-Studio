// test-file-manager.js - 文件管理测试模块

/**
 * 文件管理器测试
 */
export class TestFileManager {
    /**
     * 运行测试
     * @param {Object} TestUtils - 测试工具对象
     */
    static runTests(TestUtils) {
        console.log('📋 运行文件管理器测试...');
        
        // 测试 DOM 元素存在
        this.testDOMElementsExist(TestUtils);
        
        // 测试模拟文件加载
        this.testMockFileLoad(TestUtils);
    }
    
    /**
     * 测试 DOM 元素存在
     * @param {Object} TestUtils - 测试工具对象
     */
    static testDOMElementsExist(TestUtils) {
        const fileInput = document.getElementById('file-input');
        const importBtn = document.getElementById('import-btn');
        const fileTabs = document.getElementById('file-tabs');
        
        TestUtils.assert(fileInput !== null, '文件输入元素存在');
        TestUtils.assert(importBtn !== null, '导入按钮元素存在');
        TestUtils.assert(fileTabs !== null, '文件标签面板元素存在');
    }
    
    /**
     * 测试模拟文件加载
     * @param {Object} TestUtils - 测试工具对象
     */
    static testMockFileLoad(TestUtils) {
        // 获取文件管理器实例
        const fileManager = window.svgStudio ? window.svgStudio.fileManager : null;
        
        if (!fileManager) {
            TestUtils.assert(false, '无法获取文件管理器实例');
            return;
        }
        
        // 创建一个模拟的 SVG 内容
        const mockSvgContent = '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="red"/></svg>';
        
        try {
            // 解析模拟的 SVG 内容
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(mockSvgContent, 'image/svg+xml');
            
            // 创建一个模拟的文件对象
            const mockFileObj = {
                id: 'mock_file_1',
                name: 'test.svg',
                content: mockSvgContent,
                svgDoc: svgDoc
            };
            
            // 测试添加文件
            if (typeof fileManager.files !== 'undefined') {
                // 记录初始文件数量
                const initialFileCount = fileManager.files.length;
                
                // 直接添加到文件列表
                fileManager.files.push(mockFileObj);
                
                // 创建文件标签页
                fileManager.createFileTab(mockFileObj);
                
                // 设置为活动文件
                fileManager.setActiveFile(fileManager.files.length - 1);
                
                // 检查文件是否已添加
                TestUtils.assertEquals(fileManager.files.length, initialFileCount + 1, '文件已添加到文件列表');
                
                // 检查是否是活动文件
                TestUtils.assertEquals(fileManager.getActiveFile().id, mockFileObj.id, '设置活动文件成功');
                
                // 清理
                fileManager.closeFile(mockFileObj.id);
            } else {
                TestUtils.assert(false, '文件管理器实例不完整');
            }
        } catch (error) {
            TestUtils.assert(false, `模拟文件加载测试失败: ${error.message}`);
        }
    }
}
