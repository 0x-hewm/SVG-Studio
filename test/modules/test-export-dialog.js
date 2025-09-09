// test-export-dialog.js - 测试导出对话框功能
import { ExportManager } from '../../src/js/modules/export-manager.js';
import { EventBus } from '../../src/js/utils/event-bus.js';

/**
 * 测试导出对话框功能
 */
export function testExportDialog() {
    console.log('---------- 测试导出对话框 ----------');
    
    // 创建测试环境
    setupTestEnvironment();
    
    // 运行测试
    const results = runTests();
    
    // 输出测试结果
    console.log(`通过: ${results.passed}, 失败: ${results.failed}`);
    
    // 如果有失败的测试，抛出错误
    if (results.failed > 0) {
        throw new Error('导出对话框测试失败');
    }
    
    // 清理测试环境
    cleanupTestEnvironment();
    
    console.log('导出对话框测试完成');
}

/**
 * 设置测试环境
 */
function setupTestEnvironment() {
    // 创建测试用的 DOM 元素
    const exportDialog = document.createElement('div');
    exportDialog.id = 'export-dialog';
    exportDialog.className = 'export-dialog';
    exportDialog.innerHTML = `
        <div class="export-dialog-content">
            <div class="export-dialog-header">
                <h3>导出 SVG</h3>
                <button class="export-dialog-close">&times;</button>
            </div>
            <div class="export-dialog-body">
                <div class="export-formats">
                    <div class="export-format-btn selected" data-format="svg">SVG</div>
                    <div class="export-format-btn" data-format="png">PNG</div>
                    <div class="export-format-btn" data-format="jpeg">JPEG</div>
                    <div class="export-format-btn" data-format="webp">WebP</div>
                    <div class="export-format-btn" data-format="pdf">PDF</div>
                </div>
                <div class="export-options-group">
                    <div class="export-option">
                        <label for="export-scale-new">缩放比例:</label>
                        <input type="range" id="export-scale-new" min="0.5" max="5" value="1" step="0.1">
                        <span id="export-scale-value-new">1.0x</span>
                    </div>
                    <div class="export-option">
                        <label for="export-bg-color-new">背景颜色:</label>
                        <input type="color" id="export-bg-color-new" value="#ffffff">
                    </div>
                    <div class="export-option">
                        <label for="export-transparent-new">透明背景:</label>
                        <input type="checkbox" id="export-transparent-new">
                    </div>
                </div>
                <div class="export-options-group image-format-options">
                    <div class="export-option">
                        <label for="export-quality">质量:</label>
                        <input type="range" id="export-quality" min="0.1" max="1.0" value="0.9" step="0.1">
                        <span id="export-quality-value">90%</span>
                    </div>
                </div>
            </div>
            <div class="export-dialog-footer">
                <button class="cancel-btn">取消</button>
                <button class="export-btn">导出</button>
            </div>
        </div>
    `;
    
    const exportBtn = document.createElement('button');
    exportBtn.id = 'export-btn';
    exportBtn.textContent = '导出';
    
    const svgCanvas = document.createElement('div');
    svgCanvas.id = 'svg-canvas';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '300');
    svg.setAttribute('height', '200');
    svg.setAttribute('viewBox', '0 0 300 200');
    svgCanvas.appendChild(svg);
    
    document.body.appendChild(exportDialog);
    document.body.appendChild(exportBtn);
    document.body.appendChild(svgCanvas);
    
    // 创建全局变量
    window.originalCreateObjectURL = URL.createObjectURL;
    window.originalRevokeObjectURL = URL.revokeObjectURL;
    
    // 模拟 URL 方法
    URL.createObjectURL = (blob) => 'mock-url';
    URL.revokeObjectURL = (url) => {};
    
    // 模拟 Blob
    window.Blob = class MockBlob {
        constructor(content, options) {
            this.content = content;
            this.options = options;
        }
    };
    
    // 模拟下载链接点击
    document.createElement = (function(originalCreateElement) {
        return function(tagName) {
            const element = originalCreateElement.call(document, tagName);
            if (tagName.toLowerCase() === 'a') {
                element.click = function() {
                    console.log('模拟文件下载:', this.download);
                };
            }
            return element;
        };
    })(document.createElement);
}

/**
 * 清理测试环境
 */
function cleanupTestEnvironment() {
    // 移除测试 DOM 元素
    document.getElementById('export-dialog').remove();
    document.getElementById('export-btn').remove();
    document.getElementById('svg-canvas').remove();
    
    // 恢复原始方法
    URL.createObjectURL = window.originalCreateObjectURL;
    URL.revokeObjectURL = window.originalRevokeObjectURL;
}

/**
 * 运行测试
 */
function runTests() {
    let passed = 0;
    let failed = 0;
    
    // 创建事件总线和导出管理器
    const eventBus = new EventBus();
    const exportManager = new ExportManager(eventBus);
    
    try {
        // 测试 1: 初始化导出管理器
        exportManager.init();
        console.log('✓ 导出管理器初始化成功');
        passed++;
    } catch (error) {
        console.error('✗ 导出管理器初始化失败:', error);
        failed++;
    }
    
    try {
        // 测试 2: 打开导出对话框
        exportManager.openExportDialog();
        
        // 验证对话框状态
        const dialogDisplayStyle = window.getComputedStyle(exportManager.exportDialog).display;
        if (dialogDisplayStyle !== 'none') {
            console.log('✓ 打开导出对话框成功');
            passed++;
        } else {
            console.error('✗ 打开导出对话框失败');
            failed++;
        }
    } catch (error) {
        console.error('✗ 打开导出对话框失败:', error);
        failed++;
    }
    
    try {
        // 测试 3: 关闭导出对话框
        exportManager.closeExportDialog();
        setTimeout(() => {
            // 验证对话框状态
            const dialogHasShowClass = exportManager.exportDialog.classList.contains('show');
            if (!dialogHasShowClass) {
                console.log('✓ 关闭导出对话框成功');
                passed++;
            } else {
                console.error('✗ 关闭导出对话框失败');
                failed++;
            }
        }, 400); // 等待过渡效果完成后检查
    } catch (error) {
        console.error('✗ 关闭导出对话框失败:', error);
        failed++;
    }
    
    try {
        // 测试 4: 选择导出格式
        const pngFormatBtn = document.querySelector('.export-format-btn[data-format="png"]');
        const event = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        pngFormatBtn.dispatchEvent(event);
        
        // 验证格式选择
        const isSelected = pngFormatBtn.classList.contains('selected');
        const selectedFormat = exportManager.selectedFormat;
        
        if (isSelected && selectedFormat === 'png') {
            console.log('✓ 选择导出格式成功');
            passed++;
        } else {
            console.error('✗ 选择导出格式失败');
            failed++;
        }
    } catch (error) {
        console.error('✗ 选择导出格式失败:', error);
        failed++;
    }
    
    try {
        // 测试 5: 更新格式选项显示
        exportManager.updateFormatOptions('svg');
        const imageFormatOptionsDisplay = document.querySelector('.image-format-options').style.display;
        
        if (imageFormatOptionsDisplay === 'none') {
            console.log('✓ 更新格式选项显示成功');
            passed++;
        } else {
            console.error('✗ 更新格式选项显示失败');
            failed++;
        }
    } catch (error) {
        console.error('✗ 更新格式选项显示失败:', error);
        failed++;
    }
    
    return { passed, failed };
}
