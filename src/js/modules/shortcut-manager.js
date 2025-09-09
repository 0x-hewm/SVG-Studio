// shortcut-manager.js - 键盘快捷键管理模块
import { Events } from '../utils/event-bus.js';

/**
 * 快捷键管理器
 * 负责管理键盘快捷键
 */
export class ShortcutManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        
        // 快捷键定义
        this.shortcuts = [
            // 文件操作
            { key: 'o', ctrl: true, action: 'importFile', description: '导入文件' },
            { key: 's', ctrl: true, action: 'exportSVG', description: '导出 SVG' },
            
            // 编辑操作
            { key: 'z', ctrl: true, action: 'undo', description: '撤销' },
            { key: 'y', ctrl: true, action: 'redo', description: '重做' },
            { key: 'z', ctrl: true, shift: true, action: 'redo', description: '重做' },
            { key: 'Delete', action: 'deleteSelected', description: '删除选中元素' },
            { key: 'Escape', action: 'deselectAll', description: '取消选择' },
            
            // 视图操作
            { key: '0', ctrl: true, action: 'resetView', description: '重置视图' },
            { key: '+', ctrl: true, action: 'zoomIn', description: '放大视图' },
            { key: '=', ctrl: true, action: 'zoomIn', description: '放大视图' }, // 兼容无需按Shift的键盘
            { key: '-', ctrl: true, action: 'zoomOut', description: '缩小视图' },
            { key: 'f', ctrl: true, action: 'fitView', description: '适配视图' },
            
            // 视图切换
            { key: '1', ctrl: true, action: 'visualView', description: '切换到视觉视图' },
            { key: '2', ctrl: true, action: 'codeView', description: '切换到代码视图' },
            
            // 工具切换
            { key: 'r', action: 'toggleRulers', description: '切换标尺' },
            { key: 'g', action: 'toggleGrid', description: '切换网格' },
            { key: 'm', action: 'toggleMeasure', description: '切换测量工具' },
            
            // 其他功能
            { key: 'h', ctrl: true, action: 'showShortcuts', description: '显示快捷键帮助' },
            { key: '/', ctrl: true, action: 'showShortcuts', description: '显示快捷键帮助' },
            { key: 't', ctrl: true, action: 'toggleTheme', description: '切换主题' }
        ];
        
        // 订阅事件
        this.eventSubscriptions = [];
    }
    
    /**
     * 初始化快捷键管理器
     */
    init() {
        // 添加键盘事件监听
        document.addEventListener('keydown', this.handleKeyDown);
        
        // 订阅帮助快捷键事件
        this.eventSubscriptions.push(
            this.eventBus.subscribe(Events.SHOW_SHORTCUTS, () => {
                this.showShortcutsHelp();
            })
        );
        
    }
    
    /**
     * 处理键盘按下事件
     * @param {KeyboardEvent} e - 键盘事件
     */
    handleKeyDown = (e) => {
        // 如果正在编辑文本内容，不处理快捷键
        if (this.isEditingText()) {
            return;
        }
        
        // 查找匹配的快捷键
        for (const shortcut of this.shortcuts) {
            if (this.matchShortcut(e, shortcut)) {
                e.preventDefault();
                this.executeAction(shortcut.action);
                break;
            }
        }
    }
    
    /**
     * 检查是否正在编辑文本内容
     * @returns {boolean} 是否正在编辑文本
     */
    isEditingText() {
        const activeElement = document.activeElement;
        const tagName = activeElement.tagName.toLowerCase();
        
        return (
            tagName === 'input' ||
            tagName === 'textarea' ||
            tagName === 'select' ||
            activeElement.isContentEditable
        );
    }
    
    /**
     * 检查键盘事件是否匹配快捷键
     * @param {KeyboardEvent} e - 键盘事件
     * @param {Object} shortcut - 快捷键定义
     * @returns {boolean} 是否匹配
     */
    matchShortcut(e, shortcut) {
        const key = e.key;
        const ctrl = e.ctrlKey || e.metaKey; // 兼容 macOS 的 Command 键
        const shift = e.shiftKey;
        const alt = e.altKey;
        
        return (
            key.toLowerCase() === shortcut.key.toLowerCase() &&
            (shortcut.ctrl ? ctrl : !ctrl) &&
            (shortcut.shift ? shift : !shift) &&
            (shortcut.alt ? alt : !alt)
        );
    }
    
    /**
     * 执行快捷键对应的操作
     * @param {string} action - 操作名称
     */
    executeAction(action) {
        switch (action) {
            // 文件操作
            case 'importFile':
                document.getElementById('file-input').click();
                break;
            case 'exportSVG':
                this.eventBus.publish(Events.EXPORT_REQUESTED, { format: 'svg' });
                break;
                
            // 编辑操作
            case 'undo':
                this.eventBus.publish(Events.HISTORY_UNDO);
                break;
            case 'redo':
                this.eventBus.publish(Events.HISTORY_REDO);
                break;
            case 'deleteSelected':
                this.eventBus.publish(Events.ELEMENT_DELETE);
                break;
            case 'deselectAll':
                this.eventBus.publish(Events.ELEMENT_DESELECTED);
                break;
                
            // 视图操作
            case 'resetView':
                this.eventBus.publish(Events.VIEW_RESET);
                break;
            case 'zoomIn':
                this.eventBus.publish(Events.VIEW_ZOOMED, { type: 'in' });
                break;
            case 'zoomOut':
                this.eventBus.publish(Events.VIEW_ZOOMED, { type: 'out' });
                break;
            case 'fitView':
                this.eventBus.publish(Events.VIEW_FIT);
                break;
                
            // 视图切换
            case 'visualView':
                document.getElementById('visual-view-btn').click();
                break;
            case 'codeView':
                document.getElementById('code-view-btn').click();
                break;
                
            // 工具切换
            case 'toggleRulers':
                document.getElementById('toggle-rulers-btn').click();
                break;
            case 'toggleGrid':
                document.getElementById('toggle-grid-btn').click();
                break;
            case 'toggleMeasure':
                document.getElementById('measure-btn').click();
                break;
                
            // 其他功能
            case 'showShortcuts':
                this.showShortcutsHelp();
                break;
            case 'toggleTheme':
                this.eventBus.publish(Events.THEME_TOGGLE);
                break;
        }
    }
    
    /**
     * 显示快捷键帮助
     */
    showShortcutsHelp() {
        // 使用 DOM 构建快捷键帮助内容（避免字符串被当作纯文本插入）
        const container = document.createElement('div');
        container.className = 'shortcuts-help';

        const title = document.createElement('h3');
        title.textContent = 'SVG Studio 键盘快捷键';
        container.appendChild(title);

        // 按类别分组
        const categories = {
            '文件操作': this.shortcuts.filter(s => ['importFile', 'exportSVG'].includes(s.action)),
            '编辑操作': this.shortcuts.filter(s => ['undo', 'redo', 'deleteSelected', 'deselectAll'].includes(s.action)),
            '视图操作': this.shortcuts.filter(s => ['resetView', 'zoomIn', 'zoomOut', 'fitView'].includes(s.action)),
            '视图切换': this.shortcuts.filter(s => ['visualView', 'codeView'].includes(s.action)),
            '工具切换': this.shortcuts.filter(s => ['toggleRulers', 'toggleGrid', 'toggleMeasure'].includes(s.action)),
            '其他功能': this.shortcuts.filter(s => ['showShortcuts', 'toggleTheme'].includes(s.action))
        };

        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

        for (const [category, shortcuts] of Object.entries(categories)) {
            if (shortcuts.length === 0) continue;

            const h4 = document.createElement('h4');
            h4.textContent = category;
            container.appendChild(h4);

            const table = document.createElement('table');

            for (const shortcut of shortcuts) {
                const tr = document.createElement('tr');
                const tdKey = document.createElement('td');
                const tdDesc = document.createElement('td');

                // 构建 keyCombo
                const parts = [];
                if (shortcut.ctrl) parts.push(isMac ? '⌘' : 'Ctrl');
                if (shortcut.shift) parts.push(isMac ? '⇧' : 'Shift');
                if (shortcut.alt) parts.push(isMac ? '⌥' : 'Alt');

                // 创建按键展示节点
                const keySpans = parts.map(p => {
                    const span = document.createElement('span');
                    span.className = 'key';
                    span.textContent = p;
                    return span;
                });

                // 添加分隔和最终按键
                const comboFragment = document.createDocumentFragment();
                keySpans.forEach((span, idx) => {
                    comboFragment.appendChild(span);
                    if (idx < keySpans.length) {
                        comboFragment.appendChild(document.createTextNode(' + '));
                    }
                });

                // 最终按键
                const finalKey = document.createElement('span');
                finalKey.className = 'key';
                finalKey.textContent = this.formatKeyName(shortcut.key);
                comboFragment.appendChild(finalKey);

                tdKey.appendChild(comboFragment);
                tdDesc.textContent = shortcut.description;

                tr.appendChild(tdKey);
                tr.appendChild(tdDesc);
                table.appendChild(tr);
            }

            container.appendChild(table);
        }

        const hint = document.createElement('p');
        hint.style.textAlign = 'center';
        hint.style.marginTop = '20px';
        hint.style.fontSize = '12px';
        hint.style.color = 'var(--primary-color)';
        hint.textContent = '提示：按 Ctrl+/ 或 Ctrl+H 随时查看此帮助';
        container.appendChild(hint);

        // 显示模态窗口（传入 HTMLElement，UI 管理器会直接 appendChild）
        this.eventBus.publish(Events.UI_MODAL, {
            title: '键盘快捷键',
            content: container,
            width: '500px'
        });
    }
    
    /**
     * 格式化按键名称
     * @param {string} key - 按键名称
     * @returns {string} 格式化后的按键名称
     */
    formatKeyName(key) {
        // 特殊按键名称映射
        const keyNames = {
            'Delete': '删除',
            'Escape': 'Esc',
            'Control': 'Ctrl',
            'ArrowUp': '↑',
            'ArrowDown': '↓',
            'ArrowLeft': '←',
            'ArrowRight': '→'
        };
        
        return keyNames[key] || key;
    }
    
    /**
     * 销毁
     */
    destroy() {
        // 取消事件订阅
        this.eventSubscriptions.forEach(unsub => unsub());
        
        // 移除事件监听
        document.removeEventListener('keydown', this.handleKeyDown);
    }
}
