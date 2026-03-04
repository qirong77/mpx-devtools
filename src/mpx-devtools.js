/**
 * MPX DevTools - 组件树监控系统
 * 提供组件生命周期追踪和组件树可视化功能
 */

class MPXDevTools {
    activeInstances = new Set();
    constructor() {}
    onComponentMounted(instance) {
        try {
            // 防止重复注册（多个生命周期钩子可能都会触发）
            if (this.activeInstances.has(instance)) {
                console.log("[mpxDevTools] Component already tracked, skipping");
                return;
            }

            instance.mpxDevToolsInfo = new MpxDevtoolsComponentInfo(instance);
            this.activeInstances.add(instance);
        } catch (error) {
            console.error("[mpxDevTools] Error mounting component:", error);
        }
    }

    onComponentUnmounted(instance) {
        try {
            if (!this.activeInstances.has(instance)) {
                console.log("[mpxDevTools] Component not tracked, skipping unmount");
                return;
            }

            this.activeInstances.delete(instance);
        } catch (error) {
            console.error("[mpxDevTools] Error unmounting component:", error);
        }
    }
    getInstanceById(id) {
        for (const instance of this.activeInstances) {
            if (instance.mpxDevToolsInfo?.id === id) {
                return instance;
            }
        }
        console.warn(`[mpxDevTools] No component found with ID: ${id}`);
        return null;
    }
    listActiveComponentsInfo() {
        if (this.activeInstances.size === 0) {
            console.log("⚠️  当前没有活跃的组件实例");
            return {};
        }
        const componentsInfo = Array.from(this.activeInstances).map((instance) => {
            const info = {
                id: instance.mpxDevToolsInfo?.__mpx_file_src__ || "未知组件",
                ref:`wx.mpxDevTools.getInstanceById('${instance.mpxDevToolsInfo?.id}')`,
            };
            console.table(info);
            console.log('props',instance.mpxDevToolsInfo.props);
            console.log('\n');
            console.log('data',instance.mpxDevToolsInfo.data);
            console.log('\n');
            console.log('computed',instance.mpxDevToolsInfo.computed);
            console.log('\n');
            return instance.mpxDevToolsInfo;
        });
        return componentsInfo;
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
        this.type = instance?.$rawOptions?.__type__ || "未知类型";
        this.data = instance?.$rawOptions?.data || {};
        this.props = instance?.$rawOptions?.props || {};
        this.computed = Object.keys(instance?.$rawOptions?.computed || {}).reduce((acc, key) => {
            const val = instance?.[key];
            acc[key] =  val
            return acc;
        }, {});
        this.id = Math.random().toString(36).slice(2, 5); // 简单生成一个随机 ID
        // 尝试多种方式获取文件路径
        this.__mpx_file_src__ =
            this.data.__mpx_file_src__ ||
            (typeof this.computed.__mpx_file_src__ === "function" ? this.computed.__mpx_file_src__() : null) ||
            this.computed.__mpx_file_src__ ||
            "未知组件";``
    }
    toJson() {
        const formatObject = (obj) => {
            if (!obj || Object.keys(obj).length === 0) return '{}';
            try {
                return JSON.stringify(obj, null, 2);
            } catch (error) {
                return String(obj);
            }
        };

        return {
            data: formatObject(this.data),
            props: formatObject(this.props),
            computed: formatObject(this.computed),
        };
    }
}
export default mpxDevTools;
