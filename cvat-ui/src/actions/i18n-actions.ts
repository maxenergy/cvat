// Copyright (C) 2025 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import { AnyAction } from 'redux';
import { ActionUnion, createAction, ThunkAction } from 'utils/redux';
import i18n from 'config/i18n';

export enum I18nActionTypes {
    CHANGE_LANGUAGE_REQUEST = 'CHANGE_LANGUAGE_REQUEST',
    CHANGE_LANGUAGE_SUCCESS = 'CHANGE_LANGUAGE_SUCCESS',
    CHANGE_LANGUAGE_FAILURE = 'CHANGE_LANGUAGE_FAILURE',
    LOAD_LANGUAGE_PREFERENCE = 'LOAD_LANGUAGE_PREFERENCE',
}

export const i18nActions = {
    changeLanguageRequest: () => createAction(I18nActionTypes.CHANGE_LANGUAGE_REQUEST),
    changeLanguageSuccess: (language: string) => createAction(I18nActionTypes.CHANGE_LANGUAGE_SUCCESS, { language }),
    changeLanguageFailure: (error: string) => createAction(I18nActionTypes.CHANGE_LANGUAGE_FAILURE, { error }),
    loadLanguagePreference: (language: string) => createAction(I18nActionTypes.LOAD_LANGUAGE_PREFERENCE, { language }),
};

export type I18nActions = ActionUnion<typeof i18nActions>;

export function changeLanguageAsync(language: string): ThunkAction {
    return async (dispatch): Promise<void> => {
        dispatch(i18nActions.changeLanguageRequest());

        try {
            await i18n.changeLanguage(language);
            localStorage.setItem('cvat-language', language);

            dispatch(i18nActions.changeLanguageSuccess(language));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to change language';
            dispatch(i18nActions.changeLanguageFailure(errorMessage));
        }
    };
}

export function loadLanguagePreferenceAsync(): ThunkAction {
    return async (dispatch): Promise<void> => {
        const savedLanguage = localStorage.getItem('cvat-language');
        const language = savedLanguage || i18n.language || 'en';

        if (savedLanguage && savedLanguage !== i18n.language) {
            await i18n.changeLanguage(savedLanguage);
        }

        dispatch(i18nActions.loadLanguagePreference(language));
    };
}
