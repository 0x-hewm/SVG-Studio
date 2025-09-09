// test-color-picker.js - 测试颜色选择器和不透明度控件功能

// 导入依赖模块
import { TestSuite } from '../test-suite.js';

/**
 * 颜色选择器和不透明度控件测试套件
 */
export class ColorPickerTests extends TestSuite {
    constructor() {
        super('颜色选择器和不透明度控件测试');
    }
    
    /**
     * 运行所有测试
     */
    async runTests() {
        this.testColorPickerVisibility();
        this.testColorPickerInteraction();
        this.testOpacityControlsVisibility();
        this.testOpacityControlsInteraction();
        
        this.logResults();
    }
    
    /**
     * 测试颜色选择器是否可见
     */
    testColorPickerVisibility() {
        // 创建临时 SVG 元素并选中它
        this.createTemporaryElement();
        
        // 获取颜色选择器
        const fillColorPicker = document.getElementById('fill-color');
        const strokeColorPicker = document.getElementById('stroke-color');
        
        // 检查颜色选择器是否可见
        this.assert(
            getComputedStyle(fillColorPicker).display !== 'none',
            '填充颜色选择器应该可见'
        );
        
        this.assert(
            getComputedStyle(strokeColorPicker).display !== 'none',
            '描边颜色选择器应该可见'
        );
        
        // 检查颜色选择器尺寸
        this.assert(
            parseInt(getComputedStyle(fillColorPicker).width) >= 30,
            '填充颜色选择器宽度应该足够大'
        );
        
        this.assert(
            parseInt(getComputedStyle(strokeColorPicker).height) >= 20,
            '描边颜色选择器高度应该足够大'
        );
        
        // 清理临时元素
        this.cleanupTemporaryElement();
    }
    
    /**
     * 测试颜色选择器交互
     */
    testColorPickerInteraction() {
        // 创建临时 SVG 元素并选中它
        this.createTemporaryElement();
        
        // 获取颜色选择器及其文本框
        const fillColorPicker = document.getElementById('fill-color');
        const fillColorText = document.getElementById('fill-color-text');
        
        // 模拟更改颜色
        fillColorPicker.value = '#ff0000';
        fillColorPicker.dispatchEvent(new Event('input'));
        
        // 检查文本框是否更新
        this.assert(
            fillColorText.value === '#ff0000',
            '填充颜色文本框应该与颜色选择器同步'
        );
        
        // 模拟通过文本框更改颜色
        fillColorText.value = '#00ff00';
        fillColorText.dispatchEvent(new Event('change'));
        
        // 检查颜色选择器是否更新
        this.assert(
            fillColorPicker.value.toLowerCase() === '#00ff00',
            '填充颜色选择器应该与文本框同步'
        );
        
        // 清理临时元素
        this.cleanupTemporaryElement();
    }
    
    /**
     * 测试不透明度控件是否可见
     */
    testOpacityControlsVisibility() {
        // 创建临时 SVG 元素并选中它
        this.createTemporaryElement();
        
        // 获取不透明度控件
        const fillOpacity = document.getElementById('fill-opacity');
        const strokeOpacity = document.getElementById('stroke-opacity');
        
        // 检查不透明度控件是否可见
        this.assert(
            getComputedStyle(fillOpacity).display !== 'none',
            '填充不透明度控件应该可见'
        );
        
        this.assert(
            getComputedStyle(strokeOpacity).display !== 'none',
            '描边不透明度控件应该可见'
        );
        
        // 检查不透明度控件是否有足够的宽度
        this.assert(
            parseInt(getComputedStyle(fillOpacity).width) >= 50,
            '填充不透明度控件宽度应该足够大'
        );
        
        // 清理临时元素
        this.cleanupTemporaryElement();
    }
    
    /**
     * 测试不透明度控件交互
     */
    testOpacityControlsInteraction() {
        // 创建临时 SVG 元素并选中它
        this.createTemporaryElement();
        
        // 获取不透明度控件及其文本框
        const fillOpacity = document.getElementById('fill-opacity');
        const fillOpacityText = document.getElementById('fill-opacity-text');
        
        // 模拟更改不透明度
        fillOpacity.value = 0.5;
        fillOpacity.dispatchEvent(new Event('input'));
        
        // 检查文本框是否更新
        this.assert(
            parseFloat(fillOpacityText.value) === 0.5,
            '填充不透明度文本框应该与滑块同步'
        );
        
        // 模拟通过文本框更改不透明度
        fillOpacityText.value = 0.75;
        fillOpacityText.dispatchEvent(new Event('change'));
        
        // 检查滑块是否更新
        this.assert(
            parseFloat(fillOpacity.value) === 0.75,
            '填充不透明度滑块应该与文本框同步'
        );
        
        // 清理临时元素
        this.cleanupTemporaryElement();
    }
    
    /**
     * 创建临时 SVG 元素并选中它
     */
    createTemporaryElement() {
        // 创建临时 SVG 元素
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('width', '100');
        svg.setAttribute('height', '100');
        
        const rect = document.createElementNS(svgNS, 'rect');
        rect.setAttribute('x', '10');
        rect.setAttribute('y', '10');
        rect.setAttribute('width', '80');
        rect.setAttribute('height', '80');
        rect.setAttribute('fill', '#3366cc');
        rect.setAttribute('stroke', '#000000');
        rect.setAttribute('id', 'test-rect');
        
        svg.appendChild(rect);
        
        // 将 SVG 添加到临时容器
        const tempContainer = document.createElement('div');
        tempContainer.id = 'temp-test-container';
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.appendChild(svg);
        document.body.appendChild(tempContainer);
        
        // 模拟选中元素
        const event = new CustomEvent('element-selected', {
            detail: {
                element: rect,
                elementInfo: {
                    type: 'rect',
                    id: 'test-rect',
                    className: '',
                    fill: '#3366cc',
                    fillOpacity: 1,
                    stroke: '#000000',
                    strokeWidth: 1,
                    strokeOpacity: 1
                }
            }
        });
        
        document.dispatchEvent(event);
        
        this.tempElement = rect;
        this.tempContainer = tempContainer;
    }
    
    /**
     * 清理临时元素
     */
    cleanupTemporaryElement() {
        if (this.tempContainer) {
            document.body.removeChild(this.tempContainer);
            this.tempContainer = null;
            this.tempElement = null;
        }
    }
}

// 创建测试实例并运行测试
const colorPickerTests = new ColorPickerTests();
colorPickerTests.runTests();
