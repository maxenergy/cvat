// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { TasksQuery } from 'reducers';
import { CSVColumn } from 'utils/csv-writer';
import { getCore, Task } from 'cvat-core-wrapper';
import { useTranslation } from 'react-i18next';
import createCSVExportButton from '../export-csv-button-hoc';

const cvat = getCore();

const TasksCSVExportButton = () => {
    const { t } = useTranslation('tasks');

    const columns: CSVColumn<Task>[] = [
        { header: t('csvExport.id'), accessor: (task) => task.id },
        { header: t('csvExport.name'), accessor: (task) => task.name },
        { header: t('csvExport.taskUrl'), accessor: (task) => `${window.location.origin}/tasks/${task.id}` },
        { header: t('csvExport.projectId'), accessor: (task) => task.projectId },
        { header: t('csvExport.projectName'), accessor: (task) => task.projectName ?? '' },
        { header: t('csvExport.projectUrl'), accessor: (task) => (task.projectId ? `${window.location.origin}/projects/${task.projectId}` : '') },
        { header: t('csvExport.owner'), accessor: (task) => task.owner?.username ?? '' },
        { header: t('csvExport.assignee'), accessor: (task) => task.assignee?.username ?? '' },
        { header: t('csvExport.status'), accessor: (task) => task.status },
        { header: t('csvExport.mode'), accessor: (task) => task.mode },
        { header: t('csvExport.size'), accessor: (task) => task.size },
        { header: t('csvExport.subset'), accessor: (task) => task.subset ?? '' },
        {
            header: t('csvExport.createdDate'),
            accessor: (task) => task.createdDate,
        },
        {
            header: t('csvExport.updatedDate'),
            accessor: (task) => task.updatedDate,
        },
        { header: t('csvExport.bugTracker'), accessor: (task) => task.bugTracker ?? '' },
    ];

    const ExportButton = createCSVExportButton<Task, TasksQuery>({
        resourceName: 'tasks',
        className: 'cvat-tasks-export-csv-button',
        tooltipTitle: t('topBar.exportToCSV'),
        columns,
        uniqueKey: 'id',
        fetchPage: async (query) => {
            const tasks = await cvat.tasks.get(query);
            return {
                results: tasks,
                count: tasks.count,
            };
        },
    });

    return <ExportButton />;
};

export default TasksCSVExportButton;
