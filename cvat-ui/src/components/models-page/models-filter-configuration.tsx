// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import { Config } from '@react-awesome-query-builder/antd';
import asyncFetchUsers from 'components/resource-sorting-filtering/request-users';
import i18n from 'config/i18n';

export const config: Partial<Config> = {
    fields: {
        description: {
            label: () => i18n.t('models:filterConfig.description'),
            type: 'text',
            valueSources: ['value'],
            operators: ['like'],
        },
        target_url: {
            label: () => i18n.t('models:filterConfig.targetUrl'),
            type: 'text',
            valueSources: ['value'],
            operators: ['like'],
        },
        owner: {
            label: () => i18n.t('models:filterConfig.owner'),
            type: 'select',
            valueSources: ['value'],
            operators: ['select_equals'],
            fieldSettings: {
                useAsyncSearch: true,
                forceAsyncSearch: true,
                asyncFetch: asyncFetchUsers,
            },
        },
        updated_date: {
            label: () => i18n.t('models:filterConfig.lastUpdated'),
            type: 'datetime',
            operators: ['between', 'greater', 'greater_or_equal', 'less', 'less_or_equal'],
        },
        type: {
            label: () => i18n.t('models:filterConfig.type'),
            type: 'select',
            valueSources: ['value'],
            fieldSettings: {
                listValues: [
                    { value: 'organization', title: () => i18n.t('models:filterConfig.organization') },
                    { value: 'project', title: () => i18n.t('models:filterConfig.project') },
                ],
            },
        },
        id: {
            label: () => i18n.t('models:filterConfig.id'),
            type: 'number',
            operators: ['equal', 'between', 'greater', 'greater_or_equal', 'less', 'less_or_equal'],
            fieldSettings: { min: 0 },
            valueSources: ['value'],
        },
    },
};

export const localStorageRecentCapacity = 10;
export const localStorageRecentKeyword = 'recentlyAppliedWebhooksFilters';
export const predefinedFilterValues = {};
