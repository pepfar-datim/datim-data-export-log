if (process.env.NODE_ENV !== 'production') {
    jQuery.ajaxSetup({
        headers: {
            Authorization: 'Basic ' + btoa('admin:district'),
        },
    });
}

import 'd2-ui/scss/DataTable.scss';
import 'd2-ui/scss/HeaderBar.scss';

import React from 'react';
import {render, findDOMNode} from 'react-dom';
import HeaderBar from 'd2-ui/lib/header-bar/HeaderBar.component';
import {init, config, getInstance, getManifest} from 'd2/lib/d2';
import actions from './dataExportLog.actions';
import store from './dataExportLog.store';
import DataTable from 'd2-ui/lib/data-table/DataTable.component';
import reactTapEventPlugin from 'react-tap-event-plugin';
import RaisedButton from 'material-ui/lib/raised-button';
import dhis2 from 'd2-ui/lib/header-bar/dhis2';
import TextField from 'material-ui/lib/text-field';
import log from 'loglevel';
import Snackbar from 'material-ui/lib/snackbar';
import {helpers} from 'rx';
import LoadingMask from 'd2-ui/lib/loading-mask/LoadingMask.component';
import LinearProgress from 'material-ui/lib/linear-progress';
import FontIcon from 'material-ui/lib/font-icon';
import Paper from 'material-ui/lib/paper';
import Popover from 'material-ui/lib/popover/popover';
import Checkbox from 'material-ui/lib/Checkbox';

import KeyboardArrowDownIcon from 'material-ui/lib/svg-icons/hardware/keyboard-arrow-down';
import KeyboardArrowRightIcon from 'material-ui/lib/svg-icons/hardware/keyboard-arrow-right';
import CheckCircleIcon from 'material-ui/lib/svg-icons/action/check-circle';
import HighlightOffIcon from 'material-ui/lib/svg-icons/action/highlight-off';

import '../css//bootstrap.css';
import '../css/stylesheet.css';
import '../js/bootstrap.min.js';


config.i18n.strings.add('exported_at');
config.i18n.strings.add('exported_by');

reactTapEventPlugin();


getInstance()
    .then(d2 => {
        d2.i18n.translations.exported_at = 'Exported At';
        d2.i18n.translations.exported_by = 'Exported By';
        d2.i18n.translations.status = 'Status';
        d2.i18n.translations.period = 'Period';
    });

const STATUS_SUCCESS = "SUCCESS";
const STATUS_FAILURE = "FAILURE";

function formatDate(date) {
  var shortMonthNames = ["Jan", "Feb", "March", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];  
  return shortMonthNames[date.getMonth()] +  ' ' + date.getDate() + ', ' + date.getFullYear() +  ' ' + date.getHours() + ':' + date.getMinutes() + ':'+ date.getSeconds();
}

function getStatusStyle(status){
    return status === STATUS_SUCCESS ? "success" : "error";
}





const ExportLogList = React.createClass({

  
    getInitialState() {
        return {
            log: [],
            isLoading: true,
            popover: {},            
        };
    },

    componentWillMount() {
        actions.load()
            .subscribe(() => {}, (e) => {
                console.error(e);
                this.setState({
                    isLoading: false
                });
            });

        store.subscribe(storeState => this.setState({
            isLoading: false,
            ...storeState
        }), (e) => {
            console.error(e);
        } );
    },

   
    rowClick(event, data) {      
       console.log("data:" + data);     
        this.setState({
            popover: {
                open: true,
                //target: event.target.currentNode,
                //message: data.summary,
                //targetOrigin: event.target.parentNode,
                //anchorEl: event.currentTarget,
            },
        });
        
    },

    handleTouchTap(data, event) {       
       console.log("handleTouchTap method - id:" + data.id);
        this.setState({
            popover: {
                open: true,
                targetOrigin: event.target.parentNode,
                anchorEl: event.currentTarget,   
                message: data.summary             
                }
        });
        
    },

    

    render() {
        const tableColumns = ['exportedAt', 'exportedBy', 'period', 'status'];
        const styles = {                                     
              tableBorder: {
                borderCollapse: 'collapse',
                width:'90%',
              }              
            };
                         

        if (this.state.isLoading) {
            return (
                <div>
                    <LinearProgress indetermined />
                    <div style={{paddingTop: '1rem'}}>Loading export log...</div>
                </div>
            );
        }

        if (this.state.log.length === 0) {
            const tipStyle = {
                display: 'inline-block',
                padding: '.5rem',
                margin: '0, 5px',
                backgroundColor: 'orange',
                color: '#FFF',
                position: 'relative',
                top: '-30px',
                width: 250,
                verticalAlign: 'top',
            };
            return (
                <div>                    
                    <Paper>
                        <div style={{fontSize: '1.5rem', margin: '.5em', padding: '2rem', color: 'red'}}>Could not find any previous exports</div>
                    </Paper>
                </div>
            )
        }
       
            
            var logList = []
            this.state.log.map(function(log, index) {
                logList.push(
                  <tr data-toggle='collapse' data-target={"#dataTarget_" + log.id} className='accordion-toggle collapsed' id={"tr_"+ log.id}>
                      <td key={"k1_" + log.id}>{formatDate(new Date(log.exportedAt))}</td>
                      <td key={"k2_" + log.id}>{log.exportedBy}</td>
                       <td key={"k3" + log.id}>{log.period} - {log.id}</td>
                       <td className={getStatusStyle(log.status)} key={"k4_" + log.id}>{log.status}</td>
                       <td key={"k5_" + log.id}><span className="glyphicon glyphicon-chevron-right" key={"k6_" + log.id}></span></td>
                  </tr>                  
                );

                logList.push(
                   <tr>
                      <td colSpan="5" className="hiddenRow" key={"k7_" + log.id}>                        
                        <div className="accordian-body collapse" id={"dataTarget_" + log.id} key={"div1_" + log.id}>
                          <div className="col-xs-12 col-md-8" key={"div2_" + log.id}>
                            <div className="stepwizard" key={"div_stepwizard_" + log.id}>
                              <div className="stepwizard-row success-row" key={"divstep_row_" + log.id}>
                                <div className="stepwizard-step" id={"step1_" + log.id} key={"div_step1" + log.id}>

                                    <a href="#" ref={"link1_" + log.id} key={"alink1_"+ log.id} tabIndex="0" className="success" data-html="true" data-container="body" dataToggle="popover" data-trigger="focus" data-placement="bottom" 
                                      title={"started at:" + log.exportedAt}
                                      data-content={log.summary}>
                                      <button type="button" className="btn btn-default btn-circle success-circle" ref={"step1Button_" + log.id} key={"step1ButtonID_" + log.id}>
                                        <span className="glyphicon glyphicon-ok checkmark" aria-hidden="true" key={"arrow_1" + log.id}></span>
                                      </button>
                                    </a>
                                    <p>Initiation</p>
                                 </div>
                                

                                 <div className="stepwizard-step" id={"step2_" + log.id}>
                                    <a href="#" ref={"link2_" + log.id} key={"link2_"+ log.id} tabIndex="0" className="success" data-html="true" data-container="body" data-toggle="popover" data-trigger="focus" data-placement="bottom" 
                                      title={"Successfully Synchronized Metadata "} 
                                        data-content="data content" >
                                       <button type="button" className="btn btn-default btn-circle success-circle" ref={"step2Button_" + log.id} key={"step2Button_"+ log.id}>
                                          <span className="glyphicon glyphicon-ok checkmark" aria-hidden="true" id={"arrow_2" + log.id}></span>
                                          </button>
                                    </a>
                                        <p>Metadata <br/>Synchronization</p>
                                   </div>
                                   <div className="stepwizard-step" id={"step3_" + log.id}>
                                   <a href="#" ref={"link3_" + log.id} tabIndex="0" className="success" data-html="true" data-container="body" data-toggle="popover" 
                                        data-trigger="focus" data-placement="bottom" 
                                        title={log.summary} data-content="&lt;dl&gt;&lt;dt&gt;Definition list&lt;/dt&gt;&lt;dd&gt;Consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.&lt;/dd&gt;" >
                                       <button type="button" className="btn btn-default btn-circle success-circle" ref={"step3Button_" + log.id} key={"step3Button_"+ log.id}>
                                          <span className="glyphicon glyphicon-ok checkmark" aria-hidden="true" id={"arrow_3" + log.id}></span>
                                          </button>
                                    </a>
                                        <p>Adx message <br/> Generation</p>
                                   </div>
                                   <div className="stepwizard-step" id={"step4_" + log.id}>
                                   <a href="#" ref={"link4_" + log.id} tabIndex="0" className="success" data-html="true" data-container="body" data-toggle="popover"
                                    data-trigger="focus" data-placement="bottom" 
                                    title={log.status} data-content="data content message" >
                                       <button type="button" className="btn btn-default btn-circle success-circle" ref={"step4Button_" + log.id}>
                                          <span className="glyphicon glyphicon-ok checkmark" aria-hidden="true" id={"arrow_4" + log.id}></span>
                                          </button>    
                                    </a>
                                        <p>Success</p>                                         
                                   </div> 

                              </div>
                            </div>
                          </div>
                          <div className="col-xs-12 col-md-4 table-button" key={"buttondiv_"+ log.id}>
                            <button type="submit" className="btn btn-primary" ref={"button_" + log.id} key={"button_" + log.id} onClick={this.rowClick}>Download ADX</button>  
                            <RaisedButton
                                  onTouchTap={this.handleTouchTap.bind(this, log)}
                                  label="Click me"
                                />

                              <Popover open={this.state.popover.open}
                                   anchorEl={this.state.popover.target}
                                   anchorOrigin={{vertical: 'center', horizontal: 'left'}}
                                   canAutoPosition={false}
                                   onRequestClose={() => this.setState({popover: {open: false}})}
                                   style={{marginLeft: '1rem', padding: '1rem', maxWidth: '60%'}}>                              
                              <div>{log.summary}</div>
                            </Popover>

                          </div>
                        </div>                                                                              
                      </td>
                   </tr>
                  
                );
              }
              , this)
              ;
      

      
     

        return (
            <div ref="contentRef" >
            <div className=" table-header">         
              <div className="container">
              <h2>Previous Records</h2>                     
                <table className="table" style={{bordeCollapse:'collapse'}}>                    
                    <thead>
                        <tr>
                            <th>Exported Time</th>
                            <th>Exported By</th>
                            <th>Period</th>
                            <th>Status</th>
                            <th>&nbsp;</th>
                        </tr>
                    </thead>
                    <tbody>
                    {logList}
                    </tbody>
                </table>
                </div>            
                </div>
            </div>

        );
    }
});
 


const ExportActionBar = React.createClass({
    getInitialState() {
        return {
            inProgress: true,
            dryrunChecked: false,   
            passwordErrorMsg: ""                   
        };
    },

     getExportDate(){
        var d = new Date();                        
        // TO DO: to get the previous quarters
        return "2016 Q3";
    },

    componentWillMount() {
        store.subscribe(storeState => this.setState(storeState));
    },

    startExport() {
        actions.startExport(this.refs.password.getValue())
            .subscribe(
                helpers.identity,
                (errorMessage) => {
                    this.setState({
                        snackbarMessage: errorMessage,
                        passwordErrorMsg: errorMessage

                    });
                   // this.refs.snackbar.show();                   
                }
            );
            
            
    },


    setPassword() {
        this.setState({
            password: this.refs.password.getValue(),
        });
        if (this.refs.password.getValue() === "") {
          this.setState({
            passwordErrorMsg: ""
        });
        }
    },

    handleDryrunCheck() {
      this.setState({dryrunChecked: !this.state.dryrunChecked})
     
    },
   

    renderPassword() {        

        const styles = {            
          buttonBarStyle: {
            //textAlign: 'left',
            marginBottom: '2rem',
            marginTop: '70px',
          },
          buttonStyle: {
            marginleft: 1,
            width: 300,                      
          },          
        };
                
               
        var msg = (this.state.dryrunChecked) ? "checked" : "unchecked" ;
        
        
        var lastExported = (this.state.log != null && this.state.log.length > 0) ? formatDate(new Date(this.state.log[0].exportedAt)) : "";
        var lastStatus = (this.state.log != null && this.state.log.length > 0) ? this.state.log[0].status : "";
        var lastStatusStyle = (this.state.log != null && this.state.log.length > 0 && this.state.log[0].status === STATUS_SUCCESS) ? "success" : "error";
        const buttonText = this.state.inProgress ? 'Export in progress. Check back later.' : !this.state.password ? 'Export' : 'Export';
       

        return (
            <div   className="container"> 
                <h1>Data Submission</h1>
                <div>Please reconfirm your identity to start exporting data for <span><b>{this.getExportDate()}</b></span> </div>
                <TextField ref="password" type="password" fullWidth="true" value={this.state.password} onChange={this.setPassword} 
                errorText={this.state.passwordErrorMsg} hintText="Enter your password" /><br/>               
                <Checkbox label="Dry run" style={styles.checkbox} ref="dryrun" onClick={this.handleDryrunCheck} defaultChecked={this.state.dryrunChecked} />                 
                <RaisedButton className="btn btn-primary" backgroundColor='#00BCD4' labelColor='#ffffff' onClick={this.startExport} disabled={this.state.inProgress || !this.state.password} label={buttonText} />
                
                <div className="explanation">
                  <span className="last-export-time"><span className="explanation-title">Last Export Time: </span>{lastExported} </span>,
                  <span className="last-export-status"><span className="explanation-title"> Last Export Status: </span><span className={lastStatusStyle}>{lastStatus}</span></span>
                </div>
            </div>

        );
    },
   

    render() {       
        return this.renderPassword() 
    }
});

const App = React.createClass({
    childContextTypes: {
        d2: React.PropTypes.object,
    },

    getChildContext() {
        return {
            d2: this.props.d2,
        };
    },

    render() {
        const appContentStyle = {
            width: '85%',
            margin: '5rem auto 0',
        };

        return (
            <div>
                <HeaderBar />
                <div style={appContentStyle}>
                    <ExportActionBar />
                    <ExportLogList />
                </div>
            </div>
        );
    }
});

render(<LoadingMask />, document.getElementById('app'));

getManifest('manifest.webapp')
    .then(manifest => {
        if ((process.env.NODE_ENV !== 'production') && process.env.DEVELOPMENT_SERVER_ADDRESS) {
            console.log(process.env.DEVELOPMENT_SERVER_ADDRESS);
            dhis2.settings.baseUrl = `${process.env.DEVELOPMENT_SERVER_ADDRESS}`;
            config.baseUrl = `${process.env.DEVELOPMENT_SERVER_ADDRESS}/api`;
            return;
        }
        config.baseUrl = manifest.getBaseUrl() + '/api'
        dhis2.settings.baseUrl = manifest.getBaseUrl();
    })
    .then(() => {
        init()
            .then(d2 => {
                render(<App d2={d2} />, document.getElementById('app'));
            })
            .catch(errorMessage => {
                log.error('Unable to load d2', errorMessage);
            });
    });
