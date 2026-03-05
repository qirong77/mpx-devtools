/**
 * MPX DevTools - 组件树监控系统
 * 提供组件生命周期追踪和组件树可视化功能
 */

class MPXDevTools {
    instancesSet = new Set();
    constructor() {}
    onComponentMounted(instance) {
        try {
            // 防止重复注册（多个生命周期钩子可能都会触发）
            if (this.instancesSet.has(instance) || instance.$MpxDevToolsInfo?.__mpx_file_src__ === "未知组件") {
                return;
            }
            instance.$MpxDevToolsInfo = new MpxDevtoolsComponentInfo(instance);
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
        const obj = results.reduce((acc, item) => {
            if (!acc[item.component]) {
                acc[item.component] = [];
            }
            acc[item.component].push(item);
            delete item.component; 
            return acc;
        }, {});
        return obj;
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
        Object.keys(obj).forEach((key) => {
            if (obj[key].length === 1) {
                obj[key] = obj[key][0];
            }
        });
        return obj;
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
        this.id = Math.random().toString(36).slice(2, 5); // 简单生成一个随机 ID
        this.ref = 'wx.mpxDevTools.getInstanceById("' + this.id + '")';
        this.type = this._instance?.$rawOptions?.__type__ || "未知类型";
        this.__mpx_file_src__ = this.data?.__mpx_file_src__ || this.__mpx_file_src__ || "未知组件";
        this.update();
    }
    update() {
        const instance = this._instance;
        this.props = Object.keys(instance.$rawOptions?.props || {}).reduce((acc, key) => {
            const val = instance?.[key];
            acc[key] = val;
            return acc;
        }, {});
        this.computed = Object.keys(instance.$rawOptions?.computed || {}).reduce((acc, key) => {
            const val = instance?.[key];
            acc[key] = val;
            return acc;
        }, {});
        this.data = Object.keys(instance.$rawOptions?.data || {}).reduce((acc, key) => {
            const val = instance?.[key];
            acc[key] = val;
            return acc;
        }, {});
        this.parentId = instance?.selectOwnerComponent()?.$MpxDevToolsInfo?.id || null;
    }
}
// 创建全局实例
const mpxDevTools = new MPXDevTools();
if (wx && typeof wx === "object") {
    wx.mpxDevTools = {
        search:mpxDevTools.search.bind(mpxDevTools),
        getInstanceById: mpxDevTools.getInstanceById.bind(mpxDevTools),
        get activeInstances() {
            return mpxDevTools.activeInstances;
        },
    };
}
export default mpxDevTools;
