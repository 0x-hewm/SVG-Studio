// history-manager.js - 历史管理模块
import { Events } from '../utils/event-bus.js';

/**
 * 历史管理器
 * 负责管理 SVG 编辑的历史记录，支持撤销/重做
 */
export class HistoryManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        
        // 历史状态
        this.history = {}; // 按文件 ID 存储历史记录
        this.currentIndex = {}; // 当前历史索引
        this.maxHistorySize = 50; // 最大历史记录数
        
        // 当前活动文件 ID
        this.activeFileId = null;
        
        // DOM 元素
        this.undoBtn = document.getElementById('undo-btn');
        this.redoBtn = document.getElementById('redo-btn');
        
        // 订阅事件
        this.eventSubscriptions = [];
    }
    
    /**
     * 初始化历史管理器
     */
    init() {
        // 撤销按钮点击事件
        this.undoBtn.addEventListener('click', () => {
            this.undo();
        });
        
        // 重做按钮点击事件
        this.redoBtn.addEventListener('click', () => {
            this.redo();
        });
        
        // 订阅历史快照事件
        this.eventSubscriptions.push(
            this.eventBus.subscribe(Events.HISTORY_SNAPSHOT, (data) => {
                this.addSnapshot(data.fileId, data.description, data.content);
            })
        );
        
        // 订阅文件选择事件
        this.eventSubscriptions.push(
            this.eventBus.subscribe(Events.FILE_SELECTED, (fileObj) => {
                if (fileObj) {
                    this.activeFileId = fileObj.id;
                    this.updateButtons();
                } else {
                    this.activeFileId = null;
                    this.disableButtons();
                }
            })
        );
        
        // 订阅文件关闭事件
        this.eventSubscriptions.push(
            this.eventBus.subscribe(Events.FILE_CLOSED, (fileObj) => {
                // 清理已关闭文件的历史记录
                if (fileObj && fileObj.id in this.history) {
                    delete this.history[fileObj.id];
                    delete this.currentIndex[fileObj.id];
                }
            })
        );
        
        // 添加键盘快捷键
        document.addEventListener('keydown', (e) => {
            // 只有在没有输入框获得焦点时才处理快捷键
            if (document.activeElement.tagName !== 'INPUT' && 
                document.activeElement.tagName !== 'TEXTAREA') {
                
                // 撤销: Ctrl+Z / Command+Z
                if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                    this.undo();
                    e.preventDefault();
                }
                
                // 重做: Ctrl+Y / Command+Y 或 Ctrl+Shift+Z / Command+Shift+Z
                if (((e.ctrlKey || e.metaKey) && e.key === 'y') || 
                    ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
                    this.redo();
                    e.preventDefault();
                }
            }
        });
        
        // 初始禁用按钮
        this.disableButtons();
    }
    
    /**
     * 添加历史快照
     * @param {string} fileId - 文件 ID
     * @param {string} description - 操作描述
     * @param {string} content - SVG 内容
     */
    addSnapshot(fileId, description, content) {
        if (!fileId) {
            fileId = this.activeFileId;
        }
        
        if (!fileId) {
            return;
        }
        
        // 初始化文件的历史记录
        if (!this.history[fileId]) {
            this.history[fileId] = [];
            this.currentIndex[fileId] = -1;
        }
        
        // 获取当前索引
        const index = this.currentIndex[fileId];
        
        // 如果当前索引不是最后一个，则删除之后的历史记录
        if (index < this.history[fileId].length - 1) {
            this.history[fileId] = this.history[fileId].slice(0, index + 1);
        }
        
        // 添加新快照
        this.history[fileId].push({
            description: description,
            content: content,
            timestamp: Date.now()
        });
        
        // 更新当前索引
        this.currentIndex[fileId] = this.history[fileId].length - 1;
        
        // 限制历史记录大小
        if (this.history[fileId].length > this.maxHistorySize) {
            this.history[fileId].shift();
            this.currentIndex[fileId]--;
        }
        
        // 更新按钮状态
        this.updateButtons();
        
        // 发布历史变更事件
        this.eventBus.publish(Events.HISTORY_CHANGED, {
            fileId: fileId,
            canUndo: this.canUndo(),
            canRedo: this.canRedo()
        });
    }
    
    /**
     * 撤销操作
     */
    undo() {
        if (!this.canUndo()) {
            return;
        }
        
        // 获取当前文件的历史记录
        const fileId = this.activeFileId;
        const history = this.history[fileId];
        const index = this.currentIndex[fileId];
        
        // 减少当前索引
        this.currentIndex[fileId]--;
        
        // 获取上一个快照
        const snapshot = history[this.currentIndex[fileId]];
        
        // 更新按钮状态
        this.updateButtons();
        
        // 发布历史撤销事件
        this.eventBus.publish(Events.HISTORY_UNDO, {
            fileId: fileId,
            snapshot: snapshot
        });
        
        // 更新文件内容
        this.updateFileContent(fileId, snapshot.content);
    }
    
    /**
     * 重做操作
     */
    redo() {
        if (!this.canRedo()) {
            return;
        }
        
        // 获取当前文件的历史记录
        const fileId = this.activeFileId;
        const history = this.history[fileId];
        const index = this.currentIndex[fileId];
        
        // 增加当前索引
        this.currentIndex[fileId]++;
        
        // 获取下一个快照
        const snapshot = history[this.currentIndex[fileId]];
        
        // 更新按钮状态
        this.updateButtons();
        
        // 发布历史重做事件
        this.eventBus.publish(Events.HISTORY_REDO, {
            fileId: fileId,
            snapshot: snapshot
        });
        
        // 更新文件内容
        this.updateFileContent(fileId, snapshot.content);
    }
    
    /**
     * 更新文件内容
     * @param {string} fileId - 文件 ID
     * @param {string} content - SVG 内容
     */
    updateFileContent(fileId, content) {
        // 解析 SVG 内容
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(content, 'image/svg+xml');
        
        // 检查解析错误
        const parserError = svgDoc.querySelector('parsererror');
        if (parserError) {
            console.error('SVG 解析错误:', parserError);
            return;
        }
        
        // 获取 SVG 元素
        const svgElement = svgDoc.documentElement;
        
        // 更新 SVG 画布
        const svgCanvas = document.getElementById('svg-canvas');
        svgCanvas.innerHTML = '';
        svgCanvas.appendChild(svgElement);
        
        // 更新文件管理器中的文件内容
        this.eventBus.publish(Events.FILE_SAVED, {
            fileId: fileId,
            content: content
        });
    }
    
    /**
     * 检查是否可以撤销
     * @returns {boolean} 是否可以撤销
     */
    canUndo() {
        if (!this.activeFileId || !this.history[this.activeFileId]) {
            return false;
        }
        
        return this.currentIndex[this.activeFileId] > 0;
    }
    
    /**
     * 检查是否可以重做
     * @returns {boolean} 是否可以重做
     */
    canRedo() {
        if (!this.activeFileId || !this.history[this.activeFileId]) {
            return false;
        }
        
        return this.currentIndex[this.activeFileId] < this.history[this.activeFileId].length - 1;
    }
    
    /**
     * 更新按钮状态
     */
    updateButtons() {
        if (this.canUndo()) {
            this.undoBtn.removeAttribute('disabled');
        } else {
            this.undoBtn.setAttribute('disabled', 'disabled');
        }
        
        if (this.canRedo()) {
            this.redoBtn.removeAttribute('disabled');
        } else {
            this.redoBtn.setAttribute('disabled', 'disabled');
        }
    }
    
    /**
     * 禁用按钮
     */
    disableButtons() {
        this.undoBtn.setAttribute('disabled', 'disabled');
        this.redoBtn.setAttribute('disabled', 'disabled');
    }
    
    /**
     * 获取当前文件的历史记录
     * @returns {Array|null} 历史记录数组或 null
     */
    getCurrentHistory() {
        if (!this.activeFileId || !this.history[this.activeFileId]) {
            return null;
        }
        
        return this.history[this.activeFileId];
    }
    
    /**
     * 获取当前历史索引
     * @returns {number} 当前历史索引
     */
    getCurrentIndex() {
        if (!this.activeFileId || !this.currentIndex[this.activeFileId]) {
            return -1;
        }
        
        return this.currentIndex[this.activeFileId];
    }
}
