// element-selector.js - 元素选择模块
import { Events } from '../utils/event-bus.js';

/**
 * 元素选择器
 * 负责 SVG 元素的选择和高亮
 */
export class ElementSelector {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.selectedElement = null;
        this.svgCanvas = document.getElementById('svg-canvas');
        this.selectionInfo = document.getElementById('selection-info');
        
        // 订阅事件
        this.eventSubscriptions = [];
        
        // 订阅文件关闭事件
        this.eventSubscriptions.push(
            this.eventBus.subscribe(Events.FILE_CLOSED, () => {
                this.clearSelection();
            })
        );
    }
    
    /**
     * 初始化元素选择器
     */
    init() {
        // 启用状态
        this.enabled = true;
        
        // 监听 SVG 画布中的点击事件
        this.svgCanvas.addEventListener('click', (e) => {
            // 如果选择器被禁用，则不处理点击事件
            if (!this.enabled) return;
            
            // 如果点击的是 SVG 画布本身而不是元素，则取消选择
            if (e.target === this.svgCanvas || e.target.tagName === 'svg') {
                this.clearSelection();
                return;
            }
            
            // 获取点击的元素
            let element = e.target;
            
            // 如果元素是 SVG 的一部分，但不是主要元素（如 <g> 的子元素），则选择父元素
            while (element && element.tagName !== 'svg') {
                // 检查元素是否有 ID 或者是一个主要的 SVG 元素
                const isMainElement = this.isMainSvgElement(element);
                
                if (isMainElement) {
                    this.selectElement(element);
                    e.stopPropagation();
                    return;
                }
                
                element = element.parentElement;
            }
            
            // 如果没有找到合适的元素，则取消选择
            this.clearSelection();
        });
        
        // 订阅文件加载事件
        this.eventSubscriptions.push(
            this.eventBus.subscribe(Events.FILE_LOADED, () => {
                this.clearSelection();
            })
        );
        
        // 订阅文件选择事件
        this.eventSubscriptions.push(
            this.eventBus.subscribe(Events.FILE_SELECTED, () => {
                this.clearSelection();
            })
        );
    }
    
    /**
     * 判断元素是否是主要的 SVG 元素
     * @param {SVGElement} element - SVG 元素
     * @returns {boolean} 是否是主要元素
     */
    isMainSvgElement(element) {
        // 主要 SVG 元素类型
        const mainElements = [
            'circle', 'ellipse', 'line', 'path', 'polygon', 'polyline',
            'rect', 'text', 'g', 'image', 'use'
        ];
        
        // 检查元素标签名是否在主要元素列表中
        return mainElements.includes(element.tagName.toLowerCase());
    }
    
    /**
     * 选择元素
     * @param {SVGElement} element - 要选择的 SVG 元素
     */
    selectElement(element) {
        // 如果已经选择了该元素，则不执行任何操作
        if (this.selectedElement === element) {
            return;
        }
        
        // 清除之前的选择
        this.clearSelection();
        
        // 设置新的选择元素
        this.selectedElement = element;
        
        // 添加选择样式
        element.classList.add('svg-element-highlighted');
        
        // 更新选择信息
        this.updateSelectionInfo(element);
        
        // 发布元素选择事件
        this.eventBus.publish(Events.ELEMENT_SELECTED, {
            element: element,
            elementInfo: this.getElementInfo(element)
        });
    }
    
    /**
     * 清除选择
     */
    clearSelection() {
        if (this.selectedElement) {
            // 移除选择样式
            this.selectedElement.classList.remove('svg-element-highlighted');
            
            // 重置选择信息
            this.selectionInfo.textContent = '无';
            
            // 发布元素取消选择事件
            this.eventBus.publish(Events.ELEMENT_DESELECTED, {
                element: this.selectedElement
            });
            
            // 重置选择元素
            this.selectedElement = null;
        }
    }
    
    /**
     * 更新选择信息
     * @param {SVGElement} element - 选中的 SVG 元素
     */
    updateSelectionInfo(element) {
        const info = this.getElementInfo(element);
        this.selectionInfo.textContent = `${info.type}${info.id ? ' #' + info.id : ''}`;
    }
    
    /**
     * 获取元素信息
     * @param {SVGElement} element - SVG 元素
     * @returns {Object} 元素信息对象
     */
    getElementInfo(element) {
        // 获取元素类型
        const type = element.tagName.toLowerCase();
        
        // 获取元素 ID
        const id = element.id || '';
        
        // 获取元素类名
        const className = element.getAttribute('class') || '';
        
        // 获取填充颜色
        const fill = element.getAttribute('fill') || 
                     window.getComputedStyle(element).fill || 
                     'none';
        
        // 获取填充不透明度
        const fillOpacity = element.getAttribute('fill-opacity') || 
                           window.getComputedStyle(element).fillOpacity || 
                           '1';
        
        // 获取描边颜色
        const stroke = element.getAttribute('stroke') || 
                       window.getComputedStyle(element).stroke || 
                       'none';
        
        // 获取描边宽度
        const strokeWidth = element.getAttribute('stroke-width') || 
                           window.getComputedStyle(element).strokeWidth || 
                           '1';
        
        // 获取描边不透明度
        const strokeOpacity = element.getAttribute('stroke-opacity') || 
                             window.getComputedStyle(element).strokeOpacity || 
                             '1';
        
        // 获取变换
        const transform = element.getAttribute('transform') || '';
        
        // 基本属性对象
        const info = {
            type,
            id,
            className,
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            transform
        };
        
        // 根据元素类型添加特定属性
        switch (type) {
            case 'rect':
                info.x = element.getAttribute('x') || '0';
                info.y = element.getAttribute('y') || '0';
                info.width = element.getAttribute('width') || '0';
                info.height = element.getAttribute('height') || '0';
                info.rx = element.getAttribute('rx') || '0';
                info.ry = element.getAttribute('ry') || '0';
                break;
                
            case 'circle':
                info.cx = element.getAttribute('cx') || '0';
                info.cy = element.getAttribute('cy') || '0';
                info.r = element.getAttribute('r') || '0';
                break;
                
            case 'ellipse':
                info.cx = element.getAttribute('cx') || '0';
                info.cy = element.getAttribute('cy') || '0';
                info.rx = element.getAttribute('rx') || '0';
                info.ry = element.getAttribute('ry') || '0';
                break;
                
            case 'line':
                info.x1 = element.getAttribute('x1') || '0';
                info.y1 = element.getAttribute('y1') || '0';
                info.x2 = element.getAttribute('x2') || '0';
                info.y2 = element.getAttribute('y2') || '0';
                break;
                
            case 'polyline':
            case 'polygon':
                info.points = element.getAttribute('points') || '';
                break;
                
            case 'path':
                info.d = element.getAttribute('d') || '';
                break;
                
            case 'text':
                info.x = element.getAttribute('x') || '0';
                info.y = element.getAttribute('y') || '0';
                info.textContent = element.textContent || '';
                info.fontFamily = element.getAttribute('font-family') || 
                                 window.getComputedStyle(element).fontFamily || 
                                 'sans-serif';
                info.fontSize = element.getAttribute('font-size') || 
                               window.getComputedStyle(element).fontSize || 
                               '16';
                break;
        }
        
        return info;
    }
    
    /**
     * 获取当前选中的元素
     * @returns {SVGElement|null} 选中的 SVG 元素或 null
     */
    getSelectedElement() {
        return this.selectedElement;
    }
    
    /**
     * 根据 ID 选择元素
     * @param {string} id - 元素 ID
     */
    selectElementById(id) {
        const element = document.getElementById(id);
        if (element) {
            this.selectElement(element);
        }
    }
    
    /**
     * 设置选择器的启用状态
     * @param {boolean} enabled - 是否启用
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        
        if (!enabled) {
            // 如果禁用，则清除当前选择
            this.clearSelection();
        }
    }
}
