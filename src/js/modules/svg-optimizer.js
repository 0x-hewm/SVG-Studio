// svg-optimizer.js - SVG 优化模块
import { Events } from '../utils/event-bus.js';

/**
 * SVG 优化器
 * 负责优化 SVG 内容，减小文件大小
 */
export class SVGOptimizer {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.svgoInstance = null; // SVGO 实例
        this.isLoaded = false; // 是否已加载 SVGO

        // DOM 元素
        this.optimizeBtn = document.getElementById('optimize-btn');

        // 订阅事件
        this.eventSubscriptions = [];
    }

    /**
     * 初始化 SVG 优化器
     */
    init() {
        // 如果内置 SVGO 可用，直接使用
        if (typeof window.SVGO !== 'undefined') {
            this.svgoInstance = new window.SVGO();
            this.isLoaded = true;
        } else {
            // 否则尝试加载
            this.loadSVGO();
        }

        // 优化按钮点击事件
        this.optimizeBtn.addEventListener('click', () => {
            this.optimizeSVG();
        });

        
    }

    /**
     * 加载 SVGO
     */
    async loadSVGO() {
        try {
            // 首先检查全局 SVGO 是否已可用(svgo-fallback.js 提供)
            if (typeof window.SVGO !== 'undefined') {
                this.svgoInstance = new window.SVGO();
                this.isLoaded = true;
                return;
            }
            
            // 如果内置实现不可用，尝试从 CDN 加载
            try {
                await this.loadSVGOFromCDN('https://cdn.jsdelivr.net/npm/svgo@2.8.0/dist/svgo.browser.umd.js');
                return;
            } catch (error) {
                console.warn('SVGO 2.x UMD 加载失败，尝试备用版本:', error);
                try {
                    await this.loadSVGOFromCDN('https://cdn.jsdelivr.net/npm/svgo@1.3.2/dist/svgo.js');
                    return;
                } catch (error2) {
                    console.warn('SVGO 1.x 也加载失败，尝试其他 CDN:', error2);
                    try {
                        await this.loadSVGOFromCDN('https://unpkg.com/svgo@1.3.2/dist/svgo.js');
                        return;
                    } catch (error3) {
                        console.warn('所有 SVGO CDN 都加载失败:', error3);
                    }
                }
            }
            
            // 如果仍然没有 SVGO，显示一个警告但不是错误
            console.warn('无法加载 SVGO，将使用基本优化');
        } catch (error) {
            console.error('SVGO 加载过程中出错:', error);
        }
    }

    /**
     * 从 CDN 加载 SVGO
     * @param {string} url - CDN URL
     */
    async loadSVGOFromCDN(url) {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;

        // 等待脚本加载完成
        await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = () => reject(new Error(`无法加载 SVGO: ${url}`));
            document.head.appendChild(script);
        });

        // 等待一小段时间确保脚本完全执行
        await new Promise(resolve => setTimeout(resolve, 200));

        // 检查是否成功加载 - 尝试多种可能的导出方式
        let SVGO = null;
        
        // 检查不同的挂载点和版本
        if (typeof window.SVGO !== 'undefined') {
            SVGO = window.SVGO;
        } else if (typeof window.svgo !== 'undefined') {
            SVGO = window.svgo;
        } else if (typeof window.svgoModule !== 'undefined') {
            SVGO = window.svgoModule.SVGO;
        } else if (typeof window.svgoLib !== 'undefined') {
            SVGO = window.svgoLib;
        }
        
        // 旧版本的 SVGO 可能作为 optimize 函数暴露
        if (!SVGO && typeof window.optimize === 'function') {
            // 创建一个兼容的包装器
            SVGO = function() {
                this.optimize = window.optimize;
            };
        }

        if (!SVGO) {
            throw new Error('SVGO 库加载不完整');
        }

        // 创建 SVGO 实例 - 尝试不同的构造方式
        try {
            // 尝试新版本 API (v2+)
            this.svgoInstance = new SVGO({
                plugins: [
                    {
                        name: 'preset-default',
                        params: {
                            overrides: {
                                removeViewBox: false,
                                removeDimensions: false,
                                removeRasterImages: false
                            }
                        }
                    }
                ]
            });
        } catch (e) {
            console.warn('新版本 SVGO 构造失败，尝试兼容模式:', e);
            try {
                // 尝试旧版本 API (v1.x)
                this.svgoInstance = new SVGO({
                    plugins: [
                        { removeViewBox: false },
                        { removeDimensions: false },
                        { removeRasterImages: false }
                    ]
                });
            } catch (e2) {
                console.warn('旧版本 SVGO 构造也失败，尝试无参数模式:', e2);
                // 最后尝试无参数模式
                this.svgoInstance = new SVGO();
            }
        }

        this.isLoaded = true;
    }

    /**
     * 优化 SVG（带备选方案）
     */
    async optimizeSVG() {
        // 显示加载状态
        this.eventBus.publish(Events.UI_LOADING, { loading: true, message: '正在准备优化...' });

        try {
            // 如果 SVGO 未初始化，先初始化一下
            if (!this.isLoaded) {
                // 尝试创建一个内置 SVGO 实例
                if (typeof window.SVGO !== 'undefined') {
                    this.svgoInstance = new window.SVGO();
                    this.isLoaded = true;
                } else {
                    // 如果内置 SVGO 不可用，尝试加载
                    await this.loadSVGO();
                }
            }

            // 如果 SVGO 已加载，使用 SVGO
            if (this.isLoaded && this.svgoInstance) {
                await this.optimizeWithSVGO();
            } else {
                // 如果 SVGO 仍然不可用，使用基本的优化方法
                await this.optimizeBasic();
            }
        } catch (error) {
            console.error('优化过程中出错:', error);
            // 如果出错，回退到基本优化
            try {
                await this.optimizeBasic();
            } catch (backupError) {
                console.error('基本优化也失败:', backupError);
                this.eventBus.publish(Events.UI_ERROR, {
                    title: '优化失败',
                    message: '所有优化方法都失败，请稍后重试'
                });
            }
        } finally {
            this.eventBus.publish(Events.UI_LOADING, { loading: false });
        }
    }

    /**
     * 使用 SVGO 优化 SVG
     */
    async optimizeWithSVGO() {
        try {
            // 获取 SVG 元素
            const svgElement = document.querySelector('#svg-canvas svg');
            if (!svgElement) {
                throw new Error('没有可优化的 SVG');
            }

            // 获取 SVG 内容
            const serializer = new XMLSerializer();
            const svgString = serializer.serializeToString(svgElement);

            // 获取优化前的大小
            const originalSize = new Blob([svgString]).size;

            // 优化 SVG
            let result;
            try {
                // 使用 SVGO 实例优化
                result = await this.svgoInstance.optimize(svgString);
            } catch (e) {
                console.warn('SVGO 优化方法出错，尝试替代方法:', e);
                
                if (typeof this.svgoInstance.optimize === 'function') {
                    // 尝试不同的参数调用方式
                    try {
                        result = await this.svgoInstance.optimize(svgString, {});
                    } catch (e2) {
                        console.warn('SVGO 备选调用方式也失败:', e2);
                        // 最后的尝试 - 如果我们有直接的全局函数
                        if (typeof window.optimize === 'function') {
                            result = await window.optimize(svgString);
                        } else {
                            throw new Error('所有 SVGO 优化方法都失败');
                        }
                    }
                } else {
                    throw new Error('SVGO 实例不包含 optimize 方法');
                }
            }

            // 处理各种返回格式
            let optimizedSvgString;
            
            if (!result) {
                throw new Error('SVGO 返回空结果');
            } else if (typeof result === 'string') {
                // 直接返回字符串
                optimizedSvgString = result;
            } else if (result.data && typeof result.data === 'string') {
                // 返回 {data: string}
                optimizedSvgString = result.data;
            } else if (result.data && result.data.content && typeof result.data.content === 'string') {
                // 返回 {data: {content: string}}
                optimizedSvgString = result.data.content;
            } else {
                // 未知格式，记录信息并抛出错误
                console.error('未知的 SVGO 返回格式:', result);
                throw new Error('无法解析 SVGO 返回的结果');
            }

            // 验证优化后的SVG能否被解析
            const parser = new DOMParser();
            const doc = parser.parseFromString(optimizedSvgString, 'image/svg+xml');
            if (doc.querySelector('parsererror')) {
                console.error('SVGO 返回的 SVG 无效');
                throw new Error('优化后的 SVG 解析错误');
            }

            // 获取优化后的大小
            const optimizedSize = new Blob([optimizedSvgString]).size;

            // 计算优化比例
            const reduction = (1 - optimizedSize / originalSize) * 100;

            // 应用优化结果
            await this.applyOptimizedSVG(optimizedSvgString, originalSize, optimizedSize, reduction);

        } catch (error) {
            console.error('SVGO 优化失败:', error);
            // 如果 SVGO 优化失败，回退到基本优化
            await this.optimizeBasic();
        }
    }

    /**
     * 基本 SVG 优化（不依赖外部库）
     */
    async optimizeBasic() {
        // 显示加载状态
        this.eventBus.publish(Events.UI_LOADING, { loading: true, message: '正在进行基本优化...' });

        try {
            // 获取 SVG 元素
            const svgElement = document.querySelector('#svg-canvas svg');
            if (!svgElement) {
                throw new Error('没有可优化的 SVG');
            }

            // 获取 SVG 内容
            const serializer = new XMLSerializer();
            const svgString = serializer.serializeToString(svgElement);

            // 获取优化前的大小
            const originalSize = new Blob([svgString]).size;

            // 进行基本的优化
            let optimizedSvgString = svgString;

            // 备份原始SVG
            const originalSvgString = svgString;

            try {
                // 移除注释
                optimizedSvgString = optimizedSvgString.replace(/<!--[\s\S]*?-->/g, '');

                // 移除多余的空白字符
                optimizedSvgString = optimizedSvgString.replace(/>\s+</g, '><');

                // 移除行尾空白
                optimizedSvgString = optimizedSvgString.replace(/[ \t]+$/gm, '');

                // 移除空行
                optimizedSvgString = optimizedSvgString.replace(/\n\s*\n/g, '\n');

                // 压缩属性值
                optimizedSvgString = optimizedSvgString.replace(/="([^"]*)"/g, (match, content) => {
                    // 移除属性值中的多余空格
                    return '="' + content.replace(/\s+/g, ' ').trim() + '"';
                });

                // 移除无用的元数据标签
                optimizedSvgString = optimizedSvgString.replace(/<metadata>[\s\S]*?<\/metadata>/g, '');

                // 验证优化后的SVG能否被解析
                const parser = new DOMParser();
                const doc = parser.parseFromString(optimizedSvgString, 'image/svg+xml');
                if (doc.querySelector('parsererror')) {
                    console.warn('基本优化导致SVG无效，使用原始SVG');
                    optimizedSvgString = originalSvgString;
                }
            } catch (e) {
                console.warn('基本优化过程中出错，使用原始SVG:', e);
                optimizedSvgString = originalSvgString;
            }

            // 获取优化后的大小
            const optimizedSize = new Blob([optimizedSvgString]).size;

            // 计算优化比例
            const reduction = (1 - optimizedSize / originalSize) * 100;

            // 应用优化结果
            await this.applyOptimizedSVG(optimizedSvgString, originalSize, optimizedSize, reduction);

        } catch (error) {
            console.error('基本优化失败:', error);
            this.eventBus.publish(Events.UI_ERROR, {
                title: '优化失败',
                message: error.message
            });
        } finally {
            this.eventBus.publish(Events.UI_LOADING, { loading: false });
        }
    }

    /**
     * 应用优化后的 SVG
     * @param {string} optimizedSvgString - 优化后的 SVG 字符串
     * @param {number} originalSize - 原始大小
     * @param {number} optimizedSize - 优化后大小
     * @param {number} reduction - 优化比例
     */
    async applyOptimizedSVG(optimizedSvgString, originalSize, optimizedSize, reduction) {
        // 解析优化后的 SVG
        const parser = new DOMParser();
        const optimizedSvgDoc = parser.parseFromString(optimizedSvgString, 'image/svg+xml');

        // 检查解析错误
        const parserError = optimizedSvgDoc.querySelector('parsererror');
        if (parserError) {
            throw new Error('优化后的 SVG 解析错误');
        }

        // 获取优化后的 SVG 元素
        const optimizedSvgElement = optimizedSvgDoc.documentElement;

        // 更新 SVG 画布
        const svgCanvas = document.getElementById('svg-canvas');
        svgCanvas.innerHTML = '';
        svgCanvas.appendChild(optimizedSvgElement);

        // 创建历史快照
        this.eventBus.publish(Events.HISTORY_SNAPSHOT, {
            description: 'SVG 优化',
            content: optimizedSvgString
        });

        // 发布优化完成事件
        this.eventBus.publish(Events.OPTIMIZE_COMPLETED, {
            originalSize: originalSize,
            optimizedSize: optimizedSize,
            reduction: reduction.toFixed(2)
        });

        // 显示优化结果
        this.eventBus.publish(Events.UI_MODAL, {
            title: 'SVG 优化完成',
            content: `
                <p>优化前大小: ${this.formatSize(originalSize)}</p>
                <p>优化后大小: ${this.formatSize(optimizedSize)}</p>
                <p>减小比例: ${reduction.toFixed(2)}%</p>
            `
        });

        
    }

    /**
     * 格式化文件大小
     * @param {number} bytes - 字节数
     * @returns {string} 格式化后的文件大小
     */
    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}
