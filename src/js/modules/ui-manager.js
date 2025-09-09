// ui-manager.js - UI 管理模块
import { Events } from '../utils/event-bus.js';

/**
 * UI 管理器
 * 负责管理全局 UI 元素，如模态框、加载提示等
 */
export class UIManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        
        // DOM 元素
        this.modal = document.getElementById('modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalBody = document.getElementById('modal-body');
        this.closeModal = document.querySelector('.close-modal');
        this.loadingOverlay = document.getElementById('loading-overlay');
        this.loadingMessage = document.getElementById('loading-message');
        
        // 订阅事件
        this.eventSubscriptions = [];
    }
    
    /**
     * 初始化 UI 管理器
     */
    init() {
        // 关闭模态框按钮事件
        this.closeModal.addEventListener('click', () => {
            this.hideModal();
        });
        
        // 点击模态框背景关闭
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });
        
        // ESC 键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('show')) {
                this.hideModal();
            }
        });
        
        // 订阅 UI 错误事件
        this.eventSubscriptions.push(
            this.eventBus.subscribe(Events.UI_ERROR, (data) => {
                this.showErrorModal(data.title, data.message);
            })
        );
        
        // 订阅 UI 模态框事件
        this.eventSubscriptions.push(
            this.eventBus.subscribe(Events.UI_MODAL, (data) => {
                this.showModal(data.title, data.content, data.width, data.onShow, data.closable);
            })
        );
        
        // 订阅 UI 模态框关闭事件
        this.eventSubscriptions.push(
            this.eventBus.subscribe(Events.UI_MODAL_CLOSE, () => {
                this.hideModal();
            })
        );
        
        // 订阅 UI 加载状态事件
        this.eventSubscriptions.push(
            this.eventBus.subscribe(Events.UI_LOADING, (data) => {
                if (data.loading) {
                    this.showLoading(data.message);
                } else {
                    this.hideLoading();
                }
            })
        );
        
        // 订阅导出完成事件
        this.eventSubscriptions.push(
            this.eventBus.subscribe(Events.EXPORT_COMPLETED, (data) => {
                this.showToast(`${data.format.toUpperCase()} 导出成功`);
            })
        );
        
        // 订阅优化完成事件
        this.eventSubscriptions.push(
            this.eventBus.subscribe(Events.OPTIMIZE_COMPLETED, (data) => {
                this.showToast(`SVG 优化完成，减小了 ${data.reduction}%`);
            })
        );
        
    }
    
    /**
     * 显示模态框
     * @param {string} title - 标题
     * @param {string} content - 内容
     * @param {string} [width] - 模态框宽度，如 '500px'
     * @param {Function} [onShow] - 模态框显示后的回调函数
     * @param {boolean} [closable=true] - 是否可关闭
     */
    showModal(title, content, width, onShow, closable = true) {
        this.modalTitle.textContent = title;
        
        // 设置内容：支持 HTMLElement 或 字符串（如果包含 HTML 标签则用 innerHTML，否则作为文本）
        this.modalBody.textContent = '';
        if (content instanceof HTMLElement) {
            this.modalBody.appendChild(content);
        } else if (typeof content === 'string') {
            // 简单检测是否包含 HTML 标签，若包含则使用 innerHTML（适用于内部模板）
            const looksLikeHtml = /<[^>]+>/.test(content);
            if (looksLikeHtml) {
                this.modalBody.innerHTML = content;
            } else {
                this.modalBody.textContent = content;
            }
        } else {
            this.modalBody.appendChild(document.createTextNode(String(content)));
        }
        
        // 设置模态框宽度
        if (width) {
            document.querySelector('.modal-content').style.width = width;
            document.querySelector('.modal-content').style.maxWidth = width;
        } else {
            document.querySelector('.modal-content').style.width = '';
            document.querySelector('.modal-content').style.maxWidth = '';
        }
        
        // 设置是否可关闭
        if (closable === false) {
            this.closeModal.style.display = 'none';
        } else {
            this.closeModal.style.display = '';
        }
        
        this.modal.classList.add('show');
        
        // 执行回调
        if (typeof onShow === 'function') {
            onShow();
        }
    }
    
    /**
     * 隐藏模态框
     */
    hideModal() {
        this.modal.classList.remove('show');
    }
    
    /**
     * 显示错误模态框
     * @param {string} title - 标题
     * @param {string} message - 错误信息
     */
    showErrorModal(title, message) {
        const content = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
            </div>
        `;
        this.showModal(title, content);
    }
    
    /**
     * 显示加载提示
     * @param {string} message - 加载提示信息
     */
    showLoading(message = '处理中...') {
        this.loadingMessage.textContent = message;
        this.loadingOverlay.classList.remove('hidden');
    }
    
    /**
     * 隐藏加载提示
     */
    hideLoading() {
        this.loadingOverlay.classList.add('hidden');
    }
    
    /**
     * 显示临时提示
     * @param {string} message - 提示信息
     * @param {number} duration - 显示时间（毫秒）
     */
    showToast(message, duration = 3000) {
        // 创建 toast 元素
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        
        // 添加到页面
        document.body.appendChild(toast);
        
        // 显示 toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // 设置定时器移除 toast
        setTimeout(() => {
            toast.classList.remove('show');
            
            // 动画结束后移除元素
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, duration);
    }
}
