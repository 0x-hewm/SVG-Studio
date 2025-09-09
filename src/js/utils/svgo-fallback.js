/* svgo-fallback.js
 * SVGO 的简易实现，完全不依赖外部库
 */

// 定义一个全局变量，这样 svg-optimizer.js 可以访问
window.SVGO = function() {
  // 构造函数，支持配置参数但不使用
  this.optimize = async function(svgString) {
    
    try {
      // 解析 SVG 字符串为 DOM
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, 'image/svg+xml');
      
      // 检查解析错误
      if (doc.querySelector('parsererror')) {
        console.error('SVG 解析错误');
        return { data: svgString }; // 返回原始字符串
      }
      
      // 获取 SVG 根元素
      const svgElement = doc.documentElement;
      
      // 1. 删除空文本节点
      removeEmptyTextNodes(svgElement);
      
      // 2. 删除元数据
      removeElements(svgElement, 'metadata');
      
      // 3. 删除注释
      removeComments(doc);
      
      // 4. 压缩数字精度 (保留 3 位小数)
      compressNumbers(svgElement);
      
      // 5. 移除不必要的属性
      removeUnnecessaryAttributes(svgElement);
      
      // 6. 简化路径数据
      simplifyPaths(svgElement);
      
      // 7. 清理 ID
      cleanIds(svgElement);
      
      // 8. 合并相似的路径
      // 这部分比较复杂，简化实现
      
      // 9. 折叠无用的组
      collapseGroups(svgElement);
      
      // 10. 去除默认值
      removeDefaultAttributes(svgElement);
      
      // 序列化回字符串
      const serializer = new XMLSerializer();
      let optimizedSvg = serializer.serializeToString(doc);
      
      // 执行字符串级别的优化
      optimizedSvg = optimizedSvg
        // 移除 XML 声明
        .replace(/<\?xml[^>]*\?>\s*/g, '')
        // 移除注释
        .replace(/<!--[\s\S]*?-->/g, '')
        // 移除多余空白
        .replace(/>\s+</g, '><')
        // 移除行尾空白
        .replace(/[ \t]+$/gm, '')
        // 移除空行
        .replace(/\n\s*\n/g, '\n')
        // 压缩属性值中的空白
        .replace(/="([^"]*)"/g, (match, content) => {
          return '="' + content.replace(/\s+/g, ' ').trim() + '"';
        });
      
      return {
        data: optimizedSvg
      };
    } catch (error) {
      console.error('内置 SVGO 优化出错:', error);
      return { data: svgString }; // 发生错误时返回原始字符串
    }
  };
  
  // 辅助函数
  
  // 删除空文本节点
  function removeEmptyTextNodes(element) {
    const walker = document.createTreeWalker(
      element, 
      NodeFilter.SHOW_TEXT,
      { 
        acceptNode: function(node) {
          return node.textContent.trim() === '' ? 
            NodeFilter.FILTER_ACCEPT : 
            NodeFilter.FILTER_REJECT;
        } 
      }
    );
    
    const emptyTextNodes = [];
    let node;
    while (node = walker.nextNode()) {
      emptyTextNodes.push(node);
    }
    
    emptyTextNodes.forEach(node => {
      node.parentNode.removeChild(node);
    });
  }
  
  // 删除指定类型的元素
  function removeElements(element, tagName) {
    const elements = element.getElementsByTagName(tagName);
    while (elements.length > 0) {
      elements[0].parentNode.removeChild(elements[0]);
    }
  }
  
  // 删除注释
  function removeComments(doc) {
    const walker = document.createTreeWalker(
      doc, 
      NodeFilter.SHOW_COMMENT,
      null,
      false
    );
    
    const comments = [];
    let node;
    while (node = walker.nextNode()) {
      comments.push(node);
    }
    
    comments.forEach(comment => {
      comment.parentNode.removeChild(comment);
    });
  }
  
  // 压缩数字精度
  function compressNumbers(element) {
    // 处理属性中的数字
    const allElements = element.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];
      
      for (let j = 0; j < el.attributes.length; j++) {
        const attr = el.attributes[j];
        if (attr.value.match(/[0-9]*\.[0-9]+/)) {
          attr.value = attr.value.replace(/([0-9]*\.[0-9]+)/g, function(match) {
            return parseFloat(parseFloat(match).toFixed(3));
          });
        }
      }
      
      // 特别处理路径数据
      if (el.tagName.toLowerCase() === 'path' && el.hasAttribute('d')) {
        const pathData = el.getAttribute('d');
        const optimizedPathData = pathData.replace(/([0-9]*\.[0-9]+)/g, function(match) {
          return parseFloat(parseFloat(match).toFixed(3));
        });
        el.setAttribute('d', optimizedPathData);
      }
    }
  }
  
  // 移除不必要的属性
  function removeUnnecessaryAttributes(element) {
    const unnecessaryAttrs = [
      'version',
      'xml:space',
      'enable-background',
      'xmlns:xlink', // 除非被使用
      'xmlns:svg',
      'space'
    ];
    
    const allElements = element.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];
      unnecessaryAttrs.forEach(attr => {
        if (el.hasAttribute(attr)) {
          el.removeAttribute(attr);
        }
      });
    }
  }
  
  // 简化路径数据
  function simplifyPaths(element) {
    const paths = element.getElementsByTagName('path');
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      if (path.hasAttribute('d')) {
        let d = path.getAttribute('d');
        
        // 合并相邻的相同命令
        d = d.replace(/([MLHVCSQTAZmlhvcsqtaz])\s*([+-]?(?:\d*\.\d+|\d+)(?:[eE][+-]?\d+)?(?:\s*,\s*|\s+))+/g, (match) => {
          return match.replace(/\s+/g, ' ').replace(/\s,\s/g, ',');
        });
        
        path.setAttribute('d', d.trim());
      }
    }
  }
  
  // 清理 ID
  function cleanIds(element) {
    // 收集所有使用的 ID
    const usedIds = new Set();
    
    // 查找 url(#id) 引用
    const allElements = element.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];
      for (let j = 0; j < el.attributes.length; j++) {
        const attr = el.attributes[j];
        const urlRefs = attr.value.match(/url\(#([^)]+)\)/g);
        if (urlRefs) {
          urlRefs.forEach(ref => {
            const id = ref.match(/url\(#([^)]+)\)/)[1];
            usedIds.add(id);
          });
        }
      }
    }
    
    // 删除未使用的 ID
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];
      if (el.hasAttribute('id') && !usedIds.has(el.getAttribute('id'))) {
        el.removeAttribute('id');
      }
    }
  }
  
  // 折叠无用的组
  function collapseGroups(element) {
    const groups = element.getElementsByTagName('g');
    const groupsArray = Array.from(groups);
    
    for (let i = groupsArray.length - 1; i >= 0; i--) {
      const group = groupsArray[i];
      
      // 如果组内只有一个元素且没有属性，将其替换为其子元素
      if (group.childElementCount === 1 && group.attributes.length === 0) {
        const child = group.firstElementChild;
        group.parentNode.replaceChild(child, group);
      }
      
      // 如果组没有子元素，移除它
      if (group.childElementCount === 0) {
        group.parentNode.removeChild(group);
      }
    }
  }
  
  // 删除默认属性值
  function removeDefaultAttributes(element) {
    const defaultAttrs = {
      'stroke-opacity': '1',
      'stroke-width': '1',
      'fill-opacity': '1',
      'opacity': '1',
      'stroke-dasharray': 'none',
      'stroke-dashoffset': '0',
      'stroke-miterlimit': '4'
    };
    
    const allElements = element.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];
      
      Object.keys(defaultAttrs).forEach(attr => {
        if (el.getAttribute(attr) === defaultAttrs[attr]) {
          el.removeAttribute(attr);
        }
      });
    }
  }
};

