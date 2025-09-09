// layer-manager.js - 图层管理模块
import { Events } from '../utils/event-bus.js';

/**
 * 图层管理器
 * 负责 SVG 图层的管理，包括显示/隐藏/重命名/删除等操作
 */
export class LayerManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.layers = [];
        this.activeFileId = null;
        
        // DOM 元素
        this.layersPanel = document.getElementById('layers-panel');
        
        // 订阅事件
        this.eventSubscriptions = [];
    }
    
    /**
     * 初始化图层管理器
     */
    init() {
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
                    // 没有文件，清空图层面板
                    this.clearLayers();
                }
            })
        );
        
        // 订阅元素选择事件
        this.eventSubscriptions.push(
            this.eventBus.subscribe(Events.ELEMENT_SELECTED, (data) => {
                this.highlightSelectedLayer(data.element);
            })
        );
        
        // 订阅元素取消选择事件
        this.eventSubscriptions.push(
            this.eventBus.subscribe(Events.ELEMENT_DESELECTED, () => {
                this.clearLayerSelection();
            })
        );
        
        console.log('图层管理器初始化完成');
    }
    
    /**
     * 处理文件加载事件
     * @param {Object} fileObj - 文件对象
     */
    handleFileLoaded(fileObj) {
        this.activeFileId = fileObj.id;
        this.parseSvgLayers(fileObj.svgDoc);
    }
    
    /**
     * 处理文件选择事件
     * @param {Object} fileObj - 文件对象
     */
    handleFileSelected(fileObj) {
        this.activeFileId = fileObj.id;
        this.parseSvgLayers(fileObj.svgDoc);
    }
    
    /**
     * 解析 SVG 图层
     * @param {Document} svgDoc - SVG 文档
     */
    parseSvgLayers(svgDoc) {
        this.layers = [];
        
        // 获取 SVG 元素
        const svgElement = svgDoc.documentElement;
        
        // 解析子元素作为图层
        this.parseChildElements(svgElement);
        
        // 更新图层面板
        this.renderLayers();
    }
    
    /**
     * 解析子元素
     * @param {SVGElement} element - SVG 元素
     */
    parseChildElements(element) {
        // 遍历所有子元素
        Array.from(element.children).forEach((child, index) => {
            // 跳过非图层元素，如 defs、style 等
            if (['defs', 'style', 'metadata'].includes(child.tagName.toLowerCase())) {
                return;
            }
            
            // 创建图层对象
            const layer = {
                id: child.id || `layer_${index}`,
                element: child,
                type: child.tagName.toLowerCase(),
                name: this.getElementName(child),
                visible: !child.hasAttribute('display') || child.getAttribute('display') !== 'none'
            };
            
            // 添加到图层列表
            this.layers.push(layer);
        });
    }
    
    /**
     * 获取元素名称
     * @param {SVGElement} element - SVG 元素
     * @returns {string} 元素名称
     */
    getElementName(element) {
        // 优先使用 ID
        if (element.id) {
            return element.id;
        }
        
        // 使用元素类型
        const type = element.tagName.toLowerCase();
        
        // 根据元素类型生成名称
        switch (type) {
            case 'rect':
                return `矩形`;
            case 'circle':
                return `圆形`;
            case 'ellipse':
                return `椭圆`;
            case 'line':
                return `线条`;
            case 'polyline':
                return `折线`;
            case 'polygon':
                return `多边形`;
            case 'path':
                return `路径`;
            case 'text':
                return `文本: ${element.textContent.substring(0, 10)}${element.textContent.length > 10 ? '...' : ''}`;
            case 'g':
                return `组`;
            case 'image':
                return `图像`;
            case 'use':
                return `引用`;
            default:
                return `${type}`;
        }
    }
    
    /**
     * 渲染图层列表
     */
    renderLayers() {
        // 清空图层面板
        this.layersPanel.innerHTML = '';
        
        // 如果没有图层，显示提示信息
        if (this.layers.length === 0) {
            this.layersPanel.innerHTML = '<div class="no-layers-message">没有可用的图层</div>';
            return;
        }
        
        // 创建图层项
        this.layers.forEach((layer) => {
            const layerItem = document.createElement('div');
            layerItem.className = 'layer-item';
            layerItem.dataset.layerId = layer.id;
            
            layerItem.innerHTML = `
                <div class="layer-visibility">
                    <i class="fas ${layer.visible ? 'fa-eye' : 'fa-eye-slash'}"></i>
                </div>
                <div class="layer-name" title="${layer.name}">${layer.name}</div>
                <div class="layer-actions">
                    <button class="layer-action-btn rename" title="重命名">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="layer-action-btn delete" title="删除">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            // 点击图层选择元素
            layerItem.addEventListener('click', (e) => {
                // 忽略点击可见性按钮和操作按钮的事件
                if (e.target.closest('.layer-visibility') || e.target.closest('.layer-actions')) {
                    return;
                }
                
                this.selectLayer(layer);
            });
            
            // 可见性切换
            const visibilityBtn = layerItem.querySelector('.layer-visibility');
            visibilityBtn.addEventListener('click', () => {
                this.toggleLayerVisibility(layer);
            });
            
            // 重命名按钮
            const renameBtn = layerItem.querySelector('.rename');
            renameBtn.addEventListener('click', () => {
                this.renameLayer(layer);
            });
            
            // 删除按钮
            const deleteBtn = layerItem.querySelector('.delete');
            deleteBtn.addEventListener('click', () => {
                this.deleteLayer(layer);
            });
            
            this.layersPanel.appendChild(layerItem);
        });
    }
    
    /**
     * 选择图层
     * @param {Object} layer - 图层对象
     */
    selectLayer(layer) {
        // 触发元素选择事件
        this.eventBus.publish(Events.ELEMENT_SELECTED, {
            element: layer.element,
            elementInfo: this.getElementInfo(layer.element)
        });
    }
    
    /**
     * 切换图层可见性
     * @param {Object} layer - 图层对象
     */
    toggleLayerVisibility(layer) {
        // 切换可见性状态
        layer.visible = !layer.visible;
        
        // 更新元素显示属性
        if (layer.visible) {
            layer.element.removeAttribute('display');
            layer.element.style.display = '';
        } else {
            layer.element.setAttribute('display', 'none');
            layer.element.style.display = 'none';
        }
        
        // 更新图层项
        const layerItem = this.layersPanel.querySelector(`.layer-item[data-layer-id="${layer.id}"]`);
        if (layerItem) {
            const visibilityIcon = layerItem.querySelector('.layer-visibility i');
            visibilityIcon.className = `fas ${layer.visible ? 'fa-eye' : 'fa-eye-slash'}`;
        }
        
        // 发布图层可见性变更事件
        this.eventBus.publish(Events.LAYER_VISIBILITY_CHANGED, {
            layer: layer,
            visible: layer.visible
        });
        
        // 强制触发重绘 - 刷新SVG视图
        this.forceRedraw();
        
        // 确保元素的显示状态被正确应用
        setTimeout(() => {
            // 使用额外的刷新机制确保视图更新
            this.forceRedraw();
        }, 50);
        
        // 创建历史快照
        this.createHistorySnapshot(`${layer.visible ? '显示' : '隐藏'}图层 ${layer.name}`);
    }
    
    /**
     * 重命名图层
     * @param {Object} layer - 图层对象
     */
    renameLayer(layer) {
        // 弹出重命名对话框
        const newName = prompt('请输入新的图层名称:', layer.name);
        
        if (newName !== null && newName.trim() !== '') {
            const oldName = layer.name;
            
            // 更新图层名称
            layer.name = newName.trim();
            
            // 如果使用 ID 作为名称，则更新元素 ID
            if (layer.element.id === oldName) {
                layer.element.id = layer.name;
                layer.id = layer.name;
            }
            
            // 更新图层项
            const layerItem = this.layersPanel.querySelector(`.layer-item[data-layer-id="${layer.id}"]`);
            if (layerItem) {
                const nameElement = layerItem.querySelector('.layer-name');
                nameElement.textContent = layer.name;
                nameElement.title = layer.name;
            }
            
            // 发布图层重命名事件
            this.eventBus.publish(Events.LAYER_RENAMED, {
                layer: layer,
                oldName: oldName,
                newName: layer.name
            });
            
            // 创建历史快照
            this.createHistorySnapshot(`重命名图层 ${oldName} 为 ${layer.name}`);
        }
    }
    
    /**
     * 删除图层
     * @param {Object} layer - 图层对象
     */
    deleteLayer(layer) {
        // 弹出确认对话框
        if (confirm(`确定要删除图层 "${layer.name}" 吗？`)) {
            try {
                // 从 SVG 中移除元素
                if (layer.element.parentNode) {
                    layer.element.parentNode.removeChild(layer.element);
                }
                
                // 从图层列表中移除
                this.layers = this.layers.filter(l => l.id !== layer.id);
                
                // 从图层面板中移除
                const layerItem = this.layersPanel.querySelector(`.layer-item[data-layer-id="${layer.id}"]`);
                if (layerItem) {
                    layerItem.remove();
                }
                
                // 发布图层删除事件
                this.eventBus.publish(Events.LAYER_DELETED, {
                    layerId: layer.id,
                    layerName: layer.name
                });
                
                // 强制触发重绘 - 刷新SVG视图
                this.forceRedraw();
                
                // 使用额外的刷新机制确保视图更新
                setTimeout(() => {
                    this.forceRedraw();
                }, 50);
                
                // 如果没有图层了，显示提示信息
                if (this.layers.length === 0) {
                    this.layersPanel.innerHTML = '<div class="no-layers-message">没有可用的图层</div>';
                }
                
                // 创建历史快照
                this.createHistorySnapshot(`删除图层 ${layer.name}`);
            } catch (error) {
                console.error('删除图层时出错:', error);
                alert('删除图层失败，请重试！');
            }
        }
    }
    
    /**
     * 高亮选中的图层
     * @param {SVGElement} element - 选中的 SVG 元素
     */
    highlightSelectedLayer(element) {
        // 清除之前的选择
        this.clearLayerSelection();
        
        // 查找对应的图层
        const layerId = element.id || '';
        const layerItems = this.layersPanel.querySelectorAll('.layer-item');
        
        for (const layerItem of layerItems) {
            const itemLayerId = layerItem.dataset.layerId;
            
            // 检查是否是选中的图层
            if (itemLayerId === layerId || this.isElementInLayer(element, itemLayerId)) {
                layerItem.classList.add('selected');
                
                // 确保选中的图层在可视区域内
                layerItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                break;
            }
        }
    }
    
    /**
     * 检查元素是否在指定图层中
     * @param {SVGElement} element - SVG 元素
     * @param {string} layerId - 图层 ID
     * @returns {boolean} 元素是否在图层中
     */
    isElementInLayer(element, layerId) {
        // 查找对应的图层
        const layer = this.layers.find(l => l.id === layerId);
        if (!layer) {
            return false;
        }
        
        // 检查元素是否是图层的子元素
        return layer.element.contains(element);
    }
    
    /**
     * 清除图层选择
     */
    clearLayerSelection() {
        const selectedLayers = this.layersPanel.querySelectorAll('.layer-item.selected');
        selectedLayers.forEach(layer => {
            layer.classList.remove('selected');
        });
    }
    
    /**
     * 清空图层
     */
    clearLayers() {
        this.layers = [];
        this.layersPanel.innerHTML = '<div class="no-layers-message">没有可用的图层</div>';
    }
    
    /**
     * 创建历史快照
     * @param {string} description - 操作描述
     */
    createHistorySnapshot(description) {
        // 获取 SVG 元素
        const svgElement = document.querySelector('#svg-canvas svg');
        if (!svgElement) {
            return;
        }
        
        // 创建快照
        this.eventBus.publish(Events.HISTORY_SNAPSHOT, {
            fileId: this.activeFileId,
            description: description,
            content: svgElement.outerHTML
        });
    }
    
    /**
     * 强制SVG重绘
     * 使用多种技术确保SVG视图被刷新
     */
    forceRedraw() {
        // 查找SVG元素
        const svgCanvas = document.getElementById('svg-canvas');
        const svgElement = svgCanvas.querySelector('svg');
        
        if (!svgElement) return;
        
        // 方法1: 触发viewBox变化
        const viewBox = svgElement.getAttribute('viewBox') || '0 0 100 100';
        svgElement.setAttribute('viewBox', viewBox + ' ');
        
        // 方法2: 使用requestAnimationFrame确保在下一帧进行绘制
        requestAnimationFrame(() => {
            svgElement.setAttribute('viewBox', viewBox);
            
            // 方法3: 强制DOM重排
            svgElement.style.display = 'none';
            // 触发重排
            void svgElement.offsetHeight;
            svgElement.style.display = '';
            
            // 方法4: 更新transform以触发重绘
            const currentTransform = svgElement.style.transform || '';
            svgElement.style.transform = 'translateZ(0)';
            
            // 方法5: 触发小的尺寸变化再还原
            requestAnimationFrame(() => {
                svgElement.style.transform = currentTransform;
            });
        });
    }
    
    /**
     * 获取元素信息
     * @param {SVGElement} element - SVG 元素
     * @returns {Object} 元素信息对象
     */
    getElementInfo(element) {
        // 获取元素类型
        const type = element.tagName.toLowerCase();
        
        // 基本属性对象
        const info = {
            type,
            id: element.id || '',
            className: element.getAttribute('class') || '',
            fill: element.getAttribute('fill') || 'none',
            fillOpacity: element.getAttribute('fill-opacity') || '1',
            stroke: element.getAttribute('stroke') || 'none',
            strokeWidth: element.getAttribute('stroke-width') || '1',
            strokeOpacity: element.getAttribute('stroke-opacity') || '1'
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
                info.fontFamily = element.getAttribute('font-family') || 'sans-serif';
                info.fontSize = element.getAttribute('font-size') || '16';
                break;
        }
        
        return info;
    }
}
