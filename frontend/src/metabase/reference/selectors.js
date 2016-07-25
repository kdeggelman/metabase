import { createSelector } from 'reselect';
import i from "icepick";

import Query, { AggregationClause } from 'metabase/lib/query';
import { titleize, humanize } from "metabase/lib/formatting";

// there might be a better way to organize sections
// it feels like I'm duplicating a lot of routing logic here
//TODO: refactor to use different container components for each section
// initialize section metadata in there
const referenceSections = {
    [`/reference/guide`]: {
        id: `/reference/guide`,
        name: "Understanding our data",
        breadcrumb: "Guide",
        icon: "all"
    },
    [`/reference/metrics`]: {
        id: `/reference/metrics`,
        name: "Metrics",
        empty: {
            title: "Metrics are the official numbers that your team cares about",
            adminMessage: "Defining common metrics for your team makes it even easier to ask questions",
            message: "Metrics will appear here once your admins have created some",
            image: "/app/img/metrics-list",
            adminAction: "Create a metric",
            adminLink: "http://www.metabase.com/docs/latest/administration-guide/05-segments-and-metrics.html"
        },
        breadcrumb: "Metrics",
        // mapping of propname to args of dispatch function
        fetch: {fetchMetrics: []},
        get: 'getMetrics',
        icon: "ruler",
        headerIcon: "ruler"
    },
    [`/reference/segments`]: {
        id: `/reference/segments`,
        name: "Segments",
        empty: {
            title: "Segments are interesting subsets of tables",
            adminMessage: "Defining common segments for your team makes it even easier to ask questions",
            message: "Segments will appear here once your admins have created some",
            image: "/app/img/segments-list",
            adminAction: "Create a segment",
            adminLink: "http://www.metabase.com/docs/latest/administration-guide/05-segments-and-metrics.html"
        },
        breadcrumb: "Segments",
        fetch: {fetchSegments: []},
        get: 'getSegments',
        icon: "segment",
        headerIcon: "segment"
    },
    [`/reference/databases`]: {
        id: `/reference/databases`,
        name: "Databases and tables",
        empty: {
            title: "Metabase is no fun without any data",
            adminMessage: "Your databses will appear here once you connect one",
            message: "Databases will appear here once your admins have added some",
            image: "/app/img/databases-list",
            adminAction: "Connect a database",
            adminLink: "/admin/databases/create"
        },
        breadcrumb: "Databases",
        fetch: {fetchDatabases: []},
        get: 'getDatabases',
        icon: "database",
        headerIcon: "database"
    }
};

const getReferenceSections = (state) => referenceSections;

const getMetricSections = (metric, user) => metric ? {
    [`/reference/metrics/${metric.id}`]: {
        id: `/reference/metrics/${metric.id}`,
        name: 'Details',
        update: 'updateMetric',
        type: 'metric',
        questions: [
            {
                text: `See raw data for ${metric.name}`,
                icon: "illustration-icon-table",
                link: `/q?table=${metric.table_id}&metric=${metric.id}`
            }
        ],
        breadcrumb: `${metric.name}`,
        fetch: {fetchMetrics: []},
        get: 'getMetric',
        icon: "document",
        headerIcon: "ruler",
        headerLink: `/q?table=${metric.table_id}&metric=${metric.id}`,
        parent: referenceSections[`/reference/metrics`]
    },
    [`/reference/metrics/${metric.id}/questions`]: {
        id: `/reference/metrics/${metric.id}/questions`,
        name: `Questions about ${metric.name}`,
        empty: {
            message: `Questions about this metric will appear here as they're added`,
            icon: "all",
            action: "Ask a question",
            link: `/q?table=${metric.table_id}&metric=${metric.id}`
        },
        type: 'questions',
        sidebar: 'Questions about this metric',
        breadcrumb: `${metric.name}`,
        fetch: {fetchMetrics: [], fetchQuestions: []},
        get: 'getMetricQuestions',
        icon: "all",
        parent: referenceSections[`/reference/metrics`]
    },
    [`/reference/metrics/${metric.id}/revisions`]: {
        id: `/reference/metrics/${metric.id}/revisions`,
        name: `Revision history for ${metric.name}`,
        sidebar: 'Revision history',
        breadcrumb: `${metric.name}`,
        hidden: user && !user.is_superuser,
        fetch: {fetchMetricRevisions: [metric.id]},
        get: 'getMetricRevisions',
        icon: "history",
        parent: referenceSections[`/reference/metrics`]
    }
} : {};

const getSegmentSections = (segment, user) => segment ? {
    [`/reference/segments/${segment.id}`]: {
        id: `/reference/segments/${segment.id}`,
        name: 'Details',
        update: 'updateSegment',
        type: 'segment',
        questions: [
            {
                text: `See raw data for ${segment.name}`,
                icon: "illustration-icon-table",
                link: `/q?table=${segment.table_id}&segment=${segment.id}`
            }
        ],
        breadcrumb: `${segment.name}`,
        fetch: {fetchSegments: []},
        get: 'getSegment',
        icon: "document",
        headerIcon: "clipboard",
        headerLink: `/q?table=${segment.table_id}&segment=${segment.id}`,
        parent: referenceSections[`/reference/segments`]
    },
    [`/reference/segments/${segment.id}/fields`]: {
        id: `/reference/segments/${segment.id}/fields`,
        name: `Fields in ${segment.name}`,
        empty: {
            message: `Fields in this segment will appear here as they're added`,
            icon: "fields"
        },
        sidebar: 'Fields in this segment',
        fetch: {fetchSegmentFields: [segment.id]},
        get: "getFieldsBySegment",
        breadcrumb: `${segment.name}`,
        icon: "fields",
        parent: referenceSections[`/reference/segments`]
    },
    [`/reference/segments/${segment.id}/questions`]: {
        id: `/reference/segments/${segment.id}/questions`,
        name: `Questions about ${segment.name}`,
        empty: {
            message: `Questions about this segment will appear here as they're added`,
            icon: "all",
            action: "Ask a question",
            link: `/q?table=${segment.table_id}&segment=${segment.id}`
        },
        type: 'questions',
        sidebar: 'Questions about this segment',
        breadcrumb: `${segment.name}`,
        fetch: {fetchSegments: [], fetchQuestions: []},
        get: 'getSegmentQuestions',
        icon: "all",
        parent: referenceSections[`/reference/segments`]
    },
    [`/reference/segments/${segment.id}/revisions`]: {
        id: `/reference/segments/${segment.id}/revisions`,
        name: `Revision history for ${segment.name}`,
        sidebar: 'Revision history',
        breadcrumb: `${segment.name}`,
        hidden: user && !user.is_superuser,
        fetch: {fetchSegmentRevisions: [segment.id]},
        get: 'getSegmentRevisions',
        icon: "history",
        parent: referenceSections[`/reference/segments`]
    }
} : {};

const getSegmentFieldSections = (segment, field, user) => segment && field ? {
    [`/reference/segments/${segment.id}/fields/${field.id}`]: {
        id: `/reference/segments/${segment.id}/fields/${field.id}`,
        name: 'Details',
        update: 'updateField',
        type: 'field',
        breadcrumb: `${field.display_name}`,
        fetch: {fetchSegmentFields: [segment.id]},
        get: "getFieldBySegment",
        icon: "document",
        headerIcon: "field",
        parent: getSegmentSections(segment)[`/reference/segments/${segment.id}/fields`]
    }
} : {};

const getDatabaseSections = (database) => database ? {
    [`/reference/databases/${database.id}`]: {
        id: `/reference/databases/${database.id}`,
        name: 'Details',
        update: 'updateDatabase',
        type: 'database',
        breadcrumb: `${database.name}`,
        fetch: {fetchDatabaseMetadata: [database.id]},
        get: 'getDatabase',
        icon: "document",
        headerIcon: "database",
        parent: referenceSections[`/reference/databases`]
    },
    [`/reference/databases/${database.id}/tables`]: {
        id: `/reference/databases/${database.id}/tables`,
        name: `Tables in ${database.name}`,
        type: 'tables',
        empty: {
            message: `Tables in this database will appear here as they're added`,
            icon: "table2"
        },
        sidebar: 'Tables in this database',
        breadcrumb: `${database.name}`,
        fetch: {fetchDatabaseMetadata: [database.id]},
        get: 'getTablesByDatabase',
        icon: "table2",
        parent: referenceSections[`/reference/databases`]
    }
} : {};

const getTableSections = (database, table) => database && table ? {
    [`/reference/databases/${database.id}/tables/${table.id}`]: {
        id: `/reference/databases/${database.id}/tables/${table.id}`,
        name: 'Details',
        update: 'updateTable',
        type: 'table',
        questions: [
            {
                text: `See raw data for ${table.display_name}`,
                icon: "illustration-icon-table",
                link: `/q?table=${table.id}`
            }
        ],
        breadcrumb: `${table.display_name}`,
        fetch: {fetchDatabaseMetadata: [database.id]},
        get: 'getTable',
        icon: "document",
        headerIcon: "table2",
        headerLink: `/q?table=${table.id}`,
        parent: getDatabaseSections(database)[`/reference/databases/${database.id}/tables`]
    },
    [`/reference/databases/${database.id}/tables/${table.id}/fields`]: {
        id: `/reference/databases/${database.id}/tables/${table.id}/fields`,
        name: `Fields in ${table.display_name}`,
        empty: {
            message: `Fields in this table will appear here as they're added`,
            icon: "fields"
        },
        sidebar: 'Fields in this table',
        breadcrumb: `${table.display_name}`,
        fetch: {fetchDatabaseMetadata: [database.id]},
        get: "getFieldsByTable",
        icon: "fields",
        parent: getDatabaseSections(database)[`/reference/databases/${database.id}/tables`]
    },
    [`/reference/databases/${database.id}/tables/${table.id}/questions`]: {
        id: `/reference/databases/${database.id}/tables/${table.id}/questions`,
        name: `Questions about ${table.display_name}`,
        empty: {
            message: `Questions about this table will appear here as they're added`,
            icon: "all",
            action: "Ask a question",
            link: `/q?table=${table.id}`
        },
        type: 'questions',
        sidebar: 'Questions about this table',
        breadcrumb: `${table.display_name}`,
        fetch: {fetchDatabaseMetadata: [database.id], fetchQuestions: []},
        get: 'getTableQuestions',
        icon: "all",
        parent: getDatabaseSections(database)[`/reference/databases/${database.id}/tables`]
    }
} : {};

const getTableFieldSections = (database, table, field) => database && table && field ? {
    [`/reference/databases/${database.id}/tables/${table.id}/fields/${field.id}`]: {
        id: `/reference/databases/${database.id}/tables/${table.id}/fields/${field.id}`,
        name: 'Details',
        update: 'updateField',
        type: 'field',
        breadcrumb: `${field.display_name}`,
        fetch: {fetchDatabaseMetadata: [database.id]},
        get: "getField",
        icon: "document",
        headerIcon: "field",
        parent: getTableSections(database, table)[`/reference/databases/${database.id}/tables/${table.id}/fields`]
    }
} : {};

const idsToObjectMap = (ids, objects) => ids
    .map(id => objects[id])
    .reduce((map, object) => Object.assign({}, map, {[object.id]: object}), {});
    // recursive freezing done by i.assoc here is too expensive
    // hangs browser for large databases
    // .reduce((map, object) => i.assoc(map, object.id, object), {});

export const getUser = (state) => state.currentUser;

export const getSectionId = (state) => state.router.location.pathname;

export const getMetricId = (state) => Number.parseInt(state.router.params.metricId);
const getMetrics = (state) => state.metadata.metrics;
export const getMetric = createSelector(
    [getMetricId, getMetrics],
    (metricId, metrics) => metrics[metricId] || { id: metricId }
);

export const getSegmentId = (state) => Number.parseInt(state.router.params.segmentId);
const getSegments = (state) => state.metadata.segments;
export const getSegment = createSelector(
    [getSegmentId, getSegments],
    (segmentId, segments) => segments[segmentId] || { id: segmentId }
);

export const getDatabaseId = (state) => Number.parseInt(state.router.params.databaseId);
const getDatabases = (state) => state.metadata.databases;
const getDatabase = createSelector(
    [getDatabaseId, getDatabases],
    (databaseId, databases) => databases[databaseId] || { id: databaseId }
);

export const getTableId = (state) => Number.parseInt(state.router.params.tableId);
// export const getTableId = (state) => Number.parseInt(state.router.params.tableId);
export const getTables = (state) => state.metadata.tables;
const getTablesByDatabase = createSelector(
    [getTables, getDatabase],
    (tables, database) => tables && database && database.tables ?
        idsToObjectMap(database.tables, tables) : {}
);
const getTable = createSelector(
    [getTableId, getTables],
    (tableId, tables) => tables[tableId] || { id: tableId }
);
const getTableBySegment = createSelector(
    [getSegment, getTables],
    (segment, tables) => segment ? tables[segment.table_id] : {}
);

export const getFieldId = (state) => Number.parseInt(state.router.params.fieldId);
const getFields = (state) => state.metadata.fields;
const getFieldsByTable = createSelector(
    [getTable, getFields],
    (table, fields) => table && table.fields ? idsToObjectMap(table.fields, fields) : {}
);
const getFieldsBySegment = createSelector(
    [getTableBySegment, getFields],
    (table, fields) => table && table.fields ? idsToObjectMap(table.fields, fields) : {}
);
const getField = createSelector(
    [getFieldId, getFields],
    (fieldId, fields) => fields[fieldId] || { id: fieldId }
);
const getFieldBySegment = createSelector(
    [getFieldId, getFieldsBySegment],
    (fieldId, fields) => fields[fieldId] || { id: fieldId }
);

const getQuestions = (state) => i.getIn(state, ['questions', 'entities', 'cards']) || {};

const getMetricQuestions = createSelector(
    [getMetricId, getQuestions],
    (metricId, questions) => Object.values(questions)
        .filter(question => AggregationClause.getMetric(
            question.dataset_query.query.aggregation
        ) === metricId)
        .reduce((map, question) => i.assoc(map, question.id, question), {})
);

const getRevisions = (state) => state.metadata.revisions;

const getMetricRevisions = createSelector(
    [getMetricId, getRevisions],
    (metricId, revisions) => i.getIn(revisions, ['metric', metricId]) || {}
);

const getSegmentRevisions = createSelector(
    [getSegmentId, getRevisions],
    (segmentId, revisions) => i.getIn(revisions, ['segment', segmentId]) || {}
);

const getSegmentQuestions = createSelector(
    [getSegmentId, getQuestions],
    (segmentId, questions) => Object.values(questions)
        .filter(question => Query.getFilters(question.dataset_query.query)
            .some(filter => Query.isSegmentFilter(filter) && filter[1] === segmentId)
        )
        .reduce((map, question) => i.assoc(map, question.id, question), {})
);

const getTableQuestions = createSelector(
    [getTable, getQuestions],
    (table, questions) => Object.values(questions)
        .filter(question => question.table_id === table.id)
);

const getDatabaseBySegment = createSelector(
    [getSegment, getTables, getDatabases],
    (segment, tables, databases) => segment && segment.table_id && tables[segment.table_id] &&
        databases[tables[segment.table_id].db_id] || {}
);

export const databaseToForeignKeys = (database) => database && database.tables_lookup ?
    Object.values(database.tables_lookup)
        // ignore tables without primary key
        .filter(table => table && table.fields_lookup &&
            Object.values(table.fields_lookup)
                .find(field => field.special_type === 'id')
        )
        .map(table => ({
            table: table,
            field: table && table.fields_lookup && Object.values(table.fields_lookup)
                .find(field => field.special_type === 'id')
        }))
        .map(({ table, field }) => ({
            id: field.id,
            name: table.schema && table.schema !== "public" ?
                `${titleize(humanize(table.schema))}.${table.display_name} → ${field.display_name}` :
                `${table.display_name} → ${field.display_name}`,
            description: field.description
        }))
        .reduce((map, foreignKey) => i.assoc(map, foreignKey.id, foreignKey), {}) :
    {};

const getForeignKeysBySegment = createSelector(
    [getDatabaseBySegment],
    databaseToForeignKeys
);

const getForeignKeysByDatabase = createSelector(
    [getDatabase],
    databaseToForeignKeys
);

export const getForeignKeys = createSelector(
    [getSegmentId, getForeignKeysBySegment, getForeignKeysByDatabase],
    (segmentId, foreignKeysBySegment, foreignKeysByDatabase) => segmentId ?
        foreignKeysBySegment : foreignKeysByDatabase
)

export const getSections = createSelector(
    [getSectionId, getMetric, getSegment, getDatabase, getTable, getField, getFieldBySegment, getUser, getReferenceSections],
    (sectionId, metric, segment, database, table, field, fieldBySegment, user, referenceSections) => {
        // can be simplified if we had a single map of all sections
        if (referenceSections[sectionId]) {
            return referenceSections;
        }

        const metricSections = getMetricSections(metric, user);
        if (metricSections[sectionId]) {
            return metricSections;
        }

        const segmentSections = getSegmentSections(segment, user);
        if (segmentSections[sectionId]) {
            return segmentSections;
        }

        const segmentFieldSections = getSegmentFieldSections(segment, fieldBySegment);
        if (segmentFieldSections[sectionId]) {
            return segmentFieldSections;
        }

        const databaseSections = getDatabaseSections(database);
        if (databaseSections[sectionId]) {
            return databaseSections;
        }

        const tableSections = getTableSections(database, table);
        if (tableSections[sectionId]) {
            return tableSections;
        }

        const tableFieldSections = getTableFieldSections(database, table, field);
        if (tableFieldSections[sectionId]) {
            return tableFieldSections;
        }

        return {};
    }
);

export const getSection = createSelector(
    [getSectionId, getSections],
    (sectionId, sections) => sections[sectionId] || {}
);

const dataSelectors = {
    getMetric,
    getMetricQuestions,
    getMetricRevisions,
    getMetrics,
    getSegment,
    getSegmentQuestions,
    getSegmentRevisions,
    getSegments,
    getDatabase,
    getDatabases,
    getTable,
    getTableQuestions,
    getTables,
    getTablesByDatabase,
    getField,
    getFieldBySegment,
    getFields,
    getFieldsByTable,
    getFieldsBySegment
};

export const getData = (state) => {
    const section = getSection(state);
    if (!section) {
        return {};
    }
    const selector = dataSelectors[section.get];
    if (!selector) {
        return {};
    }

    return selector(state);
};

export const getLoading = (state) => state.reference.isLoading;

export const getError = (state) => state.reference.error;

const getBreadcrumb = (section, index, sections) => index !== sections.length - 1 ?
    [section.breadcrumb, section.id] : [section.breadcrumb];

const getParentSections = (section) => {
    if (!section.parent) {
        return [section];
    }

    const parentSections = []
        .concat(getParentSections(section.parent), section);

    return parentSections;
};

export const buildBreadcrumbs = (section) => getParentSections(section)
    .map(getBreadcrumb)
    .slice(-3);

export const getBreadcrumbs = createSelector(
    [getSection],
    buildBreadcrumbs
)

export const getHasSingleSchema = createSelector(
    [getTablesByDatabase],
    (tables) => tables && Object.keys(tables).length > 0 ?
        Object.values(tables)
            .every((table, index, tables) => table.schema === tables[0].schema) : true
)

export const getHasDisplayName = createSelector(
    [getSection],
    (section) =>
        section.type === 'table' ||
        section.type === 'field'
)

export const getHasRevisionHistory = createSelector(
    [getSection],
    (section) =>
        section.type === 'metric' ||
        section.type === 'segment'
)

export const getHasQuestions = createSelector(
    [getSection],
    (section) =>
        section.type === 'metric' ||
        section.type === 'segment' ||
        section.type === 'table' ||
        section.type === 'field'
)

export const getIsEditing = (state) => state.reference.isEditing;
