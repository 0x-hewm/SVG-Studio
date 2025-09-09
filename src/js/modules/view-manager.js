// view-manager.js - 视图管理模块
import { Events } from '../utils/event-bus.js';

/**
 * 视图管理器
 * 负责 SVG 视图的缩放、平移等操作
 */
export class ViewManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        
        // 视图状态
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.initialTranslateX = 0;
        this.initialTranslateY = 0;
        
        // 启用状态
        this.enabled = true;
        
        // SVG 尺寸信息
        this.svgWidth = 0;
        this.svgHeight = 0;
        
        // DOM 元素
        this.canvasContainer = document.getElementById('canvas-container');
        this.svgCanvas = document.getElementById('svg-canvas');
        this.zoomInBtn = document.getElementById('zoom-in-btn');
        this.zoomOutBtn = document.getElementById('zoom-out-btn');
        this.resetViewBtn = document.getElementById('reset-view-btn');
        this.fitViewBtn = document.getElementById('fit-view-btn');
        this.zoomLevelDisplay = document.getElementById('zoom-level');
        this.mousePositionDisplay = document.getElementById('mouse-position');
        
        // 订阅事件
        this.eventSubscriptions = [];
    }
    
    /**
     * 初始化视图管理器
     */
    init() {
        // 缩放按钮点击事件
        this.zoomInBtn.addEventListener('click', () => {
            if (this.enabled) this.zoomIn();
        });
        this.zoomOutBtn.addEventListener('click', () => {
            if (this.enabled) this.zoomOut();
        });
        this.resetViewBtn.addEventListener('click', () => {
            if (this.enabled) this.resetView();
        });
        this.fitViewBtn.addEventListener('click', () => {
            if (this.enabled) this.fitView();
        });
        
        // 鼠标滚轮缩放
        this.canvasContainer.addEventListener('wheel', (e) => {
            // 如果视图管理器被禁用，则不处理事件
            if (!this.enabled) return;
            
            e.preventDefault();
            
            if (e.ctrlKey || e.metaKey) {
                // 缩放
                const direction = e.deltaY < 0 ? 1 : -1;
                const factor = direction > 0 ? 1.1 : 0.9;
                
                // 计算鼠标位置相对于 SVG 的坐标
                const rect = this.canvasContainer.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                this.zoomAtPoint(factor, mouseX, mouseY);
            } else {
                // 平移
                this.translateX -= e.deltaX * 0.5;
                this.translateY -= e.deltaY * 0.5;
                this.updateTransform();
            }
        }, { passive: false });
        
        // 鼠标拖动平移
        this.canvasContainer.addEventListener('mousedown', (e) => {
            // 如果视图管理器被禁用，则不处理事件
            if (!this.enabled) return;
            
            if (e.button === 0) { // 左键
                this.isDragging = true;
                this.dragStartX = e.clientX;
                this.dragStartY = e.clientY;
                this.initialTranslateX = this.translateX;
                this.initialTranslateY = this.translateY;
                this.svgCanvas.classList.add('dragging');
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.isDragging && this.enabled) {
                const dx = e.clientX - this.dragStartX;
                const dy = e.clientY - this.dragStartY;
                
                this.translateX = this.initialTranslateX + dx;
                this.translateY = this.initialTranslateY + dy;
                
                this.updateTransform();
            }
            
            // 更新鼠标位置显示
            this.updateMousePosition(e);
        });
        
        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.svgCanvas.classList.remove('dragging');
                
                // 发布视图平移事件
                this.eventBus.publish(Events.VIEW_PANNED, {
                    translateX: this.translateX,
                    translateY: this.translateY
                });
            }
        });
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            // 如果视图管理器被禁用，则不处理快捷键
            if (!this.enabled) return;
            
            // 只有在没有输入框获得焦点时才处理快捷键
            if (document.activeElement.tagName !== 'INPUT' && 
                document.activeElement.tagName !== 'TEXTAREA') {
                
                // 缩放: +/- 键
                if (e.key === '+' || e.key === '=') {
                    this.zoomIn();
                    e.preventDefault();
                } else if (e.key === '-' || e.key === '_') {
                    this.zoomOut();
                    e.preventDefault();
                }
                
                // 平移: 方向键
                const panStep = 20;
                if (e.key === 'ArrowLeft') {
                    this.translateX += panStep;
                    this.updateTransform();
                    e.preventDefault();
                } else if (e.key === 'ArrowRight') {
                    this.translateX -= panStep;
                    this.updateTransform();
                    e.preventDefault();
                } else if (e.key === 'ArrowUp') {
                    this.translateY += panStep;
                    this.updateTransform();
                    e.preventDefault();
                } else if (e.key === 'ArrowDown') {
                    this.translateY -= panStep;
                    this.updateTransform();
                    e.preventDefault();
                }
                
                // 重置视图: R 键
                if (e.key === 'r' || e.key === 'R') {
                    this.resetView();
                    e.preventDefault();
                }
                
                // 适配视图: F 键
                if (e.key === 'f' || e.key === 'F') {
                    this.fitView();
                    e.preventDefault();
                }
            }
        });
        
        // 订阅文件加载事件
        this.eventSubscriptions.push(
            this.eventBus.subscribe(Events.FILE_LOADED, (fileObj) => {
                this.handleFileLoaded(fileObj);
            })
        );
        
        // 订阅文件选择事件
        this.eventSubscriptions.push(
            this.eventBus.subscribe(Events.FILE_SELECTED, (fileObj) => {
                if (fileObj) {
                    this.handleFileSelected(fileObj);
                } else {
                    // 没有文件，清空画布
                    this.svgCanvas.innerHTML = '';
                    this.resetView();
                }
            })
        );
        
        // 初始更新变换
        this.updateTransform();
        
        console.log('视图管理器初始化完成');
    }
    
    /**
     * 处理文件加载事件
     * @param {Object} fileObj - 文件对象
     */
    handleFileLoaded(fileObj) {
        // 获取 SVG 元素
        const svgElement = fileObj.svgDoc.documentElement.cloneNode(true);
        
        // 清空画布并添加 SVG
        this.svgCanvas.innerHTML = '';
        this.svgCanvas.appendChild(svgElement);
        
        // 获取 SVG 尺寸
        this.updateSvgDimensions(svgElement);
        
        // 重置视图
        this.resetView();
        
        // 适配视图
        this.fitView();
    }
    
    /**
     * 处理文件选择事件
     * @param {Object} fileObj - 文件对象
     */
    handleFileSelected(fileObj) {
        // 获取 SVG 元素
        const svgElement = fileObj.svgDoc.documentElement.cloneNode(true);
        
        // 清空画布并添加 SVG
        this.svgCanvas.innerHTML = '';
        this.svgCanvas.appendChild(svgElement);
        
        // 获取 SVG 尺寸
        this.updateSvgDimensions(svgElement);
        
        // 重置视图
        this.resetView();
        
        // 适配视图
        this.fitView();
        
        // 发布 SVG 加载完成事件
        this.eventBus.publish(Events.SVG_LOADED, {
            svgElement: svgElement,
            fileObj: fileObj
        });
    }
    
    /**
     * 更新 SVG 尺寸信息
     * @param {SVGElement} svgElement - SVG 元素
     */
    updateSvgDimensions(svgElement) {
        // 获取 SVG 的宽高
        let width = svgElement.getAttribute('width');
        let height = svgElement.getAttribute('height');
        
        // 如果没有宽高属性，尝试从 viewBox 获取
        if (!width || !height) {
            const viewBox = svgElement.getAttribute('viewBox');
            if (viewBox) {
                const [, , viewBoxWidth, viewBoxHeight] = viewBox.split(/\s+/).map(Number);
                width = width || viewBoxWidth;
                height = height || viewBoxHeight;
            }
        }
        
        // 解析宽高值
        this.svgWidth = this.parseLength(width) || 300;
        this.svgHeight = this.parseLength(height) || 150;
        
        // 设置 SVG 元素尺寸
        svgElement.setAttribute('width', this.svgWidth);
        svgElement.setAttribute('height', this.svgHeight);
    }
    
    /**
     * 解析长度值
     * @param {string} length - 长度值字符串，如 "100px", "50%"
     * @returns {number} 解析后的长度值
     */
    parseLength(length) {
        if (!length) return null;
        
        // 移除单位
        return parseFloat(length);
    }
    
    /**
     * 放大视图
     */
    zoomIn() {
        this.zoom(1.2);
    }
    
    /**
     * 缩小视图
     */
    zoomOut() {
        this.zoom(0.8);
    }
    
    /**
     * 按指定系数缩放视图
     * @param {number} factor - 缩放系数
     */
    zoom(factor) {
        // 获取容器中心点
        const containerRect = this.canvasContainer.getBoundingClientRect();
        const centerX = containerRect.width / 2;
        const centerY = containerRect.height / 2;
        
        this.zoomAtPoint(factor, centerX, centerY);
    }
    
    /**
     * 在指定点缩放视图
     * @param {number} factor - 缩放系数
     * @param {number} x - 缩放中心点 X 坐标
     * @param {number} y - 缩放中心点 Y 坐标
     */
    zoomAtPoint(factor, x, y) {
        // 计算缩放前的世界坐标
        const worldX = (x - this.translateX) / this.scale;
        const worldY = (y - this.translateY) / this.scale;
        
        // 应用缩放系数
        const newScale = Math.max(0.1, Math.min(10, this.scale * factor));
        
        // 计算新的平移值，使缩放中心点保持不变
        const newTranslateX = x - worldX * newScale;
        const newTranslateY = y - worldY * newScale;
        
        // 更新状态
        this.scale = newScale;
        this.translateX = newTranslateX;
        this.translateY = newTranslateY;
        
        // 更新变换
        this.updateTransform();
        
        // 发布视图缩放事件
        this.eventBus.publish(Events.VIEW_ZOOMED, { scale: this.scale });
    }
    
    /**
     * 重置视图
     */
    resetView() {
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        
        this.updateTransform();
        
        // 发布视图重置事件
        this.eventBus.publish(Events.VIEW_RESET);
    }
    
    /**
     * 适配视图
     */
    fitView() {
        if (!this.svgWidth || !this.svgHeight) {
            return;
        }
        
        // 获取容器尺寸
        const containerRect = this.canvasContainer.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;
        
        // 计算缩放系数
        const scaleX = containerWidth / this.svgWidth;
        const scaleY = containerHeight / this.svgHeight;
        const scale = Math.min(scaleX, scaleY) * 0.9; // 留出一些边距
        
        // 设置缩放
        this.scale = scale;
        
        // 居中 SVG
        this.translateX = (containerWidth - this.svgWidth * scale) / 2;
        this.translateY = (containerHeight - this.svgHeight * scale) / 2;
        
        this.updateTransform();
        
        // 发布视图适配事件
        this.eventBus.publish(Events.VIEW_FIT);
    }
    
    /**
     * 更新变换
     */
    updateTransform() {
        // 应用变换到 SVG 画布
        this.svgCanvas.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
        
        // 更新缩放级别显示
        this.zoomLevelDisplay.textContent = `${Math.round(this.scale * 100)}%`;
    }
    
    /**
     * 更新鼠标位置显示
     * @param {MouseEvent} e - 鼠标事件
     */
    updateMousePosition(e) {
        const rect = this.canvasContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 转换为 SVG 坐标
        const svgX = Math.round((x - this.translateX) / this.scale);
        const svgY = Math.round((y - this.translateY) / this.scale);
        
        this.mousePositionDisplay.textContent = `${svgX}, ${svgY}`;
    }
    
    /**
     * 获取当前视图状态
     * @returns {Object} 视图状态对象
     */
    getViewState() {
        return {
            scale: this.scale,
            translateX: this.translateX,
            translateY: this.translateY
        };
    }
    
    /**
     * 设置视图管理器的启用状态
     * @param {boolean} enabled - 是否启用
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        
        if (!enabled) {
            // 如果禁用，则停止当前的拖拽操作
            if (this.isDragging) {
                this.isDragging = false;
                this.svgCanvas.classList.remove('dragging');
            }
        }
    }
    
    /**
     * 设置视图状态
     * @param {Object} state - 视图状态对象
     */
    setViewState(state) {
        this.scale = state.scale;
        this.translateX = state.translateX;
        this.translateY = state.translateY;
        
        this.updateTransform();
    }
}
