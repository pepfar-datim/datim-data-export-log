import Action from 'd2-flux/action/Action';
import {getInstance} from 'd2/lib/d2';
import store from './dataExportLog.store';
import dhis2 from 'd2-ui/lib/header-bar/dhis2';

const actions = Action.createActionsFromNames(['load', 'startExport', 'pollItems']);
const dataStoreUrl = 'dataStore/adxAdapter';

function compareDates(left, right) {
    return new Date(left).getTime() - new Date(right).getTime();
}

function sortExportItemsOnDateDesc(exportItems) {
    return exportItems
        .sort((left, right) => compareDates(left.timestamp, right.timestamp))
        .reverse();
}

function createLogObjectForStore(logItem) {
    return {
        id: logItem.id,
        exportedBy: logItem.user,
        exportedAt: new Date(logItem.timestamp).toString(),
        period: logItem.pe,
        status: logItem.status,
        timestamp: logItem.timestamp,
    };
}

actions.load
    .subscribe(({data, complete, error}) => {
        getInstance()
            .then(d2 => {
                const api = d2.Api.getApi();

                return api.get(dataStoreUrl)
                    .then(logDataDescription => logDataDescription)
                    .then(exportLogUids => {
                        if (!Array.isArray(exportLogUids)) { return []; }

                        const exportRequests = exportLogUids
                            .map(uid => {
                                return api.get(`${dataStoreUrl}/${uid}`)
                                    .then(exportData => {
                                        exportData.id = uid;
                                        return exportData;
                                    })
                                    .catch(() => undefined);
                            });

                        return Promise.all(exportRequests);
                    })
                    .then(exportLogResponses => exportLogResponses.filter(exportLogResponse => exportLogResponse))
                    .catch(error => {
                        log.warn(error);
                        return [];
                    });
            })
            .then(sortExportItemsOnDateDesc)
            .then(logData => {
                const inProgressItems = logData.filter(item => item.status === 'IN PROGRESS');
                const inProgress = Boolean(inProgressItems.length);

                if (inProgress) {
                    setTimeout(() => actions.pollItems(inProgressItems),  5000);
                }

                store.setState({
                    log: logData.map(createLogObjectForStore),
                    inProgress: inProgress,
                });
            })
            .then(() => complete('Log list loaded'))
            .catch(errorMessage => error(errorMessage));
    });

actions.pollItems
    .subscribe(({data, complete, error}) => {
        getInstance()
            .then(d2 => {
                const api = d2.Api.getApi();
                const requests = data
                    .map(({id}) => {
                        return api.get(`${dataStoreUrl}/${id}`)
                            .then(exportData => {
                                exportData.id = id;
                                return exportData;
                            });
                    });

                return Promise.all(requests);
            })
            .then(statuses => {
                const updatedItems = statuses.map(item => item.id);
                const storeState = store.getState();
                const notUpdatedItems = storeState.log
                    .filter(logItem => updatedItems.indexOf(logItem.id) === -1);

                return sortExportItemsOnDateDesc(notUpdatedItems.concat(statuses.map(createLogObjectForStore)))
            })
            .then(logItems => {
                const inProgressItems = logItems.filter(logItem => logItem.status === 'IN PROGRESS');

                if (inProgressItems.length) {
                    setTimeout(() => actions.pollItems(inProgressItems),  5000);
                }

                store.setState({
                    log: logItems,
                    inProgress: Boolean(inProgressItems.length),
                });
            })
            .then(() => console.log(store.getState()))
            .then(complete)
            .catch(error);
    });

actions.startExport
    .subscribe(({data, complete, error}) => {
        getInstance()
            .then(d2 => {
                const {username} = d2.currentUser;
                const password = data;

                store.setState({inProgress: true});

                return new Promise((resolve, reject) => {
                    jQuery.ajax({
                        url: '/adxAdapter/exchange',
                        method: 'POST',
                        data: JSON.stringify({
                            username,
                            password,
                        }, undefined, 2),
                        contentType: 'application/json',
                    }).then((data) => {
                        resolve(data);
                    }, () => {
                        store.setState({
                            inProgress: false,
                        });
                        reject('Failed to start export');
                    });
                });
            })
            .then(response => response.id)
            .then(idToPoll => {
                getInstance()
                    .then(d2 => {
                        return api.get(`${dataStoreUrl}/${idToPoll}`)
                            .then(exportData => {
                                exportData.id = uid;
                                return exportData;
                            })
                            .catch(() => undefined);
                    });
            });
    });

export default actions;
