// measure-tool.js - 测量工具模块
import { Events } from '../utils/event-bus.js';

/**
 * 测量工具
 * 负责在 SVG 编辑器中提供测量功能
 */
export class MeasureTool {
    constructor(eventBus) {
        this.eventBus = eventBus;
        
        // 状态
        this.active = false;
        this.measuring = false;
        this.startX = 0;
        this.startY = 0;
        this.endX = 0;
        this.endY = 0;
        
        // 测量单位
        this.unit = 'px';
        this.unitFactors = {
            'px': 1,
            'mm': 3.7795275591, // 1mm = 3.7795 px (96 DPI)
            'cm': 37.795275591, // 1cm = 37.795 px
            'in': 96           // 1in = 96 px
        };
        
        // DOM 元素
        this.canvasContainer = document.getElementById('canvas-container');
        this.svgCanvas = document.getElementById('svg-canvas');
        this.measureBtn = document.getElementById('measure-btn');
        this.unitSelect = document.getElementById('measure-unit-select');
        
        // 测量线和标签
        this.measureLine = null;
        this.measureLabel = null;
        
        // 视图信息
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        
        // 订阅事件
        this.eventSubscriptions = [];
    }
    
    /**
     * 初始化测量工具
     */
    init() {
        // 创建测量元素
        this.createMeasureElements();
        
        // 测量按钮点击事件
        this.measureBtn.addEventListener('click', () => {
            this.toggleMeasureTool();
        });
        
        // 单位选择事件
        this.unitSelect.addEventListener('change', () => {
            this.unit = this.unitSelect.value;
            if (this.measuring || this.measureLine.style.display === 'block') {
                this.updateMeasurement();
            }
        });
        
        // 订阅视图变化事件
        this.eventSubscriptions.push(
            this.eventBus.subscribe(Events.VIEW_ZOOMED, (data) => {
                this.scale = data.scale;
                if (this.measuring || this.measureLine.style.display === 'block') {
                    this.updateMeasurement();
                }
            })
        );
        
        this.eventSubscriptions.push(
            this.eventBus.subscribe(Events.VIEW_PANNED, (data) => {
                this.translateX = data.translateX;
                this.translateY = data.translateY;
                if (this.measuring || this.measureLine.style.display === 'block') {
                    this.updateMeasurement();
                }
            })
        );
        
        // 订阅文件操作事件
        this.eventSubscriptions.push(
            this.eventBus.subscribe(Events.FILE_LOADED, () => {
                this.clearMeasurement();
            })
        );
        
        console.log('测量工具初始化完成');
    }
    
    /**
     * 创建测量元素
     */
    createMeasureElements() {
        // 创建测量线
        this.measureLine = document.createElement('div');
        this.measureLine.className = 'measure-line';
        this.measureLine.style.display = 'none';
        
        // 创建测量标签
        this.measureLabel = document.createElement('div');
        this.measureLabel.className = 'measure-label';
        this.measureLabel.style.display = 'none';
        
        // 创建起点标记
        this.startPoint = document.createElement('div');
        this.startPoint.className = 'measure-point start-point';
        this.startPoint.style.display = 'none';
        
        // 创建终点标记
        this.endPoint = document.createElement('div');
        this.endPoint.className = 'measure-point end-point';
        this.endPoint.style.display = 'none';
        
        // 添加到容器
        this.canvasContainer.appendChild(this.measureLine);
        this.canvasContainer.appendChild(this.measureLabel);
        this.canvasContainer.appendChild(this.startPoint);
        this.canvasContainer.appendChild(this.endPoint);
        
        // 添加鼠标事件处理
        this.bindMouseEvents();
    }
    
    /**
     * 绑定鼠标事件
     */
    bindMouseEvents() {
        // 鼠标按下开始测量
        this.canvasContainer.addEventListener('mousedown', this.handleMouseDown);
        
        // 鼠标移动更新测量
        this.canvasContainer.addEventListener('mousemove', this.handleMouseMove);
        
        // 鼠标释放完成测量
        this.canvasContainer.addEventListener('mouseup', this.handleMouseUp);
        
        // 点击其他区域取消测量
        document.addEventListener('click', this.handleDocumentClick);
    }
    
    /**
     * 切换测量工具
     */
    toggleMeasureTool() {
        // 检查裁剪工具是否激活
        const cropManager = window.svgStudio ? window.svgStudio.cropManager : null;
        if (cropManager && cropManager.cropActive) {
            // 如果裁剪工具激活，则显示提示并不激活测量工具
            this.eventBus.publish(Events.UI_ERROR, {
                title: '工具冲突',
                message: '请先完成或取消裁剪操作，再使用测量工具。'
            });
            return;
        }
        
        this.active = !this.active;
        
        if (this.active) {
            this.measureBtn.classList.add('active');
            this.canvasContainer.classList.add('measure-mode');
            this.canvasContainer.style.cursor = 'crosshair';
            
            // 禁用元素选择器
            const elementSelector = window.svgStudio ? window.svgStudio.elementSelector : null;
            if (elementSelector) {
                elementSelector.setEnabled(false);
            }
        } else {
            this.measureBtn.classList.remove('active');
            this.canvasContainer.classList.remove('measure-mode');
            this.canvasContainer.style.cursor = '';
            this.clearMeasurement();
            
            // 重新启用元素选择器
            const elementSelector = window.svgStudio ? window.svgStudio.elementSelector : null;
            if (elementSelector) {
                elementSelector.setEnabled(true);
            }
        }
    }
    
    /**
     * 处理鼠标按下事件
     * @param {MouseEvent} e - 鼠标事件
     */
    handleMouseDown = (e) => {
        if (!this.active) return;
        
        // 防止事件冒泡
        e.stopPropagation();
        
        // 开始测量
        this.measuring = true;
        
        // 获取起点位置（相对于画布容器）
        const rect = this.canvasContainer.getBoundingClientRect();
        this.startX = e.clientX - rect.left;
        this.startY = e.clientY - rect.top;
        
        // 设置起点标记位置
        this.startPoint.style.left = `${this.startX - 5}px`;
        this.startPoint.style.top = `${this.startY - 5}px`;
        this.startPoint.style.display = 'block';
        
        // 初始化测量线
        this.measureLine.style.left = `${this.startX}px`;
        this.measureLine.style.top = `${this.startY}px`;
        this.measureLine.style.width = '0';
        this.measureLine.style.transform = 'rotate(0deg)';
        this.measureLine.style.display = 'block';
        
        // 初始化测量标签
        this.measureLabel.style.display = 'block';
    }
    
    /**
     * 处理鼠标移动事件
     * @param {MouseEvent} e - 鼠标事件
     */
    handleMouseMove = (e) => {
        if (!this.active || !this.measuring) return;
        
        // 获取当前位置（相对于画布容器）
        const rect = this.canvasContainer.getBoundingClientRect();
        this.endX = e.clientX - rect.left;
        this.endY = e.clientY - rect.top;
        
        // 更新测量线和标签
        this.updateMeasurement();
        
        // 阻止默认事件和冒泡，防止在测量时触发画布拖动
        e.preventDefault();
        e.stopPropagation();
    }
    
    /**
     * 处理鼠标释放事件
     */
    handleMouseUp = () => {
        if (!this.active || !this.measuring) return;
        
        // 完成测量
        this.measuring = false;
        
        // 显示终点标记
        this.endPoint.style.left = `${this.endX - 5}px`;
        this.endPoint.style.top = `${this.endY - 5}px`;
        this.endPoint.style.display = 'block';
    }
    
    /**
     * 处理文档点击事件
     * @param {MouseEvent} e - 鼠标事件
     */
    handleDocumentClick = (e) => {
        // 如果点击了测量工具之外的区域，并且不是测量按钮
        if (this.active && 
            !this.measuring && 
            !e.target.closest('.measure-line') && 
            !e.target.closest('.measure-label') &&
            !e.target.closest('.measure-point') &&
            !e.target.closest('#measure-btn')) {
            this.clearMeasurement();
        }
    }
    
    /**
     * 更新测量
     */
    updateMeasurement() {
        // 计算线的长度和角度
        const dx = this.endX - this.startX;
        const dy = this.endY - this.startY;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        // 更新线条样式
        this.measureLine.style.width = `${length}px`;
        this.measureLine.style.transform = `rotate(${angle}deg)`;
        
        // 更新终点标记位置
        this.endPoint.style.left = `${this.endX - 5}px`;
        this.endPoint.style.top = `${this.endY - 5}px`;
        
        // 计算实际距离（像素）
        const realDx = dx / this.scale;
        const realDy = dy / this.scale;
        const realLength = Math.sqrt(realDx * realDx + realDy * realDy);
        
        // 转换为当前单位
        const convertedLength = realLength / this.unitFactors[this.unit];
        const formattedLength = convertedLength.toFixed(2);
        
        // 计算水平和垂直距离
        const horizontalDistance = Math.abs(realDx).toFixed(2);
        const verticalDistance = Math.abs(realDy).toFixed(2);
        
        // 更新标签内容
        this.measureLabel.innerHTML = `
            <div>长度: ${formattedLength} ${this.unit}</div>
            <div>水平: ${horizontalDistance} ${this.unit}</div>
            <div>垂直: ${verticalDistance} ${this.unit}</div>
            <div>角度: ${angle.toFixed(1)}°</div>
        `;
        
        // 更新标签位置 - 放在线的中点
        const labelX = this.startX + dx / 2;
        const labelY = this.startY + dy / 2;
        
        // 避免标签超出可视区域
        const labelWidth = this.measureLabel.offsetWidth;
        const labelHeight = this.measureLabel.offsetHeight;
        const containerRect = this.canvasContainer.getBoundingClientRect();
        
        let labelLeft = labelX - labelWidth / 2;
        let labelTop = labelY - labelHeight - 10; // 默认放在线上方
        
        // 如果标签顶部超出容器，放在线下方
        if (labelTop < 0) {
            labelTop = labelY + 10;
        }
        
        // 如果标签左侧超出容器，靠左对齐
        if (labelLeft < 0) {
            labelLeft = 0;
        }
        
        // 如果标签右侧超出容器，靠右对齐
        if (labelLeft + labelWidth > containerRect.width) {
            labelLeft = containerRect.width - labelWidth;
        }
        
        this.measureLabel.style.left = `${labelLeft}px`;
        this.measureLabel.style.top = `${labelTop}px`;
    }
    
    /**
     * 清除测量
     */
    clearMeasurement() {
        this.measuring = false;
        this.measureLine.style.display = 'none';
        this.measureLabel.style.display = 'none';
        this.startPoint.style.display = 'none';
        this.endPoint.style.display = 'none';
    }
    
    /**
     * 销毁
     */
    destroy() {
        // 取消事件订阅
        this.eventSubscriptions.forEach(unsub => unsub());
        
        // 移除事件监听
        this.canvasContainer.removeEventListener('mousedown', this.handleMouseDown);
        this.canvasContainer.removeEventListener('mousemove', this.handleMouseMove);
        this.canvasContainer.removeEventListener('mouseup', this.handleMouseUp);
        document.removeEventListener('click', this.handleDocumentClick);
        
        // 移除测量元素
        this.canvasContainer.removeChild(this.measureLine);
        this.canvasContainer.removeChild(this.measureLabel);
        this.canvasContainer.removeChild(this.startPoint);
        this.canvasContainer.removeChild(this.endPoint);
    }
}
