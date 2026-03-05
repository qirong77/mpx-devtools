/**
 * MPX DevTools - 组件树监控系统
 * 提供组件生命周期追踪和组件树可视化功能
 */

import { printTree, buildTreeStructure, buildSearchTree, printSearchTree } from './utils/tree-printer.js';

/**
 * MPX DevTools 主类
 * @class
 */
class MPXDevTools {
    /**
     * 所有活跃组件实例的集合
     * @type {Set}
     */
    instancesSet = new Set();
    
    /**
     * 构造函数
     */
    constructor() {}
    
    /**
     * 打印组件树
     * @returns {Array} 返回树形结构数组
     */
    printTree() {
        const tree = this.activeInstances;
        printTree(tree);
        return tree;
    }
    
    /**
     * 搜索并打印结果树
     * @param {string} text - 要搜索的文本
     * @returns {Array} 返回搜索结果树
     */
    printSearch(text) {
        const tree = this.search(text);
        if (tree.length === 0) {
            console.log('未找到匹配的结果');
        } else {
            console.log('=== 搜索结果 (\u2713 表示有匹配结果，\u25cb 表示仅显示父路径) ===');
            printSearchTree(tree);
        }
        return tree;
    }
    
    /**
     * 组件挂载时的回调
     * @param {Object} instance - 组件实例
     * @returns {void}
     */
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
    
    /**
     * 在所有组件实例中搜索包含特定文本的数据
     * @param {string} [text=''] - 要搜索的文本
     * @returns {Array} 返回包含搜索结果的树形结构数组
     */
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
                            instanceId: info.id,
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
                                instanceId: info.id,
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
            const id = item.instanceId;
            if (!resultsByInstance[id]) {
                resultsByInstance[id] = {
                    results: []
                };
            }
            // 移除 instanceId，只保留搜索结果相关信息
            resultsByInstance[id].results.push({
                component: item.component,
                value: item.value,
                ref: item.ref
            });
        });
        
        // 使用树形结构，保留完整的父子层级关系
        return buildSearchTree(this.instancesSet, resultsByInstance);
    }
    
    /**
     * 获取所有活跃组件实例的树形结构
     * @returns {Array} 返回树形结构数组
     */
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
        return buildTreeStructure(obj);
    }
    
    /**
     * 组件卸载时的回调
     * @param {Object} instance - 组件实例
     * @returns {void}
     */
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
    
    /**
     * 根据 ID 获取组件实例
     * @param {string} id - 组件实例的 ID
     * @returns {Object|null} 返回组件实例或 null
     */
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

/**
 * 组件信息类
 * @class
 */
class MpxDevtoolsComponentInfo {
    /**
     * 组件实例引用
     * @type {Object|null}
     * @private
     */
    _instance = null;
    
    /**
     * 构造函数
     * @param {Object} instance - 组件实例
     */
    constructor(instance) {
        this._instance = instance;
        this.update();
    }
    
    /**
     * 更新组件信息
     * @returns {void}
     */
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
        printSearch: mpxDevTools.printSearch.bind(mpxDevTools),
        get activeInstances() {
            return mpxDevTools.activeInstances;
        },
    };
}
export default mpxDevTools;
