// crop-manager.js - 裁剪管理模块
import { Events } from '../utils/event-bus.js';

/**
 * 裁剪管理器
 * 负责 SVG 的裁剪功能
 */
export class CropManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.cropActive = false;
        this.cropStartX = 0;
        this.cropStartY = 0;
        this.cropEndX = 0;
        this.cropEndY = 0;
        
        // DOM 元素
        this.canvasContainer = document.getElementById('canvas-container');
        this.svgCanvas = document.getElementById('svg-canvas');
        this.cropBtn = document.getElementById('crop-btn');
        this.applyBtn = document.getElementById('crop-apply-btn');
        this.cancelBtn = document.getElementById('crop-cancel-btn');
        this.cropToolbar = document.getElementById('crop-toolbar');
        
        // 裁剪框元素
        this.cropBox = null;
        
        // 订阅事件
        this.eventSubscriptions = [];
        
        // 订阅文件关闭事件
        this.eventSubscriptions.push(
            this.eventBus.subscribe(Events.FILE_CLOSED, () => {
                this.clearCrop();
            })
        );
    }
    
    /**
     * 初始化裁剪管理器
     */
    init() {
        // 裁剪按钮点击事件
        this.cropBtn.addEventListener('click', () => {
            this.startCrop();
        });
        
        // 应用裁剪按钮点击事件
        this.applyBtn.addEventListener('click', () => {
            this.applyCrop();
        });
        
        // 取消裁剪按钮点击事件
        this.cancelBtn.addEventListener('click', () => {
            this.cancelCrop();
        });
        
        // 订阅文件加载事件
        this.eventSubscriptions.push(
            this.eventBus.subscribe(Events.FILE_LOADED, () => {
                this.cancelCrop();
            })
        );
        
        // 订阅文件选择事件
        this.eventSubscriptions.push(
            this.eventBus.subscribe(Events.FILE_SELECTED, () => {
                this.cancelCrop();
            })
        );
    }
    
    /**
     * 开始裁剪
     */
    startCrop() {
        if (this.cropActive) {
            return;
        }
        
        // 检查测量工具是否激活
        const measureTool = window.svgStudio ? window.svgStudio.measureTool : null;
        if (measureTool && measureTool.active) {
            // 如果测量工具激活，则显示提示并不开始裁剪
            this.eventBus.publish(Events.UI_ERROR, {
                title: '工具冲突',
                message: '请先关闭测量工具，再使用裁剪功能。'
            });
            return;
        }
        
        // 获取 SVG 元素
        const svgElement = document.querySelector('#svg-canvas svg');
        if (!svgElement) {
            this.eventBus.publish(Events.UI_ERROR, {
                title: '无法裁剪',
                message: '没有可裁剪的 SVG'
            });
            return;
        }
        
        // 激活裁剪模式
        this.cropActive = true;
        this.canvasContainer.classList.add('crop-mode');
        
        // 显示裁剪工具栏
        this.cropToolbar.classList.remove('hidden');
        
        // 创建裁剪框
        this.createCropBox();
        
        // 添加鼠标事件
        this.addCropEvents();
        
        // 禁用其他工具
        this.disableOtherTools();
        
        // 显示提示
        this.eventBus.publish(Events.UI_MODAL, {
            title: '裁剪模式',
            content: `
                请拖动鼠标创建裁剪区域。
                完成后，点击"应用裁剪"按钮确认裁剪，或点击"取消"退出裁剪模式。
            `
        });
    }
    
    /**
     * 创建裁剪框
     */
    createCropBox() {
        // 创建裁剪框元素
        this.cropBox = document.createElement('div');
        this.cropBox.className = 'crop-box';
        
        // 添加到画布容器
        this.canvasContainer.appendChild(this.cropBox);
    }
    
    /**
     * 添加裁剪事件
     */
    addCropEvents() {
        // 鼠标按下开始绘制裁剪框
        this.canvasContainer.addEventListener('mousedown', this.handleMouseDown);
        
        // 鼠标移动调整裁剪框大小
        document.addEventListener('mousemove', this.handleMouseMove);
        
        // 鼠标松开完成裁剪框绘制
        document.addEventListener('mouseup', this.handleMouseUp);
    }
    
    /**
     * 移除裁剪事件
     */
    removeCropEvents() {
        this.canvasContainer.removeEventListener('mousedown', this.handleMouseDown);
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
    }
    
    /**
     * 处理鼠标按下事件
     * @param {MouseEvent} e - 鼠标事件
     */
    handleMouseDown = (e) => {
        if (!this.cropActive) {
            return;
        }
        
        // 获取裁剪起点（相对于画布容器）
        const rect = this.canvasContainer.getBoundingClientRect();
        this.cropStartX = e.clientX - rect.left;
        this.cropStartY = e.clientY - rect.top;
        
        // 初始化裁剪框
        this.cropBox.style.left = `${this.cropStartX}px`;
        this.cropBox.style.top = `${this.cropStartY}px`;
        this.cropBox.style.width = '0';
        this.cropBox.style.height = '0';
        this.cropBox.classList.add('active');
    }
    
    /**
     * 处理鼠标移动事件
     * @param {MouseEvent} e - 鼠标事件
     */
    handleMouseMove = (e) => {
        if (!this.cropActive || !this.cropBox.classList.contains('active')) {
            return;
        }
        
        // 获取裁剪终点（相对于画布容器）
        const rect = this.canvasContainer.getBoundingClientRect();
        this.cropEndX = e.clientX - rect.left;
        this.cropEndY = e.clientY - rect.top;
        
        // 计算裁剪框尺寸和位置
        const left = Math.min(this.cropStartX, this.cropEndX);
        const top = Math.min(this.cropStartY, this.cropEndY);
        const width = Math.abs(this.cropEndX - this.cropStartX);
        const height = Math.abs(this.cropEndY - this.cropStartY);
        
        // 更新裁剪框
        this.cropBox.style.left = `${left}px`;
        this.cropBox.style.top = `${top}px`;
        this.cropBox.style.width = `${width}px`;
        this.cropBox.style.height = `${height}px`;
    }
    
    /**
     * 处理鼠标松开事件
     */
    handleMouseUp = () => {
        if (!this.cropActive || !this.cropBox.classList.contains('active')) {
            return;
        }
        
        // 完成裁剪框绘制
        this.cropBox.classList.remove('active');
        
        // 计算裁剪区域（相对于 SVG 画布）
        const viewManager = window.svgStudio.viewManager;
        const scale = viewManager.scale;
        const translateX = viewManager.translateX;
        const translateY = viewManager.translateY;
        
        // 计算裁剪区域在 SVG 坐标系中的位置
        const left = Math.min(this.cropStartX, this.cropEndX);
        const top = Math.min(this.cropStartY, this.cropEndY);
        const width = Math.abs(this.cropEndX - this.cropStartX);
        const height = Math.abs(this.cropEndY - this.cropStartY);
        
        // 转换为 SVG 坐标
        const svgLeft = (left - translateX) / scale;
        const svgTop = (top - translateY) / scale;
        const svgWidth = width / scale;
        const svgHeight = height / scale;
        
        // 存储裁剪区域信息
        this.cropInfo = {
            x: svgLeft,
            y: svgTop,
            width: svgWidth,
            height: svgHeight
        };
    }
    
    /**
     * 应用裁剪
     */
    applyCrop() {
        if (!this.cropActive || !this.cropInfo) {
            return;
        }
        
        try {
            // 获取 SVG 元素
            const svgElement = document.querySelector('#svg-canvas svg');
            if (!svgElement) {
                throw new Error('没有可裁剪的 SVG');
            }
            
            // 创建一个新的 SVG 元素
            const newSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            
            // 复制原始 SVG 的属性
            Array.from(svgElement.attributes).forEach(attr => {
                newSvg.setAttribute(attr.name, attr.value);
            });
            
            // 设置新的尺寸和视口
            newSvg.setAttribute('width', this.cropInfo.width);
            newSvg.setAttribute('height', this.cropInfo.height);
            newSvg.setAttribute('viewBox', `${this.cropInfo.x} ${this.cropInfo.y} ${this.cropInfo.width} ${this.cropInfo.height}`);
            
            // 复制 SVG 内容 - 使用安全的克隆方法
            const svgContent = svgElement.innerHTML;
            // 验证 SVG 内容是否安全（只包含 SVG 元素）
            if (this.isValidSvgContent(svgContent)) {
                newSvg.innerHTML = svgContent;
            } else {
                // 如果内容不安全，使用文本内容
                newSvg.textContent = 'SVG 内容无法安全复制';
            }
            
            // 更新 SVG 画布
            this.svgCanvas.innerHTML = '';
            this.svgCanvas.appendChild(newSvg);
            
            // 创建历史快照
            this.eventBus.publish(Events.HISTORY_SNAPSHOT, {
                description: '裁剪 SVG',
                content: newSvg.outerHTML
            });
            
            // 取消裁剪模式
            this.cancelCrop();
            
            // 发布裁剪完成事件
            this.eventBus.publish(Events.CROP_COMPLETED, {
                cropInfo: this.cropInfo
            });
        } catch (error) {
            console.error('应用裁剪失败:', error);
            this.eventBus.publish(Events.UI_ERROR, {
                title: '裁剪失败',
                message: error.message
            });
        }
    }
    
    /**
     * 取消裁剪
     */
    cancelCrop() {
        if (!this.cropActive) {
            return;
        }
        
        // 取消裁剪模式
        this.cropActive = false;
        this.canvasContainer.classList.remove('crop-mode');
        
        // 隐藏裁剪工具栏
        this.cropToolbar.classList.add('hidden');
        
        // 移除裁剪框
        if (this.cropBox) {
            this.canvasContainer.removeChild(this.cropBox);
            this.cropBox = null;
        }
        
        // 移除事件监听
        this.removeCropEvents();
        
        // 重置裁剪信息
        this.cropInfo = null;
        
        // 启用其他工具
        this.enableOtherTools();
    }
    
    /**
     * 禁用其他工具
     */
    disableOtherTools() {
        // 禁用元素选择
        const elementSelector = window.svgStudio ? window.svgStudio.elementSelector : null;
        if (elementSelector) {
            elementSelector.setEnabled(false);
        }
        
        // 禁用视图操作
        const viewManager = window.svgStudio ? window.svgStudio.viewManager : null;
        if (viewManager) {
            viewManager.setEnabled(false);
        }
        
        // 禁用测量工具
        const measureTool = window.svgStudio ? window.svgStudio.measureTool : null;
        if (measureTool && measureTool.active) {
            // 如果测量工具是激活的，强制关闭它
            measureTool.active = false;
            measureTool.measureBtn.classList.remove('active');
            measureTool.canvasContainer.classList.remove('measure-mode');
            measureTool.canvasContainer.style.cursor = '';
            measureTool.clearMeasurement();
        }
    }
    
    /**
     * 启用其他工具
     */
    enableOtherTools() {
        // 启用元素选择
        const elementSelector = window.svgStudio.elementSelector;
        if (elementSelector) {
            elementSelector.setEnabled(true);
        }
        
        // 启用视图操作
        const viewManager = window.svgStudio.viewManager;
        if (viewManager) {
            viewManager.setEnabled(true);
        }
    }
    
    /**
     * 验证 SVG 内容是否安全
     * @param {string} content - SVG 内容
     * @returns {boolean} 是否安全
     */
    isValidSvgContent(content) {
        // 检查是否包含潜在的危险标签
        const dangerousTags = ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'];
        const lowerContent = content.toLowerCase();
        
        for (const tag of dangerousTags) {
            if (lowerContent.includes('<' + tag) || lowerContent.includes('</' + tag)) {
                return false;
            }
        }
        
        // 检查是否包含事件处理器
        const eventHandlers = ['onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout'];
        for (const handler of eventHandlers) {
            if (lowerContent.includes(handler)) {
                return false;
            }
        }
        
        return true;
    }
}
