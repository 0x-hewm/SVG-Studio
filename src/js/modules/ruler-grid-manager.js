// ruler-grid-manager.js - 标尺和网格管理模块
import { Events } from '../utils/event-bus.js';

/**
 * 标尺和网格管理器
 * 负责 SVG 编辑器的标尺和网格功能
 */
export class RulerGridManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        
        // 状态
        this.showRulers = false;
        this.showGrid = false;
        this.snapToGrid = false;
        this.gridSize = 10; // 默认网格大小为 10px
        this.rulerUnit = 'px'; // 默认单位为像素
        
        // DOM 元素
        this.canvasContainer = document.getElementById('canvas-container');
        this.svgCanvas = document.getElementById('svg-canvas');
        this.horizontalRuler = null;
        this.verticalRuler = null;
        this.gridOverlay = null;
        
        // 视图信息
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        
        // DOM 元素 - 按钮
        this.toggleRulersBtn = document.getElementById('toggle-rulers-btn');
        this.toggleGridBtn = document.getElementById('toggle-grid-btn');
        this.toggleSnapBtn = document.getElementById('toggle-snap-btn');
        this.gridSizeInput = document.getElementById('grid-size-input');
        
        // 订阅事件
        this.eventSubscriptions = [];
    }
    
    /**
     * 初始化标尺和网格管理器
     */
    init() {
        // 创建标尺和网格元素
        this.createRulers();
        this.createGrid();
        
        // 添加按钮事件监听
        this.toggleRulersBtn.addEventListener('click', () => this.toggleRulers());
        this.toggleGridBtn.addEventListener('click', () => this.toggleGrid());
        this.toggleSnapBtn.addEventListener('click', () => this.toggleSnap());
        
        // 网格大小输入
        this.gridSizeInput.addEventListener('change', () => {
            const size = parseInt(this.gridSizeInput.value);
            if (size >= 5 && size <= 100) {
                this.setGridSize(size);
            } else {
                this.gridSizeInput.value = this.gridSize;
            }
        });
        
        // 订阅视图变化事件
        this.eventSubscriptions.push(
            this.eventBus.subscribe(Events.VIEW_ZOOMED, (data) => {
                this.scale = data.scale;
                this.updateRulers();
                this.updateGrid();
            })
        );
        
        this.eventSubscriptions.push(
            this.eventBus.subscribe(Events.VIEW_PANNED, (data) => {
                this.translateX = data.translateX;
                this.translateY = data.translateY;
                this.updateRulers();
            })
        );
        
        // 订阅文件加载事件
        this.eventSubscriptions.push(
            this.eventBus.subscribe(Events.FILE_LOADED, () => {
                this.updateRulers();
                this.updateGrid();
            })
        );
        
        // 鼠标移动更新标尺指示器
        this.canvasContainer.addEventListener('mousemove', this.handleMouseMove.bind(this));
        
        // 更新按钮状态
        this.updateButtonStates();
        
    }
    
    /**
     * 创建标尺元素
     */
    createRulers() {
        // 创建水平标尺
        this.horizontalRuler = document.createElement('div');
        this.horizontalRuler.className = 'ruler horizontal-ruler';
        this.horizontalRuler.style.display = 'none';
        
        // 创建垂直标尺
        this.verticalRuler = document.createElement('div');
        this.verticalRuler.className = 'ruler vertical-ruler';
        this.verticalRuler.style.display = 'none';
        
        // 创建标尺交叉点
        const rulerCorner = document.createElement('div');
        rulerCorner.className = 'ruler-corner';
        rulerCorner.style.display = 'none';
        
        // 创建标尺指示器
        const horizontalIndicator = document.createElement('div');
        horizontalIndicator.className = 'ruler-indicator horizontal-indicator';
        horizontalIndicator.style.display = 'none';
        
        const verticalIndicator = document.createElement('div');
        verticalIndicator.className = 'ruler-indicator vertical-indicator';
        verticalIndicator.style.display = 'none';
        
        // 添加到容器
        this.canvasContainer.appendChild(this.horizontalRuler);
        this.canvasContainer.appendChild(this.verticalRuler);
        this.canvasContainer.appendChild(rulerCorner);
        this.canvasContainer.appendChild(horizontalIndicator);
        this.canvasContainer.appendChild(verticalIndicator);
        
        // 存储指示器引用
        this.horizontalIndicator = horizontalIndicator;
        this.verticalIndicator = verticalIndicator;
        this.rulerCorner = rulerCorner;
    }
    
    /**
     * 创建网格元素
     */
    createGrid() {
        // 创建网格覆盖层
        this.gridOverlay = document.createElement('div');
        this.gridOverlay.className = 'grid-overlay';
        this.gridOverlay.style.display = 'none';
        
        // 添加到容器
        this.canvasContainer.appendChild(this.gridOverlay);
    }
    
    /**
     * 切换标尺显示
     */
    toggleRulers() {
        this.showRulers = !this.showRulers;
        
        // 更新标尺显示
        this.horizontalRuler.style.display = this.showRulers ? 'block' : 'none';
        this.verticalRuler.style.display = this.showRulers ? 'block' : 'none';
        this.rulerCorner.style.display = this.showRulers ? 'block' : 'none';
        
        // 更新指示器
        if (this.showRulers) {
            this.horizontalIndicator.style.display = 'block';
            this.verticalIndicator.style.display = 'block';
        } else {
            this.horizontalIndicator.style.display = 'none';
            this.verticalIndicator.style.display = 'none';
        }
        
        // 更新标尺
        if (this.showRulers) {
            this.updateRulers();
        }
        
        // 更新按钮状态
        this.updateButtonStates();
        
        // 更新容器类名
        if (this.showRulers) {
            this.canvasContainer.classList.add('with-rulers');
        } else {
            this.canvasContainer.classList.remove('with-rulers');
        }
    }
    
    /**
     * 切换网格显示
     */
    toggleGrid() {
        this.showGrid = !this.showGrid;
        
        // 更新网格显示
        this.gridOverlay.style.display = this.showGrid ? 'block' : 'none';
        
        // 更新网格
        if (this.showGrid) {
            this.updateGrid();
        }
        
        // 更新按钮状态
        this.updateButtonStates();
    }
    
    /**
     * 切换网格吸附
     */
    toggleSnap() {
        this.snapToGrid = !this.snapToGrid;
        
        // 更新按钮状态
        this.updateButtonStates();
        
        // 发布网格吸附变更事件
        this.eventBus.publish(Events.GRID_SNAP_CHANGED, {
            snapToGrid: this.snapToGrid,
            gridSize: this.gridSize
        });
    }
    
    /**
     * 设置网格大小
     * @param {number} size - 网格大小（像素）
     */
    setGridSize(size) {
        this.gridSize = size;
        
        // 更新网格
        this.updateGrid();
        
        // 更新输入框值
        this.gridSizeInput.value = size;
        
        // 发布网格大小变更事件
        this.eventBus.publish(Events.GRID_SIZE_CHANGED, {
            gridSize: this.gridSize
        });
    }
    
    /**
     * 更新标尺
     */
    updateRulers() {
        if (!this.showRulers) return;
        
        // 清空标尺
        this.horizontalRuler.innerHTML = '';
        this.verticalRuler.innerHTML = '';
        
        // 获取容器尺寸
        const containerRect = this.canvasContainer.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;
        
        // 计算标尺参数
        const rulerSize = 20; // 标尺宽度
        const majorTickInterval = 100; // 主刻度间隔
        const minorTickInterval = 10; // 次刻度间隔
        
        // 计算标尺范围
        const horizontalStart = Math.floor(-this.translateX / this.scale / minorTickInterval) * minorTickInterval;
        const horizontalEnd = Math.ceil((containerWidth - this.translateX) / this.scale / minorTickInterval) * minorTickInterval;
        
        const verticalStart = Math.floor(-this.translateY / this.scale / minorTickInterval) * minorTickInterval;
        const verticalEnd = Math.ceil((containerHeight - this.translateY) / this.scale / minorTickInterval) * minorTickInterval;
        
        // 生成水平标尺刻度
        for (let i = horizontalStart; i <= horizontalEnd; i += minorTickInterval) {
            const isMajorTick = i % majorTickInterval === 0;
            const tickHeight = isMajorTick ? 10 : 5;
            const tickPositionX = (i * this.scale + this.translateX);
            
            if (tickPositionX < 0 || tickPositionX > containerWidth) continue;
            
            // 创建刻度
            const tick = document.createElement('div');
            tick.className = isMajorTick ? 'ruler-tick major' : 'ruler-tick minor';
            tick.style.left = `${tickPositionX}px`;
            tick.style.height = `${tickHeight}px`;
            
            // 添加刻度值
            if (isMajorTick) {
                const tickValue = document.createElement('div');
                tickValue.className = 'ruler-tick-value';
                tickValue.textContent = i;
                tick.appendChild(tickValue);
            }
            
            this.horizontalRuler.appendChild(tick);
        }
        
        // 生成垂直标尺刻度
        for (let i = verticalStart; i <= verticalEnd; i += minorTickInterval) {
            const isMajorTick = i % majorTickInterval === 0;
            const tickWidth = isMajorTick ? 10 : 5;
            const tickPositionY = (i * this.scale + this.translateY);
            
            if (tickPositionY < 0 || tickPositionY > containerHeight) continue;
            
            // 创建刻度
            const tick = document.createElement('div');
            tick.className = isMajorTick ? 'ruler-tick major' : 'ruler-tick minor';
            tick.style.top = `${tickPositionY}px`;
            tick.style.width = `${tickWidth}px`;
            
            // 添加刻度值
            if (isMajorTick) {
                const tickValue = document.createElement('div');
                tickValue.className = 'ruler-tick-value';
                tickValue.textContent = i;
                tick.appendChild(tickValue);
            }
            
            this.verticalRuler.appendChild(tick);
        }
    }
    
    /**
     * 更新网格
     */
    updateGrid() {
        if (!this.showGrid) return;
        
        // 设置网格 CSS 属性
        const gridSizePx = this.gridSize * this.scale;
        const offsetX = (this.translateX % gridSizePx + gridSizePx) % gridSizePx;
        const offsetY = (this.translateY % gridSizePx + gridSizePx) % gridSizePx;
        
        this.gridOverlay.style.backgroundSize = `${gridSizePx}px ${gridSizePx}px`;
        this.gridOverlay.style.backgroundPosition = `${offsetX}px ${offsetY}px`;
    }
    
    /**
     * 处理鼠标移动事件
     * @param {MouseEvent} e - 鼠标事件
     */
    handleMouseMove(e) {
        if (!this.showRulers) return;
        
        // 获取鼠标在画布中的位置
        const rect = this.canvasContainer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // 更新指示器位置
        this.horizontalIndicator.style.left = `${mouseX}px`;
        this.verticalIndicator.style.top = `${mouseY}px`;
    }
    
    /**
     * 更新按钮状态
     */
    updateButtonStates() {
        // 标尺按钮
        if (this.showRulers) {
            this.toggleRulersBtn.classList.add('active');
        } else {
            this.toggleRulersBtn.classList.remove('active');
        }
        
        // 网格按钮
        if (this.showGrid) {
            this.toggleGridBtn.classList.add('active');
        } else {
            this.toggleGridBtn.classList.remove('active');
        }
        
        // 吸附按钮
        if (this.snapToGrid) {
            this.toggleSnapBtn.classList.add('active');
        } else {
            this.toggleSnapBtn.classList.remove('active');
        }
    }
    
    /**
     * 获取网格吸附位置
     * @param {number} value - 原始位置值
     * @returns {number} 吸附后的位置值
     */
    getSnappedValue(value) {
        if (!this.snapToGrid) return value;
        return Math.round(value / this.gridSize) * this.gridSize;
    }
    
    /**
     * 销毁
     */
    destroy() {
        // 取消事件订阅
        this.eventSubscriptions.forEach(unsub => unsub());
        
        // 移除事件监听
        this.canvasContainer.removeEventListener('mousemove', this.handleMouseMove);
        this.toggleRulersBtn.removeEventListener('click', this.toggleRulers);
        this.toggleGridBtn.removeEventListener('click', this.toggleGrid);
        this.toggleSnapBtn.removeEventListener('click', this.toggleSnap);
        this.gridSizeInput.removeEventListener('change', this.setGridSize);
    }
}
