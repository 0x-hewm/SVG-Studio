// batch-export-manager.js - 批量导出管理模块
import { Events } from '../utils/event-bus.js';

/**
 * 批量导出管理器
 * 负责 SVG 的批量导出功能
 */
class BatchExportManager {
    constructor(eventBus, exportManager) {
        this.eventBus = eventBus;
        this.exportManager = exportManager;
        this.exportQueue = [];
        this.isExporting = false;
        this.exportOptions = {
            formats: ['svg', 'png', 'jpeg', 'webp', 'pdf'],
            scale: 1,
            background: 'transparent',
            quality: 0.8
        };
        
        // 事件订阅
        this.eventSubscriptions = [];
        
        // 订阅事件
        this.eventSubscriptions.push(
            this.eventBus.subscribe(Events.SVG_LOADED, () => {
                this.updateUI();
            }),
            this.eventBus.subscribe(Events.PROPERTY_CHANGED, () => {
                this.updateUI();
            })
        );
        
        // 延迟检查SVG状态，确保SVG已经加载
        setTimeout(() => {
            this.updateUI();
        }, 100);
        
        // 等待DOM加载完成后初始化按钮
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initBatchExportButton();
            });
        } else {
            this.initBatchExportButton();
        }
    }
    
    /**
     * 初始化批量导出按钮
     */
    initBatchExportButton() {
        // 获取批量导出按钮
        this.batchExportBtn = document.getElementById('batch-export-btn');
        
        if (this.batchExportBtn) {
            // 绑定点击事件
            this.batchExportBtn.addEventListener('click', () => {
                this.showBatchExportDialog();
            });
            
            // 监听SVG变化事件
            this.eventSubscriptions.push(
                this.eventBus.subscribe(Events.SVG_LOADED, () => {
                    this.updateUI();
                }),
                this.eventBus.subscribe(Events.PROPERTY_CHANGED, () => {
                    this.updateUI();
                })
            );
            
            // 延迟检查SVG状态，确保SVG已经加载
            setTimeout(() => {
                this.updateUI();
            }, 100);
        } else {
            console.warn('未找到批量导出按钮元素');
        }
    }
    
    /**
     * 更新 UI
     */
    updateUI() {
        // 检查多种可能的SVG元素位置
        const svgElement1 = document.querySelector('#svg-canvas svg');
        const svgElement2 = document.querySelector('#canvas-container svg');
        const svgElement3 = document.querySelector('svg');
        const svgCanvas = document.getElementById('svg-canvas');
        
        const svgElement = svgElement1 || svgElement2 || svgElement3;
        const hasSvg = !!svgElement;
        
        if (this.batchExportBtn) {
            // 如果有SVG元素，启用按钮；如果没有SVG元素，只有在页面完全加载后才禁用
            if (hasSvg) {
                this.batchExportBtn.disabled = false;
            } else if (document.readyState === 'complete') {
                // 页面完全加载后，如果还是没有SVG，才禁用按钮
                this.batchExportBtn.disabled = true;
            } else {
                // 页面还在加载中，暂时启用按钮
                this.batchExportBtn.disabled = false;
            }
        } else {
            console.warn('批量导出按钮元素不存在');
        }
    }
    
    /**
     * 显示批量导出对话框
     */
    showBatchExportDialog() {
        // 获取 SVG 元素
        const svgElement = document.querySelector('#svg-canvas svg');
        if (!svgElement) {
            this.eventBus.publish(Events.UI_ERROR, {
                title: '无法导出',
                message: '没有可导出的 SVG'
            });
            return;
        }
        
        // 创建批量导出对话框
        const dialogContent = `
            <div class="batch-export-dialog">
                <h3>批量导出设置</h3>
                
                <div class="export-format-section">
                    <h4>选择导出格式</h4>
                    <div class="format-options">
                        <label>
                            <input type="checkbox" name="format" value="svg" checked> SVG
                        </label>
                        <label>
                            <input type="checkbox" name="format" value="png" checked> PNG
                        </label>
                        <label>
                            <input type="checkbox" name="format" value="jpeg"> JPEG
                        </label>
                        <label>
                            <input type="checkbox" name="format" value="webp"> WebP
                        </label>
                        <label>
                            <input type="checkbox" name="format" value="pdf"> PDF
                        </label>
                    </div>
                </div>
                
                <div class="export-options-section">
                    <h4>导出选项</h4>
                    
                    <div class="option-group">
                        <label for="batch-scale">缩放比例:</label>
                        <input type="number" id="batch-scale" min="0.1" max="20" step="0.1" value="1">
                    </div>
                    
                    <div class="option-group">
                        <label for="batch-background">背景颜色:</label>
                        <input type="color" id="batch-background" value="#ffffff">
                        <label class="transparent-bg">
                            <input type="checkbox" id="batch-transparent" checked> 透明背景
                        </label>
                    </div>
                    
                    <div class="option-group">
                        <label for="batch-quality">图像质量 (JPEG/WebP):</label>
                        <input type="range" id="batch-quality" min="0.1" max="1.0" step="0.1" value="0.8">
                        <span id="batch-quality-value">0.8</span>
                    </div>
                </div>
                
                <div class="export-actions">
                    <button id="batch-export-start" class="btn btn-primary">开始导出</button>
                    <button id="batch-export-cancel" class="btn btn-secondary">取消</button>
                </div>
            </div>
        `;
        
        // 显示对话框
        this.eventBus.publish(Events.UI_MODAL, {
            title: '批量导出',
            content: dialogContent,
            width: '500px',
            onShow: () => {
                this.setupDialogEvents();
            }
        });
    }
    
    /**
     * 设置对话框事件
     */
    setupDialogEvents() {
        // 获取对话框元素
        const dialog = document.querySelector('.modal-dialog');
        if (!dialog) return;
        
        // 缩放比例输入
        const scaleInput = dialog.querySelector('#batch-scale');
        
        // 背景颜色设置
        const backgroundInput = dialog.querySelector('#batch-background');
        const transparentCheck = dialog.querySelector('#batch-transparent');
        
        // 图像质量设置
        const qualityInput = dialog.querySelector('#batch-quality');
        const qualityValue = dialog.querySelector('#batch-quality-value');
        
        // 格式选择
        const formatCheckboxes = dialog.querySelectorAll('input[name="format"]');
        
        // 更新质量显示
        qualityInput.addEventListener('input', () => {
            qualityValue.textContent = qualityInput.value;
        });
        
        // 透明背景切换
        transparentCheck.addEventListener('change', () => {
            backgroundInput.disabled = transparentCheck.checked;
        });
        
        // 开始导出按钮
        const startBtn = dialog.querySelector('#batch-export-start');
        startBtn.addEventListener('click', () => {
            // 收集导出选项
            const formats = Array.from(formatCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value);
                
            // 如果没有选择任何格式，显示错误
            if (formats.length === 0) {
                this.eventBus.publish(Events.UI_ERROR, {
                    title: '导出错误',
                    message: '请至少选择一种导出格式'
                });
                return;
            }
            
            // 设置导出选项
            this.exportOptions = {
                formats: formats,
                scale: parseFloat(scaleInput.value),
                background: transparentCheck.checked ? 'transparent' : backgroundInput.value,
                quality: parseFloat(qualityInput.value)
            };
            
            // 更新导出管理器的选项
            if (this.exportManager) {
                // 更新导出管理器的控件值
                if (this.exportManager.exportScaleNew) {
                    this.exportManager.exportScaleNew.value = this.exportOptions.scale;
                }
                if (this.exportManager.exportTransparentNew) {
                    this.exportManager.exportTransparentNew.checked = (this.exportOptions.background === 'transparent');
                }
                if (this.exportManager.exportBgColorNew && this.exportOptions.background !== 'transparent') {
                    this.exportManager.exportBgColorNew.value = this.exportOptions.background;
                }
                if (this.exportManager.exportQuality) {
                    this.exportManager.exportQuality.value = this.exportOptions.quality;
                }
            }
            
            // 开始批量导出
            this.startBatchExport();
            
            // 关闭对话框
            this.eventBus.publish(Events.UI_MODAL_CLOSE);
        });
        
        // 取消按钮
        const cancelBtn = dialog.querySelector('#batch-export-cancel');
        cancelBtn.addEventListener('click', () => {
            this.eventBus.publish(Events.UI_MODAL_CLOSE);
        });
    }
    
    /**
     * 开始批量导出
     */
    startBatchExport() {
        // 准备导出队列
        this.prepareExportQueue();
        
        // 显示进度对话框
        this.showExportProgressDialog();
        
        // 开始处理队列
        this.processExportQueue();
    }
    
    /**
     * 准备导出队列
     */
    prepareExportQueue() {
        // 获取文件名（不带扩展名）
        const fileManager = window.svgStudio.fileManager;
        const fileName = fileManager.getCurrentFileName().replace(/\.svg$/, '');
        
        // 清空导出队列
        this.exportQueue = [];
        
        // 为每种格式创建导出任务
        this.exportOptions.formats.forEach(format => {
            this.exportQueue.push({
                format: format,
                fileName: `${fileName}.${format === 'pdf' ? 'pdf' : format.toLowerCase()}`,
                status: 'pending'
            });
        });
        
    }
    
    /**
     * 显示导出进度对话框
     */
    showExportProgressDialog() {
        // 创建进度对话框内容
        let content = `
            <div class="export-progress-dialog">
                <h3>正在导出文件</h3>
                <div class="progress-container">
                    <div class="progress-bar" style="width: 0%"></div>
                </div>
                <p class="progress-status">准备开始导出...</p>
                <div class="export-list">
        `;
        
        // 添加导出队列项
        this.exportQueue.forEach((item, index) => {
            content += `
                <div class="export-item" data-index="${index}">
                    <span class="export-item-name">${item.fileName}</span>
                    <span class="export-item-status pending">等待中</span>
                </div>
            `;
        });
        
        content += `
                </div>
                <div class="export-actions">
                    <button id="download-all" class="btn btn-primary" disabled>下载全部</button>
                    <button id="close-export" class="btn btn-secondary">关闭</button>
                </div>
            </div>
        `;
        
        // 显示对话框
        this.eventBus.publish(Events.UI_MODAL, {
            title: '批量导出进度',
            content: content,
            width: '500px',
            onShow: () => {
                // 设置关闭按钮事件
                const closeBtn = document.querySelector('#close-export');
                closeBtn.addEventListener('click', () => {
                    this.eventBus.publish(Events.UI_MODAL_CLOSE);
                });
                
                // 设置下载全部按钮事件
                const downloadAllBtn = document.querySelector('#download-all');
                downloadAllBtn.addEventListener('click', () => {
                    this.downloadAllExports();
                });
            },
            closable: false
        });
    }
    
    /**
     * 处理导出队列
     */
    async processExportQueue() {
        if (this.isExporting || this.exportQueue.length === 0) return;
        
        this.isExporting = true;
        const queueLength = this.exportQueue.length;
        let completed = 0;
        
        // 发布开始导出事件
        this.eventBus.publish('EXPORT_PROGRESS', {
            progress: 0,
            message: '开始批量导出...'
        });
        
        for (let i = 0; i < this.exportQueue.length; i++) {
            const item = this.exportQueue[i];
            
            try {
                // 更新进度
                this.eventBus.publish('EXPORT_PROGRESS', {
                    progress: Math.round((i / queueLength) * 100),
                    message: `正在导出: ${item.fileName}`
                });
                
                // 执行导出
                item.status = 'processing';
                this.updateExportProgress(i, 'processing');
                
                const result = await this.exportManager.exportFile(item.svgElement, {
                    format: item.format,
                    fileName: item.fileName,
                    scale: this.exportOptions.scale,
                    background: this.exportOptions.background,
                    quality: this.exportOptions.quality
                });
                
                // 导出成功
                item.status = 'completed';
                item.result = result;
                completed++;
                this.updateExportProgress(i, 'completed');
                
            } catch (error) {
                console.error(`导出失败 ${item.fileName}:`, error);
                item.status = 'failed';
                item.error = error.message;
                this.updateExportProgress(i, 'failed', error.message);
            }
            
            // 更新总体进度
            this.eventBus.publish('EXPORT_PROGRESS', {
                progress: Math.round(((i + 1) / queueLength) * 100),
                message: `已完成 ${completed}/${queueLength} 个文件`
            });
            
            // 在导出之间添加小延迟，避免阻塞 UI
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        this.isExporting = false;
        
        // 发布完成事件
        this.eventBus.publish('EXPORT_COMPLETE', {
            total: queueLength,
            completed: completed,
            failed: queueLength - completed
        });
        
        // 启用下载全部按钮
        const downloadAllBtn = document.querySelector('.btn-success');
        if (downloadAllBtn) {
            downloadAllBtn.style.display = 'inline-block';
        }
    }
    
    /**
     * 更新导出进度
     * @param {number} index - 导出队列索引
     * @param {string} status - 状态（pending/processing/completed/failed）
     * @param {string} [message] - 可选的状态消息
     */
    updateExportProgress(index, status, message) {
        const exportItem = document.querySelector(`.export-item[data-index="${index}"]`);
        if (!exportItem) return;
        
        const statusElem = exportItem.querySelector('.export-item-status');
        if (!statusElem) return;
        
        // 更新状态类
        statusElem.className = `export-item-status ${status}`;
        
        // 更新状态文本
        switch (status) {
            case 'pending':
                statusElem.textContent = '等待中';
                break;
            case 'processing':
                statusElem.textContent = '导出中...';
                break;
            case 'completed':
                statusElem.textContent = '完成';
                break;
            case 'failed':
                statusElem.textContent = `失败: ${message || '未知错误'}`;
                break;
        }
    }
    
    /**
     * 下载所有导出文件
     */
    downloadAllExports() {
        // 筛选已完成的导出
        const completedExports = this.exportQueue.filter(item => item.status === 'completed');
        
        // 如果没有完成的导出，显示错误
        if (completedExports.length === 0) {
            this.eventBus.publish('UI_ERROR', {
                title: '下载失败',
                message: '没有可下载的文件'
            });
            return;
        }
        
        // 显示成功消息
        this.eventBus.publish('UI_SUCCESS', {
            title: '导出完成',
            message: `成功导出 ${completedExports.length} 个文件`
        });
    }
    
    /**
     * 开始导出
     */
    startExport() {
        this.processExportQueue();
    }
    
    /**
     * 添加到导出队列
     * @param {SVGElement} svgElement - SVG 元素
     * @param {Object} options - 导出选项
     */
    addToQueue(svgElement, options) {
        const item = {
            svgElement: svgElement,
            format: options.format,
            fileName: options.fileName,
            status: 'pending',
            result: null,
            error: null
        };
        
        this.exportQueue.push(item);
    }
    
    /**
     * 清空导出队列
     */
    clearQueue() {
        this.exportQueue = [];
    }
    
    /**
     * 销毁管理器
     */
    destroy() {
        // 取消事件订阅
        this.eventSubscriptions.forEach(unsub => unsub());
        this.eventSubscriptions = [];
        
        // 移除事件监听器
        this.batchExportBtn.removeEventListener('click', this.showBatchExportDialog);
    }
}

export { BatchExportManager };
