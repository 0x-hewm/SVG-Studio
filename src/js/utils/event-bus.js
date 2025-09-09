// event-bus.js - 事件总线模块
// 用于应用内不同模块之间的通信

/**
 * 事件总线
 * 提供发布-订阅模式的实现，允许模块之间解耦通信
 */
export class EventBus {
    constructor() {
        this.subscribers = {};
    }
    
    /**
     * 订阅事件
     * @param {string} event - 事件名称
     * @param {Function} callback - 事件回调函数
     * @returns {Function} 取消订阅的函数
     */
    subscribe(event, callback) {
        if (!this.subscribers[event]) {
            this.subscribers[event] = [];
        }
        
        this.subscribers[event].push(callback);
        
        // 返回取消订阅的函数
        return () => {
            this.unsubscribe(event, callback);
        };
    }
    
    /**
     * 取消订阅事件
     * @param {string} event - 事件名称
     * @param {Function} callback - 要取消的事件回调函数
     */
    unsubscribe(event, callback) {
        if (this.subscribers[event]) {
            this.subscribers[event] = this.subscribers[event].filter(
                subscriber => subscriber !== callback
            );
        }
    }
    
    /**
     * 发布事件
     * @param {string} event - 事件名称
     * @param {any} data - 传递给订阅者的数据
     */
    publish(event, data) {
        if (this.subscribers[event]) {
            this.subscribers[event].forEach(callback => {
                callback(data);
            });
        }
    }
}

// 预定义的事件类型
export const Events = {
    // 文件相关事件
    FILE_LOADED: 'file:loaded',           // 文件加载完成
    FILE_SELECTED: 'file:selected',       // 选择文件标签
    FILE_CLOSED: 'file:closed',           // 关闭文件
    FILE_SAVED: 'file:saved',             // 文件保存
    
    // SVG 相关事件
    SVG_LOADED: 'svg:loaded',             // SVG 加载完成
    SVG_CHANGED: 'svg:changed',           // SVG 内容变更
    
    // 视图相关事件
    VIEW_ZOOMED: 'view:zoomed',           // 视图缩放
    VIEW_PANNED: 'view:panned',           // 视图平移
    VIEW_RESET: 'view:reset',             // 视图重置
    VIEW_FIT: 'view:fit',                 // 视图适配
    
    // 元素选择事件
    ELEMENT_SELECTED: 'element:selected', // 选中元素
    ELEMENT_DESELECTED: 'element:deselected', // 取消选择元素
    
    // 属性编辑事件
    PROPERTY_CHANGED: 'property:changed', // 属性变更
    
    // 图层相关事件
    LAYER_VISIBILITY_CHANGED: 'layer:visibility:changed', // 图层可见性变更
    LAYER_RENAMED: 'layer:renamed',       // 图层重命名
    LAYER_DELETED: 'layer:deleted',       // 图层删除
    
    // 导出相关事件
    EXPORT_REQUESTED: 'export:requested', // 请求导出
    EXPORT_COMPLETED: 'export:completed', // 导出完成
    
    // 历史相关事件
    HISTORY_CHANGED: 'history:changed',   // 历史状态变更
    HISTORY_SNAPSHOT: 'history:snapshot', // 历史快照
    HISTORY_UNDO: 'history:undo',         // 撤销操作
    HISTORY_REDO: 'history:redo',         // 重做操作
    
    // SVG 优化事件
    OPTIMIZE_REQUESTED: 'optimize:requested', // 请求优化
    OPTIMIZE_COMPLETED: 'optimize:completed', // 优化完成
    
    // 代码编辑事件
    CODE_VIEW_CHANGED: 'code:view:changed', // 代码视图切换
    CODE_UPDATED: 'code:updated',           // 代码更新
    
    // UI 相关事件
    UI_LOADING: 'ui:loading',             // UI 加载状态
    UI_ERROR: 'ui:error',                 // UI 错误提示
    UI_MODAL: 'ui:modal',                 // UI 模态框
    UI_MODAL_CLOSE: 'ui:modal:close',     // 关闭模态框
    
    // 裁剪相关事件
    CROP_STARTED: 'crop:started',         // 开始裁剪
    CROP_COMPLETED: 'crop:completed',     // 裁剪完成
    CROP_CANCELLED: 'crop:cancelled',     // 取消裁剪
    
    // 标尺和网格相关事件
    GRID_SIZE_CHANGED: 'grid:size:changed',  // 网格大小改变
    GRID_SNAP_CHANGED: 'grid:snap:changed',  // 网格吸附状态改变
    RULERS_VISIBILITY_CHANGED: 'rulers:visibility:changed', // 标尺可见性改变
    
    // 测量工具事件
    MEASURE_STARTED: 'measure:started',    // 开始测量
    MEASURE_COMPLETED: 'measure:completed', // 测量完成
    
    // 主题相关事件
    THEME_TOGGLE: 'theme:toggle',          // 切换主题
    THEME_CHANGED: 'theme:changed',        // 主题已变更
    
    // 快捷键相关事件
    SHOW_SHORTCUTS: 'shortcuts:show'       // 显示快捷键帮助
};
