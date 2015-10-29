import Action from 'd2-flux/action/Action';
import {getInstance} from 'd2/lib/d2';
import store from './dataExportLog.store';

const actions = Action.createActionsFromNames(['load']);

actions.load
    .subscribe(({data, complete, error}) => {
        getInstance()
            .then(d2 => {
                const api = d2.Api.getApi();

                return api.get('dataStore/exportLogApp/log')
                    .catch(response => {
                        if (response.httpStatusCode === 404) {
                            return api.post('dataStore/exportLogApp/log', [])
                                .then(() => {
                                    return api.get('dataStore/exportLogApp/log');
                                });
                        }
                        log.error(response.message, response);
                    });
            })
            .then(logDataDescription => JSON.parse(logDataDescription.value))
            .then(logData => store.setState({
                log: logData.map((logItem, index) => {
                    return {
                        id: index,
                        exportedBy: logItem.user.name,
                        exportedAt: Date(logItem.created),
                    };
                }),
            }))
            .then(() => complete('Log list loaded'))
            .catch(errorMessage => error(errorMessage));
    });

export default actions;
