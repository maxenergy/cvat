// Copyright (C) 2025 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import { AnyAction } from 'redux';
import { I18nActionTypes } from 'actions/i18n-actions';
import { AuthActionTypes } from 'actions/auth-actions';
import { I18nState } from '.';

const defaultState: I18nState = {
    currentLanguage: 'en',
    availableLanguages: ['en', 'zh'],
    isLoading: false,
    error: null,
};

export default (state = defaultState, action: AnyAction): I18nState => {
    switch (action.type) {
        case I18nActionTypes.CHANGE_LANGUAGE_REQUEST: {
            return {
                ...state,
                isLoading: true,
                error: null,
            };
        }
        case I18nActionTypes.CHANGE_LANGUAGE_SUCCESS: {
            return {
                ...state,
                currentLanguage: action.payload.language,
                isLoading: false,
                error: null,
            };
        }
        case I18nActionTypes.CHANGE_LANGUAGE_FAILURE: {
            return {
                ...state,
                isLoading: false,
                error: action.payload.error,
            };
        }
        case I18nActionTypes.LOAD_LANGUAGE_PREFERENCE: {
            return {
                ...state,
                currentLanguage: action.payload.language,
            };
        }
        case AuthActionTypes.LOGOUT_SUCCESS: {
            // Preserve language preference on logout
            return {
                ...state,
            };
        }
        default: {
            return state;
        }
    }
};
