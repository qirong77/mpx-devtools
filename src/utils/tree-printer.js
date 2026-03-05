/**
 * 树形结构打印工具
 * @module tree-printer
 */

/**
 * 打印树形结构的辅助方法
 * @param {Object|Array} tree - 树形结构对象或数组
 * @param {string} [indent=''] - 当前缩进字符串
 * @returns {void}
 */
export function printTree(tree, indent = '') {
    if (Array.isArray(tree)) {
        tree.forEach(node => {
            console.log(indent + node.path, [node]);
            if (node.children && node.children.length > 0) {
                printTree(node.children, indent + '    ');
            }
        });
    } else {
        console.log(indent + tree.path, [tree]);
        if (tree.children && tree.children.length > 0) {
            printTree(tree.children, indent + '    ');
        }
    }
}

/**
 * 构建树形结构
 * @param {Object} instancesMap - 实例映射对象，key 为组件路径，value 为实例或实例数组
 * @returns {Array} 返回树形结构数组
 */
export function buildTreeStructure(instancesMap) {
    const allInstances = [];
    const idToInstance = new Map();
    
    // 收集所有实例，并建立 id 到实例的映射
    Object.keys(instancesMap).forEach(key => {
        const instances = Array.isArray(instancesMap[key]) ? instancesMap[key] : [instancesMap[key]];
        instances.forEach(instance => {
            allInstances.push({ key, instance });
            idToInstance.set(instance.id, instance);
        });
    });
    
    // 找出所有根节点（没有父节点的）
    const roots = allInstances.filter(item => !item.instance.parentId);
    
    /**
     * 递归构建树形节点
     * @param {Object} instance - 组件实例
     * @returns {Object} 树形节点对象
     */
    const buildTreeNode = (instance) => {
        const node = {
            path: instance.__mpx_file_src__ || '未知组件',
            value: instance,
            children: []
        };
        
        // 查找子节点
        const children = allInstances.filter(item => item.instance.parentId === instance.id);
        children.forEach((child) => {
            node.children.push(buildTreeNode(child.instance));
        });
        
        return node;
    };
    
    // 构建所有根节点的树
    const result = [];
    roots.forEach(root => {
        result.push(buildTreeNode(root.instance));
    });
    
    // 处理可能的孤立节点（有 parentId 但找不到父节点）
    const processedIds = new Set();
    const collectIds = (node) => {
        processedIds.add(node.value.id);
        node.children.forEach(child => collectIds(child));
    };
    result.forEach(root => collectIds(root));
    
    allInstances.forEach(item => {
        if (!processedIds.has(item.instance.id)) {
            result.push({
                path: item.instance.__mpx_file_src__ || '未知组件',
                value: item.instance,
                children: []
            });
        }
    });
    
    return result;
}

/**
 * 构建带数据的树形结构
 * @param {Object} instancesMap - 实例映射对象
 * @param {Object} dataMap - 数据映射对象，key 为实例 id，value 为关联的数据
 * @returns {Array} 返回树形结构数组
 */
export function buildTreeStructureWithData(instancesMap, dataMap) {
    const allInstances = [];
    const idToInstance = new Map();
    
    // 收集所有实例
    Object.keys(instancesMap).forEach(key => {
        const instances = Array.isArray(instancesMap[key]) ? instancesMap[key] : [instancesMap[key]];
        instances.forEach(instance => {
            allInstances.push({ key, instance });
            idToInstance.set(instance.id, instance);
        });
    });
    
    // 找出所有根节点
    const roots = allInstances.filter(item => !item.instance.parentId);
    
    /**
     * 递归构建树形节点
     * @param {Object} instance - 组件实例
     * @returns {Object} 树形节点对象
     */
    const buildTreeNode = (instance) => {
        const node = {
            path: instance.__mpx_file_src__ || '未知组件',
            value: dataMap[instance.id]?.results || instance,
            children: []
        };
        
        // 查找子节点
        const children = allInstances.filter(item => item.instance.parentId === instance.id);
        children.forEach((child) => {
            node.children.push(buildTreeNode(child.instance));
        });
        
        return node;
    };
    
    // 构建所有根节点的树
    const result = [];
    roots.forEach(root => {
        result.push(buildTreeNode(root.instance));
    });
    
    // 处理孤立节点
    const processedIds = new Set();
    const collectIds = (node) => {
        if (node.value && typeof node.value === 'object' && node.value.id) {
            processedIds.add(node.value.id);
        }
        node.children.forEach(child => collectIds(child));
    };
    result.forEach(root => collectIds(root));
    
    allInstances.forEach(item => {
        if (!processedIds.has(item.instance.id)) {
            result.push({
                path: item.instance.__mpx_file_src__ || '未知组件',
                value: dataMap[item.instance.id]?.results || item.instance,
                children: []
            });
        }
    });
    
    return result;
}

/**
 * 构建搜索结果的树形结构（保留完整的父子层级关系）
 * @param {Set} allInstancesSet - 所有组件实例的集合
 * @param {Object} resultsByInstance - 按实例 ID 分组的搜索结果
 * @returns {Array} 返回树形结构数组
 */
export function buildSearchTree(allInstancesSet, resultsByInstance) {
    // 收集所有有搜索结果的实例 ID
    const idsWithResults = new Set(Object.keys(resultsByInstance));
    
    // 收集所有需要显示的实例ID（包括祖先节点）
    const idsToInclude = new Set();
    
    // 为每个有结果的实例，追溯所有祖先节点
    const addAncestors = (instance) => {
        if (!instance || idsToInclude.has(instance.$MpxDevToolsInfo.id)) {
            return;
        }
        
        idsToInclude.add(instance.$MpxDevToolsInfo.id);
        
        // 递归添加父节点
        const parentId = instance.$MpxDevToolsInfo.parentId;
        if (parentId) {
            // 查找父实例
            for (const inst of allInstancesSet) {
                if (inst.$MpxDevToolsInfo.id === parentId) {
                    addAncestors(inst);
                    break;
                }
            }
        }
    };
    
    // 添加所有有搜索结果的实例及其祖先
    allInstancesSet.forEach(instance => {
        if (idsWithResults.has(instance.$MpxDevToolsInfo.id)) {
            addAncestors(instance);
        }
    });
    
    // 构建树形结构
    const instanceMap = new Map();
    allInstancesSet.forEach(instance => {
        if (idsToInclude.has(instance.$MpxDevToolsInfo.id)) {
            instanceMap.set(instance.$MpxDevToolsInfo.id, instance.$MpxDevToolsInfo);
        }
    });
    
    // 找出根节点
    const roots = [];
    instanceMap.forEach(instance => {
        if (!instance.parentId || !instanceMap.has(instance.parentId)) {
            roots.push(instance);
        }
    });
    
    /**
     * 递归构建树形节点
     * @param {Object} instance - 组件实例
     * @returns {Object|null} 树形节点对象
     */
    const buildTreeNode = (instance) => {
        const hasResults = idsWithResults.has(instance.id);
        const node = {
            path: instance.__mpx_file_src__ || '未知组件',
            value: hasResults ? resultsByInstance[instance.id].results : null,
            children: []
        };
        
        // 查找子节点
        instanceMap.forEach(childInstance => {
            if (childInstance.parentId === instance.id) {
                const childNode = buildTreeNode(childInstance);
                if (childNode) {
                    node.children.push(childNode);
                }
            }
        });
        
        return node;
    };
    
    // 构建所有根节点的树
    const result = [];
    roots.forEach(root => {
        const node = buildTreeNode(root);
        if (node) {
            result.push(node);
        }
    });
    
    return result;
}

/**
 * 打印搜索结果的树形结构
 * @param {Array} tree - 搜索结果树形结构数组
 * @param {string} [indent=''] - 当前缩进字符串
 * @returns {void}
 */
export function printSearchTree(tree, indent = '') {
    if (Array.isArray(tree)) {
        tree.forEach(node => {
            const hasResults = node.value !== null;
            const marker = hasResults ? '✓' : '○';
            console.log(indent + marker + ' ' + node.path, hasResults ? [node] : '');
            if (node.children && node.children.length > 0) {
                printSearchTree(node.children, indent + '    ');
            }
        });
    } else {
        const hasResults = tree.value !== null;
        const marker = hasResults ? '✓' : '○';
        console.log(indent + marker + ' ' + tree.path, hasResults ? [tree] : '');
        if (tree.children && tree.children.length > 0) {
            printSearchTree(tree.children, indent + '    ');
        }
    }
}
