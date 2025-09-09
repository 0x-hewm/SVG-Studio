// shortcuts-button.js - 快捷键按钮处理
import { Events } from './utils/event-bus.js';

// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', () => {
    // 获取快捷键按钮
    const shortcutsBtn = document.getElementById('shortcuts-btn');
    
    // 检查按钮是否存在
    if (shortcutsBtn) {
        // 添加点击事件
        shortcutsBtn.addEventListener('click', () => {
            // 获取事件总线
            const eventBus = window.svgStudio.eventBus;
            
            // 发布显示快捷键事件
            eventBus.publish(Events.SHOW_SHORTCUTS);
        });
    }
});
