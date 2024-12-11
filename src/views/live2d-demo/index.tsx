import { useRef, useEffect, useCallback, Fragment } from 'react';
import { extend } from 'koot';
import classNames from 'classnames';
import {
    RedoOutlined,
    CaretUpOutlined,
    CaretDownOutlined,
    CaretLeftOutlined,
    CaretRightOutlined,
    ZoomInOutlined,
    ZoomOutOutlined,
} from '@ant-design/icons';

import useLive2D from './use-live2d';

import styles from './index.module.less';

// ============================================================================

const basePath = './Resources/';
const models = ['Haru', 'Hiyori', 'Mao', 'Mark', 'Natori', 'Rice', 'Wanko'];

// ============================================================================

interface ComponentProps {
    customProps?: string;
}

// Component Class ============================================================

const Demo = extend<ComponentProps>({
    styles,
})(({ className }): JSX.Element => {
    const ContainerRef = useRef<HTMLDivElement>(null);

    const {
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
    } = useLive2D({
        containerRef: ContainerRef,
        basePath,
        backgroundImageUrl: require('./assets/background.jpg'),
        // onModelMotionStart: (...args) => {
        //     console.log(123, 'onModelMotionStart', ...args);
        // },
        // onModelMotionEnd: (...args) => {
        //     console.log(123, 'onModelMotionEnd', ...args);
        // },
    });

    const setMotion = useCallback(
        (evt) => {
            if (!model) return;
            const group = evt.target.getAttribute('data-group');
            const index = evt.target.getAttribute('data-index');
            model.startMotion(
                group,
                Number(index),
                3,
                // () => {
                //     if (MotionSelectRef.current) MotionSelectRef.current.value = '';
                // }
            );
        },
        [model],
    );

    const setExpression = useCallback(
        (evt) => {
            if (!model) return;
            model.setExpression(evt.target.getAttribute('data-value'));
        },
        [model],
    );

    const setPosition = useCallback(
        (evt) => {
            switch (evt.target.getAttribute('data-direction')) {
                case 'reset': {
                    return view?.resetTranslate();
                }
                case 'up': {
                    return view?.adjustTranslate(0, 0.1);
                }
                case 'right': {
                    return view?.adjustTranslate(0.1, 0);
                }
                case 'down': {
                    return view?.adjustTranslate(0, -0.1);
                }
                case 'left': {
                    return view?.adjustTranslate(-0.1, 0);
                }
                default: {
                }
            }
        },
        [view],
    );

    const setScale = useCallback(
        (evt) => {
            switch (evt.target.getAttribute('data-scale')) {
                case 'reset': {
                    return view?.resetScale();
                }
                case 'up': {
                    return view?.adjustScale(1.1);
                }
                case 'down': {
                    return view?.adjustScale(0.9);
                }
                default: {
                }
            }
        },
        [view],
    );

    const loadThisModel = useCallback(
        (evt) => {
            loadModel(evt.target.getAttribute('data-model-name'));
        },
        [loadModel],
    );

    useEffect(() => {
        if (ContainerRef.current) {
            initialize();
        }
    }, [initialize]);

    return (
        <div
            className={className}
            ref={ContainerRef}
            // style={{
            //     backgroundImage: `url(${require('./assets/background.jpg')})`,
            // }}
        >
            <div
                className={classNames([
                    'controls',
                    `is-model-state-${modelState}`,
                ])}
            >
                {modelState === 'pending' ? (
                    <>
                        <dl>
                            <dt>选择</dt>
                            <dd>
                                {models.map((name, index) => (
                                    <Fragment key={index}>
                                        <button
                                            onClick={loadThisModel}
                                            data-model-name={name}
                                        >
                                            {name}
                                        </button>
                                        <br />
                                    </Fragment>
                                ))}
                            </dd>
                        </dl>
                    </>
                ) : !model ? (
                    <>载入中...</>
                ) : (
                    <>
                        <dl>
                            <dt>模型</dt>
                            <dd>
                                <button onClick={release}>释放</button>
                            </dd>
                        </dl>

                        <dl className="is-position">
                            <dt>位置</dt>
                            <dd>
                                <button
                                    className="mod-round is-reset"
                                    onClick={setPosition}
                                    data-direction="reset"
                                >
                                    <RedoOutlined />
                                </button>
                                <button
                                    className="mod-round is-up"
                                    onClick={setPosition}
                                    data-direction="up"
                                >
                                    <CaretUpOutlined />
                                </button>
                                <button
                                    className="mod-round is-right"
                                    onClick={setPosition}
                                    data-direction="right"
                                >
                                    <CaretRightOutlined />
                                </button>
                                <button
                                    className="mod-round is-down"
                                    onClick={setPosition}
                                    data-direction="down"
                                >
                                    <CaretDownOutlined />
                                </button>
                                <button
                                    className="mod-round is-left"
                                    onClick={setPosition}
                                    data-direction="left"
                                >
                                    <CaretLeftOutlined />
                                </button>
                            </dd>
                        </dl>

                        <dl className="is-scale">
                            <dt>缩放</dt>
                            <dd>
                                <button
                                    className="mod-round is-reset"
                                    onClick={setScale}
                                    data-scale="reset"
                                >
                                    <RedoOutlined />
                                </button>
                                <button
                                    className="mod-round is-up"
                                    onClick={setScale}
                                    data-scale="up"
                                >
                                    <ZoomInOutlined />
                                </button>
                                <button
                                    className="mod-round is-down"
                                    onClick={setScale}
                                    data-scale="down"
                                >
                                    <ZoomOutOutlined />
                                </button>
                            </dd>
                        </dl>
                        <dl>
                            <dt>动作</dt>
                            <dd>
                                {modelMotionList?.length ? (
                                    modelMotionList?.map((motion, index) => (
                                        <button
                                            key={index}
                                            className={
                                                motion.name ===
                                                currentModelMotionName
                                                    ? 'is-active'
                                                    : ''
                                            }
                                            onClick={setMotion}
                                            data-group={motion.group}
                                            data-index={motion.index}
                                        >
                                            {motion.name}
                                        </button>
                                    ))
                                ) : (
                                    <span className="empty">无</span>
                                )}
                            </dd>
                        </dl>

                        <dl>
                            <dt>表情</dt>
                            <dd>
                                {modelExpressionList?.length ? (
                                    modelExpressionList?.map(
                                        (expression, index) => (
                                            <button
                                                key={index}
                                                className={
                                                    expression ===
                                                    currentModelExpressionId
                                                        ? 'is-active'
                                                        : ''
                                                }
                                                onClick={setExpression}
                                                data-value={expression}
                                            >
                                                {expression}
                                            </button>
                                        ),
                                    )
                                ) : (
                                    <span className="empty">无</span>
                                )}
                            </dd>
                        </dl>

                        <dl>
                            <dt>TIPS</dt>
                            <dd>
                                <ul>
                                    <li>点按身躯可随机更换动作</li>
                                    <li>点按面部可随机更换表情</li>
                                    <li>按住并拖拽可改变面部朝向</li>
                                </ul>
                            </dd>
                        </dl>
                    </>
                )}
            </div>
        </div>
    );
});

export default Demo;
