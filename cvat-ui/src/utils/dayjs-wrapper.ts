// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import dayjs from 'dayjs';

import advancedFormat from 'dayjs/plugin/advancedFormat';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localeData from 'dayjs/plugin/localeData';
import relativeTime from 'dayjs/plugin/relativeTime';
import weekday from 'dayjs/plugin/weekday';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import weekYear from 'dayjs/plugin/weekYear';
import duration from 'dayjs/plugin/duration';
import utc from 'dayjs/plugin/utc';

// Import dayjs locales for i18n support
import 'dayjs/locale/en';
import 'dayjs/locale/zh-cn';

dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);
dayjs.extend(relativeTime);
dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(weekOfYear);
dayjs.extend(weekYear);
dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(utc);

/**
 * Sets the dayjs locale based on the application language
 * @param language - The language code ('en' or 'zh')
 */
export const setDayjsLocale = (language: string): void => {
    const localeMap: Record<string, string> = {
        en: 'en',
        zh: 'zh-cn',
    };

    const dayjsLocale = localeMap[language] || localeMap.en;
    dayjs.locale(dayjsLocale);
};

export default dayjs;
