import {
    useRef,
    useEffect,
    useCallback,
    useState,
    useMemo,
    type MutableRefObject,
} from 'react';

import * as LAppDefine from './src/lappdefine';
import { LAppGlManager } from './src/lappglmanager';
import { LAppDelegate } from './src/lappdelegate';
import { type LAppView } from './src/lappview';
import { LAppLive2DManager } from './src/lapplive2dmanager';
import { type LAppModel } from './src/lappmodel';
import { LAppWavFileHandler } from './src/lappwavfilehandler';

/*TODO: Easy API

Structure Change:
- no `main.ts`
- move all `@framework` files into itself
- load `core` file on initialization
- `readyState`
- naming `use-live2d` hooks

toggle randomIdleExpression
toggle eyeBlink

HIT AREA
*/
const useLive2D = (options: {
    /**
     * 采用指定的 `<canvas>` 元素的 React Ref
     * - 如果未指定，则会自动创建一个，追加到 `container` 中
     * - 该属性优先级高于 `canvasElement`
     */
    canvasElementRef?: MutableRefObject<HTMLCanvasElement | null>;
    /**
     * 采用指定的 `<canvas>` 元素
     * - 如果未指定，则会自动创建一个，追加到 `container` 中
     * - 该属性优先级低于 `canvasElementRef`
     */
    canvasElement?: HTMLCanvasElement;
    /**
     * 如果未指定 `canvasElement`，则自动生成 `<canvas>` 元素，该选项为所在的容器的 React Ref
     * - 该属性优先级高于 `container`
     */
    containerRef?: MutableRefObject<HTMLElement | null>;
    /**
     * 如果未指定 `canvasElement`，则自动生成 `<canvas>` 元素，该选项为所在的容器
     * - 该属性优先级低于 `containerRef`
     */
    container?: HTMLElement;

    /**
     * 素材文件的路径
     * - 以 `/` 结尾
     * - 模型文件、背景图等文件的根目录
     *     - 每一个模型为该目录下的一个子目录
     * - 如果为相对路径，则相对于当前页面的 URL
     */
    basePath: string;
    /**
     * 背景图文件名
     * - 该文件应位于 `basePath` 目录下
     * - 优先级高于 `backgroundImageUrl`
     */
    backgroundImageFileName?: string;
    /**
     * 背景图 URL
     * - 优先级低于 `backgroundImageFileName`
     */
    backgroundImageUrl?: string;

    /**
     * 当模型开始播放动作（`motion`）时触发
     * - 回调函数的第2个参数为当前播放的动作的信息
     */
    onModelMotionStart?: LAppModel['onMotionStart'];
    /**
     * 当模型结束播放动作（`motion`）时触发
     * - 回调函数的第2个参数为当前播放的动作的信息
     */
    onModelMotionEnd?: LAppModel['onMotionEnd'];
    /**
     * 当模型表情（`expression`）变化时触发
     * - 回调函数的第2个参数为当前表情的信息
     */
    onModelExpression?: LAppModel['onExpression'];
}) => {
    // ========================================================================
    //
    // State
    //
    // ========================================================================
    const [isInitialized, setIsInitialized] = useState(false);
    const [modelState, setModelState] = useState<
        'pending' | 'loading' | 'ready' | 'error'
    >('pending');

    // ========================================================================
    //
    // Instances
    //
    // ========================================================================
    const [webGL, setWebGL] = useState<LAppGlManager>();
    const [app, setApp] = useState<LAppDelegate>();
    const [view, setView] = useState<LAppView>();
    const [live2D, setLive2D] = useState<LAppLive2DManager>();
    // const [models, setModels] = useState<LAppLive2DManager['_models']>();
    // const [currModel, setCurrModel] = useState<LAppModel>();
    const [model, setModel] = useState<LAppModel>();

    // ========================================================================
    //
    // Model: Motion
    //
    // ========================================================================
    const [modelMotionList, setModelMotionList] = useState<
        {
            name: string;
            group: string;
            index: number;
        }[]
    >();
    const [currentModelMotionName, setCurrentModelMotionName] =
        useState<string>();
    const onModelMotionStart = useMemo<
        (typeof options)['onModelMotionStart']
    >(() => {
        return (model, info) => {
            setCurrentModelMotionName(info.name);
            options.onModelMotionStart?.(model, info);
        };
    }, [options]);
    const onModelMotionEnd = useMemo<
        (typeof options)['onModelMotionEnd']
    >(() => {
        return (model, info) => {
            setCurrentModelMotionName('');
            options.onModelMotionEnd?.(model, info);
        };
    }, [options]);

    // ========================================================================
    //
    // Model: Expression
    //
    // ========================================================================
    const [modelExpressionList, setModelExpressionList] = useState<string[]>();
    const [currentModelExpressionId, setCurrentModelExpressionId] =
        useState<string>();
    const onModelExpression = useMemo<
        (typeof options)['onModelExpression']
    >(() => {
        return (model, info) => {
            setCurrentModelExpressionId(info.id);
            options.onModelExpression?.(model, info);
        };
    }, [options]);

    // ========================================================================
    //
    // Functions
    //
    // ========================================================================
    const onWindowRisize = useCallback(() => {
        if (LAppDefine.CanvasSize === 'auto') {
            LAppDelegate.getInstance()?.onResize();
        }
    }, []);

    const initialize = useCallback(() => {
        if (isInitialized) return;

        if (
            !options.canvasElementRef &&
            !options.canvasElement &&
            !options.containerRef &&
            !options.container
        )
            throw new Error(
                '请提供以下属性中的一种: `canvasElementRef` `canvasElement` `containerRef` `container`',
            );

        LAppDefine.SetResourcesPath(options.basePath);
        if (typeof options.backgroundImageFileName === 'string')
            LAppDefine.SetBackImageName(options.backgroundImageFileName);
        if (typeof options.backgroundImageUrl === 'string')
            LAppDefine.SetBackImageURL(options.backgroundImageUrl);

        // 初始化 WebGL，并创建 App 实例
        if (
            !LAppGlManager.getInstance(
                options.canvasElementRef?.current || options.canvasElement,
            ) ||
            !LAppDelegate.getInstance().initialize(
                options.containerRef?.current || options.container,
            )
        ) {
            return;
        }

        window.addEventListener('resize', onWindowRisize, { passive: true });
        window.dispatchEvent(new Event('resize'));

        setIsInitialized(true);

        LAppDelegate.getInstance().run();
    }, [options, isInitialized, onWindowRisize]);

    const loadModel = useCallback(
        (modelName: string) => {
            if (!live2D) return Promise.reject('Live2D not initialized');

            setModelMotionList([]);
            setModelExpressionList([]);
            setModelState('loading');

            return live2D
                ?.loadModel(modelName)
                .then((model) => {
                    const motionList: {
                        name: string;
                        group: string;
                        index: number;
                    }[] = [];

                    // console.log(
                    //     123,
                    //     model,
                    //     model._motions._keyValues,
                    //     model,
                    // );

                    setModel(model);

                    if (typeof onModelMotionStart === 'function')
                        model.onMotionStart = onModelMotionStart;
                    if (typeof onModelMotionEnd === 'function')
                        model.onMotionEnd = onModelMotionEnd;
                    if (typeof onModelExpression === 'function')
                        model.onExpression = onModelExpression;

                    const modelSetting = model._modelSetting;
                    if (!modelSetting) return;

                    [
                        ...Array(modelSetting.getMotionGroupCount()).keys(),
                    ].forEach((i) => {
                        const motionGroupName =
                            modelSetting.getMotionGroupName(i);
                        const motionGroupCount =
                            modelSetting.getMotionCount(motionGroupName);
                        // setMotionList
                        [...Array(motionGroupCount).keys()].forEach((j) => {
                            const motionName = `${motionGroupName}_${j}`;
                            motionList.push({
                                name: motionName,
                                group: motionGroupName,
                                index: j,
                            });
                        });
                    });
                    setModelMotionList(motionList);

                    const expressionList = [
                        ...Array(modelSetting.getExpressionCount()).keys(),
                    ].map((i) => {
                        return modelSetting.getExpressionName(i);
                    });
                    setModelExpressionList(expressionList);
                    setCurrentModelExpressionId(expressionList[0]);
                })
                .catch((err) => {
                    setModelState('error');
                    console.error(err);
                });
        },
        [live2D, onModelMotionEnd, onModelMotionStart, onModelExpression],
    );

    const ReleaseFuncRef = useRef<() => void>(() => {
        window.removeEventListener('resize', onWindowRisize);

        model?.releaseMotions();
        model?.releaseExpressions();

        LAppGlManager?.releaseInstance();
        LAppDelegate?.releaseInstance();
        LAppWavFileHandler?.releaseInstance();
        LAppLive2DManager?.getInstance()?.releaseAllModel();
        LAppLive2DManager?.releaseInstance();

        setWebGL(undefined);
        setApp(undefined);
        setView(undefined);
        setLive2D(undefined);
        setModel(undefined);
        setModelMotionList([]);
        setModelExpressionList([]);
        setCurrentModelMotionName('');

        setModelState('pending');
        setIsInitialized(false);
    });
    const release = useCallback(() => {
        ReleaseFuncRef.current();
    }, []);

    useEffect(() => {
        if (!isInitialized) return;

        const app = LAppDelegate.getInstance();
        // console.log(123, app._cubismOption);

        setWebGL(LAppGlManager.getInstance());
        setApp(app);
        if (app._view) {
            setView(app._view);
        }
        setLive2D(LAppLive2DManager.getInstance());

        // console.log(
        //     123,
        //     window.Live2DCubismCore,
        // );
        return () => {
            release();
        };
    }, [isInitialized, release]);

    useEffect(() => {
        setModelState(!model ? 'pending' : 'ready');
    }, [model]);

    return {
        isInitialized,
        modelState,

        webGL,
        app,
        view,
        live2D,
        // models,
        // currModel,
        model,

        modelMotionList,
        modelExpressionList,

        currentModelMotionName,
        currentModelExpressionId,

        initialize,
        release,

        loadModel,
    };
};

export default useLive2D;
