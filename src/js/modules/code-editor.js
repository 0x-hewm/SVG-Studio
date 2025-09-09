// code-editor.js - 代码编辑模块
import { Events } from '../utils/event-bus.js';

/**
 * 代码编辑器
 * 负责 SVG 源码的编辑和预览
 */
export class CodeEditor {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.isCodeViewActive = false;
    // 上一次已应用或载入到编辑器中的 SVG 字符串（用于检测是否有修改）
    this.lastAppliedSvgString = '';
        
        // DOM 元素
        this.canvasContainer = document.getElementById('canvas-container');
        this.codeEditorContainer = document.getElementById('code-editor-container');
        this.svgCodeEditor = document.getElementById('svg-code-editor');
        this.applyCodeChangesBtn = document.getElementById('apply-code-changes');
        this.visualViewBtn = document.getElementById('visual-view-btn');
        this.codeViewBtn = document.getElementById('code-view-btn');
        
        // 订阅事件
        this.eventSubscriptions = [];
    }
    
    /**
     * 初始化代码编辑器
     */
    init() {
        // 切换视图按钮事件
        this.visualViewBtn.addEventListener('click', () => {
            this.switchToVisualView();
        });
        
        this.codeViewBtn.addEventListener('click', () => {
            this.switchToCodeView();
        });
        
        // 应用代码更改按钮事件
        if (this.applyCodeChangesBtn) {
            this.applyCodeChangesBtn.addEventListener('click', () => {
                console.log('应用代码更改按钮被点击');
                this.applyCodeChanges();
            });
        } else {
            console.warn('代码编辑器: 未找到 apply-code-changes 按钮 (id=apply-code-changes)');
        }
        
        // 添加键盘快捷键
        this.svgCodeEditor.addEventListener('keydown', (e) => {
            // Ctrl+S / Command+S 保存更改
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.applyCodeChanges();
            }
        });
        
        // 订阅文件加载事件
        this.eventSubscriptions.push(
            this.eventBus.subscribe(Events.FILE_LOADED, (fileObj) => {
                // 如果当前是代码视图，则更新代码
                if (this.isCodeViewActive) {
                    this.updateCodeEditor(fileObj.content);
                }
            })
        );
        
        // 订阅文件选择事件
        this.eventSubscriptions.push(
            this.eventBus.subscribe(Events.FILE_SELECTED, (fileObj) => {
                if (fileObj && this.isCodeViewActive) {
                    this.updateCodeEditor(fileObj.content);
                }
            })
        );
    }
    
    /**
     * 切换到可视化视图
     */
    switchToVisualView() {
        if (!this.isCodeViewActive) {
            return;
        }
        
        // 只有在代码确实被修改（相对于上次已应用/载入的内容）时才提示应用
        if (this.isCodeModified()) {
            if (confirm('是否应用当前代码更改？')) {
                this.applyCodeChanges();
            }
        } else {
            console.log('切换到可视化视图：代码未修改，跳过应用确认');
        }
        
        // 切换视图
        this.canvasContainer.classList.remove('hidden');
        this.codeEditorContainer.classList.add('hidden');
        
        // 更新按钮状态
        this.visualViewBtn.classList.add('active');
        this.codeViewBtn.classList.remove('active');
        
        // 更新状态
        this.isCodeViewActive = false;
        
        // 发布视图切换事件
        this.eventBus.publish(Events.CODE_VIEW_CHANGED, { isCodeView: false });
    }
    
    /**
     * 切换到代码视图
     */
    switchToCodeView() {
        if (this.isCodeViewActive) {
            return;
        }
        
        // 获取当前 SVG 内容
        const svgElement = document.querySelector('#svg-canvas svg');
        if (!svgElement) {
            this.eventBus.publish(Events.UI_ERROR, {
                title: '无法切换到代码视图',
                message: '没有可编辑的 SVG'
            });
            return;
        }
        
        // 获取 SVG 源码
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgElement);
        
        // 格式化 SVG 源码
        const formattedSvgString = this.formatSVG(svgString);
        
        // 更新代码编辑器
        this.updateCodeEditor(formattedSvgString);
        
        // 切换视图
        this.canvasContainer.classList.add('hidden');
        this.codeEditorContainer.classList.remove('hidden');
        
        // 更新按钮状态
        this.visualViewBtn.classList.remove('active');
        this.codeViewBtn.classList.add('active');
        
        // 更新状态
        this.isCodeViewActive = true;
        
        // 发布视图切换事件
        this.eventBus.publish(Events.CODE_VIEW_CHANGED, { isCodeView: true });
    }
    
    /**
     * 更新代码编辑器内容
     * @param {string} svgString - SVG 字符串
     */
    updateCodeEditor(svgString) {
        // 格式化 SVG
    const formattedSvgString = this.formatSVG(svgString);

    // 更新编辑器内容并记录为已应用状态
    this.svgCodeEditor.value = formattedSvgString;
    this.lastAppliedSvgString = formattedSvgString;
    }
    
    /**
     * 应用代码更改
     */
    applyCodeChanges() {
        try {
            console.log('开始应用代码更改');

            // 获取编辑器内容
            const svgString = this.svgCodeEditor.value;
            console.log('获取到的 SVG 字符串长度:', svgString ? svgString.length : 0);
            
            // 解析 SVG
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
            
            // 检查解析错误
            const parserError = svgDoc.querySelector('parsererror');
            if (parserError) {
                throw new Error('SVG 解析错误');
            }
            
            // 获取 SVG 元素
            const svgElement = svgDoc.documentElement;
            
            // 更新 SVG 画布
            const svgCanvas = document.getElementById('svg-canvas');
            svgCanvas.innerHTML = '';
            svgCanvas.appendChild(svgElement);
            
            // 创建历史快照
            this.eventBus.publish(Events.HISTORY_SNAPSHOT, {
                description: '编辑 SVG 代码',
                content: svgString
            });
            
            // 发布代码更新事件
            this.eventBus.publish(Events.CODE_UPDATED, { content: svgString });

            // 额外发布文件内容变更和 SVG 加载事件，确保其他模块（图层面板、视图）能即时响应
            this.eventBus.publish(Events.FILE_CONTENT_CHANGED, { type: 'code_applied', content: svgString });

            // 发布 SVG_LOADED 以便需要原生 SVG 元素的模块获得最新元素引用
            this.eventBus.publish(Events.SVG_LOADED, { svgElement: svgElement, fileObj: null });

            // 更新已应用的字符串为格式化后的版本，标记为未修改状态
            try {
                this.lastAppliedSvgString = this.formatSVG(svgString);
            } catch (e) {
                this.lastAppliedSvgString = svgString;
            }
        } catch (error) {
            console.error('应用代码更改失败:', error);
            this.eventBus.publish(Events.UI_ERROR, {
                title: '应用代码失败',
                message: error.message
            });
        }
    }

    /**
     * 检查编辑器内容是否相对于上次已应用内容发生修改
     * @returns {boolean}
     */
    isCodeModified() {
        const current = this.formatSVG(this.svgCodeEditor.value || '');
        const last = this.lastAppliedSvgString || '';
        return current.trim() !== (last || '').trim();
    }
    
    /**
     * 格式化 SVG 字符串
     * @param {string} svgString - SVG 字符串
     * @returns {string} 格式化后的 SVG 字符串
     */
    formatSVG(svgString) {
        try {
            // 创建一个 XML 解析器
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgString, 'text/xml');
            
            // 检查解析错误
            const parserError = svgDoc.querySelector('parsererror');
            if (parserError) {
                return svgString; // 如果解析失败，返回原始字符串
            }
            
            // 创建一个 XML 序列化器
            const serializer = new XMLSerializer();
            
            // 格式化 XML 的函数
            const formatXml = (xml) => {
                let formatted = '';
                let indent = '';
                const indentSize = 2;
                
                // 添加换行和缩进
                xml.split(/>\s*</).forEach(node => {
                    if (node.match(/^\/\w/)) {
                        // 结束标签，减少缩进
                        indent = indent.substring(indentSize);
                    }
                    
                    formatted += indent + '<' + node + '>\n';
                    
                    if (node.match(/^<?\w[^>]*[^\/]$/) && !node.startsWith('?')) {
                        // 开始标签，增加缩进
                        indent += ' '.repeat(indentSize);
                    }
                });
                
                return formatted.substring(1, formatted.length - 2);
            };
            
            // 序列化并格式化
            const formattedSvgString = formatXml(serializer.serializeToString(svgDoc));
            
            return formattedSvgString;
        } catch (error) {
            console.error('格式化 SVG 失败:', error);
            return svgString; // 如果格式化失败，返回原始字符串
        }
    }
}
