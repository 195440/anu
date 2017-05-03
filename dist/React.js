(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.React = factory());
}(this, (function () {

/**
 * 复制一个对象的属性到另一个对象
 * 
 * @param {any} obj 
 * @param {any} props 
 * @returns 
 */
function extend(obj, props) {
    if (props) {
        for (let i in props) {
            obj[i] = props[i];
        }
    }
    return obj
}
/**
 * 一个空函数
 * 
 * @export
 */
function noop() {}
/**
 * 类继承
 * 
 * @export
 * @param {any} SubClass 
 * @param {any} SupClass 
 */
function inherit(SubClass, SupClass) {
    function Bridge() {}
    Bridge.prototype = SupClass.prototype;

    let fn = SubClass.prototype = new Bridge();

    // 避免原型链拉长导致方法查找的性能开销
    extend(fn, SupClass.prototype);
    fn.constructor = SubClass;
}




/**
 * 收集该虚拟DOM的所有组件实例，方便依次执行它们的生命周期钩子
 * 
 * @param {any} instance 
 * @returns 
 */
function getInstances(instance) {
    var instances = [instance];
    while (instance = instance.parentInstance) {
        instances.push(instance);
    }
    return instances
}
/**
 * 寻找适合的实例并返回
 * 
 * @param {any} instance 
 * @param {any} Type 
 * @returns 
 */
function matchInstance(instance, Type) {
    do {
        if (instance.statelessRender === Type)
            return instance
        if (instance instanceof Type) {
            return instance
        }
    } while (instance = instance.parentInstance)
}
/**
 * 
 * 
 * @param {any} type 
 * @returns 
 */
function isComponent(type) {
    return typeof type === 'function'
}

/**
 * 
 * 
 * @export
 * @param {any} type 
 * @returns 
 */
function isStateless(type) {
    var fn = type.prototype;
    return isComponent(type) && (!fn || !fn.render)
}

var rword = /[^, ]+/g;

function oneObject(array, val) {
    if (typeof array === 'string') {
        array = array.match(rword) || [];
    }
    var result = {},
        value = val !== void 0 ? val : 1;
    for (var i = 0, n = array.length; i < n; i++) {
        result[array[i]] = value;
    }
    return result
}

function getContext(instance, context) {
    if (instance.getChildContext) {
        return extend(extend({}, context), instance.getChildContext())
    }
    return context
}
var rcamelize = /[-_][^-_]/g;
function camelize(target) {
    //提前判断，提高getStyle等的效率
    if (!target || target.indexOf('-') < 0 && target.indexOf('_') < 0) {
        return target
    }
    //转换为驼峰风格
    return target.replace(rcamelize, function (match) {
        return match.charAt(1).toUpperCase()
    })
}
var midway = {
    immune: {} // Object.freeze(midway) ;midway.aaa = 'throw err';midway.immune.aaa = 'safe'
};

//用于后端的元素节点
function DOMElement(type) {
    this.nodeName = type;
    this.style = {};
    this.children = [];
}
var fn = DOMElement.prototype = {
    contains: Boolean
};
String('replaceChild,appendChild,removeAttributeNS,setAttributeNS,removeAttribute,setAttribute' +
            ',getAttribute,insertBefore,removeChild,addEventListener,removeEventListener,attachEvent' +
            ',detachEvent').replace(/\w+/g, function (name) {
    fn[name] = function () {
        console.log('fire ' + name);
    };
});

//用于后端的document
var fakeDoc = new DOMElement;
fakeDoc.createElement = fakeDoc.createElementNS = function (type) {
    return new DOMElement(type)
};
fakeDoc.createTextNode = fakeDoc.createComment = Boolean;
fakeDoc.documentElement = new DOMElement;

var win = typeof window === 'object'
    ? window
    : typeof global === 'object'
        ? global
        : { document: faceDoc};



var document = win.document;

var versions = {
    objectobject: 7, //IE7-8
    objectundefined: 6, //IE6
    undefinedfunction: NaN, // other modern browsers
    undefinedobject: NaN
};
/* istanbul ignore next  */
var msie = document.documentMode || versions[typeof document.all + typeof XMLHttpRequest];

var modern = /NaN|undefined/.test(msie) || msie > 8;

function createDOMElement(vnode) {
    try {
        if (vnode.ns) {
            return document.createElementNS(vnode.ns,vnode.type)
        }
    } catch (e) {}
    return document.createElement(vnode.type)
}
// https://developer.mozilla.org/en-US/docs/Web/MathML/Element/math
// http://demo.yanue.net/HTML5element/
var mhtml = {
    meter: 1,
    menu: 1,
    map: 1,
    meta: 1,
    mark: 1
};
var svgTags = oneObject('' +
// structure
'svg,g,defs,desc,metadata,symbol,use,' +
// image & shape
'image,path,rect,circle,line,ellipse,polyline,polygon,' +
// text
'text,tspan,tref,textpath,' +
// other
'marker,pattern,clippath,mask,filter,cursor,view,animate,' +
// font
'font,font-face,glyph,missing-glyph', svgNs);

var rmathTags = /^m/;
var mathNs = 'http://www.w3.org/1998/Math/MathML';
var svgNs = 'http://www.w3.org/2000/svg';
var mathTags = {
    semantics: mathNs
};

function getNs(type) {
    if (svgTags[type]) {
        return svgNs
    } else if (mathTags[type]) {
        return mathNs
    } else {
        if (!mhtml[type] && rmathTags.test(type)) {
            return mathTags[type] = mathNs
        }
    }
}

var CurrentOwner = {
    cur: null
};

var shallowEqualHack = Object.freeze([]); //用于绕过shallowEqual
/**
 * 创建虚拟DOM
 *
 * @param {string} type
 * @param {object} props
 * @param {array} children
 * @returns
 */
function createElement(type, configs, children) {
    var props = {};
    var key = null;
    configs = configs || {};
    if (configs.key != null) {
        key = configs.key + '';
        delete configs.key;
    }
    extend(props, configs);
    var c = []
        .slice
        .call(arguments, 2);
    var useEmpty = true;
    if (!c.length) {
        if (props.children && props.children.length) {
            c = props.children;
            useEmpty = false;
        }
    } else {
        useEmpty = false;
    }
    if (useEmpty) {
        c = shallowEqualHack;
    } else {
        c = flatChildren(c);
        delete c.merge; //注意这里的顺序
        Object.freeze(c);
    }
    props.children = c;
    Object.freeze(props);
    return new Vnode(type, props, key, CurrentOwner.cur)
}

function Vnode(type, props, key, owner) {
    this.type = type;
    this.props = props;
    var ns = getNs(type);
    if (ns) {
        this.ns = ns;
    }
    this.key = key || null;
    this._owner = owner || null;
}

Vnode.prototype = {
    getDOMNode: function () {
        return this.dom || null
    },
    $$typeof: 1
};

/**
 * 遍平化children，并合并相邻的简单数据类型
 *
 * @param {array} children
 * @param {any} [ret=[]]
 * @returns
 */

function flatChildren(children, ret, deep) {
    ret = ret || [];
    deep = deep || 0;
    for (var i = children.length; i--;) { //从后向前添加
        var el = children[i];
        if (el == null) {
            el = '';
        }
        var type = typeof el;
        if (el === '' || type === 'boolean') {
            continue
        }
        if (/number|string/.test(type) || el.type === '#text') {
            if (el === '' || el.text == '') {
                continue
            }
            if (ret.merge) {
                ret[0].text = (el.type
                    ? el.text
                    : el) + ret[0].text;
            } else {
                ret.unshift(el.type
                    ? el
                    : {
                        type: '#text',
                        text: String(el),
                        deep: deep
                    });
                ret.merge = true;
            }
        } else if (Array.isArray(el)) {
            flatChildren(el, ret, deep + 1);
        } else {
            ret.unshift(el);
            el.deep = deep;
            ret.merge = false;
        }

    }
    return ret
}

var queue = [];
var callbacks = [];

function setStateWarn() {
    /* istanbul ignore next */
    if (transaction.isInTransation) {
        console.warn("Cannot update during an existing state transition (such as within `render` or an" +
                "other component's constructor). Render methods should be a pure function of prop" +
                "s and state; constructor side-effects are an anti-pattern, but can be moved to `" +
                "componentWillMount`");
    }
}

var transaction = {
    isInTransation: false,
    enqueueCallback: function (obj) {
        //它们是保证在ComponentDidUpdate后执行
        callbacks.push(obj);
    },
    renderWithoutSetState: function (instance, nextProps, context) {
        instance.setState = instance.forceUpdate = setStateWarn;

        try {
            CurrentOwner.cur = instance;
            var vnode = instance.render(nextProps, context);
            if (vnode === null) {
                vnode = {
                    type: '#comment',
                    text: 'empty'
                };
            }
        } finally {
            CurrentOwner.cur = null;
            delete instance.setState;
            delete instance.forceUpdate;

        }

        return vnode
    },
    enqueue: function (obj) {
        if (obj) 
            queue.push(obj);
        if (!this.isInTransation) {
            this.isInTransation = true;
            var preProcessing = queue.concat();
            var processingCallbacks = callbacks.concat();
            var mainProcessing = [];
            queue.length = callbacks.length = 0;
            var unique = {};
            preProcessing.forEach(function (request) {
                try {
                    request.init(); //预处理， 合并参数，同一个组件的请求只需某一个进入主调度程序
                    if (!unique[request.component.uuid]) {
                        unique[request.component.uuid] = 1;
                        mainProcessing.push(request);
                    }
                } catch (e) {
                    /* istanbul ignore next */
                    console.log(e);
                }

            });

            mainProcessing.forEach(function (request) {
                try {
                    request.exec(); //执行主程序
                } catch (e) {
                    /* istanbul ignore next */
                    console.log(e);
                }
            });
            processingCallbacks.forEach(function (request) {
                request
                    .cb
                    .call(request.instance);
            });
            this.isInTransation = false;
             /* istanbul ignore next */
            if (queue.length) {
                this.enqueue(); //用于递归调用自身)
            }
        }
    }
};

/**
 * 
 * 
 * @param {any} props 
 * @param {any} context 
 */

function Component(props, context) {
    this.context = context;
    this.props = props;
    this.uuid = Math.random();
    this.refs = {};
    if (!this.state)
        this.state = {};
}


Component.prototype = {

    setState(state, cb) {
        setStateProxy(this, state, cb);
    },

    forceUpdate(cb) {
        setStateProxy(this, this.state, cb, true);
    },

    render() {}

};

/**
 * 让外面的setState与forceUpdate都共用同一通道
 * 
 * @param {any} instance 
 * @param {any} state 
 * @param {any} cb fire by component did update
 * @param {any} force ignore shouldComponentUpdate
 */

function setStateProxy(instance, state, cb, force) {
    if (typeof cb === 'function')
        transaction.enqueueCallback({ //确保回调先进入
            component: instance,
            cb: cb
        });
    transaction.enqueue({
        component: instance,
        state: state,
        init: force ? roughSetState : gentleSetState,
        exec: midway.immune.updateComponent || noop
    });

}


function gentleSetState() { //只有必要时才更新
    var instance = this.component;
    
    var state = instance.state;
    instance.prevState = instance.prevState || extend({},state);
    var s = this.state;
    extend(state, typeof s === 'function' ? s(state, instance.props) : s);
}

function roughSetState() { //强制更新
    var instance = this.component;
    instance._forceUpdate = true;
}

var hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * inlined Object.is polyfill to avoid requiring consumers ship their own
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
 */
function is(x, y) {
    // SameValue algorithm
    if (x === y) {
        // Steps 1-5, 7-10
        // Steps 6.b-6.e: +0 != -0
        // Added the nonzero y check to make Flow happy, but it is redundant
        return x !== 0 || y !== 0 || 1 / x === 1 / y;
    } else {
        // Step 6.a: NaN == NaN
        return x !== x && y !== y;
    }
}

/**
 * Performs equality by iterating through keys on an object and returning false
 * when any key has values which are not strictly equal between the arguments.
 * Returns true when the values of all keys are strictly equal.
 */
function shallowEqual(objA, objB) {
    if (is(objA, objB)) {
        return true;
    }
 
    if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
        return false;
    }

    var keysA = Object.keys(objA);
    var keysB = Object.keys(objB);
    if (keysA.length !== keysB.length) {
        return false;
    }

    // Test for A's keys different from B.
    for (var i = 0; i < keysA.length; i++) {
        if (!hasOwnProperty.call(objB, keysA[i]) || !is(objA[keysA[i]], objB[keysA[i]])) {
            return false;
        }
    }

    return true;
}

function PureComponent(props, context) {
    this.props = props;
    this.context = context;
}

inherit(PureComponent, Component);

let fn$1 = PureComponent.prototype;

fn$1.shouldComponentUpdate = function shallowCompare(nextProps, nextState) {
    var a = shallowEqual(this.props, nextProps);
    var b = shallowEqual(this.state, nextState);
    return !a || !b
};
fn$1.isPureComponent = true;

const Children = {
	only(children) {
		return children && children[0] || null;
	}
};
/*
function proptype() {}
proptype.isRequired = proptype;

export const PropTypes = {
	element: proptype,
	func: proptype,
	shape: () => proptype,
	instanceOf: ()=> proptype
};
*/

var lifecycle = {
    '-2': 'getDefaultProps',
    '-1': 'getInitialState',
    '0': 'componentWillMount',
    '1': 'render',
    '2': 'componentDidMount',
    '3': 'componentWillReceiveProps',
    '4': 'shouldComponentUpdate',
    '5': 'componentWillUpdate',
    '6': 'componentDidUpdate',
    '7': 'componentWillUnmount'
};

/**
 * 
 * 
 * @export
 * @param {Component} instance 
 * @param {number} index 
 * @returns 
 */
function applyComponentHook(instance, index) {
    if (instance) {
        var method = lifecycle[index];
        if (instance[method]) {
            return instance[method].apply(instance, [].slice.call(arguments, 2))
        }
    }
}

/**
 *
 *
 * @param {any} vnode
 * @param {any} context
 * @returns
 */
function toVnode(vnode, context) {

    var Type = vnode.type,
        instance, rendered;

    if (isComponent(Type)) {
        var props = vnode.props;
        if (!isStateless(Type)) {
            var defaultProps = Type.defaultProps || applyComponentHook(Type, -2) || {};
            props = extend({}, props); //注意，上面传下来的props已经被冻结，无法修改，需要先复制一份
            for (var i in defaultProps) {
                if (props[i] === void 666) {
                    props[i] = defaultProps[i];
                }
            }
            instance = new Type(props, context);
            //必须在这里添加vnode，因为willComponent里可能进行setState操作
            instance.vnode = vnode;

            Component.call(instance, props, context); //重点！！

            applyComponentHook(instance, 0); //willMount

            rendered = transaction.renderWithoutSetState(instance);
        } else { //添加无状态组件的分支
            instance = new Component(null, context);
            instance.render = instance.statelessRender = Type;
            instance.vnode = vnode;
            rendered = transaction.renderWithoutSetState(instance, props, context);
        }
        if (vnode.instance) {
            instance.parentInstance = vnode.instance;
            vnode.instance.childInstance = instance;
        }


        instance.prevProps = vnode.props; //实例化时prevProps

        var key = vnode.key;
        extend(vnode, rendered);
        vnode.key = key;
        vnode.instance = instance;

        if (instance.getChildContext) {
            vnode.context = getContext(instance, context);
        }


        return toVnode(vnode, context)
    } else {
        return vnode
    }
}

var rnumber = /^-?\d+(\.\d+)?$/;
    /**
     * 为元素样子设置样式
     * 
     * @export
     * @param {any} dom 
     * @param {any} oldStyle 
     * @param {any} newStyle 
     */
function patchStyle(dom, oldStyle, newStyle) {
    if (oldStyle === newStyle) {
        return
    }
    var old = {};
    for (var name in newStyle) {
        let val = newStyle[name];
        if (oldStyle[name] !== val) {
            name = cssName(name, dom);
            if (val === void(0) || val === null || val === false) {
                val = ''; //清除样式
            } else if (rnumber.test(val) && !cssNumber[name]) {
                val = val + 'px'; //添加单位
            }
            dom.style[name] = val; //应用样式
        }
    }
    // 如果旧样式存在，但新样式已经去掉
    for (var name in oldStyle) {
        if (!(name in newStyle)) {
            dom.style[name] = ''; //清除样式
        }
    }
}



var cssNumber = oneObject('animationIterationCount,columnCount,order,flex,flexGrow,flexShrink,fillOpacity,fontWeight,lineHeight,opacity,orphans,widows,zIndex,zoom');

var cssMap = oneObject('float', 'cssFloat');

//var testStyle = document.documentElement.style
var prefixes = ['', '-webkit-', '-o-', '-moz-', '-ms-'];

/**
 * 转换成当前浏览器可用的样式名
 * 
 * @param {any} name 
 * @returns 
 */
function cssName(name, dom) {
    if (cssMap[name]) {
        return cssMap[name]
    }
   var host = dom && dom.style || {};
    for (var i = 0, n = prefixes.length; i < n; i++) {
        var camelCase = camelize(prefixes[i] + name);
        if (camelCase in host) {
            return (cssMap[name] = camelCase)
        }
    }
    return null
}

var eventMap = {};
/**
 * 判定否为与事件相关
 *
 * @param {any} name
 * @returns
 */
function isEventName(name) {
    return /^on[A-Z]/.test(name)
}

function dispatchEvent(e) {
    e = new SyntheticEvent(e);
    var target = e.target;
    var paths = [];
    do {
        var events = target.__events;
        if (events) {
            paths.push({dom: target, props: events});
        }
    } while ((target = target.parentNode) && target.nodeType === 1)

    var type = eventMap[e.type] || e.type;

    var capitalized = capitalize(type);
    var bubble = 'on' + capitalized;
    var captured = 'on' + capitalized + 'Capture';
    transaction.isInTransation = true;
    for (var i = paths.length; i--;) { //从上到下
        var path = paths[i];
        var fn = path.props[captured];
        if (typeof fn === 'function') {
            e.currentTarget = path.dom;
            fn.call(path.dom, e);
            if (e._stopPropagation) {
                break
            }
        }
    }

    for (var i = 0, n = paths.length; i < n; i++) { //从下到上
        var path = paths[i];
        var fn = path.props[bubble];
        if (typeof fn === 'function') {
            e.currentTarget = path.dom;
            fn.call(path.dom, e);
            if (e._stopPropagation) {
                break
            }
        }
    }
    transaction.isInTransation = false;
    transaction.enqueue();
}

function capitalize(str) {
    return str
        .charAt(0)
        .toUpperCase() + str.slice(1)
}

var globalEvents = {};
function addGlobalEventListener(name) {
    if (!globalEvents[name]) {
        globalEvents[name] = true;
        addEvent(document, name, dispatchEvent);
    }
}
function addEvent(el, type, fn) {
    if (el.addEventListener) {
        el.addEventListener(type, fn);
    } else if (el.attachEvent) {
        el.attachEvent('on' + type, fn);
    }
}

var eventLowerCache = {};
var ron = /^on/;
var rcapture = /Capture$/;
function getBrowserName(onStr) {
    var lower = eventLowerCache[onStr];
    if (lower) {
        return lower
    }
    var hump = onStr
        .replace(ron, '')
        .replace(rcapture, '');
    lower = hump.toLowerCase();
    eventLowerCache[onStr] = lower;
    eventMap[lower] = hump;
    return lower
}

function SyntheticEvent(event) {
    if (event.originalEvent) {
        return event
    }
    for (var i in event) {
        if (!eventProto[i]) {
            this[i] = event[i];
        }
    }
    if (!this.target) {
        this.target = event.srcElement;
    }
    var target = this.target;
    this.fixEvent();
    this.timeStamp = new Date() - 0;
    this.originalEvent = event;
}

var eventProto = SyntheticEvent.prototype = {
    fixEvent: function () {}, //留给以后扩展用
    preventDefault: function () {
        var e = this.originalEvent || {};
        e.returnValue = this.returnValue = false;
        if (e.preventDefault) {
            e.preventDefault();
        }
    },
    stopPropagation: function () {
        var e = this.originalEvent || {};
        e.cancelBubble = this._stopPropagation = true;
        if (e.stopPropagation) {
            e.stopPropagation();
        }
    },
    stopImmediatePropagation: function () {
        this.stopPropagation();
        this.stopImmediate = true;
    },
    toString: function () {
        return '[object Event]'
    }
};

//fix 0.14对此方法的改动，之前refs里面保存的是虚拟DOM
  function getDOMNode() {
      return this
  }

/**
 * 收集DOM到组件实例的refs中
 * 
 * @param {any} instance 
 * @param {any} ref 
 * @param {any} dom 
 */
function patchRef(instance, ref, dom) {
    if (typeof ref === 'function') {
        ref(dom);
    } else if (typeof ref === 'string') {
        instance.refs[ref] = dom;
        dom.getDOMNode = getDOMNode;
    }
}

function removeRef(instance, ref) {
    if (instance && typeof ref === 'string') {
        delete instance.refs[ref];
    }
}

function clickHack() {}
  let inMobile = 'ontouchstart' in document;


  var xlink = "http://www.w3.org/1999/xlink";
  var stringAttributes = oneObject('id,title,alt,value,className');
  var builtIdProperties = {}; //不规则的属性名映射


  //防止压缩时出错
  'accept-charset,acceptCharset|char,ch|charoff,chOff|class,className|for,htmlFor|http-equiv,httpEquiv'.replace(/[^\|]+/g, function (a) {
      var k = a.split(',');
      builtIdProperties[k[1]] = k[0];
  });
  /*
  contenteditable不是布尔属性
  http://www.zhangxinxu.com/wordpress/2016/01/contenteditable-plaintext-only/
  contenteditable=''
  contenteditable='events'
  contenteditable='caret'
  contenteditable='plaintext-only'
  contenteditable='true'
  contenteditable='false'
   */
  var bools = ['autofocus,autoplay,async,allowTransparency,checked,controls',
      'declare,disabled,defer,defaultChecked,defaultSelected,',
      'isMap,loop,multiple,noHref,noResize,noShade',
      'open,readOnly,selected'
  ].join(',');

  bools.replace(/\w+/g, function (name) {
      builtIdProperties[name] = true;
  });

  var anomaly = ['accessKey,bgColor,cellPadding,cellSpacing,codeBase,codeType,colSpan',
      'dateTime,defaultValue,contentEditable,frameBorder,longDesc,maxLength,' +
      'marginWidth,marginHeight,rowSpan,tabIndex,useMap,vSpace,valueType,vAlign,' +
      'value,title,alt'
  ].join(',');

  anomaly.replace(/\w+/g, function (name) {
      builtIdProperties[name] = name;
  });
  /**
   * 
   * 修改dom的属性与事件
   * @export
   * @param {any} props 
   * @param {any} prevProps 
   * @param {any} vnode 
   * @param {any} prevVnode 
   */
  function diffProps(props, prevProps, vnode, prevVnode) {
      /* istanbul ignore if */
      if (props === prevProps) {
          return
      }
      var dom = vnode.dom;

      var instance = vnode._owner;
      if (prevVnode._wrapperState) {
          vnode._wrapperState = prevVnode._wrapperState;
          delete prevVnode._wrapperState;
      }
      var isHTML = !vnode.ns;
      for (let name in props) {
          if (name === 'children') {
              continue
          }
          var val = props[name];
          if (name === 'ref') {
              if (prevProps[name] !== val) {
                  instance && patchRef(instance, val, dom);
              }
              continue
          }
          if (name === 'style') {
              patchStyle(dom, prevProps.style || {}, val);
              continue
          }
          if (name === 'dangerouslySetInnerHTML') {
              var oldhtml = prevProps[name] && prevProps[name].__html;
              vnode._hasSetInnerHTML = true;
              if (val && val.__html !== oldhtml) {
                  dom.innerHTML = val.__html;
              }
          }
          if (isEventName(name)) {
              if (!prevProps[name]) { //添加全局监听事件
                  var eventName = getBrowserName(name); //带on
                  
                  var curType = typeof val;
                  /* istanbul ignore if */
                  if (curType !== 'function')
                      throw 'Expected ' + name + ' listener to be a function, instead got type ' + curType
                  addGlobalEventListener(eventName);
              }
              /* istanbul ignore if */
              if (inMobile && eventName === 'click') {
                  elem.addEventListener('click', clickHack);
              }
              var events = (dom.__events || (dom.__events = {}));
              events[name] = val;
              continue
          }
          if (val !== prevProps[name]) {
              if (typeof dom[name] === 'boolean') {
                  //布尔属性必须使用el.xxx = true|false方式设值
                  //如果为false, IE全系列下相当于setAttribute(xxx,''),
                  //会影响到样式,需要进一步处理
                  dom[name] = !!val;
              }
              if (val === false || val === void 666 || val === null) {
                  operateAttribute(dom, name, '', !isHTML);
                  continue
              }
              if (isHTML && builtIdProperties[name]) {
                  //特殊照顾value, 因为value可以是用户自己输入的，这时再触发onInput，再修改value，但这时它们是一致的
                  //<input value={this.state.value} onInput={(e)=>setState({value: e.target.value})} />
                  if (stringAttributes[name])
                      val = val + '';
                  if (name !== 'value' || dom[name] !== val) {
                      dom[name] = val;
                  }
              } else {
                  operateAttribute(dom, name, val, !isHTML);
              }

          }
      }
      //如果旧属性在新属性对象不存在，那么移除DOM
      for (let name in prevProps) {
          if (!(name in props)) {
              if (name === 'ref') {
                  removeRef(instance, prevProps.ref);
              }else if (isEventName(name)) { //移除事件
                  var events = dom.__events || {};
                  delete events[name];
              } else { //移除属性
                  if (isHTML && builtIdProperties[name]) {
                      dom[name] = builtIdProperties[name] === true ? false : '';
                  } else {
                      operateAttribute(dom, name, '', !isHTML);
                  }
              }
          }
      }
  }

  function operateAttribute(dom, name, value, isSVG) {

      var method = value === '' ? 'removeAttribute' : 'setAttribute',
          namespace = null;
      //http://www.w3school.com.cn/xlink/xlink_reference.asp 
      //https://facebook.github.io/react/blog/2015/10/07/react-v0.14.html#notable-enhancements
      // xlinkActuate, xlinkArcrole, xlinkHref, xlinkRole, xlinkShow, xlinkTitle, xlinkType
      if (isSVG && name.indexOf('xlink') === 0) {
          name = name.replace(/^xlink\:?/, '');
          namespace = xlink;
      }
      try {
          if (isSVG) {
              method = method + 'NS';
              dom[method](namespace, name.toLowerCase(), value + '');
          } else {
              dom[method](name, value + '');
          }
      } catch (e) {
          /* istanbul ignore next */
          console.log(e, method, dom.nodeName);
      }
  }

var hasReadOnlyValue = {
    'button': true,
    'image': true,
    'hidden': true,
    'reset': true,
    'submit': true
};
function setControlledComponent(vnode) {
    var props = vnode.props;
    var type = props.type;
    // input, select, textarea, datalist这几个元素都会包装成受控组件或非受控组件 **受控组件**
    // 是指定指定了value或checked 并绑定了事件的元素 **非受控组件** 是指定指定了value或checked，
    // 但没有绑定事件，也没有使用readOnly, disabled来限制状态变化的元素
    // 这时框架会弹出为它绑定事件，以重置用户的输入，确保它的value或checked值不被改变 但如果用户使用了defaultValue,
    // defaultChecked，那么它不做任何转换

    switch (vnode.type) {
        case "select":
        case "datalist":
            type = 'select';
        case 'textarea':
            if (!type) { //必须指定
                type = 'textarea';
            }
        case 'input':
            if (hasReadOnlyValue[type])
                return

            if (!type) {
                type = 'text';
            }

            var isChecked = type === 'radio' || type === 'checkbox';
            var propName = isChecked ?
                'checked' :
                'value';
            var defaultName = propName === 'value' ?
                'defaultValue' :
                'defaultChecked';
            var initValue = props[propName] != null ?
                props[propName] :
                props[defaultName];
            var isControlled = props.onChange || props.readOnly || props.disabled;
            if (/text|password/.test(type)) {
                isControlled = isControlled || props.onInput;
            }
            if (!isControlled && propName in props) {
                var dom = vnode.dom;
                console.warn('你在表单元素指定了' + propName + '属性,但没有添加onChange或onInput事件或readOnly或disabled，它将变成非受控组件，无法更换' + propName);

                function keepInitValue(e) {
                    dom[propName] = initValue;
                }
                vnode
                    .dom
                    .addEventListener('change', keepInitValue);
                if (type !== 'select') {
                    vnode
                        .dom
                        .addEventListener(isChecked ?
                            'click' :
                            'input', keepInitValue);
                }
            }
            break
        case "option":
            return vnode._wrapperState = {
                value: getOptionValue(props)
            }
    }
    if (type === 'select') {
        postUpdateSelectedOptions(vnode); //先在mount时执行一次
        return vnode._wrapperState = {
            postUpdate: postUpdateSelectedOptions
        }
    }
}

function getOptionValue(props) {
    return typeof props.value != 'undefined' ?
        props.value :
        props.children[0].text
}

function postUpdateSelectedOptions(vnode) {
    var props = vnode.props;
    var multiple = !!props.multiple;
    var value = props.value != null ? props.value : props.defaultValue != null ? props.defaultValue : multiple ? [] :
        '';

    updateOptions(vnode, multiple, value);

}

function collectOptions(vnode, ret) {
    ret = ret || [];
    for (var i = 0, el; el = vnode.props.children[i++];) {
        if (el.type === 'option') {
            ret.push(el);
        } else if (el.type === 'optgroup') {
            collectOptions(el, ret);
        }
    }
    return ret
}

function updateOptions(vnode, multiple, propValue) {
    var options = collectOptions(vnode),
        selectedValue;
    if (multiple) {
        selectedValue = {};
        try {
            for (i = 0; i < propValue.length; i++) {
                selectedValue['' + propValue[i]] = true;
            }
        } catch (e) {
            /* istanbul ignore next */
            console.warn('<select multiple="true"> 的value应该对应一个字符串数组');
        }
        for (var i = 0, option; option = options[i++];) {
            var state = option._wrapperState || /* istanbul ignore next */handleSpecialNode(option);
            var selected = selectedValue.hasOwnProperty(state.value);
            if (state.selected !== selected) {
                state.selected = selected;
                setDomSelected(option, selected);
            }
        }
    } else {
        // Do not set `select.value` as exact behavior isn't consistent across all
        // browsers for all cases.
        selectedValue = '' + propValue;
        for (var i = 0, option; option = options[i++];) {
            var state = option._wrapperState;
            if (state.value === selectedValue) {
                setDomSelected(option, true);
                return
            }
        }
        if (options.length) {
            setDomSelected(options[0], true);
        }
    }
}

function setDomSelected(option, selected) {
    option.dom && (option.dom.selected = selected);
}

//react的单向流动是由生命周期钩子的setState选择性调用（不是所有钩子都能用setState）,受控组件，事务机制

/**
 * 渲染组件
 *
 * @param {any} instance
 */
function updateComponent(instance) {
    var {
        props,
        state,
        context,
        vnode,
        prevProps,
        prevState
    } = instance;
    prevState = prevState || state;
    instance.props = prevProps;
    instance.state = prevState;
    var nextProps = props;
    var nextState = state;
    if (!instance._forceUpdate && applyComponentHook(instance, 4, nextProps, nextState, context) === false) {
        return dom //注意
    }
    applyComponentHook(instance, 5, nextProps, nextState, context);
    instance.props = nextProps;
    instance.state = nextState;

    var rendered = transaction.renderWithoutSetState(instance, nextProps, context);
    //context只能孩子用，因此不要影响原instance.context

    context = getContext(instance, context);

    var dom = diff(rendered, instance.vnode, vnode._hostParent, context);
    instance.vnode = rendered;
    // rendered.dom = dom
    delete instance.prevState; //方便下次能更新this.prevState
    instance.prevProps = props; // 更新prevProps
    applyComponentHook(instance, 6, nextProps, nextState, context);
    return dom //注意
}
/**
 * call componentWillUnmount
 *
 * @param {any} vnode
 */
function removeComponent(vnode) {
    var instance = vnode.instance;

    applyComponentHook(instance, 7); //7

    '_hostParent,_wrapperState,_instance,_owner'.replace(/\w+/g, function (name) {
        delete vnode[name];
    });

    vnode
        .props
        .children
        .forEach(function (el) {
            if (el.props) {
                removeComponent(el);
            }
        });
}

/**
 * 参数不要出现DOM,以便在后端也能运行
 *
 * @param {any} vnode 新的虚拟DOM
 * @param {any} prevVnode 旧的虚拟DOM
 * @param {any} vParentNode 父虚拟DOM
 * @param {any} context
 * @returns
 */
function diff(vnode, prevVnode, vParentNode, context) { //updateComponent
    var dom = prevVnode.dom;
    var parentNode = vParentNode && vParentNode.dom;
    var prevProps = prevVnode.props || {};
    var prevChildren = prevProps.children || [];
    var Type = vnode.type;

    //更新组件
    var isComponent$$1 = typeof Type === 'function';
    var instance = prevVnode.instance;

    if (instance) {
        instance = isComponent$$1 && matchInstance(instance, Type);
        if (instance) { //如果类型相同，使用旧的实例进行 render新的虚拟DOM
            vnode.instance = instance;
            instance.context = context; //更新context
            var nextProps = vnode.props;
            //处理非状态组件
            if (instance.statelessRender) {
                instance.props = nextProps;
                instance.prevProps = prevProps;
                return updateComponent(instance, context)
            }

            prevProps = instance.prevProps;

            instance.props = prevProps;
            applyComponentHook(instance, 3, nextProps);
            instance.prevProps = prevProps;
            instance.props = nextProps;
            return updateComponent(instance, context)
        } else {
            if (prevVnode.type !== Type) {
                removeComponent(prevVnode);
            }
        }
    }
    if (isComponent$$1) {

        vnode._hostParent = vParentNode;
        return toDOM(vnode, context, parentNode, prevVnode.dom)
    }
    if (!dom || prevVnode.type !== Type) { //这里只能是element 与#text
        var nextDom = createDOMElement(vnode);
        if (dom) {
            while (dom.firstChild) {
                nextDom.appendChild(dom.firstChild);
            }
        }
        if (parentNode) {
            if (dom) {
                parentNode.replaceChild(nextDom, dom);
            } else {
                parentNode.appendChild(nextDom);
            }
        }
        dom = nextDom;
    }
    //必须在diffProps前添加它的dom
    vnode.dom = dom;
    if (!('text' in vnode && 'text' in prevVnode)) {
        diffProps(vnode.props || {}, prevProps, vnode, prevVnode);
    }
    if (prevVnode._hasSetInnerHTML) {

        while (dom.firstChild) {
            dom.removeChild(dom.firstChild);
        }
    }
    if (!vnode._hasSetInnerHTML && vnode.props) {
        diffChildren(vnode.props.children, prevChildren, vnode, context);
    }
    var wrapperState = vnode._wrapperState;
    if (wrapperState && wrapperState.postUpdate) { //处理select
        wrapperState.postUpdate(vnode);
    }
    return dom
}

/**
 * 获取虚拟DOM对应的顶层组件实例的类型
 *
 * @param {any} vnode
 * @param {any} instance
 * @param {any} pool
 */
function getTopComponentName(vnode, instance) {
    while (instance.parentInstance) {
        instance = instance.parentInstance;
    }
    var ctor = instance.statelessRender || instance.constructor;
    return (ctor.displayName || ctor.name)
}

/**
 *
 *
 * @param {any} type
 * @param {any} vnode
 * @returns
 */
function computeUUID(type, vnode) {
    if (type === '#text') {
        return type + '/' + vnode.deep + '/' + vnode.text
    }
    return type + '/' + vnode.deep + (vnode.key !== null ?
        '/' + vnode.key :
        '')
}

/**
 *
 *
 * @param {any} newChildren
 * @param {any} oldChildren
 * @param {any} vParentNode
 * @param {any} context
 */
function diffChildren(newChildren, oldChildren, vParentNode, context) {
    //第一步，根据实例的类型，nodeName, nodeValue, key与数组深度 构建hash

    var mapping = {};
    for (let i = 0, n = oldChildren.length; i < n; i++) {
        let vnode = oldChildren[i];
        let tag = vnode.instance ?
            getTopComponentName(vnode, vnode.instance) :
            vnode.type;
        let uuid = computeUUID(tag, vnode);
        if (mapping[uuid]) {
            mapping[uuid].push(vnode);
        } else {
            mapping[uuid] = [vnode];
        }
    }
    //第二步，遍历新children, 从hash中取出旧节点
    var removedChildren = oldChildren.concat();
    for (let i = 0, n = newChildren.length; i < n; i++) {
        let vnode = newChildren[i];
        let Type = vnode.type;
        let tag = typeof Type === 'function' ?
            (vnode._hasInstance = 1, Type.displatName || Type.name) :
            Type;
        let uuid = computeUUID(tag, vnode);
        if (mapping[uuid]) {
            var matchNode = mapping[uuid].shift();
            if (!mapping[uuid].length) {
                delete mapping[uuid];
            }
            if (matchNode) {
                let index = removedChildren.indexOf(matchNode);
                removedChildren.splice(index, 1);
                vnode.prevVnode = matchNode; //重点
                matchNode.use = true;
            }
        }
    }
    var parentNode = vParentNode.dom;
    //第三，逐一比较
    for (let i = 0, n = newChildren.length; i < n; i++) {
        let vnode = newChildren[i];
        let prevVnode = null;
        if (vnode.prevVnode) {
            prevVnode = vnode.prevVnode;
        } else {
            let k;
            loop: while (k = removedChildren.shift()) {
                if (!k.use) {
                    prevVnode = k;
                    break loop
                }
            }
        }
        vnode._hostParent = vParentNode;
        if (prevVnode) { //假设两者都存在
            let isTextOrComment = 'text' in vnode;
            let prevDom = prevVnode.dom;
            if (vnode.prevVnode && vnode._hasInstance) { //都是同种组件
                delete vnode.prevVnode;
                delete vnode._hasInstance;
                vnode.action = '重复利用旧的实例更新组件';
                diff(vnode, prevVnode, vParentNode, context);
            } else if (vnode.type === prevVnode.type) { //都是元素，文本或注释
                if (isTextOrComment) {
                    vnode.dom = prevDom;
                    if (vnode.text !== prevVnode.text) {
                        vnode.action = '改文本';
                        vnode.dom.nodeValue = vnode.text;
                    } else {
                        vnode.action = '不改文本';
                    }
                } else {
                    vnode.action = '更新元素';
                    diff(vnode, prevVnode, vParentNode, context);
                }
            } else if (isTextOrComment) { //由其他类型变成文本或注释
                let isText = vnode.type === '#text';
                var dom = isText ? document.createTextNode(vnode.text) : /* istanbul ignore next */ document.createComment(vnode.text);
                vnode.dom = dom;
                parentNode.replaceChild(dom, prevDom);
                vnode.action = isText ? '替换为文本' : /* istanbul ignore next */ '替换为注释';
                removeComponent(prevVnode); //移除元素节点或组件
            } else { //由其他类型变成元素
                vnode.action = '替换为元素';
                diff(vnode, prevVnode, vParentNode, context);
            }
            //当这个孩子是上级祖先传下来的，那么它是相等的
            if (vnode !== prevVnode) {
                delete prevVnode.dom; //clear reference
            }
        } else { //添加新节点
            vnode.action = '添加新' + (vnode.type === '#text' ?
                '文本' :
                '元素');
            if (!vnode.dom) {
                var oldNode = oldChildren[i];
                /* istanbul ignore next */
                toDOM(vnode, context, parentNode, oldNode && oldNode.dom || null);
            }
        }

    }


    //第4步，移除无用节点
    if (removedChildren.length) {
        for (let i = 0, n = removedChildren.length; i < n; i++) {
            let vnode = removedChildren[i];
            parentNode.removeChild(vnode.dom);
            vnode.props && removeComponent(vnode);
        }
    }

}

//var mountOrder = 0
/**
 *
 *
 * @export
 * @param {VNode} vnode
 * @param {DOM} context
 * @param {DOM} parentNode ?
 * @param {DOM} replaced ?
 * @returns
 */
function toDOM(vnode, context, parentNode, replaced) {
    vnode = toVnode(vnode, context);
    var dom,
        isElement;
    if (vnode.type === '#comment') {
        dom = document.createComment(vnode.text);
    } else if (vnode.type === '#text') {
        dom = document.createTextNode(vnode.text);
    } else {
        dom = createDOMElement(vnode);
        isElement = true;
    }
    if (vnode.context) {
        context = vnode.context;
        delete vnode.context;
    }

    var instance = vnode.instance;


    var canComponentDidMount = instance && !vnode.dom;
    vnode.dom = dom;
    if (isElement) {
        diffProps(vnode.props, {}, vnode, {});

        if (!vnode._hasSetInnerHTML) {
            diffChildren(vnode.props.children, [], vnode, context); //添加第4参数
        }
        setControlledComponent(vnode);
    }

    //尝试插入DOM树
    if (parentNode) {
        var instances;
        if (canComponentDidMount) { //判定能否调用componentDidMount方法
            instances = getInstances(instance);
        }
        if (replaced) {
            parentNode.replaceChild(dom, replaced);
        } else {
            parentNode.appendChild(dom);
        }
        if (instances) {
            //instance._mountOrder = mountOrder++;
            while (instance = instances.shift()) {
                applyComponentHook(instance, 2);
            }
        }
    }
    return dom
}
//将Component中这个东西移动这里
midway.immune.updateComponent = function updateComponentProxy() { //这里触发视图更新
    var instance = this.component;
    updateComponent(instance);
    instance._forceUpdate = false;
};

//import {transaction} from './transaction'
var React = {
    Children, //为了react-redux
    render,
    createElement,
    PureComponent,
    Component
};

/**
 *
 * @param {any} vnode
 * @param {any} container
 */
function render(vnode, container, cb) {
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    let context = {};


    var rootElement = diff(vnode, {}, {
        dom: container
    }, context);
    var instance = vnode.instance;
    if (instance) { //组件返回组件实例，而普通虚拟DOM 返回元素节点
        while (instance.parentInstance) {
            instance = instance.parentInstance;
        }
        return instance
    }else{
        return rootElement
    }

}

win.ReactDOM = React;

return React;

})));