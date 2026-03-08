// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React, { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { Row, Col } from 'antd/lib/grid';
import { PercentageOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import Input from 'antd/lib/input';
import Space from 'antd/lib/space';
import Switch from 'antd/lib/switch';
import Tooltip from 'antd/lib/tooltip';
import Radio from 'antd/lib/radio';
import Checkbox from 'antd/lib/checkbox';
import Form, { FormInstance, RuleObject, RuleRender } from 'antd/lib/form';
import Text from 'antd/lib/typography/Text';
import { Store } from 'antd/lib/form/interface';
import CVATTooltip from 'components/common/cvat-tooltip';
import patterns from 'utils/validation-patterns';
import { isInteger } from 'utils/validation';
import SourceStorageField from 'components/storage/source-storage-field';
import TargetStorageField from 'components/storage/target-storage-field';

import {
    getCore, Storage, StorageData, StorageLocation,
} from 'cvat-core-wrapper';

const core = getCore();

export enum SortingMethod {
    LEXICOGRAPHICAL = 'lexicographical',
    NATURAL = 'natural',
    PREDEFINED = 'predefined',
    RANDOM = 'random',
}

export interface AdvancedConfiguration {
    bugTracker?: string;
    imageQuality?: number;
    overlapSize?: number;
    segmentSize?: number;
    startFrame?: number;
    stopFrame?: number;
    frameFilter?: string;
    useZipChunks: boolean;
    dataChunkSize?: number;
    useCache: boolean;
    copyData?: boolean;
    sortingMethod: SortingMethod;
    useProjectSourceStorage: boolean;
    useProjectTargetStorage: boolean;
    consensusReplicas: number;
    sourceStorage: StorageData;
    targetStorage: StorageData;
}

const initialValues: AdvancedConfiguration = {
    imageQuality: 70,
    useZipChunks: true,
    useCache: true,
    copyData: false,
    sortingMethod: SortingMethod.LEXICOGRAPHICAL,
    useProjectSourceStorage: true,
    useProjectTargetStorage: true,
    consensusReplicas: 0,

    sourceStorage: {
        location: StorageLocation.LOCAL,
        cloudStorageId: undefined,
    },
    targetStorage: {
        location: StorageLocation.LOCAL,
        cloudStorageId: undefined,
    },
};

interface Props {
    onSubmit(values: AdvancedConfiguration): Promise<void>;
    onChangeUseProjectSourceStorage(value: boolean): void;
    onChangeUseProjectTargetStorage(value: boolean): void;
    onChangeSourceStorageLocation: (value: StorageLocation) => void;
    onChangeTargetStorageLocation: (value: StorageLocation) => void;
    onChangeSortingMethod(value: SortingMethod): void;
    projectId: number | null;
    useProjectSourceStorage: boolean;
    useProjectTargetStorage: boolean;
    activeFileManagerTab: string;
    sourceStorageLocation: StorageLocation;
    targetStorageLocation: StorageLocation;
    t?: any;
}

function validateURL(_: RuleObject, value: string, t: any): Promise<void> {
    if (value && !patterns.validateURL.pattern.test(value)) {
        return Promise.reject(new Error(t('validation:urlInvalid')));
    }

    return Promise.resolve();
}

const validateOverlapSize: (t: any) => RuleRender = (t: any) => ({ getFieldValue }): RuleObject => ({
    validator(_: RuleObject, value?: string | number): Promise<void> {
        if (typeof value !== 'undefined' && value !== '') {
            const segmentSize = getFieldValue('segmentSize');
            if (typeof segmentSize !== 'undefined' && segmentSize !== '') {
                if (+segmentSize <= +value) {
                    return Promise.reject(new Error(t('validation:segmentSizeOverlap')));
                }
            }
        }

        return Promise.resolve();
    },
});

const validateStopFrame: (t: any) => RuleRender = (t: any) => ({ getFieldValue }): RuleObject => ({
    validator(_: RuleObject, value?: string | number): Promise<void> {
        if (typeof value !== 'undefined' && value !== '') {
            const startFrame = getFieldValue('startFrame');
            if (typeof startFrame !== 'undefined' && startFrame !== '') {
                if (+startFrame > +value) {
                    return Promise.reject(new Error(t('validation:startFrameStopFrame')));
                }
            }
        }

        return Promise.resolve();
    },
});

class AdvancedConfigurationForm extends React.PureComponent<Props> {
    private formRef: RefObject<FormInstance>;

    public constructor(props: Props) {
        super(props);
        this.formRef = React.createRef<FormInstance>();
    }

    public submit(): Promise<void> {
        const { onSubmit, projectId } = this.props;

        if (this.formRef.current) {
            if (projectId) {
                return Promise.all([
                    core.projects.get({ id: projectId }),
                    this.formRef.current.validateFields(),
                ]).then(([getProjectResponse, values]) => {
                    const [project] = getProjectResponse;
                    const frameFilter = values.frameStep ? `step=${values.frameStep}` : undefined;
                    const entries = Object.entries(values).filter(
                        (entry: [string, unknown]): boolean => entry[0] !== frameFilter,
                    );

                    return onSubmit({
                        ...((Object.fromEntries(entries) as any) as AdvancedConfiguration),
                        frameFilter,
                        sourceStorage: values.useProjectSourceStorage ?
                            new Storage(project.sourceStorage || { location: StorageLocation.LOCAL }) :
                            new Storage(values.sourceStorage),
                        targetStorage: values.useProjectTargetStorage ?
                            new Storage(project.targetStorage || { location: StorageLocation.LOCAL }) :
                            new Storage(values.targetStorage),
                    });
                });
            }

            return this.formRef.current.validateFields()
                .then(
                    (values: Store): Promise<void> => {
                        const frameFilter = values.frameStep ? `step=${values.frameStep}` : undefined;
                        const entries = Object.entries(values).filter(
                            (entry: [string, unknown]): boolean => entry[0] !== frameFilter,
                        );

                        return onSubmit({
                            ...((Object.fromEntries(entries) as any) as AdvancedConfiguration),
                            frameFilter,
                            sourceStorage: new Storage(values.sourceStorage),
                            targetStorage: new Storage(values.targetStorage),
                        });
                    },
                );
        }

        return Promise.reject(new Error('Form ref is empty'));
    }

    public resetFields(): void {
        if (this.formRef.current) {
            this.formRef.current.resetFields();
        }
    }

    /* eslint-disable class-methods-use-this */
    private renderCopyDataCheckbox(): JSX.Element {
        const { t } = this.props;
        return (
            <Form.Item
                help={t('tasks:createTask.copyData.help')}
                name='copyData'
                valuePropName='checked'
            >
                <Checkbox>
                    <Text className='cvat-text-color'>{t('tasks:createTask.copyData.label')}</Text>
                </Checkbox>
            </Form.Item>
        );
    }

    private renderSortingMethodRadio(): JSX.Element {
        const { onChangeSortingMethod, t } = this.props;

        return (
            <Form.Item
                label={t('tasks:createTask.sortingMethod.label')}
                name='sortingMethod'
                rules={[
                    {
                        required: true,
                        message: t('validation:required'),
                    },
                ]}
                help={t('tasks:createTask.sortingMethod.help')}
            >
                <Radio.Group buttonStyle='solid' onChange={(e) => onChangeSortingMethod(e.target.value)}>
                    <Radio.Button value={SortingMethod.LEXICOGRAPHICAL} key={SortingMethod.LEXICOGRAPHICAL}>
                        {t('tasks:createTask.sortingMethod.lexicographical')}
                    </Radio.Button>
                    <Radio.Button value={SortingMethod.NATURAL} key={SortingMethod.NATURAL}>
                        {t('tasks:createTask.sortingMethod.natural')}
                    </Radio.Button>
                    <Radio.Button value={SortingMethod.PREDEFINED} key={SortingMethod.PREDEFINED}>
                        {t('tasks:createTask.sortingMethod.predefined')}
                    </Radio.Button>
                    <Radio.Button value={SortingMethod.RANDOM} key={SortingMethod.RANDOM}>
                        {t('tasks:createTask.sortingMethod.random')}
                    </Radio.Button>
                </Radio.Group>
            </Form.Item>
        );
    }

    private renderImageQuality(): JSX.Element {
        const { t } = this.props;
        return (
            <CVATTooltip title={t('tasks:createTask.imageQuality.tooltip')}>
                <Form.Item
                    label={t('tasks:createTask.imageQuality.label')}
                    name='imageQuality'
                    rules={[
                        {
                            required: true,
                            message: t('validation:required'),
                        },
                        { validator: isInteger({ min: 5, max: 100 }) },
                    ]}
                >
                    <Input size='large' type='number' min={5} max={100} suffix={<PercentageOutlined />} />
                </Form.Item>
            </CVATTooltip>
        );
    }

    private renderOverlap(): JSX.Element {
        const { t } = this.props;
        return (
            <CVATTooltip title={t('tasks:createTask.overlapSize.tooltip')}>
                <Form.Item
                    label={t('tasks:createTask.overlapSize.label')}
                    name='overlapSize'
                    dependencies={['segmentSize']}
                    rules={[{ validator: isInteger({ min: 0 }) }, validateOverlapSize(t)]}
                >
                    <Input size='large' type='number' min={0} />
                </Form.Item>
            </CVATTooltip>
        );
    }

    private renderSegmentSize(): JSX.Element {
        const { t } = this.props;
        return (
            <CVATTooltip title={t('tasks:createTask.segmentSize.tooltip')}>
                <Form.Item label={t('tasks:createTask.segmentSize.label')} name='segmentSize' rules={[{ validator: isInteger({ min: 1 }) }]}>
                    <Input size='large' type='number' min={1} />
                </Form.Item>
            </CVATTooltip>
        );
    }

    private renderStartFrame(): JSX.Element {
        const { t } = this.props;
        return (
            <Form.Item label={t('tasks:createTask.startFrame.label')} name='startFrame' rules={[{ validator: isInteger({ min: 0 }) }]}>
                <Input size='large' type='number' min={0} step={1} />
            </Form.Item>
        );
    }

    private renderStopFrame(): JSX.Element {
        const { t } = this.props;
        return (
            <Form.Item
                label={t('tasks:createTask.stopFrame.label')}
                name='stopFrame'
                dependencies={['startFrame']}
                rules={[{ validator: isInteger({ min: 0 }) }, validateStopFrame(t)]}
            >
                <Input size='large' type='number' min={0} step={1} />
            </Form.Item>
        );
    }

    private renderFrameStep(): JSX.Element {
        const { t } = this.props;
        return (
            <Form.Item label={t('tasks:createTask.frameStep.label')} name='frameStep' rules={[{ validator: isInteger({ min: 1 }) }]}>
                <Input size='large' type='number' min={1} step={1} />
            </Form.Item>
        );
    }

    private renderBugTracker(): JSX.Element {
        const { t } = this.props;
        return (
            <Form.Item
                hasFeedback
                name='bugTracker'
                label={t('tasks:createTask.bugTracker.label')}
                extra={t('tasks:createTask.bugTracker.extra')}
                rules={[{ validator: (_: RuleObject, value: string) => validateURL(_, value, t) }]}
            >
                <Input size='large' />
            </Form.Item>
        );
    }

    private renderUzeZipChunks(): JSX.Element {
        const { t } = this.props;
        return (
            <Space>
                <Form.Item
                    name='useZipChunks'
                    valuePropName='checked'
                    className='cvat-settings-switch'
                >
                    <Switch />
                </Form.Item>
                <Text className='cvat-text-color'>{t('tasks:createTask.useZipChunks.label')}</Text>
                <Tooltip title={t('tasks:createTask.useZipChunks.tooltip')}>
                    <QuestionCircleOutlined style={{ opacity: 0.5 }} />
                </Tooltip>
            </Space>
        );
    }

    private renderCreateTaskMethod(): JSX.Element {
        const { t } = this.props;
        return (
            <Space>
                <Form.Item
                    name='useCache'
                    valuePropName='checked'
                    className='cvat-settings-switch'
                >
                    <Switch defaultChecked />
                </Form.Item>
                <Text className='cvat-text-color'>{t('tasks:createTask.useCache.label')}</Text>
                <Tooltip title={t('tasks:createTask.useCache.tooltip')}>
                    <QuestionCircleOutlined style={{ opacity: 0.5 }} />
                </Tooltip>
            </Space>
        );
    }

    private renderChunkSize(): JSX.Element {
        const { t } = this.props;
        return (
            <CVATTooltip title={t('tasks:createTask.chunkSize.tooltip')}>
                <Form.Item label={t('tasks:createTask.chunkSize.label')} name='dataChunkSize' rules={[{ validator: isInteger({ min: 1 }) }]}>
                    <Input size='large' type='number' />
                </Form.Item>
            </CVATTooltip>
        );
    }

    private renderConsensusReplicas(): JSX.Element {
        const { t } = this.props;
        return (
            <Form.Item
                label={t('tasks:createTask.consensusReplicas.label')}
                name='consensusReplicas'
                rules={[
                    {
                        validator: isInteger({
                            min: 0,
                            max: 10,
                            filter: (intValue: number): boolean => intValue !== 1,
                        }),
                    },
                ]}
            >
                <Input
                    size='large'
                    type='number'
                    min={0}
                    max={10}
                    step={1}
                />
            </Form.Item>
        );
    }

    private renderSourceStorage(): JSX.Element {
        const {
            projectId,
            useProjectSourceStorage,
            sourceStorageLocation,
            onChangeUseProjectSourceStorage,
            onChangeSourceStorageLocation,
            t,
        } = this.props;
        return (
            <SourceStorageField
                instanceId={projectId}
                locationValue={sourceStorageLocation}
                switchDescription={t('tasks:createTask.sourceStorage.switchDescription')}
                storageDescription={t('tasks:createTask.sourceStorage.storageDescription')}
                useDefaultStorage={useProjectSourceStorage}
                onChangeUseDefaultStorage={onChangeUseProjectSourceStorage}
                onChangeLocationValue={onChangeSourceStorageLocation}
            />
        );
    }

    private renderTargetStorage(): JSX.Element {
        const {
            projectId,
            useProjectTargetStorage,
            targetStorageLocation,
            onChangeUseProjectTargetStorage,
            onChangeTargetStorageLocation,
            t,
        } = this.props;
        return (
            <TargetStorageField
                instanceId={projectId}
                locationValue={targetStorageLocation}
                switchDescription={t('tasks:createTask.targetStorage.switchDescription')}
                storageDescription={t('tasks:createTask.targetStorage.storageDescription')}
                useDefaultStorage={useProjectTargetStorage}
                onChangeUseDefaultStorage={onChangeUseProjectTargetStorage}
                onChangeLocationValue={onChangeTargetStorageLocation}
            />
        );
    }

    public render(): JSX.Element {
        const { activeFileManagerTab } = this.props;
        return (
            <Form initialValues={initialValues} ref={this.formRef} layout='vertical'>
                <Row>
                    <Col>{this.renderSortingMethodRadio()}</Col>
                </Row>
                {activeFileManagerTab === 'share' ? (
                    <Row>
                        <Col>{this.renderCopyDataCheckbox()}</Col>
                    </Row>
                ) : null}
                <Row>
                    <Col span={12}>{this.renderUzeZipChunks()}</Col>
                    <Col span={12}>{this.renderCreateTaskMethod()}</Col>
                </Row>
                <Row justify='start'>
                    <Col span={7}>{this.renderImageQuality()}</Col>
                    <Col span={7} offset={1}>
                        {this.renderOverlap()}
                    </Col>
                    <Col span={7} offset={1}>
                        {this.renderSegmentSize()}
                    </Col>
                </Row>

                <Row justify='start'>
                    <Col span={7}>{this.renderStartFrame()}</Col>
                    <Col span={7} offset={1}>
                        {this.renderStopFrame()}
                    </Col>
                    <Col span={7} offset={1}>
                        {this.renderFrameStep()}
                    </Col>
                </Row>

                <Row justify='start'>
                    <Col span={7}>{this.renderChunkSize()}</Col>
                </Row>
                <Row justify='start'>
                    <Col span={7}>
                        {this.renderConsensusReplicas()}
                    </Col>
                </Row>

                <Row>
                    <Col span={24}>{this.renderBugTracker()}</Col>
                </Row>
                <Row justify='space-between'>
                    <Col span={11}>
                        {this.renderSourceStorage()}
                    </Col>
                    <Col span={11} offset={1}>
                        {this.renderTargetStorage()}
                    </Col>
                </Row>
            </Form>
        );
    }
}

function AdvancedConfigurationFormWrapper(props: Omit<Props, 't'>): JSX.Element {
    const { t } = useTranslation(['tasks', 'validation']);
    return <AdvancedConfigurationForm {...props} t={t} />;
}

export default AdvancedConfigurationFormWrapper;
