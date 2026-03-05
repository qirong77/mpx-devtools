/**
 * MPX DevTools - 组件树监控系统
 * 提供组件生命周期追踪和组件树可视化功能
 */

class MPXDevTools {
    instancesSet = new Set();
    constructor() {}
    
    // 构建树形结构的辅助方法
    _buildTreeStructure(instancesMap) {
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
        
        // 递归构建树形结构
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
    
    // 打印树形结构的辅助方法
    _printTree(tree, indent = '') {
        if (Array.isArray(tree)) {
            tree.forEach(node => {
                console.log(indent + node.path,[node]);
                if (node.children && node.children.length > 0) {
                    this._printTree(node.children, indent + '    ');
                }
            });
        } else {
            console.log(indent + tree.path,[tree]);
            if (tree.children && tree.children.length > 0) {
                this._printTree(tree.children, indent + '    ');
            }
        }
    }
    
    // 打印组件树
    printTree() {
        const tree = this.activeInstances;
        this._printTree(tree);
        return tree;
    }
    
    onComponentMounted(instance) {
        try {
            // 防止重复注册（多个生命周期钩子可能都会触发）
            if (this.instancesSet.has(instance)) {
                return;
            }
            instance.$MpxDevToolsInfo = new MpxDevtoolsComponentInfo(instance);
            if (instance.$MpxDevToolsInfo?.__mpx_file_src__ === "未知组件") {
                return;
            }
            this.instancesSet.add(instance);
        } catch (error) {
            console.error("[mpxDevTools] Error mounting component:", error);
        }
    }
    search(text='') {
        const results = [];
        
        // 如果没有搜索文本，返回空结果
        if (!text) {
            return results;
        }
        
        this.instancesSet.forEach((instance) => {
            // 更新实例信息
            instance.$MpxDevToolsInfo.update();
            const info = instance.$MpxDevToolsInfo;
            const componentPath = info.__mpx_file_src__;
            
            // 递归搜索对象中包含文本的值
            const searchInObject = (obj, prefix = '', visited = new WeakSet()) => {
                // 防止循环引用
                if (obj && typeof obj === 'object') {
                    if (visited.has(obj)) {
                        return;
                    }
                    visited.add(obj);
                }
                
                if (!obj || typeof obj !== 'object') {
                    // 检查原始值是否包含搜索文本
                    const strValue = String(obj);
                    if (strValue.includes(text)) {
                        // 构建完整的访问路径
                        results.push({
                            component: componentPath,
                            value: obj,
                            ref: info.ref + '.$MpxDevToolsInfo.' + prefix
                        });
                    }
                    return;
                }
                
                // 遍历对象的所有属性
                Object.keys(obj).forEach(key => {
                    const value = obj[key];
                    // 如果 key 是数字，使用 [数字] 格式，否则使用 .key 格式
                    const currentPath = prefix 
                        ? (/^\d+$/.test(key) ? `${prefix}[${key}]` : `${prefix}.${key}`)
                        : key;
                    
                    if (typeof value === 'object' && value !== null) {
                        // 递归搜索对象
                        searchInObject(value, currentPath, visited);
                    } else {
                        // 检查值是否包含搜索文本
                        const strValue = String(value);
                        if (strValue.includes(text)) {
                            // 构建完整的访问路径
                            results.push({
                                component: componentPath,
                                value: value,
                                ref: info.ref + '.$MpxDevToolsInfo.' + currentPath
                            });
                        }
                    }
                });
            };
            
            // 在 data、computed、props 中搜索
            searchInObject(info.data, 'data');
            searchInObject(info.computed, 'computed');
            searchInObject(info.props, 'props');
        });
        
        // 按照实例 ID 分组搜索结果
        const resultsByInstance = {};
        results.forEach(item => {
            this.instancesSet.forEach(instance => {
                if (instance.$MpxDevToolsInfo.ref === item.ref.split('.$MpxDevToolsInfo')[0]) {
                    const id = instance.$MpxDevToolsInfo.id;
                    if (!resultsByInstance[id]) {
                        resultsByInstance[id] = {
                            instance: instance.$MpxDevToolsInfo,
                            results: []
                        };
                    }
                    resultsByInstance[id].results.push(item);
                }
            });
        });
        
        // 构建树形结构的映射
        const instancesMap = {};
        Object.keys(resultsByInstance).forEach(id => {
            const data = resultsByInstance[id];
            const key = data.instance.__mpx_file_src__ || '未知组件';
            if (!instancesMap[key]) {
                instancesMap[key] = [];
            }
            instancesMap[key].push(data.instance);
        });
        
        // 使用树形结构，并添加搜索结果
        return this._buildTreeStructureWithData(instancesMap, resultsByInstance);
    }
    
    // 构建带数据的树形结构
    _buildTreeStructureWithData(instancesMap, dataMap) {
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
        
        // 递归构建树形结构
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
    get activeInstances() {
        const obj = {};
        this.instancesSet.forEach((instance) => {
            instance.$MpxDevToolsInfo.update();
            const src = instance.$MpxDevToolsInfo?.__mpx_file_src__ || "未知组件";
            if (obj[src]) {
                obj[src].push(instance.$MpxDevToolsInfo);
            } else {
                obj[src] = [instance.$MpxDevToolsInfo];
            }
        });
        
        // 构建树形结构
        return this._buildTreeStructure(obj);
    }
    onComponentUnmounted(instance) {
        try {
            if (!this.instancesSet.has(instance)) {
                return;
            }

            this.instancesSet.delete(instance);
        } catch (error) {
            console.error("[mpxDevTools] Error unmounting component:", error);
        }
    }
    getInstanceById(id) {
        for (const instance of this.instancesSet) {
            if (instance.$MpxDevToolsInfo?.id === id) {
                return instance;
            }
        }
        console.warn(`[mpxDevTools] No component found with ID: ${id}`);
        return null;
    }
}

class MpxDevtoolsComponentInfo {
    _instance = null;
    constructor(instance) {
        this._instance = instance;
        this.update();
    }
    update() {
        const instance = this._instance;
                this.type = instance?.$rawOptions?.__type__ || "未知类型";
        this.data = instance?.$rawOptions?.data || {};
        this.props = instance?.$rawOptions?.props || {};
        this.computed = Object.keys(instance?.$rawOptions?.computed || {}).reduce((acc, key) => {
            const val = instance?.[key];
            acc[key] = val;
            return acc;
        }, {});
        this.id = Math.random().toString(36).slice(2, 5); // 简单生成一个随机 ID
        this.parentId = instance?.selectOwnerComponent()?.$MpxDevToolsInfo?.id || null;
        this.ref = 'wx.mpxDevTools.getInstanceById("' + this.id + '")';
        // 尝试多种方式获取文件路径
        this.__mpx_file_src__ = this.data?.__mpx_file_src__ || this.__mpx_file_src__ || "未知组件";
    }
}
// 创建全局实例
const mpxDevTools = new MPXDevTools();
if (wx && typeof wx === "object") {
    wx.mpxDevTools = {
        search: mpxDevTools.search.bind(mpxDevTools),
        getInstanceById: mpxDevTools.getInstanceById.bind(mpxDevTools),
        printTree: mpxDevTools.printTree.bind(mpxDevTools),
        get activeInstances() {
            return mpxDevTools.activeInstances;
        },
    };
}
export default mpxDevTools;
