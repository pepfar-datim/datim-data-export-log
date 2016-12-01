if (process.env.NODE_ENV !== 'production') {
    jQuery.ajaxSetup({
        headers: {
            Authorization: 'Basic ' + btoa('admin:district'),
        },
    });
}

import 'd2-ui/scss/DataTable.scss';

import React from 'react';
import {render, findDOMNode} from 'react-dom';
import HeaderBarComponent from 'd2-ui/lib/app-header/HeaderBar';
import headerBarStore$ from 'd2-ui/lib/app-header/headerBar.store';
import withStateFrom from 'd2-ui/lib/component-helpers/withStateFrom';
import {init, config, getInstance, getManifest} from 'd2/lib/d2';
import actions from './dataExportLog.actions';
import store from './dataExportLog.store';
import DataTable from 'd2-ui/lib/data-table/DataTable.component';
import reactTapEventPlugin from 'react-tap-event-plugin';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import log from 'loglevel';
import {helpers} from 'rx';
import LoadingMask from 'd2-ui/lib/loading-mask/LoadingMask.component';
import LinearProgress from 'material-ui/LinearProgress';
import FontIcon from 'material-ui/FontIcon';
import Paper from 'material-ui/Paper';
import Popover from 'material-ui/Popover/Popover';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import Checkbox from 'material-ui/Checkbox';

import KeyboardArrowDownIcon from 'material-ui/svg-icons/hardware/keyboard-arrow-down';
import KeyboardArrowRightIcon from 'material-ui/svg-icons/hardware/keyboard-arrow-right';
import CheckCircleIcon from 'material-ui/svg-icons/action/check-circle';
import HighlightOffIcon from 'material-ui/svg-icons/action/highlight-off';

import '../css//bootstrap.css';
import '../css/stylesheet.css';
import '../js/bootstrap.min.js';

const HeaderBar = withStateFrom(headerBarStore$, HeaderBarComponent);

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
const STATUS_INPROGRESS = "IN PROGRESS";
const OK = "ok checkmark";
const REMOVE = "remove checkmark";
const BUTTON_STYLE_DEFAULT="default";



function formatDate(date) {
  var shortMonthNames = ["Jan", "Feb", "March", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];  
  return shortMonthNames[date.getMonth()] +  ' ' + date.getDate() + ', ' + date.getFullYear() +  ' ' + date.getHours() + ':' + date.getMinutes() + ':'+ date.getSeconds();
}

function getStatusStyle(status){
    return status === STATUS_SUCCESS ? "success" : "error";
}

const adxDownloadPath = 'adxAdapter/download';
function getAdxDownloadUrl (){
  return config.baseUrl.replace("api", adxDownloadPath);  
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

      
    getMessage(data){
      var step = data[1].step;
      var msg = "Started at: " + data[0].exportedAt;
      var lastProcessedStepIndex = data[0].lastProcessedStepIndex;
      console.log("NOTE: ************ temp hard code lastProcessedStepIndex vallue , line 118");
      lastProcessedStepIndex = 3;
      if (step === 3 ){
        msg = (lastProcessedStepIndex === 3 || lastProcessedStepIndex > 3 ) ? data[0].status :  "";
      } else if  (step === 2 ){
        msg = (lastProcessedStepIndex === 2 || lastProcessedStepIndex > 2 ) ? data[0].summary :  "";
      } else if (step === 1 ){
        msg = lastProcessedStepIndex === 1 ? data[0].summary : (lastProcessedStepIndex > 1? "Successfully Synchronized Metadata" : "");
      }       
      return msg;
    },

    handleTouchTap(data, event) {             
      console.log("handleTouchTap method - id:" + data[0].id  + " data.step:"+ data[1].step);
      console.log(data);
      var step = data[1].step;
      var msg = this.getMessage(data);
      
       event.preventDefault();
        this.setState({
            popover: {
                open: true,                 
                anchorEl: event.currentTarget,
                //message:  data.summary             
                message:  msg
                }
        });
        
    },

   

    getStepLabel(stepIndex) {     
      switch (stepIndex) {
      case 0:
        return 'Initiation';
      case 1:
        return 'Metadata \nSynchronization';
      case 2:
        return 'Adx message \nGeneration';
      case 3:
        return 'Success';
      default:
        return 'Invalid step';
      }
    },

    /* lastProcessedStepIndex: the index of the last step which can be success or failure
        status: the status of the last processed step associated with lastProcessedStepIndex
        
        if status is success: the lastProcessedStepIndex should be 3, as only when all the steps are success, the status can be success
        if the status is failure: the lastProcessedStepIndex can be 1, 2 or 3
        lastProcessedStepIndex: 0 based
    */
    getStepButtonStyle(lastProcessedStepIndex, status){       
      const mapStepToButtonStyle = new Map();      
      if (status.toUpperCase() === STATUS_INPROGRESS.toUpperCase()){
        switch (lastProcessedStepIndex) {
          case 0:          
            return mapStepToButtonStyle.set(0, 'default').set(1,'default').set(2,'default').set(3,'default');                     
          case 1:
            return mapStepToButtonStyle.set(0, 'success').set(1, 'default').set(2,'default').set(3,'default')  ;          
          case 2:
            return mapStepToButtonStyle.set(0, 'success').set(1, 'success').set(2,'default').set(3,'default')  ;            
          case 3:
            return mapStepToButtonStyle.set(0, 'success').set(1, 'success').set(2, 'success').set(3, 'default');              
          default:
            return mmapStepToButtonStyle.set(0, 'default').set(1,'default').set(2,'default').set(3,'default');   
          }
      }
      else if (status.toUpperCase() === STATUS_SUCCESS.toUpperCase() ){
           return mapStepToButtonStyle.set(0, 'success').set(1, 'success').set(2, 'success').set(3, 'success');                  
      } 
      else {
        switch (lastProcessedStepIndex) {
          case 0:          
            return mapStepToButtonStyle.set(0, 'failure').set(1,'default').set(2,'default').set(3,'default');                     
          case 1:
            return mapStepToButtonStyle.set(0, 'success').set(1, 'failure').set(2,'default').set(3,'default')  ;          
          case 2:
            return mapStepToButtonStyle.set(0, 'success').set(1, 'success').set(2,'failure').set(3,'default')  ;            
          case 3:
            return mapStepToButtonStyle.set(0, 'success').set(1, 'success').set(2, 'success').set(3, 'failure');              
          default:
            return mmapStepToButtonStyle.set(0, 'default').set(1,'default').set(2,'default').set(3,'default');   
          }
      }      
      return '';
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
                    <LinearProgress mode="indeterminate" />
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
             
                // hard code the lastProcessedStepIndex and dryrun, will change it when Vlad's code is ready
                var lastProcessedStepIndex = 3; // this value should be dynamic log.lastProcessedStepIndex which will be in API when Vlad's code ready
                var isDryrun = false;
                
                if (index%9 === 8) {
                  isDryrun = true;
                }

                // end of hard code part

              
                const mapStepButtonStyle = this.getStepButtonStyle(lastProcessedStepIndex, log.status);

                const rowStyle = (log.status.toUpperCase() === STATUS_INPROGRESS.toUpperCase() ) ? "inprogress-stage" + lastProcessedStepIndex + "-row" :                                
                                log.status.toUpperCase() === STATUS_SUCCESS.toUpperCase() ? "success-row" : "failure-stage" + lastProcessedStepIndex + "-row"; 
                var statusDisplay = log.status + " " +  (isDryrun ? "(dry run)" : "") ;
                if (log.status.toUpperCase() === STATUS_FAILURE.toUpperCase()) {
                  statusDisplay = log.status + " at " + this.getStepLabel(lastProcessedStepIndex) + " " +  (isDryrun ? "(dry run)" : "") ;
                }
                
                const stepRowCollapseStyle =  (index === 0 ) ? "" : "collapse";      
                const displayGlyphicon =   (index === 0 ) ? "" : "glyphicon glyphicon-chevron-right";  
                const dryrunStyle = isDryrun ? "dryrun" : "";                   
                logList.push(
                  <tr data-toggle='collapse' data-target={"#dataTarget_" + log.id} className={"accordion-toggle " + stepRowCollapseStyle +"d " + dryrunStyle} id={"tr_"+ log.id}>
                      <td key={"k1_" + log.id}>{formatDate(new Date(log.exportedAt))}</td>
                      <td key={"k2_" + log.id}>{log.exportedBy}</td>
                       <td key={"k3" + log.id}>{log.period} - {log.id}</td>
                       <td className={getStatusStyle(log.status)} key={"k4_" + log.id}>
                       {statusDisplay}</td>
                       <td key={"k5_" + log.id}><span className={displayGlyphicon} key={"k6_" + log.id}></span></td>
                  </tr>                  
                );


              const totalSteps = 4;    
              var stepsArr = [];
              for (let i=0; i < totalSteps; i++) {
                 var logWithSteps = [];
                 logWithSteps.push(log);
                 logWithSteps.push({step: i});
                 var disabledButton = (log.status.toUpperCase() === STATUS_FAILURE.toUpperCase() &&  lastProcessedStepIndex < i )? "disabled=disabled" : "";
                 var opts = {};
                  if (disabledButton) {
                      opts['disabled'] = 'disabled';
                  }


                  stepsArr.push(
                    <div className="stepwizard-step" id={"step_" +  i + log.id} key={"div_step" + i + log.id}>                                    
                      <a href="#" ref={"link_" + i + log.id} key={"alink_" + i+ log.id} tabIndex={i}  className={mapStepButtonStyle.get(i)} >
                        <button type="button" className={"btn btn-default btn-circle " + mapStepButtonStyle.get(i) + "-circle"} id={"stepButton_" + i + log.id} ref={"stepButton_" + i + log.id} key={"stepButtonID_"  + i+ log.id}
                        onClick={this.handleTouchTap.bind(this, logWithSteps)}  {...opts }>
                          <span className={"glyphicon glyphicon-" + 
                           (mapStepButtonStyle.get(i).toUpperCase()===STATUS_SUCCESS.toUpperCase() ? OK : 
                             mapStepButtonStyle.get(i).toUpperCase()=== STATUS_FAILURE.toUpperCase() ? REMOVE : BUTTON_STYLE_DEFAULT ) } aria-hidden="true" key={"arrow_" + i + log.id}></span>
                        </button>
                      </a>   
                              
                      <p>{this.getStepLabel(i)}</p>
                   </div>
                                            
                  );                 
              }                  
                logList.push(
                   <tr>
                      <td colSpan="5" className={"hiddenRow " + dryrunStyle} key={"k7_" + log.id}>                        
                        <div className={"accordian-body " + stepRowCollapseStyle} id={"dataTarget_" + log.id} key={"div1_" + log.id}>
                          <div className="col-xs-12 col-md-8" key={"div2_" + log.id}>
                            <div className="stepwizard" key={"div_stepwizard_" + log.id}>
                              <div className={"stepwizard-row " + rowStyle} key={"divstep_row_" + log.id} >                                
                              {stepsArr}
                              </div>
                            </div>
                          </div>
                          <div className="col-xs-12 col-md-4 table-button" key={"buttondiv_"+ log.id} id={"buttondiv_"+ log.id}>
                            <form action={getAdxDownloadUrl() + "?id=" + log.id} method="get" >
                              <button type="submit" className="btn btn-primary" ref={"button_" + log.id} key={"button_" + log.id} id={"downloadbutton" + index}>Download ADX</button>  
                             </form>

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
              <h2>Data Exporting Records</h2>                     
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
                <div>
                  <Popover 
                         open={this.state.popover.open}                            
                         anchorEl={this.state.popover.anchorEl}
                         anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}
                         targetOrigin={{horizontal: 'left', vertical: 'top'}}
                         canAutoPosition={false}
                         onRequestClose={() => this.setState({popover: {open: false}})}
                         style={{marginLeft: '1rem', padding: '1rem', maxWidth: '50%', maxHeight: '50px', color: '#333333', backgroundColor: '#fffae6',  border: '1px solid #A0A0A0'}}>                              
                    <div>{this.state.popover.message}</div>
                  </Popover>  
                 </div>   

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
            passwordErrorMsg: "",                 
            isSnackbarOpen: false,
        };
    },
     
    getExportDate(){        
        var date = new Date();        
        var quarter = Math.floor(date.getMonth() / 3),
        year = date.getFullYear();
        quarter -= 1;        
        if(quarter < 0) {
            var yearsChanged = Math.ceil(-quarter / 4);
            year -= yearsChanged;            
            quarter += 4 * yearsChanged;
        }        
        return year + " Q" + (quarter + 1) ;    
    },


    componentWillMount() {
        store.subscribe(storeState => this.setState(storeState));
    },

    startExport() {
        actions.startExport({password:this.refs.password.getValue(), dryrun:this.state.dryrunChecked})
            .subscribe(
                helpers.identity,
                (errorMessage) => {
                    this.setState({
                        snackbarMessage: errorMessage,
                        passwordErrorMsg: errorMessage,
                        isSnackbarOpen: true,
                    });
                }
            );
            this.setState(
              {
                password: "",
                dryrunChecked: false,
                passwordErrorMsg: "",
              }
            )
            
            
            
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
        this.setState({
            dryrunChecked: !this.state.dryrunChecked,
        });
    },

    closeSnackbar() {
        this.setState({
            isSnackbarOpen: false,
        });
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
          underlineStyle: {
            borderColor: '#00BCD4',
          },        
        };
                
               
        var msg = (this.state.dryrunChecked) ? "checked" : "unchecked" ;
        
        
        var lastExported = (this.state.log != null && this.state.log.length > 0) ? formatDate(new Date(this.state.log[0].exportedAt)) : "";
        var lastStatus = (this.state.log != null && this.state.log.length > 0) ? this.state.log[0].status : "";
        var lastStatusStyle = (this.state.log != null && this.state.log.length > 0 && this.state.log[0].status === STATUS_SUCCESS) ? "success" : "error";
        const buttonText = this.state.inProgress ? 'Export in progress. Check back later.' : !this.state.password ? 'Export' : 'Export';
        //console.error("snackbar message:"+this.state.snackbarMessage);

        return (
            <div   className="container"> 
                <h1>Data Submission</h1>
                <div>Please reconfirm your identity to start exporting data for <span><b>{this.getExportDate()}</b> Period.</span> </div>
                <TextField ref="password" type="password" fullWidth="true" value={this.state.password} onChange={this.setPassword} 
                errorText={this.state.passwordErrorMsg} hintText="Enter your password"  underlineFocusStyle="borderColor: #00BCD4" /><br/>               
                <Checkbox label="Dry run" style={styles.checkbox} ref="dryrun" onClick={this.handleDryrunCheck} defaultChecked={this.state.dryrunChecked} />                 
                <RaisedButton  backgroundColor='#00BCD4' labelColor='#ffffff' onClick={this.startExport} disabled={this.state.inProgress || !this.state.password} label={buttonText} />
                
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
            <MuiThemeProvider>
                <div>
                    <HeaderBar />
                    <div style={appContentStyle}>
                        <ExportActionBar />
                        <ExportLogList />
                    </div>
                </div>
            </MuiThemeProvider>
        );
    }
});

render(<MuiThemeProvider><LoadingMask /></MuiThemeProvider>, document.getElementById('app'));

getManifest('manifest.webapp')
    .then(manifest => {
        if ((process.env.NODE_ENV !== 'production') && process.env.DEVELOPMENT_SERVER_ADDRESS) {
            console.log(process.env.DEVELOPMENT_SERVER_ADDRESS);
            config.baseUrl = `${process.env.DEVELOPMENT_SERVER_ADDRESS}/api`;
            return;
        }

        config.baseUrl = manifest.getBaseUrl() + '/api'
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
