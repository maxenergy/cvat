// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Text from 'antd/lib/typography/Text';
import { Row, Col } from 'antd/lib/grid';
import Empty from 'antd/lib/empty';

interface Props {
    notFound: boolean;
}

export default function EmptyListComponent(props: Props): JSX.Element {
    const { notFound } = props;
    const { t } = useTranslation('projects');

    return (
        <div className='cvat-empty-projects-list'>
            <Empty description={notFound ? (
                <Text strong>{t('emptyList.noResultsMatched')}</Text>
            ) : (
                <>
                    <Row justify='center' align='middle'>
                        <Col>
                            <Text strong>{t('emptyList.noProjectsCreated')}</Text>
                        </Col>
                    </Row>
                    <Row justify='center' align='middle'>
                        <Col>
                            <Text type='secondary'>{t('emptyList.getStarted')}</Text>
                        </Col>
                    </Row>
                    <Row justify='center' align='middle'>
                        <Col>
                            <Link to='/projects/create'>{t('emptyList.createNewOne')}</Link>
                        </Col>
                    </Row>
                </>
            )}
            />
        </div>
    );
}
