// main.js - SVG Studio 应用入口
import { FileManager } from './modules/file-manager.js';
import { ViewManager } from './modules/view-manager.js';
import { ElementSelector } from './modules/element-selector.js';
import { PropertyEditor } from './modules/property-editor.js';
import { LayerManager } from './modules/layer-manager.js';
import { ExportManager } from './modules/export-manager.js';
import { HistoryManager } from './modules/history-manager.js';
import { SVGOptimizer } from './modules/svg-optimizer.js';
import { CodeEditor } from './modules/code-editor.js';
import { EventBus } from './utils/event-bus.js';
import { UIManager } from './modules/ui-manager.js';
import { CropManager } from './modules/crop-manager.js';
import { RulerGridManager } from './modules/ruler-grid-manager.js';
import { MeasureTool } from './modules/measure-tool.js';
import { ShortcutManager } from './modules/shortcut-manager.js';
import { ThemeManager } from './modules/theme-manager.js';

/**
 * SVG Studio 主应用
 * 负责协调各个模块之间的交互
 */
class SVGStudio {
    constructor() {
        // 初始化事件总线
        this.eventBus = new EventBus();
        
        // 初始化各个管理器模块
        this.fileManager = new FileManager(this.eventBus);
        this.viewManager = new ViewManager(this.eventBus);
        this.elementSelector = new ElementSelector(this.eventBus);
        this.propertyEditor = new PropertyEditor(this.eventBus);
        this.layerManager = new LayerManager(this.eventBus);
        this.exportManager = new ExportManager(this.eventBus);
        this.historyManager = new HistoryManager(this.eventBus);
        this.svgOptimizer = new SVGOptimizer(this.eventBus);
        this.codeEditor = new CodeEditor(this.eventBus);
        this.uiManager = new UIManager(this.eventBus);
        this.cropManager = new CropManager(this.eventBus);
        this.rulerGridManager = new RulerGridManager(this.eventBus);
        this.measureTool = new MeasureTool(this.eventBus);
        this.shortcutManager = new ShortcutManager(this.eventBus);
        this.themeManager = new ThemeManager(this.eventBus);
        
        // 初始化 UI 和事件监听
        this.init();
    }
    
    /**
     * 初始化应用
     */
    init() {
        // 注册全局拖放区域，允许拖放 SVG 文件到任何地方
        this.setupGlobalDropZone();
        
        // 初始化各个模块
        this.fileManager.init();
        this.viewManager.init();
        this.elementSelector.init();
        this.propertyEditor.init();
        this.layerManager.init();
        this.exportManager.init();
        this.historyManager.init();
        this.svgOptimizer.init();
        this.codeEditor.init();
        this.uiManager.init();
        this.cropManager.init();
        this.rulerGridManager.init();
        this.measureTool.init();
        this.shortcutManager.init();
        this.themeManager.init();
        
        // 显示欢迎界面
        this.showWelcomeScreen();
        
        console.log('SVG Studio 初始化完成');
    }
    
    /**
     * 设置全局拖放区域
     */
    setupGlobalDropZone() {
        const dropZone = document.body;
        
        // 阻止默认行为以允许拖放
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });
        
        // 添加拖放效果
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('drag-active');
            }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('drag-active');
            }, false);
        });
        
        // 处理拖放的文件
        dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.fileManager.loadFiles(files);
            }
        }, false);
    }
    
    /**
     * 显示欢迎界面
     */
    showWelcomeScreen() {
        const canvasContainer = document.getElementById('svg-canvas');
        canvasContainer.innerHTML = `
            <div class="welcome-screen">
                <h2>欢迎使用 SVG Studio</h2>
                <p>拖放 SVG 文件到此处，或点击"导入"按钮开始</p>
                <button id="welcome-import-btn">
                    <i class="fas fa-file-import"></i> 导入 SVG
                </button>
            </div>
        `;
        
        document.getElementById('welcome-import-btn').addEventListener('click', () => {
            document.getElementById('file-input').click();
        });
    }
}

// 当 DOM 加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.svgStudio = new SVGStudio();
});

// 导出给测试使用
export default SVGStudio;
