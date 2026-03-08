// Copyright (C) 2025 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from '../locales/en/common.json';
import enAuth from '../locales/en/auth.json';
import enTasks from '../locales/en/tasks.json';
import enProjects from '../locales/en/projects.json';
import enJobs from '../locales/en/jobs.json';
import enModels from '../locales/en/models.json';
import enAnnotations from '../locales/en/annotations.json';
import enCloudStorage from '../locales/en/cloudStorage.json';
import enOrganizations from '../locales/en/organizations.json';
import enWebhooks from '../locales/en/webhooks.json';
import enSettings from '../locales/en/settings.json';
import enErrors from '../locales/en/errors.json';
import enValidation from '../locales/en/validation.json';

import zhCommon from '../locales/zh/common.json';
import zhAuth from '../locales/zh/auth.json';
import zhTasks from '../locales/zh/tasks.json';
import zhProjects from '../locales/zh/projects.json';
import zhJobs from '../locales/zh/jobs.json';
import zhModels from '../locales/zh/models.json';
import zhAnnotations from '../locales/zh/annotations.json';
import zhCloudStorage from '../locales/zh/cloudStorage.json';
import zhOrganizations from '../locales/zh/organizations.json';
import zhWebhooks from '../locales/zh/webhooks.json';
import zhSettings from '../locales/zh/settings.json';
import zhErrors from '../locales/zh/errors.json';
import zhValidation from '../locales/zh/validation.json';

// Initialize i18next with configuration
i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: {
                common: enCommon,
                auth: enAuth,
                tasks: enTasks,
                projects: enProjects,
                jobs: enJobs,
                models: enModels,
                annotations: enAnnotations,
                cloudStorage: enCloudStorage,
                organizations: enOrganizations,
                webhooks: enWebhooks,
                settings: enSettings,
                errors: enErrors,
                validation: enValidation,
            },
            zh: {
                common: zhCommon,
                auth: zhAuth,
                tasks: zhTasks,
                projects: zhProjects,
                jobs: zhJobs,
                models: zhModels,
                annotations: zhAnnotations,
                cloudStorage: zhCloudStorage,
                organizations: zhOrganizations,
                webhooks: zhWebhooks,
                settings: zhSettings,
                errors: zhErrors,
                validation: zhValidation,
            },
        },
        fallbackLng: 'en',
        defaultNS: 'common',
        ns: [
            'common',
            'auth',
            'tasks',
            'projects',
            'jobs',
            'models',
            'annotations',
            'cloudStorage',
            'organizations',
            'webhooks',
            'settings',
            'errors',
            'validation',
        ],
        interpolation: {
            escapeValue: false, // React already escapes values
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'cvat-language',
        },
        react: {
            useSuspense: false, // Set to false to avoid suspense issues during initial setup
        },
        debug: process.env.NODE_ENV === 'development',
    });

export default i18n;
