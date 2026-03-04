/**
 * MPX DevTools - 组件树监控系统
 * 提供组件生命周期追踪和组件树可视化功能
 */

class MPXDevTools {
    activeInstances = new Set();
    constructor() {
    }
    onComponentMounted(instance) {
        try {
            // 防止重复注册（多个生命周期钩子可能都会触发）
            if (this.activeInstances.has(instance)) {
                console.debug('[mpxDevTools] Component already tracked, skipping');
                return;
            }
            
            instance.__mpxDevToolsInfo = new MpxDevtoolsComponentInfo(instance);
            this.activeInstances.add(instance);
            console.debug('[mpxDevTools] Component mounted:', instance);
        } catch (error) {
            console.error('[mpxDevTools] Error mounting component:', error);
        }
    }
    
    onComponentUnmounted(instance) {
        try {
            if (!this.activeInstances.has(instance)) {
                console.debug('[mpxDevTools] Component not tracked, skipping unmount');
                return;
            }
            
            this.activeInstances.delete(instance);
            console.debug('[mpxDevTools] Component unmounted:', instance);
        } catch (error) {
            console.error('[mpxDevTools] Error unmounting component:', error);
        }
    }
    
    /**
     * 获取指定路径的组件实例
     * @param {string} filePath - 组件文件路径
     * @returns {Array} 匹配的组件实例数组
     */
    getComponentsByPath(filePath) {
        const results = [];
        this.activeInstances.forEach(instance => {
            if (instance.__mpxDevToolsInfo?.__mpx_file_src__?.includes(filePath)) {
                results.push(instance);
            }
        });
        return results;
    }
    
    /**
     * 获取指定类型的组件实例
     * @param {string} type - 组件类型（page/component）
     * @returns {Array} 匹配的组件实例数组
     */
    getComponentsByType(type) {
        const results = [];
        this.activeInstances.forEach(instance => {
            if (instance.__mpxDevToolsInfo?.type === type) {
                results.push(instance);
            }
        });
        return results;
    }
    listActiveComponentsInfo() {
        if (this.activeInstances.size === 0) {
            console.log('⚠️  当前没有活跃的组件实例');
            return {};
        }
        
        const components = {};
        
        try {
            this.activeInstances.forEach(instance => {
                const info = instance.__mpxDevToolsInfo;
                if (!info) {
                    console.warn('[mpxDevTools] Instance missing __mpxDevToolsInfo:', instance);
                    return;
                }
                
                const fileSrc = info.__mpx_file_src__ || '未知组件';
                
                // 按文件路径分组
                if(components[fileSrc]) {
                    components[fileSrc].push(instance);
                } else {
                    components[fileSrc] = [instance];
                }
            });
            
            // 简单打印统计信息
            console.log(`📊 总计: ${this.activeInstances.size} 个活跃实例，${Object.keys(components).length} 种组件类型`);
            console.table(Object.keys(components).map(fileSrc => ({
                '组件路径': fileSrc,
                '实例数量': components[fileSrc].length,
                '类型': components[fileSrc][0]?.__mpxDevToolsInfo?.type || '未知'
            })));
            
        } catch (error) {
            console.error('[mpxDevTools] Error listing components:', error);
        }
        
        return components;
    }
}

// 创建全局实例
const mpxDevTools = new MPXDevTools();
self.mpxDevTools = mpxDevTools;
if (wx && typeof wx === "object") {
    wx.mpxDevTools = mpxDevTools;
}
class MpxDevtoolsComponentInfo {
    constructor(instance) {
        try {
            this.type = instance?.$rawOptions?.__type__ || "未知类型";
            this.data = instance?.$rawOptions?.data || {};
            this.props = instance?.$rawOptions?.props || {};
            this.computed = instance?.$rawOptions?.computed || {};
            
            // 尝试多种方式获取文件路径
            this.__mpx_file_src__ = 
                this.data.__mpx_file_src__ || 
                (typeof this.computed.__mpx_file_src__ === 'function' ? this.computed.__mpx_file_src__() : null) ||
                this.computed.__mpx_file_src__ ||
                "未知组件";
        } catch (error) {
            console.error('[mpxDevTools] Error creating component info:', error);
            this.type = "错误";
            this.data = {};
            this.props = {};
            this.computed = {};
            this.__mpx_file_src__ = "错误组件";
        }
    }
}
// 暂时不需要这个函数，先注释掉
// function findParentComponent(instance) {
//     if (instance.selectOwnerComponent && typeof instance.selectOwnerComponent === "function") {
//         try {
//             const res =  instance.selectOwnerComponent();
//             console.debug('[mpxDevTools] findParentComponent-selectOwnerComponent result:', res,instance);
//             return res;
//         } catch (e) {
//             // 忽略错误
//         }
//     }

//     return null;
// }
export default mpxDevTools;
