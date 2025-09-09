import { Events } from '../utils/event-bus.js';

/**
 * PDF 导出模块
 */
class ExportPDF {
    constructor(eventBus) {
        this.eventBus = eventBus;
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
    }/**
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

export default ExportPDF;
