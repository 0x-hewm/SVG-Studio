// property-editor.js - 属性编辑模块
import { Events } from '../utils/event-bus.js';

/**
 * 属性编辑器
 * 负责编辑 SVG 元素的属性
 */
export class PropertyEditor {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.selectedElement = null;
        
        // DOM 元素
        this.propertiesPanel = document.getElementById('properties-panel');
        this.noSelectionMessage = document.getElementById('no-selection-message');
        this.elementProperties = document.getElementById('element-properties');
        this.elementTypeLabel = document.getElementById('element-type-label').querySelector('span');
        this.elementId = document.getElementById('element-id');
        this.elementClass = document.getElementById('element-class');
        this.fillColor = document.getElementById('fill-color');
        this.fillColorText = document.getElementById('fill-color-text');
        this.fillOpacity = document.getElementById('fill-opacity');
        this.fillOpacityText = document.getElementById('fill-opacity-text');
        this.strokeColor = document.getElementById('stroke-color');
        this.strokeColorText = document.getElementById('stroke-color-text');
        this.strokeWidth = document.getElementById('stroke-width');
        this.strokeOpacity = document.getElementById('stroke-opacity');
        this.strokeOpacityText = document.getElementById('stroke-opacity-text');
        this.textProperties = document.getElementById('text-properties');
        this.textContent = document.getElementById('text-content');
        this.fontFamily = document.getElementById('font-family');
        this.fontSize = document.getElementById('font-size');
        this.positionProperties = document.getElementById('position-properties');
        
        // 订阅事件
        this.eventSubscriptions = [];
    }
    
    /**
     * 初始化属性编辑器
     */
    init() {
        // 改进颜色选择器布局
        this.enhanceColorPickerLayout();
        
        // 订阅元素选择事件
        this.eventSubscriptions.push(
            this.eventBus.subscribe(Events.ELEMENT_SELECTED, (data) => {
                this.handleElementSelected(data.element, data.elementInfo);
            })
        );
        
        // 订阅元素取消选择事件
        this.eventSubscriptions.push(
            this.eventBus.subscribe(Events.ELEMENT_DESELECTED, () => {
                this.handleElementDeselected();
            })
        );
        
        // 添加基本属性输入事件
        this.setupBasicPropertyEvents();
        
        // 添加填充与描边属性输入事件
        this.setupFillStrokePropertyEvents();
        
        // 添加文本属性输入事件
        this.setupTextPropertyEvents();
        
        console.log('属性编辑器初始化完成');
    }
    
    /**
     * 改进颜色选择器布局
     */
    enhanceColorPickerLayout() {
        // 改进填充颜色行
        const fillColorRow = this.fillColor.parentElement;
        fillColorRow.classList.add('color-property-row');
        
        // 创建填充颜色容器
        const fillColorContainer = document.createElement('div');
        fillColorContainer.className = 'color-property-container';
        
        // 移动填充颜色控件到容器中
        const fillColorLabel = fillColorRow.querySelector('label');
        fillColorRow.innerHTML = '';
        fillColorRow.appendChild(fillColorLabel);
        fillColorRow.appendChild(fillColorContainer);
        fillColorContainer.appendChild(this.fillColor);
        fillColorContainer.appendChild(this.fillColorText);
        
        // 改进描边颜色行
        const strokeColorRow = this.strokeColor.parentElement;
        strokeColorRow.classList.add('color-property-row');
        
        // 创建描边颜色容器
        const strokeColorContainer = document.createElement('div');
        strokeColorContainer.className = 'color-property-container';
        
        // 移动描边颜色控件到容器中
        const strokeColorLabel = strokeColorRow.querySelector('label');
        strokeColorRow.innerHTML = '';
        strokeColorRow.appendChild(strokeColorLabel);
        strokeColorRow.appendChild(strokeColorContainer);
        strokeColorContainer.appendChild(this.strokeColor);
        strokeColorContainer.appendChild(this.strokeColorText);
        
        // 改进填充不透明度行
        const fillOpacityRow = this.fillOpacity.parentElement;
        fillOpacityRow.classList.add('opacity-property-row');
        
        // 创建填充不透明度容器
        const fillOpacityContainer = document.createElement('div');
        fillOpacityContainer.className = 'opacity-slider-container';
        
        // 移动填充不透明度控件到容器中
        const fillOpacityLabel = fillOpacityRow.querySelector('label');
        fillOpacityRow.innerHTML = '';
        fillOpacityRow.appendChild(fillOpacityLabel);
        fillOpacityRow.appendChild(fillOpacityContainer);
        fillOpacityContainer.appendChild(this.fillOpacity);
        fillOpacityContainer.appendChild(this.fillOpacityText);
        
        // 改进描边不透明度行
        const strokeOpacityRow = this.strokeOpacity.parentElement;
        strokeOpacityRow.classList.add('opacity-property-row');
        
        // 创建描边不透明度容器
        const strokeOpacityContainer = document.createElement('div');
        strokeOpacityContainer.className = 'opacity-slider-container';
        
        // 移动描边不透明度控件到容器中
        const strokeOpacityLabel = strokeOpacityRow.querySelector('label');
        strokeOpacityRow.innerHTML = '';
        strokeOpacityRow.appendChild(strokeOpacityLabel);
        strokeOpacityRow.appendChild(strokeOpacityContainer);
        strokeOpacityContainer.appendChild(this.strokeOpacity);
        strokeOpacityContainer.appendChild(this.strokeOpacityText);
    }
    
    /**
     * 设置基本属性事件
     */
    setupBasicPropertyEvents() {
        // ID 输入事件
        this.elementId.addEventListener('change', () => {
            if (this.selectedElement) {
                const oldId = this.selectedElement.id;
                const newId = this.elementId.value.trim();
                
                // 更新元素 ID
                this.selectedElement.id = newId;
                
                // 发布属性变更事件
                this.eventBus.publish(Events.PROPERTY_CHANGED, {
                    element: this.selectedElement,
                    property: 'id',
                    oldValue: oldId,
                    newValue: newId
                });
                
                // 创建历史快照
                this.createHistorySnapshot('修改元素 ID');
            }
        });
        
        // 类名输入事件
        this.elementClass.addEventListener('change', () => {
            if (this.selectedElement) {
                const oldClass = this.selectedElement.getAttribute('class') || '';
                const newClass = this.elementClass.value.trim();
                
                // 更新元素类名
                this.selectedElement.setAttribute('class', newClass);
                
                // 发布属性变更事件
                this.eventBus.publish(Events.PROPERTY_CHANGED, {
                    element: this.selectedElement,
                    property: 'class',
                    oldValue: oldClass,
                    newValue: newClass
                });
                
                // 创建历史快照
                this.createHistorySnapshot('修改元素类名');
            }
        });
    }
    
    /**
     * 设置填充与描边属性事件
     */
    setupFillStrokePropertyEvents() {
        // 填充颜色事件
        this.fillColor.addEventListener('input', () => {
            if (this.selectedElement) {
                const color = this.fillColor.value;
                this.fillColorText.value = color;
                this.updateElementProperty('fill', color);
            }
        });
        
        this.fillColorText.addEventListener('change', () => {
            if (this.selectedElement) {
                const color = this.fillColorText.value;
                this.fillColor.value = this.isValidColor(color) ? color : '#000000';
                this.updateElementProperty('fill', this.fillColor.value);
            }
        });
        
        // 填充不透明度事件
        this.fillOpacity.addEventListener('input', () => {
            if (this.selectedElement) {
                const opacity = this.fillOpacity.value;
                this.fillOpacityText.value = opacity;
                this.updateElementProperty('fill-opacity', opacity);
            }
        });
        
        this.fillOpacityText.addEventListener('change', () => {
            if (this.selectedElement) {
                let opacity = parseFloat(this.fillOpacityText.value);
                opacity = Math.min(1, Math.max(0, opacity));
                this.fillOpacity.value = opacity;
                this.fillOpacityText.value = opacity;
                this.updateElementProperty('fill-opacity', opacity);
            }
        });
        
        // 描边颜色事件
        this.strokeColor.addEventListener('input', () => {
            if (this.selectedElement) {
                const color = this.strokeColor.value;
                this.strokeColorText.value = color;
                this.updateElementProperty('stroke', color);
            }
        });
        
        this.strokeColorText.addEventListener('change', () => {
            if (this.selectedElement) {
                const color = this.strokeColorText.value;
                this.strokeColor.value = this.isValidColor(color) ? color : '#000000';
                this.updateElementProperty('stroke', this.strokeColor.value);
            }
        });
        
        // 描边宽度事件
        this.strokeWidth.addEventListener('change', () => {
            if (this.selectedElement) {
                const width = this.strokeWidth.value;
                this.updateElementProperty('stroke-width', width);
            }
        });
        
        // 描边不透明度事件
        this.strokeOpacity.addEventListener('input', () => {
            if (this.selectedElement) {
                const opacity = this.strokeOpacity.value;
                this.strokeOpacityText.value = opacity;
                this.updateElementProperty('stroke-opacity', opacity);
            }
        });
        
        this.strokeOpacityText.addEventListener('change', () => {
            if (this.selectedElement) {
                let opacity = parseFloat(this.strokeOpacityText.value);
                opacity = Math.min(1, Math.max(0, opacity));
                this.strokeOpacity.value = opacity;
                this.strokeOpacityText.value = opacity;
                this.updateElementProperty('stroke-opacity', opacity);
            }
        });
    }
    
    /**
     * 设置文本属性事件
     */
    setupTextPropertyEvents() {
        // 文本内容事件
        this.textContent.addEventListener('change', () => {
            if (this.selectedElement && this.selectedElement.tagName.toLowerCase() === 'text') {
                const oldText = this.selectedElement.textContent;
                const newText = this.textContent.value;
                
                // 更新文本内容
                this.selectedElement.textContent = newText;
                
                // 发布属性变更事件
                this.eventBus.publish(Events.PROPERTY_CHANGED, {
                    element: this.selectedElement,
                    property: 'textContent',
                    oldValue: oldText,
                    newValue: newText
                });
                
                // 创建历史快照
                this.createHistorySnapshot('修改文本内容');
            }
        });
        
        // 字体事件
        this.fontFamily.addEventListener('change', () => {
            if (this.selectedElement && this.selectedElement.tagName.toLowerCase() === 'text') {
                const fontFamily = this.fontFamily.value;
                this.updateElementProperty('font-family', fontFamily);
            }
        });
        
        // 字体大小事件
        this.fontSize.addEventListener('change', () => {
            if (this.selectedElement && this.selectedElement.tagName.toLowerCase() === 'text') {
                const fontSize = this.fontSize.value;
                this.updateElementProperty('font-size', fontSize);
            }
        });
    }
    
    /**
     * 处理元素选择事件
     * @param {SVGElement} element - 选中的 SVG 元素
     * @param {Object} elementInfo - 元素信息对象
     */
    handleElementSelected(element, elementInfo) {
        this.selectedElement = element;
        
        // 显示属性面板，隐藏无选择消息
        this.noSelectionMessage.classList.add('hidden');
        this.elementProperties.classList.remove('hidden');
        
        // 更新元素类型标签
        this.elementTypeLabel.textContent = elementInfo.type;
        
        // 更新基本属性
        this.elementId.value = elementInfo.id;
        this.elementClass.value = elementInfo.className;
        
        // 更新填充与描边属性
        this.fillColor.value = this.normalizeColor(elementInfo.fill);
        this.fillColorText.value = this.fillColor.value;
        this.fillOpacity.value = elementInfo.fillOpacity;
        this.fillOpacityText.value = elementInfo.fillOpacity;
        this.strokeColor.value = this.normalizeColor(elementInfo.stroke);
        this.strokeColorText.value = this.strokeColor.value;
        this.strokeWidth.value = elementInfo.strokeWidth;
        this.strokeOpacity.value = elementInfo.strokeOpacity;
        this.strokeOpacityText.value = elementInfo.strokeOpacity;
        
        // 处理文本属性
        if (elementInfo.type === 'text') {
            this.textProperties.classList.remove('hidden');
            this.textContent.value = elementInfo.textContent;
            this.fontFamily.value = elementInfo.fontFamily;
            this.fontSize.value = elementInfo.fontSize;
        } else {
            this.textProperties.classList.add('hidden');
        }
        
        // 更新位置属性
        this.updatePositionProperties(elementInfo);
    }
    
    /**
     * 处理元素取消选择事件
     */
    handleElementDeselected() {
        this.selectedElement = null;
        
        // 隐藏属性面板，显示无选择消息
        this.noSelectionMessage.classList.remove('hidden');
        this.elementProperties.classList.add('hidden');
    }
    
    /**
     * 更新元素属性
     * @param {string} property - 属性名
     * @param {string} value - 属性值
     */
    updateElementProperty(property, value) {
        if (!this.selectedElement) {
            return;
        }
        
        const oldValue = this.selectedElement.getAttribute(property);
        
        // 更新元素属性
        this.selectedElement.setAttribute(property, value);
        
        // 发布属性变更事件
        this.eventBus.publish(Events.PROPERTY_CHANGED, {
            element: this.selectedElement,
            property: property,
            oldValue: oldValue,
            newValue: value
        });
        
        // 创建历史快照
        this.createHistorySnapshot(`修改 ${property}`);
    }
    
    /**
     * 更新位置属性控件
     * @param {Object} elementInfo - 元素信息对象
     */
    updatePositionProperties(elementInfo) {
        // 清空位置属性容器
        this.positionProperties.innerHTML = '';
        
        // 根据元素类型生成不同的位置属性控件
        const type = elementInfo.type;
        
        // 创建位置属性控件的函数
        const createPositionProperty = (label, property, value) => {
            const propertyRow = document.createElement('div');
            propertyRow.className = 'property-row';
            
            // 确保value不是undefined，如果是则设置为默认值'0'
            const safeValue = (value !== undefined && value !== null) ? value : '0';
            
            propertyRow.innerHTML = `
                <label for="${property}">${label}</label>
                <input type="number" id="${property}" value="${safeValue}" step="1">
            `;
            
            this.positionProperties.appendChild(propertyRow);
            
            // 添加事件监听
            const input = propertyRow.querySelector(`#${property}`);
            input.addEventListener('change', () => {
                this.updateElementProperty(property, input.value);
            });
        };
        
        // 根据元素类型创建不同的位置属性
        switch (type) {
            case 'rect':
                createPositionProperty('X', 'x', elementInfo.x);
                createPositionProperty('Y', 'y', elementInfo.y);
                createPositionProperty('宽度', 'width', elementInfo.width);
                createPositionProperty('高度', 'height', elementInfo.height);
                createPositionProperty('圆角 X', 'rx', elementInfo.rx);
                createPositionProperty('圆角 Y', 'ry', elementInfo.ry);
                break;
                
            case 'circle':
                createPositionProperty('中心 X', 'cx', elementInfo.cx);
                createPositionProperty('中心 Y', 'cy', elementInfo.cy);
                createPositionProperty('半径', 'r', elementInfo.r);
                break;
                
            case 'ellipse':
                createPositionProperty('中心 X', 'cx', elementInfo.cx);
                createPositionProperty('中心 Y', 'cy', elementInfo.cy);
                createPositionProperty('半径 X', 'rx', elementInfo.rx);
                createPositionProperty('半径 Y', 'ry', elementInfo.ry);
                break;
                
            case 'line':
                createPositionProperty('起点 X', 'x1', elementInfo.x1);
                createPositionProperty('起点 Y', 'y1', elementInfo.y1);
                createPositionProperty('终点 X', 'x2', elementInfo.x2);
                createPositionProperty('终点 Y', 'y2', elementInfo.y2);
                break;
                
            case 'text':
                createPositionProperty('X', 'x', elementInfo.x);
                createPositionProperty('Y', 'y', elementInfo.y);
                break;
                
            case 'polyline':
            case 'polygon':
                const pointsRow = document.createElement('div');
                pointsRow.className = 'property-row';
                
                // 确保points不是undefined，如果是则设置为空字符串
                const safePoints = (elementInfo.points !== undefined && elementInfo.points !== null) ? elementInfo.points : '';
                
                pointsRow.innerHTML = `
                    <label for="points">点坐标</label>
                    <input type="text" id="points" value="${safePoints}">
                `;
                
                this.positionProperties.appendChild(pointsRow);
                
                // 添加事件监听
                const pointsInput = pointsRow.querySelector('#points');
                pointsInput.addEventListener('change', () => {
                    this.updateElementProperty('points', pointsInput.value);
                });
                break;
                
            case 'path':
                const dRow = document.createElement('div');
                dRow.className = 'property-row';
                
                // 确保d不是undefined，如果是则设置为空字符串
                const safePath = (elementInfo.d !== undefined && elementInfo.d !== null) ? elementInfo.d : '';
                
                dRow.innerHTML = `
                    <label for="path-d">路径数据</label>
                    <textarea id="path-d" rows="3">${safePath}</textarea>
                `;
                
                this.positionProperties.appendChild(dRow);
                
                // 添加事件监听
                const dInput = dRow.querySelector('#path-d');
                dInput.addEventListener('change', () => {
                    this.updateElementProperty('d', dInput.value);
                });
                break;
        }
    }
    
    /**
     * 创建历史快照
     * @param {string} description - 操作描述
     */
    createHistorySnapshot(description) {
        if (!this.selectedElement) {
            return;
        }
        
        // 获取 SVG 元素
        const svgElement = this.selectedElement.closest('svg');
        if (!svgElement) {
            return;
        }
        
        // 创建快照
        this.eventBus.publish(Events.HISTORY_SNAPSHOT, {
            description: description,
            content: svgElement.outerHTML
        });
    }
    
    /**
     * 标准化颜色值
     * @param {string} color - 颜色值
     * @returns {string} 标准化后的颜色值
     */
    normalizeColor(color) {
        if (!color || color === 'none' || color === 'transparent') {
            return '#000000';
        }
        
        // 处理 rgb() 格式
        if (color.startsWith('rgb')) {
            const rgb = color.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
                const r = parseInt(rgb[0]);
                const g = parseInt(rgb[1]);
                const b = parseInt(rgb[2]);
                return this.rgbToHex(r, g, b);
            }
        }
        
        return color;
    }
    
    /**
     * RGB 转 Hex
     * @param {number} r - 红色值
     * @param {number} g - 绿色值
     * @param {number} b - 蓝色值
     * @returns {string} Hex 颜色值
     */
    rgbToHex(r, g, b) {
        return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
    }
    
    /**
     * 检查是否是有效的颜色值
     * @param {string} color - 颜色值
     * @returns {boolean} 是否有效
     */
    isValidColor(color) {
        // 创建一个临时元素来测试颜色是否有效
        const tempElement = document.createElement('div');
        tempElement.style.color = '';
        tempElement.style.color = color;
        return tempElement.style.color !== '';
    }
}
