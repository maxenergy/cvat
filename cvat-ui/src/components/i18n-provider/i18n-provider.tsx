// Copyright (C) 2025 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React, { PropsWithChildren, useEffect } from 'react';
import { ConfigProvider } from 'antd';
import type { Locale } from 'antd/es/locale';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import { useSelector } from 'react-redux';
import { I18nextProvider } from 'react-i18next';

import i18n from 'config/i18n';
import { CombinedState, selectCurrentLanguage } from 'reducers';
import { setDayjsLocale } from 'utils/dayjs-wrapper';

const ANT_DESIGN_LOCALES: Record<string, Locale> = {
    en: enUS,
    zh: zhCN,
};

function I18nProvider({ children }: PropsWithChildren): JSX.Element {
    const currentLanguage = useSelector((state: CombinedState) => selectCurrentLanguage(state));

    useEffect(() => {
        // Synchronize dayjs locale with current language
        setDayjsLocale(currentLanguage);
    }, [currentLanguage]);

    const antDesignLocale = ANT_DESIGN_LOCALES[currentLanguage] || ANT_DESIGN_LOCALES.en;

    return (
        <I18nextProvider i18n={i18n}>
            <ConfigProvider locale={antDesignLocale}>
                {children}
            </ConfigProvider>
        </I18nextProvider>
    );
}

export default I18nProvider;
