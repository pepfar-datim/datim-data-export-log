import Action from 'd2-ui/lib/action/Action';
import {getInstance} from 'd2/lib/d2';
import store from './dataExportLog.store';
import dhis2 from 'd2-ui/lib/header-bar/dhis2';
import log from 'loglevel';


const actions = Action.createActionsFromNames(['load', 'startExport', 'pollItems', 'loadPeriods', 'loadDataTypes','loadPeriodsxxx']);
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
        exportedBy: logItem.username,
        exportedAt: new Date(logItem.timestamp).toString(),
        period: logItem.pe,
        status: logItem.status,
        timestamp: logItem.timestamp,
        summary: logItem.summary,
        dryrun: logItem.dryRun,
        hasAdxMessage: logItem.hasAdxMessage,
        lastStepIndex : logItem.lastStepIndex,
    };
}

function getAbsoluteBaseUrl(fullUrl) {
    const anchorTag = document.createElement('a');

    anchorTag.href = fullUrl;

    return `${anchorTag.protocol}//${anchorTag.hostname}${anchorTag.port ? ':' + anchorTag.port : ''}`;
}

function createDataTypeForStore(dataType) {
    return {
        dataTypeCode: dataType.code,
        dataTypeValue: dataType.value,        
    };
}

function fetchDataTypes( dataStoreUrlLocation, store){        
    var urlBase = dataStoreUrlLocation.substring(0, (dataStoreUrlLocation.length - "exchange".length) );    
    //var url = `http://localhost:8080/adxAdapter/dataTypes`;     
    var url = urlBase + "dataTypes";                
        fetch(url)
        .then(response => { 
           return response.json() 
         })
        .then (data => {                                    
          store.setState(Object.assign({}, store.getState(), {dataTypes: data}));                      
       });
        
}

function fetchPeriods(dataStoreUrlLocation, dataType, store){        
    var urlBase = dataStoreUrlLocation.substring(0, (dataStoreUrlLocation.length - "exchange".length) );         
    var url = urlBase + "dataTypes";   
      var url2 = urlBase +  "periodDates/" + dataType;      
      fetch(url2)
      .then(response => { 
         return response.json() 
      })
      .then (periodsData => {                                                                                  
          periodDateSelected: periodsData.currentPeriod.code,
        store.setState(Object.assign({}, store.getState(), {
            periodDates: periodsData,                            
            periodDateSelected: periodsData.currentPeriod.code,})); 
      })  ;            
}

actions.load
    .subscribe(({data, complete, error}) => {
        getInstance()
            .then(d2 => {
                const api = d2.Api.getApi();
                store.setState(Object.assign({}, store.getState(), {dataStoreUrlLocation: ''}));
                return api.get(dataStoreUrl)
                    .then(logDataDescription => logDataDescription)
                    .then(exportLogUids => {                        
                        if (!Array.isArray(exportLogUids)) { return []; }
                       
                        const exportRequests = exportLogUids
                            .filter(uid => uid !== 'location')
                            .map(uid => { // map uid to exportData
                                return api.get(`${dataStoreUrl}/${uid}`)
                                    .then(exportData => {
                                        exportData.id = uid;                                                                           
                                        return exportData;
                                    })
                                    .catch(() => undefined);
                            });

                            const dataStoreURLlocationRequest = exportLogUids
                            .filter(uid => uid === 'location')
                            .map(uid => { 
                                return api.get(`${dataStoreUrl}/${uid}`)
                                    .then(exportData => {                                        
                                        store.setState(Object.assign({}, store.getState(), {dataStoreUrlLocation: exportData.value}));                                                                                                                
                                    })
                                    .catch(() => undefined);
                            });                            

                        return Promise.all(exportRequests);
                    })
                    .then(exportLogResponses => exportLogResponses.filter(exportLogResponse => exportLogResponse)) //?
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

  
// added 12/2017
    actions.loadDataTypes
     .subscribe(({data, complete, error}) => {
        getInstance()
            .then(d2 => {
                const api = d2.Api.getApi();               
                return api.get(`${dataStoreUrl}/location`)                                        
            })
           .then (periodsData => {                                                                
            fetchDataTypes(periodsData.value, store);            

          })             
            .catch(errorMessage => error(errorMessage));          
    });

    actions.loadPeriods
     .subscribe(({data, complete, error}) => {
        getInstance()
            .then(d2 => {
                const api = d2.Api.getApi();               
                return api.get(`${dataStoreUrl}/location`)                                        
            })
           .then (locationData => {                                                     
            //console.log( locationData);              
            fetchPeriods(locationData.value, data.dataType, store);            
          })            
          .catch(errorMessage => error(errorMessage));           
    });     
// end of adding 

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
            .then(complete)
            .catch(error);
    });

actions.startExport
    .subscribe(({data, complete, error}) => {        
        getInstance()
            .then(d2 => {
                const {username} = d2.currentUser;                
                const periodCode = data.periodDate;        
                const type = data.dataType;  
                                               
                store.setState(Object.assign({}, store.getState(), {inProgress: true, dataType: "", periodDateSelected: ""}));                
                const api = d2.Api.getApi();
                return api.get(`${dataStoreUrl}/location`)
                    .then(dataStoreResponse => dataStoreResponse.value)
                    .then(adxLocation => {
                        return new Promise((resolve, reject) => {
                            jQuery.ajax({                               
                                url: `${adxLocation}`,
                                method: 'POST',
                                data: JSON.stringify({
                                    type,
                                    username, 
                                    periodCode                                                                                                       
                                }, undefined, 2),
                                contentType: 'application/json',
                            }).then((data) => {
                                resolve(data); //the executor sends the result via resolve()                                
                            }, (jqXHR) => {
                                store.setState(Object.assign({}, store.getState(), {inProgress: false}));                                
                                if (jqXHR.status === 401) {
                                    reject('The password is incorrect');
                                } else {
                                    reject('Failed to start export'  );
                                }
                            });
                        });
                    }); 
            })
            .then(response => response.id)
            .then(idToPoll => {
                getInstance()
                    .then(d2 => {
                        const api = d2.Api.getApi();                        
                        return api.get(`${dataStoreUrl}/${idToPoll}`)
                            .then(progessItem => {
                                actions.pollItems([progessItem]);
                            })
                            .catch(() => undefined);
                    });
            })
            .then(complete)
            .catch((errorMessage) => {
                error(errorMessage);
            });
    });

export default actions;
