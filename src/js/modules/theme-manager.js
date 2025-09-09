// theme-manager.js - 主题管理模块
import { Events } from '../utils/event-bus.js';

/**
 * 主题管理器
 * 负责管理应用的深色/浅色主题切换
 */
export class ThemeManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        
        // 当前主题
        this.currentTheme = localStorage.getItem('theme') || 'light';
        
        // DOM 元素
        this.themeToggleBtn = document.getElementById('theme-toggle-btn');
        
        // 订阅事件
        this.eventSubscriptions = [];
    }
    
    /**
     * 初始化主题管理器
     */
    init() {
        // 应用保存的主题
        this.applyTheme(this.currentTheme);
        
        // 主题切换按钮点击事件
        this.themeToggleBtn.addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // 更新按钮图标
        this.updateButtonIcon();
        
        // 订阅主题切换事件
        this.eventSubscriptions.push(
            this.eventBus.subscribe(Events.THEME_TOGGLE, () => {
                this.toggleTheme();
            })
        );
        
        // 监听系统主题变化
        this.setupSystemThemeListener();
        
        console.log('主题管理器初始化完成');
    }
    
    /**
     * 切换主题
     */
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }
    
    /**
     * 应用主题
     * @param {string} theme - 主题名称 ('light' 或 'dark')
     */
    applyTheme(theme) {
        // 更新当前主题
        this.currentTheme = theme;
        
        // 应用主题类到文档根元素
        document.documentElement.setAttribute('data-theme', theme);
        
        // 保存主题到本地存储
        localStorage.setItem('theme', theme);
        
        // 更新按钮图标
        this.updateButtonIcon();
        
        // 发布主题变更事件
        this.eventBus.publish(Events.THEME_CHANGED, { theme });
    }
    
    /**
     * 更新按钮图标
     */
    updateButtonIcon() {
        const iconElement = this.themeToggleBtn.querySelector('i');
        
        if (this.currentTheme === 'light') {
            iconElement.className = 'fas fa-moon';
            this.themeToggleBtn.setAttribute('title', '切换到深色主题');
        } else {
            iconElement.className = 'fas fa-sun';
            this.themeToggleBtn.setAttribute('title', '切换到浅色主题');
        }
    }
    
    /**
     * 设置系统主题监听
     */
    setupSystemThemeListener() {
        // 如果浏览器支持主题媒体查询
        if (window.matchMedia) {
            const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            // 检查本地存储是否有用户选择的主题
            if (!localStorage.getItem('theme')) {
                // 根据系统主题设置初始主题
                const systemTheme = darkModeMediaQuery.matches ? 'dark' : 'light';
                this.applyTheme(systemTheme);
            }
            
            // 监听系统主题变化
            darkModeMediaQuery.addEventListener('change', (e) => {
                // 只有当用户没有手动设置主题时，才跟随系统主题
                if (!localStorage.getItem('theme')) {
                    const systemTheme = e.matches ? 'dark' : 'light';
                    this.applyTheme(systemTheme);
                }
            });
        }
    }
    
    /**
     * 销毁
     */
    destroy() {
        // 取消事件订阅
        this.eventSubscriptions.forEach(unsub => unsub());
        
        // 移除事件监听
        this.themeToggleBtn.removeEventListener('click', this.toggleTheme);
    }
}
