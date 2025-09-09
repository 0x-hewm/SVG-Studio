// file-manager.js - 文件管理模块
import { Events } from '../utils/event-bus.js';

/**
 * 文件管理器
 * 负责 SVG 文件的加载、保存和管理
 */
export class FileManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.files = [];
        this.activeFileIndex = -1;
        
        // DOM 元素
        this.fileInput = document.getElementById('file-input');
        this.importBtn = document.getElementById('import-btn');
        this.fileTabs = document.getElementById('file-tabs');
    }
    
    /**
     * 初始化文件管理器
     */
    init() {
        // 导入按钮点击事件
        this.importBtn.addEventListener('click', () => {
            this.fileInput.click();
        });
        
        // 文件选择事件
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.loadFiles(e.target.files);
            }
        });
        
        console.log('文件管理器初始化完成');
    }
    
    /**
     * 加载文件
     * @param {FileList} fileList - 文件列表对象
     */
    loadFiles(fileList) {
        // 显示加载状态
        this.eventBus.publish(Events.UI_LOADING, { loading: true, message: '加载文件中...' });
        
        // 处理每个文件
        Array.from(fileList).forEach(file => {
            // 只处理 SVG 文件
            if (!file.name.toLowerCase().endsWith('.svg')) {
                console.warn(`跳过非 SVG 文件: ${file.name}`);
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const content = e.target.result;
                
                try {
                    // 解析 SVG 内容
                    const parser = new DOMParser();
                    const svgDoc = parser.parseFromString(content, 'image/svg+xml');
                    
                    // 检查解析错误
                    const parserError = svgDoc.querySelector('parsererror');
                    if (parserError) {
                        throw new Error('SVG 解析错误');
                    }
                    
                    // 创建文件对象
                    const fileObj = {
                        id: this.generateFileId(),
                        name: file.name,
                        content: content,
                        svgDoc: svgDoc,
                        originalFile: file
                    };
                    
                    // 添加到文件列表
                    this.files.push(fileObj);
                    
                    // 创建文件标签页
                    this.createFileTab(fileObj);
                    
                    // 设置为活动文件
                    this.setActiveFile(this.files.length - 1);
                    
                    // 发布文件加载事件
                    this.eventBus.publish(Events.FILE_LOADED, fileObj);
                    
                    // 创建历史快照
                    this.eventBus.publish(Events.HISTORY_SNAPSHOT, {
                        fileId: fileObj.id,
                        description: '文件加载',
                        content: content
                    });
                    
                    console.log(`成功加载文件: ${file.name}`);
                } catch (error) {
                    console.error(`加载文件失败: ${file.name}`, error);
                    this.eventBus.publish(Events.UI_ERROR, {
                        title: '文件加载失败',
                        message: `无法加载 ${file.name}: ${error.message}`
                    });
                }
            };
            
            reader.onerror = () => {
                console.error(`读取文件失败: ${file.name}`);
                this.eventBus.publish(Events.UI_ERROR, {
                    title: '文件读取失败',
                    message: `无法读取 ${file.name}`
                });
            };
            
            // 读取文件内容
            reader.readAsText(file);
        });
        
        // 隐藏加载状态
        this.eventBus.publish(Events.UI_LOADING, { loading: false });
        
        // 重置文件输入，允许重复选择同一文件
        this.fileInput.value = '';
    }
    
    /**
     * 创建文件标签页
     * @param {Object} fileObj - 文件对象
     */
    createFileTab(fileObj) {
        const tab = document.createElement('div');
        tab.className = 'file-tab';
        tab.dataset.fileId = fileObj.id;
        tab.innerHTML = `
            <span class="file-tab-name">${fileObj.name}</span>
            <span class="file-tab-close">&times;</span>
        `;
        
        // 点击标签切换文件
        tab.addEventListener('click', (e) => {
            // 如果点击的是关闭按钮，则不触发选择
            if (!e.target.classList.contains('file-tab-close')) {
                const index = this.files.findIndex(f => f.id === fileObj.id);
                if (index !== -1) {
                    this.setActiveFile(index);
                }
            }
        });
        
        // 点击关闭按钮关闭文件
        const closeBtn = tab.querySelector('.file-tab-close');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeFile(fileObj.id);
        });
        
        this.fileTabs.appendChild(tab);
    }
    
    /**
     * 设置活动文件
     * @param {number} index - 文件索引
     */
    setActiveFile(index) {
        if (index < 0 || index >= this.files.length) {
            return;
        }
        
        this.activeFileIndex = index;
        const activeFile = this.files[index];
        
        // 更新标签页状态
        const tabs = this.fileTabs.querySelectorAll('.file-tab');
        tabs.forEach(tab => {
            if (tab.dataset.fileId === activeFile.id) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // 发布文件选择事件
        this.eventBus.publish(Events.FILE_SELECTED, activeFile);
        
        console.log(`切换到文件: ${activeFile.name}`);
    }
    
    /**
     * 关闭文件
     * @param {string} fileId - 文件 ID
     */
    closeFile(fileId) {
        const index = this.files.findIndex(f => f.id === fileId);
        if (index === -1) {
            return;
        }
        
        const fileObj = this.files[index];
        
        // 从文件列表中移除
        this.files.splice(index, 1);
        
        // 移除标签页
        const tab = this.fileTabs.querySelector(`.file-tab[data-file-id="${fileId}"]`);
        if (tab) {
            tab.remove();
        }
        
        // 如果关闭的是当前活动文件，则切换到其他文件
        if (index === this.activeFileIndex) {
            if (this.files.length > 0) {
                // 切换到前一个或后一个文件
                const newIndex = Math.min(index, this.files.length - 1);
                this.setActiveFile(newIndex);
            } else {
                // 没有文件了，重置状态
                this.activeFileIndex = -1;
                this.eventBus.publish(Events.FILE_SELECTED, null);
            }
        } else if (index < this.activeFileIndex) {
            // 如果关闭的文件在活动文件之前，需要调整活动文件索引
            this.activeFileIndex--;
        }
        
        // 发布文件关闭事件
        this.eventBus.publish(Events.FILE_CLOSED, fileObj);
        
        console.log(`关闭文件: ${fileObj.name}`);
    }
    
    /**
     * 获取当前活动文件
     * @returns {Object|null} 活动文件对象或 null
     */
    getActiveFile() {
        if (this.activeFileIndex >= 0 && this.activeFileIndex < this.files.length) {
            return this.files[this.activeFileIndex];
        }
        return null;
    }
    
    /**
     * 更新文件内容
     * @param {string} fileId - 文件 ID
     * @param {string} content - 新的 SVG 内容
     */
    updateFileContent(fileId, content) {
        const index = this.files.findIndex(f => f.id === fileId);
        if (index === -1) {
            return;
        }
        
        try {
            // 解析新的 SVG 内容
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(content, 'image/svg+xml');
            
            // 检查解析错误
            const parserError = svgDoc.querySelector('parsererror');
            if (parserError) {
                throw new Error('SVG 解析错误');
            }
            
            // 更新文件内容和 SVG 文档
            this.files[index].content = content;
            this.files[index].svgDoc = svgDoc;
            
            // 如果是当前活动文件，需要更新显示
            if (index === this.activeFileIndex) {
                this.eventBus.publish(Events.FILE_LOADED, this.files[index]);
            }
            
            console.log(`更新文件内容: ${this.files[index].name}`);
        } catch (error) {
            console.error('更新文件内容失败', error);
            this.eventBus.publish(Events.UI_ERROR, {
                title: '更新文件失败',
                message: `无法更新文件内容: ${error.message}`
            });
        }
    }
    
    /**
     * 生成唯一的文件 ID
     * @returns {string} 文件 ID
     */
    generateFileId() {
        return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
