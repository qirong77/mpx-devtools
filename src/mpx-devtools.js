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
            if (this.instancesSet.has(instance)) {
                return;
            }
            instance.$$$MpxDevToolsInfo = new MpxDevtoolsComponentInfo(instance);
            if (instance.$$$MpxDevToolsInfo?.__mpx_file_src__ === "未知组件") {
                return;
            }
            this.instancesSet.add(instance);
        } catch (error) {
            console.error("[mpxDevTools] Error mounting component:", error);
        }
    }
    get activeInstances() {
        const obj = {};
        this.instancesSet.forEach((instance) => {
            const src = instance.$$$MpxDevToolsInfo?.__mpx_file_src__ || "未知组件";
            if (obj[src]) {
                obj[src].push(instance.$$$MpxDevToolsInfo);
            } else {
                obj[src] = [instance.$$$MpxDevToolsInfo];
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
                console.log("[mpxDevTools] Component not tracked, skipping unmount");
                return;
            }

            this.instancesSet.delete(instance);
        } catch (error) {
            console.error("[mpxDevTools] Error unmounting component:", error);
        }
    }
    getInstanceById(id) {
        for (const instance of this.instancesSet) {
            if (instance.$$$MpxDevToolsInfo?.id === id) {
                return instance;
            }
        }
        console.warn(`[mpxDevTools] No component found with ID: ${id}`);
        return null;
    }
}

class MpxDevtoolsComponentInfo {
    constructor(instance) {
        this.type = instance?.$rawOptions?.__type__ || "未知类型";
        this.data = instance?.$rawOptions?.data || {};
        this.props = instance?.$rawOptions?.props || {};
        this.computed = Object.keys(instance?.$rawOptions?.computed || {}).reduce((acc, key) => {
            const val = instance?.[key];
            acc[key] = val;
            return acc;
        }, {});
        this.id = Math.random().toString(36).slice(2, 5); // 简单生成一个随机 ID
        this.ref = 'wx.mpxDevTools.getInstanceById("' + this.id + '")';
        // 尝试多种方式获取文件路径
        this.__mpx_file_src__ = this.data?.__mpx_file_src__ || this.__mpx_file_src__ || "未知组件";
    }
}
// 创建全局实例
const mpxDevTools = new MPXDevTools();
if (wx && typeof wx === "object") {
    wx.mpxDevTools = mpxDevTools;
}
export default mpxDevTools;
