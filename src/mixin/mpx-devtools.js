/**
 * MPX DevTools - 组件树监控系统
 * 提供组件生命周期追踪和组件树可视化功能
 */

import mpx from "@mpxjs/core";

class MPXDevTools {
    constructor() {
        this.instanceMapSet = new WeakSet(); // 存储组件实例和其信息的映射
        this.instanceMap = {};
        this.rootInstance = []; // 根组件实例
        this.exposeGlobalMethods();
    }
    onComponentMounted(instance) {
        this.instanceMapSet.add(instance);
        instance.MpxDevtoolsComponentInfo = new MpxDevtoolsComponentInfo(instance);
        const src = instance.MpxDevtoolsComponentInfo.__mpx_file_src__ || "未知组件";
        this.instanceMap[src] = instance;
        const parent = findParentComponent(instance);
        if (parent) {
            // 将当前实例添加到父组件的子组件列表中
            if (parent.mpxDevToolsChildren) {
                parent.mpxDevToolsChildren.push(instance);
            } else {
                parent.mpxDevToolsChildren = [instance];
            }
        } else {
            this.rootInstance.push(instance);
        }
    }
    onComponentUnmounted(instance) {
        if (this.instanceMapSet.has(instance)) {
            this.instanceMapSet.delete(instance);
            // 从父组件的子组件列表中移除
            const parent = findParentComponent(instance);
            if (parent && parent.mpxDevToolsChildren) {
                const index = parent.mpxDevToolsChildren.indexOf(instance);
                if (index > -1) {
                    parent.mpxDevToolsChildren.splice(index, 1);
                }
            }

            // 从根实例列表中移除（如果存在）
            const rootIndex = this.rootInstance.indexOf(instance);
            if (rootIndex > -1) {
                this.rootInstance.splice(rootIndex, 1);
            }

            // 清理子组件关系
            if (instance.mpxDevToolsChildren) {
                delete instance.mpxDevToolsChildren;
            }

            // 清理组件信息
            if (instance.MpxDevtoolsComponentInfo) {
                delete instance.MpxDevtoolsComponentInfo;
            }
        }
    }
    exposeGlobalMethods() {
        const that = this;
        mpx.mpxDevTools = {
            getinstanceMapSet: () => this.instanceMapSet,
            getRoot: () => {
                const roots = [...new Set(this.rootInstance)].filter((inst) => {
                    const state = inst.__mpxProxy?.proxy?.__mpxProxy?.state;
                    if (["__unmounted__"].includes(state)) {
                        return false;
                    }
                    return true;
                });
                this.rootInstance = roots;
                return roots;
            },
            getInstanceBySrc(src = "") {
                const instance = that.instanceMap[src] || null;
                if (instance) {
                    console.log('[mpxDevTools] 找到了组件实例:', src, instance);
                    return {
                        props: instance?.$rawOptions?.props || "{}",
                        type: instance?.$rawOptions?.__type__ || "未知类型",
                        data: instance?.$rawOptions?.data || {},
                        computed: instance?.$rawOptions?.computed || {},
                        instance,
                    };
                }
                const canUseSources = Object.keys(that.instanceMap);
                return `[mpxDevTools] 未找到组件实例: ${src}。可用的组件源文件有: ` + canUseSources.join(', ');
            },
            getInstanceTreeRoot() {
                const roots = mpx.mpxDevTools.getRoot();
                const node = createInstanceTree(roots[roots.length - 1], 30);
                return node;
            },
        };
        self.mpx = mpx;
        self.mpxDevTools = mpx.mpxDevTools;
        if (wx && typeof wx === "object") {
            wx.mpxDevTools = mpx.mpxDevTools;
            wx.mpx = mpx;
        }
    }
}

// 创建全局实例
const mpxDevTools = new MPXDevTools();
class MpxDevtoolsComponentInfo {
    constructor(instance) {
        this.type = instance?.$rawOptions?.__type__ || "未知类型";
        this.data = instance?.$rawOptions?.data || {};
        this.props = instance?.$rawOptions?.props || {};
        this.computed = instance?.$rawOptions?.computed || {};
        this.__mpx_file_src__ = this.data.__mpx_file_src__ || this.computed.__mpx_file_src__?.() || "未知组件";
    }
}
function findParentComponent(instance) {
    if (instance.selectOwnerComponent && typeof instance.selectOwnerComponent === "function") {
        try {
            const res =  instance.selectOwnerComponent();
            console.debug('[mpxDevTools] findParentComponent-selectOwnerComponent result:', res,instance);
            return res;
        } catch (e) {
            // 忽略错误
        }
    }

    return null;
}
function createInstanceTree(instance, depth = 0) {
    const tree = {
        component: instance,
        children: [],
    };
    if (depth > 0) {
        const children = instance.mpxDevToolsChildren || [];
        children.forEach((child) => {
            tree.children.push(createInstanceTree(child, depth - 1));
        });
    }
    return tree;
}
export default mpxDevTools;
