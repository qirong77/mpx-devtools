/**
 * MPX DevTools - 组件树监控系统
 * 提供组件生命周期追踪和组件树可视化功能
 */

class MPXDevTools {
  constructor() {
    this.instanceMapSet = new WeakSet(); // 存储组件实例和其信息的映射
    this.rootInstance = []; // 根组件实例
    this.exposeGlobalMethods();
  }
  onComponentMounted(instance) {
    this.instanceMapSet.add(instance);
    instance.MpxDevtoolsComponentInfo = new MpxDevtoolsComponentInfo(instance);

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

    // 查找并建立当前实例的子组件关系
    const children = findChildrenComponent(instance);
    if (children && children.length > 0) {
      instance.mpxDevToolsChildren = children;
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
    if (typeof wx !== "undefined") {
      // 暴露调试方法到 wx 全局对象
      wx.mpxDevTools = {
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
        getInstanceTreeRoot() {
          const roots = wx.mpxDevTools.getRoot();
          const node = createInstanceTree(roots[roots.length - 1], 30);
          return node;
        },
        // 获取指定组件的子组件
        getChildrenComponents(instance) {
          return findChildrenComponent(instance);
        },
        // 获取指定组件的父组件
        getParentComponent(instance) {
          return findParentComponent(instance);
        },
      };
    }
  }
}

// 创建全局实例
const mpxDevTools = new MPXDevTools();
class MpxDevtoolsComponentInfo {
  constructor(instance) {
    this.type = instance?.$rawOptions?.__type__ || "未知";
    this.data = instance?.$rawOptions?.data || "空";
    this.props = instance?.$rawOptions?.props || {};
    this.computed = instance?.$rawOptions?.computed || {};
  }
}
function findParentComponent(instance) {
  // MPX 中查找父组件的几种方式

  // 1. Vue 风格的 $parent
  if (instance.$parent) {
    return instance.$parent;
  }

  // 2. MPX 特有的父组件查找
  if (instance.__mpxProxy && instance.__mpxProxy.$parent) {
    return instance.__mpxProxy.$parent;
  }

  // 3. 小程序原生方式 - selectOwnerComponent
  if (
    instance.selectOwnerComponent &&
    typeof instance.selectOwnerComponent === "function"
  ) {
    try {
      return instance.selectOwnerComponent();
    } catch (e) {
      // 忽略错误
    }
  }

  // 4. 通过小程序原生关系查找
  if (
    instance.getRelationNodes &&
    typeof instance.getRelationNodes === "function"
  ) {
    try {
      const relations = instance.getRelationNodes();
      if (relations && relations.length > 0) {
        return relations[0];
      }
    } catch (e) {
      // 忽略错误
    }
  }
  return null;
}
function findChildrenComponent(instance) {
  // 存储找到的子组件
  const children = [];

  // 1. 直接从实例上获取已存储的子组件
  if (
    instance.mpxDevToolsChildren &&
    Array.isArray(instance.mpxDevToolsChildren)
  ) {
    return instance.mpxDevToolsChildren;
  }

  // 2. Vue 风格的 $children
  if (instance.$children && Array.isArray(instance.$children)) {
    children.push(...instance.$children);
  }

  // 3. MPX 特有的子组件查找
  if (instance.__mpxProxy && instance.__mpxProxy.$children) {
    children.push(...instance.__mpxProxy.$children);
  }

  // 4. 小程序原生方式 - selectAllComponents
  if (
    instance.selectAllComponents &&
    typeof instance.selectAllComponents === "function"
  ) {
    try {
      const components = instance.selectAllComponents();
      if (components && Array.isArray(components)) {
        children.push(...components);
      }
    } catch (e) {
      // 忽略错误
    }
  }

  // 5. 通过小程序原生关系查找子组件
  if (
    instance.getRelationNodes &&
    typeof instance.getRelationNodes === "function"
  ) {
    try {
      const relations = instance.getRelationNodes();
      if (relations && Array.isArray(relations)) {
        children.push(...relations);
      }
    } catch (e) {
      // 忽略错误
    }
  }

  // 6. 通过组件选择器查找（如果有组件ID或类名）
  if (
    instance.selectComponent &&
    typeof instance.selectComponent === "function"
  ) {
    try {
      // 尝试查找常见的子组件选择器
      const selectors = [".component", "[data-component]", "custom-component"];
      selectors.forEach((selector) => {
        try {
          const component = instance.selectComponent(selector);
          if (component && !children.includes(component)) {
            children.push(component);
          }
        } catch (e) {
          // 忽略选择器错误
        }
      });
    } catch (e) {
      // 忽略错误
    }
  }

  // 7. 如果是页面实例，尝试获取页面上的所有组件
  if (instance.__route__ || instance.route) {
    try {
      // 获取当前页面
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];

      if (currentPage === instance && currentPage.selectAllComponents) {
        const pageComponents = currentPage.selectAllComponents();
        if (pageComponents && Array.isArray(pageComponents)) {
          children.push(...pageComponents);
        }
      }
    } catch (e) {
      // 忽略错误
    }
  }

  // 去重并过滤无效的子组件
  const uniqueChildren = children.filter((child, index, arr) => {
    return (
      child &&
      typeof child === "object" &&
      arr.indexOf(child) === index && // 去重
      child !== instance
    ); // 不包含自己
  });

  return uniqueChildren;
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
