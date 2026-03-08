// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { Link } from 'react-router-dom';
import Text from 'antd/lib/typography/Text';
import { Row, Col } from 'antd/lib/grid';
import { useTranslation } from 'react-i18next';

import Empty from 'antd/lib/empty';

interface Props {
    notFound: boolean;
}

function EmptyListComponent(props: Props): JSX.Element {
    const { notFound } = props;
    const { t } = useTranslation('tasks');

    return (
        <div className='cvat-empty-tasks-list'>
            <Empty description={notFound ?
                (<Text strong>{t('emptyList.noResultsMatched')}</Text>) : (
                    <>
                        <Row justify='center' align='middle'>
                            <Col>
                                <Text strong>{t('emptyList.noTasksCreated')}</Text>
                            </Col>
                        </Row>
                        <Row justify='center' align='middle'>
                            <Col>
                                <Text type='secondary'>{t('emptyList.getStarted')}</Text>
                            </Col>
                        </Row>
                        <Row justify='center' align='middle'>
                            <Col>
                                <Link to='/tasks/create'>{t('emptyList.createNewTask')}</Link>
                                <Text type='secondary'>{t('emptyList.orTryTo')}</Text>
                                <Link to='/projects/create'>{t('emptyList.createNewProject')}</Link>
                            </Col>
                        </Row>
                    </>
                )}
            />
        </div>
    );
}

export default React.memo(EmptyListComponent);
