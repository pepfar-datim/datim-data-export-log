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
import Popover from 'material-ui/lib/popover/popover'

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
            .subscribe(() => {}, () => {
                this.setState({isLoading: false})
            });

        store.subscribe(storeState => this.setState({
            isLoading: false,
            ...storeState
        }));
    },

    rowClick(data, event) {
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
                <DataTable primaryAction={this.rowClick} rows={this.state.log} columns={tableColumns} />
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

        return (
            <div style={buttonBarStyle}>
                <TextField ref="password" type="password" value={this.state.password} onChange={this.setPassword} hintText="Please enter your password" />
                <RaisedButton style={buttonStyle} onClick={this.startExport} disabled={this.state.inProgress || !this.state.password} label={buttonText} />
                <Snackbar
                    className="snackbar"
                    ref="snackbar"
                    message={this.state.snackbarMessage || ''}
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
        if (manifest.getBaseUrl() === '*') {
            dhis2.settings.baseUrl = 'http://localhost:8080/dhis';
            return config.baseUrl = 'http://localhost:8080/dhis/api';
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
