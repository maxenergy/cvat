// Copyright (C) 2025 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import './language-switcher.scss';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GlobalOutlined, CheckOutlined } from '@ant-design/icons';
import Dropdown from 'antd/lib/dropdown';
import Button from 'antd/lib/button';
import type { MenuProps } from 'antd';

import { CombinedState } from 'reducers';
import { changeLanguageAsync } from 'actions/i18n-actions';
import CVATTooltip from 'components/common/cvat-tooltip';

interface LanguageSwitcherProps {
    className?: string;
}

const languageOptions = [
    { code: 'en', name: 'English' },
    { code: 'zh', name: '中文' },
];

function LanguageSwitcher(props: LanguageSwitcherProps): JSX.Element {
    const { className } = props;
    const dispatch = useDispatch();
    const currentLanguage = useSelector((state: CombinedState) => state.i18n.currentLanguage);

    const handleLanguageChange = (languageCode: string): void => {
        if (languageCode !== currentLanguage) {
            dispatch(changeLanguageAsync(languageCode));
        }
    };

    const menuItems: MenuProps['items'] = languageOptions.map((lang) => ({
        key: lang.code,
        label: (
            <span>
                {lang.name}
                {currentLanguage === lang.code ? (
                    <CheckOutlined style={{ marginLeft: 8, color: '#1890ff' }} />
                ) : null}
            </span>
        ),
        onClick: () => handleLanguageChange(lang.code),
    }));

    const currentLanguageName = languageOptions.find((lang) => lang.code === currentLanguage)?.name || 'English';

    return (
        <CVATTooltip overlay='Switch language'>
            <Dropdown
                trigger={['click']}
                placement='bottomRight'
                menu={{ items: menuItems }}
                className={className}
            >
                <Button
                    icon={<GlobalOutlined />}
                    size='large'
                    className='cvat-language-switcher-button cvat-header-button'
                    type='link'
                    aria-label={`Current language: ${currentLanguageName}`}
                />
            </Dropdown>
        </CVATTooltip>
    );
}

export default React.memo(LanguageSwitcher);
