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
import Snackbar from 'material-ui/Snackbar';
import {helpers} from 'rx';
import LoadingMask from 'd2-ui/lib/loading-mask/LoadingMask.component';
import LinearProgress from 'material-ui/LinearProgress';
import FontIcon from 'material-ui/FontIcon';
import Paper from 'material-ui/Paper';
import Popover from 'material-ui/Popover/Popover';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

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
        this.setState({
            popover: {
                open: true,
                target: event.target.parentNode,
                message: data.summary,
            },
        });
    },

    render() {
        const tableColumns = ['exportedAt', 'exportedBy', 'period', 'status'];

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
                    <div style={{textAlign: 'right'}}>
                        <Paper style={tipStyle}><FontIcon className="material-icons">&#xE5D8;</FontIcon><div>1) Enter your DATIM password here</div></Paper>
                        <Paper style={Object.assign({}, tipStyle, {marginLeft: '170px'})}><FontIcon className="material-icons">&#xE5D8;</FontIcon><div>2) Click here to start the export</div></Paper>
                    </div>
                    <Paper>
                        <div style={{fontSize: '1rem', padding: '1rem'}}>Could not find any previous exports</div>
                    </Paper>
                </div>
            )
        }

        return (
            <div ref="contentRef">
                <DataTable contextMenuActions={{}} primaryAction={this.rowClick} rows={this.state.log} columns={tableColumns} />
                <Popover open={this.state.popover.open}
                         anchorEl={this.state.popover.target}
                         anchorOrigin={{vertical: 'center', horizontal: 'left'}}
                         canAutoPosition={false}
                         onRequestClose={() => this.setState({popover: {open: false}})}
                         style={{marginLeft: '1rem', padding: '1rem', maxWidth: '60%'}}>
                    <div>{this.state.popover.message}</div>
                </Popover>
            </div>
        );
    }
});

const ExportActionBar = React.createClass({
    getInitialState() {
        return {
            inProgress: true,
        };
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
                        snackbarMessage: errorMessage
                    });
                    this.refs.snackbar.show();
                }
            );
    },

    setPassword() {
        this.setState({
            password: this.refs.password.getValue(),
        });
    },

    closeSnackbar() {
        this.refs.snackbar.dismiss();
    },

    render() {
        const buttonBarStyle = {
            textAlign: 'right',
            marginBottom: '2rem',
        };

        const buttonStyle = {
            marginLeft: '2rem',
            width: 400,
        };

        const buttonText = this.state.inProgress ? 'Export in progress. Check back later.' : !this.state.password ? 'Enter your password to start export' : 'Export';

        console.error(this.state.snackbarMessage);

        return (
            <div style={buttonBarStyle}>
                <TextField ref="password" type="password" value={this.state.password} onChange={this.setPassword} hintText="Please enter your password" />
                <RaisedButton style={buttonStyle} onClick={this.startExport} disabled={this.state.inProgress || !this.state.password} label={buttonText} />
                <Snackbar
                    className="snackbar"
                    ref="snackbar"
                    message={(typeof this.state.snackbarMessage === 'object' ? this.state.snackbarMessage.toString() : this.state.snackbarMessage) || ''}
                    action="dismiss"
                    autoHideDuration={0}
                    onActionTouchTap={this.closeSnackbar}
                />
            </div>
        );
    },
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
