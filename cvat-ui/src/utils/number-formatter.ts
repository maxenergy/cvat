// Copyright (C) 2025 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

/**
 * Formats a number according to the specified locale
 * @param value - The number to format
 * @param locale - The locale to use for formatting (e.g., 'en', 'zh')
 * @param options - Optional Intl.NumberFormat options
 * @returns Formatted number string
 */
export function formatNumber(
    value: number,
    locale: string = 'en',
    options?: Intl.NumberFormatOptions,
): string {
    const localeMap: Record<string, string> = {
        en: 'en-US',
        zh: 'zh-CN',
    };

    const fullLocale = localeMap[locale] || locale;

    try {
        return new Intl.NumberFormat(fullLocale, options).format(value);
    } catch (error) {
        // Fallback to English if locale is not supported
        return new Intl.NumberFormat('en-US', options).format(value);
    }
}

/**
 * Formats a file size in bytes to a human-readable string with appropriate units
 * @param bytes - The file size in bytes
 * @param locale - The locale to use for formatting (e.g., 'en', 'zh')
 * @param decimals - Number of decimal places to show (default: 2)
 * @returns Formatted file size string with localized units
 */
export function formatFileSize(
    bytes: number,
    locale: string = 'en',
    decimals: number = 2,
): string {
    if (bytes === 0) {
        return locale === 'zh' ? '0 字节' : '0 Bytes';
    }

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;

    // Define units for English and Chinese
    const unitsEn = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const unitsZh = ['字节', '千字节', '兆字节', '吉字节', '太字节', '拍字节'];

    const units = locale === 'zh' ? unitsZh : unitsEn;

    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
    const value = bytes / (k ** i);

    // Format the number part according to locale
    const formattedValue = formatNumber(value, locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: dm,
    });

    return `${formattedValue} ${units[i]}`;
}

/**
 * Formats a currency value according to the specified locale
 * @param value - The currency value to format
 * @param locale - The locale to use for formatting (e.g., 'en', 'zh')
 * @param currency - The currency code (e.g., 'USD', 'CNY')
 * @returns Formatted currency string
 */
export function formatCurrency(
    value: number,
    locale: string = 'en',
    currency: string = 'USD',
): string {
    const localeMap: Record<string, string> = {
        en: 'en-US',
        zh: 'zh-CN',
    };

    const fullLocale = localeMap[locale] || locale;

    try {
        return new Intl.NumberFormat(fullLocale, {
            style: 'currency',
            currency,
        }).format(value);
    } catch (error) {
        // Fallback to English if locale is not supported
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(value);
    }
}
