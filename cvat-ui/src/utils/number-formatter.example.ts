// Copyright (C) 2025 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

/**
 * Example usage of number formatting utilities
 * This file demonstrates how to use formatNumber, formatFileSize, and formatCurrency
 * in the CVAT UI application with i18n support.
 */

import { formatNumber, formatFileSize, formatCurrency } from './number-formatter';
import i18n from '../config/i18n';

// Example 1: Format numbers based on current locale
export function displayFormattedNumber(value: number): string {
    const currentLocale = i18n.language; // 'en' or 'zh'
    return formatNumber(value, currentLocale);
}

// Example 2: Format file sizes for display
export function displayFileSize(bytes: number): string {
    const currentLocale = i18n.language;
    return formatFileSize(bytes, currentLocale);
}

// Example 3: Format currency values
export function displayPrice(amount: number, currency: string = 'USD'): string {
    const currentLocale = i18n.language;
    return formatCurrency(amount, currentLocale, currency);
}

// Example 4: Usage in React components
/*
import { useTranslation } from 'react-i18next';
import { formatFileSize } from 'utils/number-formatter';

function FileUploadComponent() {
    const { i18n } = useTranslation();
    const fileSize = 1048576; // 1 MB in bytes

    return (
        <div>
            File size: {formatFileSize(fileSize, i18n.language)}
        </div>
    );
}
*/

// Example outputs:
// English: formatNumber(1234.56, 'en') => "1,234.56"
// Chinese: formatNumber(1234.56, 'zh') => "1,234.56"
// English: formatFileSize(1048576, 'en') => "1 MB"
// Chinese: formatFileSize(1048576, 'zh') => "1 兆字节"
// English: formatCurrency(99.99, 'en', 'USD') => "$99.99"
// Chinese: formatCurrency(99.99, 'zh', 'CNY') => "¥99.99"
