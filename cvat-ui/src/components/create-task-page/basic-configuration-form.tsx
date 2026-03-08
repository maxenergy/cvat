// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React, { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import Input from 'antd/lib/input';
import Text from 'antd/lib/typography/Text';
import Tooltip from 'antd/lib/tooltip';
import Form, { FormInstance } from 'antd/lib/form';
import { QuestionCircleOutlined } from '@ant-design/icons';

export interface BaseConfiguration {
    name: string;
}

interface Props {
    onChange(values: BaseConfiguration): void;
    many: boolean;
    exampleMultiTaskName?: string;
}

class BasicConfigurationFormComponent extends React.PureComponent<Props & { t: any }> {
    private formRef: RefObject<FormInstance>;
    private inputRef: RefObject<Input>;
    private initialName: string;

    public constructor(props: Props) {
        super(props);
        this.formRef = React.createRef<FormInstance>();
        this.inputRef = React.createRef<Input>();

        const { many } = this.props;
        this.initialName = many ? '{{file_name}}' : '';
    }

    componentDidMount(): void {
        const { onChange } = this.props;
        onChange({
            name: this.initialName,
        });
    }

    private handleChangeName(e: React.ChangeEvent<HTMLInputElement>): void {
        const { onChange } = this.props;
        onChange({
            name: e.target.value,
        });
    }

    public submit(): Promise<void> {
        if (this.formRef.current) {
            return this.formRef.current.validateFields();
        }

        return Promise.reject(new Error('Form ref is empty'));
    }

    public resetFields(): void {
        if (this.formRef.current) {
            this.formRef.current.resetFields();
        }
    }

    public focus(): void {
        if (this.inputRef.current) {
            this.inputRef.current.focus();
        }
    }

    public render(): JSX.Element {
        const { many, exampleMultiTaskName, t } = this.props;

        return (
            <Form ref={this.formRef} layout='vertical'>
                <Form.Item
                    className={many ? 'cvat-task-name-field-has-tooltip' : ''}
                    hasFeedback
                    name='name'
                    label={<span>{t('tasks:createTask.name')}</span>}
                    rules={[
                        {
                            required: true,
                            message: t('validation:taskNameEmpty'),
                        },
                    ]}
                    initialValue={this.initialName}
                >
                    <Input
                        ref={this.inputRef}
                        onChange={(e) => this.handleChangeName(e)}
                    />
                </Form.Item>
                {many ? (
                    <Text type='secondary'>
                        <Tooltip title={() => (
                            <>
                                {t('tasks:createTask.nameTemplate.youCanUse')}
                                <ul>
                                    <li>
                                        {t('tasks:createTask.nameTemplate.someText')}
                                    </li>
                                    <li>
                                        {'{{'}
                                        index
                                        {'}}'}
                                        &nbsp;- {t('tasks:createTask.nameTemplate.index')}
                                    </li>
                                    <li>
                                        {'{{'}
                                        file_name
                                        {'}}'}
                                        &nbsp;- {t('tasks:createTask.nameTemplate.fileName')}
                                    </li>
                                </ul>
                                {t('tasks:createTask.nameTemplate.example')}&nbsp;
                                <i>
                                    {exampleMultiTaskName || 'Task name 1 - video_1.mp4'}
                                </i>
                            </>
                        )}
                        >
                            {t('tasks:createTask.nameTemplate.tooltip')}
                            {' '}
                            <QuestionCircleOutlined />
                        </Tooltip>
                    </Text>
                ) : null}
            </Form>
        );
    }
}

export default function BasicConfigurationForm(props: Props): JSX.Element {
    const { t } = useTranslation(['tasks', 'validation']);
    return <BasicConfigurationFormComponent {...props} t={t} />;
}
