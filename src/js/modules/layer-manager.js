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
        console.log('=== 图层管理器初始化 ===');
        console.log('图层面板元素:', this.layersPanel);
        
        // 订阅文件加载事件
        this.eventSubscriptions.push(
            this.eventBus.subscribe(Events.FILE_LOADED, (fileObj) => {
                console.log('图层管理器: 收到文件加载事件', fileObj);
                this.handleFileLoaded(fileObj);
            })
        );
        
        // 订阅文件选择事件
        this.eventSubscriptions.push(
            this.eventBus.subscribe(Events.FILE_SELECTED, (fileObj) => {
                console.log('图层管理器: 收到文件选择事件', fileObj);
                if (fileObj) {
                    this.handleFileSelected(fileObj);
                } else {
                    // 没有文件，清空图层面板
                    console.log('图层管理器: 清空图层面板');
                    this.clearLayers();
                }
            })
        );
        
        // 订阅元素选择事件
        this.eventSubscriptions.push(
            this.eventBus.subscribe(Events.ELEMENT_SELECTED, (data) => {
                console.log('图层管理器: 收到元素选择事件', data);
                this.highlightSelectedLayer(data.element);
            })
        );
        
        // 订阅元素取消选择事件
        this.eventSubscriptions.push(
            this.eventBus.subscribe(Events.ELEMENT_DESELECTED, () => {
                console.log('图层管理器: 收到元素取消选择事件');
                this.clearLayerSelection();
            })
        );

        // 订阅代码更新事件（代码视图应用更改后刷新图层）
        this.eventSubscriptions.push(
            this.eventBus.subscribe(Events.CODE_UPDATED, (data) => {
                console.log('图层管理器: 收到代码更新事件', data);

                // 如果外部传入了新的 SVG 内容，优先使用它
                if (data && data.content) {
                    try {
                        const parser = new DOMParser();
                        const svgDoc = parser.parseFromString(data.content, 'image/svg+xml');
                        const parserError = svgDoc.querySelector('parsererror');
                        if (parserError) {
                            console.warn('图层管理器: 解析代码更新的 SVG 时出错，保持现有图层');
                            return;
                        }

                        // 使用解析得到的文档刷新图层
                        this.parseSvgLayers(svgDoc);
                    } catch (err) {
                        console.error('图层管理器: 处理 CODE_UPDATED 时出错', err);
                    }
                } else {
                    // 否则，尝试从当前显示的 SVG 中解析并刷新
                    const svgElement = document.querySelector('#svg-canvas svg');
                    if (svgElement) {
                        try {
                            const serializer = new XMLSerializer();
                            const svgString = serializer.serializeToString(svgElement);
                            const parser = new DOMParser();
                            const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
                            this.parseSvgLayers(svgDoc);
                        } catch (err) {
                            console.error('图层管理器: 从显示 SVG 刷新时出错', err);
                        }
                    }
                }
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
            
            // 检查元素的可见性状态
            const displayAttr = child.getAttribute('display');
            const visibilityAttr = child.getAttribute('visibility');
            const styleDisplay = child.style.display;
            const styleVisibility = child.style.visibility;
            
            // 判断元素是否可见
            const isVisible = !(
                displayAttr === 'none' ||
                visibilityAttr === 'hidden' ||
                styleDisplay === 'none' ||
                styleVisibility === 'hidden'
            );
            
            // 创建图层对象
            const layer = {
                id: child.id || `layer_${index}`,
                element: child,
                type: child.tagName.toLowerCase(),
                name: this.getElementName(child),
                visible: isVisible
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
        console.log('=== 开始渲染图层列表 ===');
        console.log('图层数量:', this.layers.length);
        console.log('图层面板元素:', this.layersPanel);
        
        // 清空图层面板
        this.layersPanel.innerHTML = '';
        
        if (this.layers.length === 0) {
            console.log('没有图层，显示空状态消息');
            this.layersPanel.innerHTML = '<div class="no-layers-message">没有可用的图层</div>';
            return;
        }
        
        this.layers.forEach((layer, index) => {
            console.log(`创建第${index + 1}个图层UI:`, {
                id: layer.id,
                name: layer.name,
                type: layer.type,
                visible: layer.visible
            });
            
            this.createLayerItem(layer);
        });
        
        console.log('=== 图层列表渲染完成 ===');
    }
    
    /**
     * 创建图层项
     * @param {Object} layer - 图层对象
     */
    createLayerItem(layer) {
        console.log('=== 创建图层项 ===', layer);
        
        // 创建图层项容器
        const layerItem = document.createElement('div');
        layerItem.className = 'layer-item';
        layerItem.dataset.layerId = layer.id;
        layerItem.setAttribute('role', 'listitem');
        layerItem.setAttribute('aria-label', `图层: ${layer.name}`);
        
        // 创建可见性控制
        const visibilityDiv = document.createElement('div');
        visibilityDiv.className = 'layer-visibility';
        const visibilityIcon = document.createElement('i');
        visibilityIcon.className = `fas ${layer.visible ? 'fa-eye' : 'fa-eye-slash'}`;
        visibilityDiv.appendChild(visibilityIcon);
        
        // 创建图层名称
        const nameDiv = document.createElement('div');
        nameDiv.className = 'layer-name';
        nameDiv.textContent = layer.name;
        nameDiv.title = layer.name;
        
        // 创建操作按钮区域
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'layer-actions';
        
        // 创建操作按钮
        const renameBtn = document.createElement('button');
        renameBtn.className = 'layer-action-btn rename';
        renameBtn.title = '重命名';
        renameBtn.innerHTML = '<i class="fas fa-edit"></i>';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'layer-action-btn delete';
        deleteBtn.title = '删除';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        
        actionsDiv.appendChild(renameBtn);
        actionsDiv.appendChild(deleteBtn);
        
        // 组装图层项
        layerItem.appendChild(visibilityDiv);
        layerItem.appendChild(nameDiv);
        layerItem.appendChild(actionsDiv);
        
        // 点击图层选择元素
        layerItem.addEventListener('click', (e) => {
            console.log('图层项被点击!', '图层ID:', layer.id);
            // 忽略点击可见性按钮和操作按钮的事件
            if (e.target.closest('.layer-visibility') || e.target.closest('.layer-actions')) {
                console.log('点击的是按钮区域，忽略图层选择');
                return;
            }
            
            this.selectLayer(layer);
        });
        
        // 可见性切换
        const visibilityBtn = layerItem.querySelector('.layer-visibility');
        console.log('绑定可见性按钮事件:', visibilityBtn, '图层:', layer.id);
        
        visibilityBtn.addEventListener('click', (e) => {
            console.log('可见性按钮被点击!', '图层ID:', layer.id);
            e.stopPropagation(); // 防止事件冒泡
            this.toggleLayerVisibility(layer);
        });
        
        // 重命名按钮事件
        renameBtn.addEventListener('click', (e) => {
            console.log('重命名按钮被点击!', '图层ID:', layer.id);
            e.stopPropagation(); // 防止事件冒泡
            this.renameLayer(layer);
        });
        
        // 删除按钮事件
        deleteBtn.addEventListener('click', (e) => {
            console.log('删除按钮被点击!', '图层ID:', layer.id);
            e.stopPropagation(); // 防止事件冒泡
            this.deleteLayer(layer);
        });
        
        // 添加到图层面板
        this.layersPanel.appendChild(layerItem);
        
        console.log('图层项创建完成:', layerItem);
    }

    /**
     * 选择图层
     * @param {Object} layer - 图层对象
     */
    selectLayer(layer) {
        // 尝试解析出当前在画布上显示的对应元素（优先），如果找不到则回退到源文档的元素
        const displayedElement = this.findDisplayedElement(layer.element);

        const elementToPublish = displayedElement || layer.element;

        // 触发元素选择事件，传入画布上的真实元素（如果有）以及用于面板展示的 elementInfo
        this.eventBus.publish(Events.ELEMENT_SELECTED, {
            element: elementToPublish,
            elementInfo: this.getElementInfo(elementToPublish),
            sourceElement: layer.element,
            layerId: layer.id
        });
    }

    /**
     * 在当前显示的 SVG 中查找与源 element 相对应的真实元素
     * @param {SVGElement} sourceElement - 从源文档解析得到的元素
     * @returns {SVGElement|null} 在画布上找到的元素或 null
     */
    findDisplayedElement(sourceElement) {
        try {
            const svgCanvas = document.getElementById('svg-canvas');
            const svgElement = svgCanvas ? svgCanvas.querySelector('svg') : null;
            if (!svgElement || !sourceElement) return null;

            // 优先通过 id 匹配
            if (sourceElement.id) {
                const byId = svgElement.querySelector(`#${sourceElement.id}`);
                if (byId) return byId;
            }

            // 其次尝试通过类型+在同类型中的索引匹配
            const elementsOfType = Array.from(svgElement.querySelectorAll(sourceElement.tagName));
            const layersOfSameType = this.layers.filter(l => l.element && l.element.tagName === sourceElement.tagName);
            const indexInSameType = layersOfSameType.findIndex(l => l.element === sourceElement || l.id === (sourceElement.id || ''));
            if (indexInSameType >= 0 && indexInSameType < elementsOfType.length) {
                return elementsOfType[indexInSameType];
            }

            // 最后尝试通过 outerHTML/innerHTML 精确匹配
            const sourceHTML = (sourceElement.outerHTML || '').trim();
            const match = elementsOfType.find(el => (el.outerHTML || '').trim() === sourceHTML || (el.innerHTML || '') === (sourceElement.innerHTML || ''));
            if (match) return match;
        } catch (err) {
            console.warn('findDisplayedElement 时出错', err);
        }

        return null;
    }
    
    /**
     * 切换图层可见性
     * @param {Object} layer - 图层对象
     */
    toggleLayerVisibility(layer) {
        console.log('=== 开始切换图层可见性 ===');
        console.log('图层信息:', {
            id: layer.id,
            name: layer.name,
            type: layer.type,
            currentVisible: layer.visible,
            element: layer.element
        });
        
        // 找到当前在 SVG 画布中显示的实际元素
        const svgCanvas = document.getElementById('svg-canvas');
        const svgElement = svgCanvas ? svgCanvas.querySelector('svg') : null;
        
        if (!svgElement) {
            console.error('未找到 SVG 元素');
            return;
        }
        
        // 查找实际的目标元素
        let targetElement = null;
        
        console.log('开始查找目标元素，图层信息:', {
            id: layer.id,
            type: layer.type,
            name: layer.name,
            elementId: layer.element.id,
            elementTagName: layer.element.tagName
        });
        
        // 首先尝试通过元素的ID查找
        if (layer.element.id) {
            targetElement = svgElement.querySelector(`#${layer.element.id}`);
            console.log(`通过ID "${layer.element.id}" 查找结果:`, targetElement);
        }
        
        // 如果通过ID找不到，尝试通过标签类型和索引查找
        if (!targetElement) {
            console.log('ID查找失败，尝试通过类型和索引查找');
            const elementsOfType = Array.from(svgElement.querySelectorAll(layer.element.tagName));
            console.log(`SVG中 ${layer.element.tagName} 类型的元素:`, elementsOfType.map((el, idx) => ({
                index: idx,
                id: el.id || '无ID',
                outerHTML: el.outerHTML.substring(0, 100) + (el.outerHTML.length > 100 ? '...' : '')
            })));
            
            // 通过在图层列表中的位置来推断索引
            const layersOfSameType = this.layers.filter(l => l.element.tagName === layer.element.tagName);
            const indexInSameType = layersOfSameType.findIndex(l => l.id === layer.id);
            
            console.log(`相同类型图层数量: ${layersOfSameType.length}, 当前图层在同类型中的索引: ${indexInSameType}`);
            
            if (indexInSameType >= 0 && indexInSameType < elementsOfType.length) {
                targetElement = elementsOfType[indexInSameType];
                console.log(`通过索引 ${indexInSameType} 找到目标元素:`, targetElement);
            } else if (elementsOfType.length === 1) {
                // 如果只有一个同类型元素，直接使用
                targetElement = elementsOfType[0];
                console.log('只有一个同类型元素，直接使用:', targetElement);
            } else {
                // 最后尝试：比较元素内容来匹配
                console.log('尝试通过内容匹配查找元素');
                const sourceOuterHTML = layer.element.outerHTML;
                targetElement = elementsOfType.find(el => 
                    el.outerHTML === sourceOuterHTML || 
                    el.innerHTML === layer.element.innerHTML
                );
                console.log('通过内容匹配找到:', targetElement);
            }
        }
        
        if (!targetElement) {
            console.error('无法找到目标元素，操作终止');
            return;
        }
        
        console.log('将操作的目标元素:', targetElement);
        console.log('目标元素当前属性:', {
            display: targetElement.getAttribute('display'),
            visibility: targetElement.getAttribute('visibility'),
            styleDisplay: targetElement.style.display,
            styleVisibility: targetElement.style.visibility
        });
        
        // 切换可见性状态
        const oldVisible = layer.visible;
        layer.visible = !layer.visible;
        
        console.log('可见性状态变更:', oldVisible, '->', layer.visible);
        
        // 更新元素显示属性 - 使用 SVG 标准的 visibility 属性
        if (layer.visible) {
            console.log('显示图层 - 移除隐藏属性');
            targetElement.removeAttribute('display');
            targetElement.removeAttribute('visibility');
            targetElement.style.display = '';
            targetElement.style.visibility = 'visible';
            targetElement.style.opacity = '1';
            console.log('显示后元素属性:', {
                display: targetElement.getAttribute('display'),
                visibility: targetElement.getAttribute('visibility'),
                styleDisplay: targetElement.style.display,
                styleVisibility: targetElement.style.visibility,
                styleOpacity: targetElement.style.opacity
            });
        } else {
            console.log('隐藏图层 - 设置隐藏属性');
            targetElement.setAttribute('display', 'none');
            targetElement.setAttribute('visibility', 'hidden');
            targetElement.style.display = 'none';
            targetElement.style.visibility = 'hidden';
            targetElement.style.opacity = '0';
            console.log('隐藏后元素属性:', {
                display: targetElement.getAttribute('display'),
                visibility: targetElement.getAttribute('visibility'),
                styleDisplay: targetElement.style.display,
                styleVisibility: targetElement.style.visibility,
                styleOpacity: targetElement.style.opacity
            });
        }
        
        // 更新图层项的图标
        const layerItem = this.layersPanel.querySelector(`.layer-item[data-layer-id="${layer.id}"]`);
        console.log('查找图层UI项:', layerItem);
        
        if (layerItem) {
            const visibilityIcon = layerItem.querySelector('.layer-visibility i');
            console.log('查找可见性图标:', visibilityIcon);
            
            if (visibilityIcon) {
                const newIconClass = `fas ${layer.visible ? 'fa-eye' : 'fa-eye-slash'}`;
                console.log('更新图标类名:', visibilityIcon.className, '->', newIconClass);
                visibilityIcon.className = newIconClass;
                
                // 更新按钮状态
                const visibilityBtn = layerItem.querySelector('.layer-visibility');
                const newTitle = layer.visible ? '隐藏图层' : '显示图层';
                console.log('更新按钮标题:', visibilityBtn.title, '->', newTitle);
                visibilityBtn.title = newTitle;
            }
        }
        
        // 发布图层可见性变更事件
        console.log('发布图层可见性变更事件');
        this.eventBus.publish(Events.LAYER_VISIBILITY_CHANGED, {
            layer: layer,
            visible: layer.visible,
            targetElement: targetElement
        });
        
        // 立即刷新 SVG 视图
        console.log('调用视图刷新');
        this.refreshSvgView();
        
        // 创建历史快照
        console.log('创建历史快照');
        this.createHistorySnapshot(`${layer.visible ? '显示' : '隐藏'}图层 ${layer.name}`);
        
        console.log('=== 图层可见性切换完成 ===');
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
        console.log('=== 开始删除图层 ===');
        console.log('要删除的图层:', {
            id: layer.id,
            name: layer.name,
            type: layer.type,
            element: layer.element,
            parentNode: layer.element.parentNode
        });
        
        // 弹出确认对话框
        const confirmResult = confirm(`确定要删除图层 "${layer.name}" 吗？`);
        console.log('用户确认结果:', confirmResult);
        
        if (confirmResult) {
            try {
                console.log('开始执行删除操作');
                
                // 在实际显示的 SVG 画布中寻找并移除对应元素（优先在显示的 SVG 上操作，避免只在源文档中修改）
                const svgCanvas = document.getElementById('svg-canvas');
                const displayedSvg = svgCanvas ? svgCanvas.querySelector('svg') : null;
                let removedFromDisplayed = false;

                if (displayedSvg) {
                    console.log('尝试在显示的 SVG 中匹配要删除的元素');

                    // 优先使用 ID 匹配
                    if (layer.element && layer.element.id) {
                        const byId = displayedSvg.querySelector(`#${layer.element.id}`);
                        console.log('通过 ID 查找显示元素结果:', byId);
                        if (byId && byId.parentNode) {
                            byId.parentNode.removeChild(byId);
                            console.log('已从显示 SVG 中删除元素（ID 匹配）');
                            removedFromDisplayed = true;
                        }
                    }

                    // 如果未删除，尝试通过类型+索引匹配（根据当前图层列表顺序）
                    if (!removedFromDisplayed && layer.element) {
                        const tag = layer.element.tagName;
                        const displayedOfType = Array.from(displayedSvg.querySelectorAll(tag));
                        console.log(`显示 SVG 中 ${tag} 数量:`, displayedOfType.length);

                        const layersOfSameType = this.layers.filter(l => l.element && l.element.tagName === tag);
                        const indexInSameType = layersOfSameType.findIndex(l => l.id === layer.id);
                        console.log('在相同类型图层中的索引:', indexInSameType);

                        if (indexInSameType >= 0 && indexInSameType < displayedOfType.length) {
                            const candidate = displayedOfType[indexInSameType];
                            if (candidate && candidate.parentNode) {
                                candidate.parentNode.removeChild(candidate);
                                console.log('已从显示 SVG 中删除元素（类型+索引匹配）');
                                removedFromDisplayed = true;
                            }
                        }
                    }

                    // 如果仍未删除，尝试通过 outerHTML/innerHTML 精确匹配
                    if (!removedFromDisplayed && layer.element) {
                        const displayedAll = Array.from(displayedSvg.querySelectorAll('*'));
                        const sourceHTML = (layer.element.outerHTML || '').trim();
                        const match = displayedAll.find(el => (el.outerHTML || '').trim() === sourceHTML || (el.innerHTML || '') === (layer.element.innerHTML || ''));
                        console.log('通过内容匹配结果:', match);
                        if (match && match.parentNode) {
                            match.parentNode.removeChild(match);
                            console.log('已从显示 SVG 中删除元素（内容匹配）');
                            removedFromDisplayed = true;
                        }
                    }
                } else {
                    console.warn('未找到显示的 SVG（id=svg-canvas 下无 svg）');
                }

                // 如果没有在显示 SVG 中删除成功，再回退到原始元素删除（以保证源文档一致性）
                if (!removedFromDisplayed) {
                    if (layer.element && layer.element.parentNode) {
                        console.log('回退：从原始 DOM 中移除元素（源文档）');
                        const parentNode = layer.element.parentNode;
                        console.log('原始父节点:', parentNode);
                        console.log('移除前原始父节点子元素数量:', parentNode.children ? parentNode.children.length : '未知');
                        parentNode.removeChild(layer.element);
                        console.log('移除后原始父节点子元素数量:', parentNode.children ? parentNode.children.length : '未知');
                    } else {
                        console.warn('无法移除元素 - 在显示 SVG 或源文档中均未找到目标元素');
                    }
                }
                
                // 从图层列表中移除
                const beforeCount = this.layers.length;
                this.layers = this.layers.filter(l => l.id !== layer.id);
                const afterCount = this.layers.length;
                console.log('从图层列表中移除:', beforeCount, '->', afterCount);
                
                // 从图层面板中移除对应的 UI
                const layerItem = this.layersPanel.querySelector(`.layer-item[data-layer-id="${layer.id}"]`);
                console.log('查找要删除的图层UI项:', layerItem);
                
                if (layerItem) {
                    console.log('移除图层UI项');
                    layerItem.remove();
                } else {
                    console.warn('未找到对应的图层UI项');
                }
                
                // 发布图层删除事件
                console.log('发布图层删除事件');
                this.eventBus.publish(Events.LAYER_DELETED, {
                    layerId: layer.id,
                    layerName: layer.name,
                    element: layer.element
                });
                
                // 立即刷新 SVG 视图以显示删除效果
                console.log('调用视图刷新');
                this.refreshSvgView();
                
                // 如果没有图层了，显示提示信息
                if (this.layers.length === 0) {
                    console.log('没有图层了，显示提示信息');
                    this.layersPanel.innerHTML = '<div class="no-layers-message">没有可用的图层</div>';
                }
                
                // 通知文件管理器内容已更改
                console.log('通知文件内容已更改');
                this.eventBus.publish(Events.FILE_CONTENT_CHANGED, {
                    type: 'layer_deleted',
                    layerName: layer.name
                });
                
                // 创建历史快照
                console.log('创建历史快照');
                this.createHistorySnapshot(`删除图层 ${layer.name}`);
                
                console.log('=== 图层删除完成 ===');
                
            } catch (error) {
                console.error('=== 删除图层时出错 ===');
                console.error('错误详情:', error);
                console.error('错误堆栈:', error.stack);
                alert('删除图层失败，请重试！');
            }
        } else {
            console.log('用户取消删除操作');
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
        
        const sourceEl = layer.element;

        // 如果两个节点相等（同一节点），直接返回 true
        if (element === sourceEl) return true;

        // 如果都有 id 且相同，认为匹配
        if (sourceEl.id && element.id && sourceEl.id === element.id) return true;

        // 如果 outerHTML 或 innerHTML 完全相等，也认为匹配（适配不同 document 的节点）
        try {
            const sourceOuter = (sourceEl.outerHTML || '').trim();
            const targetOuter = (element.outerHTML || '').trim();
            if (sourceOuter && targetOuter && sourceOuter === targetOuter) return true;

            const sourceInner = (sourceEl.innerHTML || '').trim();
            const targetInner = (element.innerHTML || '').trim();
            if (sourceInner && targetInner && sourceInner === targetInner) return true;
        } catch (err) {
            // ignore
        }

        // 最后尝试源节点包含目标节点（在同一 document 的情况下）
        try {
            if (sourceEl.contains && sourceEl.contains(element)) return true;
        } catch (err) {
            // ignore
        }

        return false;
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
     * 刷新 SVG 视图
     * 更有效的 SVG 重绘方法
     */
    refreshSvgView() {
        console.log('=== 开始刷新SVG视图 ===');
        
        const svgCanvas = document.getElementById('svg-canvas');
        console.log('SVG画布容器:', svgCanvas);
        
        const svgElement = svgCanvas ? svgCanvas.querySelector('svg') : null;
        console.log('SVG元素:', svgElement);
        
        if (!svgElement) {
            console.warn('未找到SVG元素，无法刷新视图');
            return;
        }
        
        try {
            console.log('执行SVG刷新操作');
            
            // 方法1: 触发 SVG 重新渲染
            const currentDisplay = svgElement.style.display;
            console.log('当前display样式:', currentDisplay);
            
            svgElement.style.display = 'none';
            console.log('临时设置display为none');
            
            // 强制重排
            const offsetHeight = svgElement.offsetHeight;
            console.log('强制重排，offsetHeight:', offsetHeight);
            
            svgElement.style.display = currentDisplay || 'block';
            console.log('恢复display样式:', svgElement.style.display);
            
            // 方法2: 使用 requestAnimationFrame 确保渲染更新
            requestAnimationFrame(() => {
                console.log('requestAnimationFrame回调执行');
                
                // 检查所有元素的最终状态
                const allElements = svgElement.querySelectorAll('*');
                console.log('=== 刷新后所有元素状态检查 ===');
                allElements.forEach((element, index) => {
                    const computedStyle = window.getComputedStyle(element);
                    console.log(`元素${index + 1} (${element.tagName}):`, {
                        id: element.id || '无ID',
                        display: element.getAttribute('display'),
                        visibility: element.getAttribute('visibility'),
                        styleDisplay: element.style.display,
                        styleVisibility: element.style.visibility,
                        computedDisplay: computedStyle.display,
                        computedVisibility: computedStyle.visibility,
                        isActuallyHidden: computedStyle.display === 'none' || computedStyle.visibility === 'hidden'
                    });
                });
                
                // 触发 SVG 内容更新
                const viewBox = svgElement.getAttribute('viewBox');
                console.log('当前viewBox:', viewBox);
                
                if (viewBox) {
                    svgElement.setAttribute('viewBox', viewBox);
                    console.log('重新设置viewBox');
                }
                
                // 通知视图管理器刷新
                console.log('发布视图刷新事件');
                this.eventBus.publish(Events.VIEW_REFRESH_NEEDED, {
                    reason: 'layer_visibility_changed'
                });
            });
            
            console.log('=== SVG视图刷新完成 ===');
            
        } catch (error) {
            console.error('=== 刷新SVG视图时出错 ===');
            console.error('错误详情:', error);
            console.error('错误堆栈:', error.stack);
        }
    }
    
    /**
     * 强制SVG重绘
     * 使用多种技术确保SVG视图被刷新
     */
    forceRedraw() {
        // 使用新的刷新方法
        this.refreshSvgView();
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
