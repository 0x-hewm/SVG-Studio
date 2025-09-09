// export-manager.js - 导出管理模块

/**
 * 导出管理器
 * 负责 SVG 导出为不同格式的功能
 */
class ExportManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        
        // DOM 元素 - 旧界面元素（保留兼容性）
        this.exportBtn = document.getElementById('export-btn');
        this.exportDropdown = document.getElementById('export-dropdown');
        this.exportScale = document.getElementById('export-scale');
        this.exportBgColor = document.getElementById('export-bg-color');
        this.exportTransparent = document.getElementById('export-transparent');
        
        // DOM 元素 - 新导出对话框
        this.exportDialog = document.getElementById('export-dialog');
        this.exportDialogClose = document.querySelector('.export-dialog-close');
        this.cancelBtn = document.querySelector('.cancel-btn');
        this.exportBtn2 = document.querySelector('.export-btn');
        this.formatButtons = document.querySelectorAll('.export-format-btn');
        this.exportScaleNew = document.getElementById('export-scale-new');
        this.exportScaleValueNew = document.getElementById('export-scale-value-new');
        this.exportBgColorNew = document.getElementById('export-bg-color-new');
        this.exportTransparentNew = document.getElementById('export-transparent-new');
        this.exportQuality = document.getElementById('export-quality');
        this.exportQualityValue = document.getElementById('export-quality-value');
        
        // 当前选择的导出格式
        this.selectedFormat = 'svg';
        
        // 订阅事件
        this.eventSubscriptions = [];
    }
    
    /**
     * 初始化导出管理器
     */
    init() {
        // 点击导出按钮显示新的导出对话框
        this.exportBtn.addEventListener('click', () => {
            this.openExportDialog();
        });
        
        // 关闭导出对话框
        this.exportDialogClose.addEventListener('click', () => {
            this.closeExportDialog();
        });
        
        // 取消按钮关闭对话框
        this.cancelBtn.addEventListener('click', () => {
            this.closeExportDialog();
        });
        
        // 导出按钮点击事件
        this.exportBtn2.addEventListener('click', () => {
            this.exportFile(this.selectedFormat);
            this.closeExportDialog();
        });
        
        // ESC 键关闭对话框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isExportDialogOpen()) {
                this.closeExportDialog();
            }
        });
        
        // 点击对话框外部关闭
        this.exportDialog.addEventListener('click', (e) => {
            if (e.target === this.exportDialog) {
                this.closeExportDialog();
            }
        });
        
        // 监听格式按钮点击事件
        this.formatButtons.forEach(button => {
            button.addEventListener('click', () => {
                // 移除所有按钮的选中状态
                this.formatButtons.forEach(btn => btn.classList.remove('selected'));
                // 添加当前按钮的选中状态
                button.classList.add('selected');
                // 保存选中的格式
                this.selectedFormat = button.dataset.format;
                // 根据格式切换选项显示
                this.updateFormatOptions(this.selectedFormat);
            });
        });
        
        // 监听透明背景复选框
        this.exportTransparentNew.addEventListener('change', () => {
            this.exportBgColorNew.disabled = this.exportTransparentNew.checked;
        });
        
        // 监听缩放滑块变化
        this.exportScaleNew.addEventListener('input', () => {
            const scaleValue = parseFloat(this.exportScaleNew.value).toFixed(1);
            this.exportScaleValueNew.textContent = `${scaleValue}x`;
        });
        
        // 监听质量滑块变化
        this.exportQuality.addEventListener('input', () => {
            const qualityValue = Math.round(parseFloat(this.exportQuality.value) * 100);
            this.exportQualityValue.textContent = `${qualityValue}%`;
        });
        
        // 初始化格式选项显示
        this.updateFormatOptions('svg');
    }
    
    /**
     * 打开导出对话框
     */
    openExportDialog() {
        this.exportDialog.style.display = 'flex';
        setTimeout(() => {
            this.exportDialog.classList.add('show');
        }, 10); // 延迟一小段时间以确保过渡效果正常工作
    }
    
    /**
     * 关闭导出对话框
     */
    closeExportDialog() {
        this.exportDialog.classList.remove('show');
        setTimeout(() => {
            this.exportDialog.style.display = 'none';
        }, 300); // 等待过渡效果完成
    }
    
    /**
     * 检查导出对话框是否打开
     */
    isExportDialogOpen() {
        return this.exportDialog.classList.contains('show');
    }
    
    /**
     * 根据选择的格式更新选项显示
     */
    updateFormatOptions(format) {
        const imageFormatOptions = document.querySelector('.image-format-options');
        
        // 只对图像格式显示质量选项
        if (['png', 'jpeg', 'webp'].includes(format)) {
            imageFormatOptions.style.display = 'block';
        } else {
            imageFormatOptions.style.display = 'none';
        }
        
        // 对于 SVG 格式，禁用背景色和透明背景选项
        if (format === 'svg') {
            this.exportBgColorNew.disabled = true;
            this.exportTransparentNew.disabled = true;
        } else {
            this.exportBgColorNew.disabled = this.exportTransparentNew.checked;
            this.exportTransparentNew.disabled = false;
        }
    }
    
    /**
     * 切换旧导出下拉菜单显示状态（兼容旧版，已不推荐使用）
     */
    toggleExportDropdown() {
        // 直接调用新的导出对话框
        this.openExportDialog();
    }
    
    /**
     * 导出文件
     * @param {string|SVGElement} formatOrElement - 导出格式 (svg, png, jpeg, webp) 或 SVG 元素
     * @param {Object} [options] - 导出选项 (当第一个参数是 SVG 元素时使用)
     */
    exportFile(formatOrElement, options = {}) {
        // 兼容两种调用方式
        let format, svgElement, scale, bgColor, quality, fileName;
        
        if (typeof formatOrElement === 'string') {
            // 旧的调用方式：exportFile('png')
            format = formatOrElement;
            svgElement = document.querySelector('#svg-canvas svg');
            scale = parseFloat(this.exportScaleNew.value) || 1;
            const useTransparentBg = this.exportTransparentNew.checked;
            bgColor = useTransparentBg ? 'transparent' : this.exportBgColorNew.value;
            quality = parseFloat(this.exportQuality.value) || 0.9;
            fileName = `image.${format}`;
        } else {
            // 新的调用方式：exportFile(svgElement, {format: 'png', fileName: 'test.png'})
            svgElement = formatOrElement;
            format = options.format;
            scale = options.scale || 1;
            bgColor = options.background || 'transparent';
            quality = options.quality || 0.9;
            fileName = options.fileName || `image.${format}`;
        }
        
        // 获取当前活动文件
        this.eventBus.publish('UI_LOADING', { loading: true, message: `正在导出 ${format.toUpperCase()} 文件...` });
        
        try {
            if (!svgElement) {
                throw new Error('没有可导出的 SVG');
            }
            
            // 根据格式导出
            switch (format.toLowerCase()) {
                case 'svg':
                    this.exportAsSVG(svgElement, fileName);
                    break;
                case 'png':
                    this.exportAsImage(svgElement, 'image/png', scale, bgColor, quality, fileName);
                    break;
                case 'jpeg':
                case 'jpg':
                    this.exportAsImage(svgElement, 'image/jpeg', scale, bgColor || '#ffffff', quality, fileName);
                    break;
                case 'webp':
                    this.exportAsImage(svgElement, 'image/webp', scale, bgColor, quality, fileName);
                    break;
                case 'pdf':
                    this.exportAsPDF(svgElement, scale, bgColor, fileName);
                    break;
                default:
                    throw new Error(`不支持的导出格式: ${format}`);
            }
            
            // 发布导出完成事件
            this.eventBus.publish('EXPORT_COMPLETED', { format: format, fileName: fileName });
            
        } catch (error) {
            console.error('导出失败:', error);
            this.eventBus.publish('UI_ERROR', {
                title: '导出失败',
                message: error.message
            });
            throw error; // 重新抛出错误以供批量导出处理
        } finally {
            this.eventBus.publish('UI_LOADING', { loading: false });
        }
    }
    
    /**
     * 导出为 SVG 文件
     * @param {SVGElement} svgElement - SVG 元素
     * @param {string} fileName - 文件名
     */
    exportAsSVG(svgElement, fileName = 'image.svg') {
        // 克隆 SVG 元素，避免修改原始元素
        const clonedSvg = svgElement.cloneNode(true);
        
        // 序列化 SVG 为字符串
        const serializer = new XMLSerializer();
        let svgString = serializer.serializeToString(clonedSvg);
        
        // 添加 XML 声明和 DOCTYPE
        svgString = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' +
                   '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
                   svgString;
        
        // 创建 Blob 对象
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        
        // 下载文件
        this.downloadFile(blob, fileName);
    }
    
    /**
     * 导出为图像文件 (PNG, JPEG, WebP)
     * @param {SVGElement} svgElement - SVG 元素
     * @param {string} mimeType - MIME 类型
     * @param {number} scale - 缩放比例
     * @param {string} bgColor - 背景颜色
     * @param {number} quality - 图像质量 (0-1)
     */
    exportAsImage(svgElement, mimeType, scale, bgColor, quality = 0.95, fileName = null) {
        // 克隆 SVG 元素，避免修改原始元素
        const clonedSvg = svgElement.cloneNode(true);
        
        // 获取 SVG 尺寸
        let width = svgElement.getAttribute('width');
        let height = svgElement.getAttribute('height');
        
        // 如果没有宽高属性，尝试从 viewBox 获取
        if (!width || !height) {
            const viewBox = svgElement.getAttribute('viewBox');
            if (viewBox) {
                const [, , viewBoxWidth, viewBoxHeight] = viewBox.split(/\s+/).map(Number);
                width = width || viewBoxWidth;
                height = height || viewBoxHeight;
            }
        }
        
        width = parseFloat(width) || 300;
        height = parseFloat(height) || 150;
        
        // 应用缩放
        const scaledWidth = width * scale;
        const scaledHeight = height * scale;
        
        // 序列化 SVG 为字符串
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(clonedSvg);
        
        // 编码 SVG 为 data URL
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        
        // 创建图像
        const image = new Image();
        image.onload = () => {
            // 创建画布
            const canvas = document.createElement('canvas');
            canvas.width = scaledWidth;
            canvas.height = scaledHeight;
            
            // 获取绘图上下文
            const ctx = canvas.getContext('2d');
            
            // 设置背景色
            if (bgColor && bgColor !== 'transparent') {
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            
            // 绘制 SVG
            ctx.drawImage(image, 0, 0, scaledWidth, scaledHeight);
            
            // 转换为 Blob
            canvas.toBlob((blob) => {
                // 释放 URL 对象
                URL.revokeObjectURL(svgUrl);
                
                // 确定文件名
                let finalFileName = fileName;
                if (!finalFileName) {
                    // 获取文件扩展名
                    let ext = 'png';
                    if (mimeType === 'image/jpeg') ext = 'jpg';
                    if (mimeType === 'image/webp') ext = 'webp';
                    finalFileName = `image.${ext}`;
                }
                
                // 下载文件
                this.downloadFile(blob, finalFileName);
            }, mimeType, quality);
        };
        
        // 设置图像源
        image.src = svgUrl;
    }
    
    /**
     * 下载文件
     * @param {Blob} blob - Blob 对象
     * @param {string} filename - 文件名
     */
    downloadFile(blob, filename) {
        // 创建下载链接
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        
        // 触发下载
        document.body.appendChild(link);
        link.click();
        
        // 清理
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
    }
    
    /**
     * 导出为 PDF 文件
     * @param {SVGElement} svgElement - SVG 元素
     * @param {number} scale - 缩放比例
     * @param {string} bgColor - 背景颜色
     */
    exportAsPDF(svgElement, scale, bgColor) {
        // 加载 jsPDF 库
        this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
            .then(() => {
                // 获取 SVG 尺寸
                let width = parseFloat(svgElement.getAttribute('width')) || 300;
                let height = parseFloat(svgElement.getAttribute('height')) || 150;
                
                // 应用缩放
                const scaledWidth = width * scale;
                const scaledHeight = height * scale;
                
                // 序列化 SVG 为字符串
                const serializer = new XMLSerializer();
                const svgString = serializer.serializeToString(svgElement);
                
                // 编码 SVG 为 data URL
                const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
                const svgUrl = URL.createObjectURL(svgBlob);
                
                // 创建图像
                const image = new Image();
                image.onload = () => {
                    // 创建画布
                    const canvas = document.createElement('canvas');
                    canvas.width = scaledWidth;
                    canvas.height = scaledHeight;
                    
                    // 获取绘图上下文
                    const ctx = canvas.getContext('2d');
                    
                    // 设置背景色
                    if (bgColor && bgColor !== 'transparent') {
                        ctx.fillStyle = bgColor;
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                    
                    // 绘制 SVG
                    ctx.drawImage(image, 0, 0, scaledWidth, scaledHeight);
                    
                    // 创建 PDF
                    const { jsPDF } = window.jspdf;
                    
                    // 确定 PDF 页面尺寸
                    // 将像素转换为毫米 (假设 96 DPI)
                    const pdfWidth = scaledWidth * 0.264583;
                    const pdfHeight = scaledHeight * 0.264583;
                    
                    // 创建 PDF 文档
                    const pdf = new jsPDF({
                        orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
                        unit: 'mm',
                        format: [pdfWidth, pdfHeight]
                    });
                    
                    // 将画布内容添加到 PDF
                    const imgData = canvas.toDataURL('image/jpeg', 1.0);
                    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                    
                    // 保存 PDF
                    pdf.save('image.pdf');
                    
                    // 释放 URL 对象
                    URL.revokeObjectURL(svgUrl);
                };
                
                // 设置图像源
                image.src = svgUrl;
            })
            .catch(error => {
                console.error('PDF 导出失败:', error);
                this.eventBus.publish(Events.UI_ERROR, {
                    title: 'PDF 导出失败',
                    message: '加载 PDF 库失败，请检查网络连接'
                });
            });
    }

    /**
     * 加载外部脚本
     * @param {string} url - 脚本 URL
     * @returns {Promise} Promise 对象
     */
    loadScript(url) {
        return new Promise((resolve, reject) => {
            // 检查脚本是否已加载
            if (document.querySelector(`script[src="${url}"]`)) {
                resolve();
                return;
            }
            
            // 创建脚本元素
            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            
            // 脚本加载成功
            script.onload = () => resolve();
            
            // 脚本加载失败
            script.onerror = () => reject(new Error(`无法加载脚本: ${url}`));
            
            // 添加到文档
            document.head.appendChild(script);
        });
    }
}

export { ExportManager };
