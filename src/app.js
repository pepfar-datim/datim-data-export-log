import 'd2-ui/scss/DataTable.scss';
import 'd2-ui/scss/HeaderBar.scss';

import React from 'react';
import {render} from 'react-dom';
import HeaderBar from 'd2-ui/lib/header-bar/HeaderBar.component';
import {init, config, getInstance, getManifest} from 'd2/lib/d2';
import actions from './dataExportLog.actions';
import store from './dataExportLog.store';
import DataTable from 'd2-ui/lib/data-table/DataTable.component';
import reactTapEventPlugin from 'react-tap-event-plugin';
import RaisedButton from 'material-ui/lib/raised-button';
import dhis2 from 'd2-ui/lib/header-bar/dhis2';
import TextField from 'material-ui/lib/text-field';

config.i18n.strings.add('exported_at');
config.i18n.strings.add('exported_by');

reactTapEventPlugin();

dhis2.settings.baseUrl = 'http://localhost:8080/dhis/';

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
        };
    },

    componentWillMount() {
        actions.load();

        store.subscribe(storeState => this.setState(storeState));
    },

    render() {
        return (
            <div>
                <DataTable rows={this.state.log} columns={['exportedAt', 'exportedBy', 'period', 'status']} />
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
        actions.startExport(this.refs.password.getValue());
    },

    setPassword() {
        this.setState({
            password: this.refs.password.getValue(),
        });
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

getManifest('manifest.webapp')
    .then(manifest => {
        if (manifest.getBaseUrl() === '*') {
            return config.baseUrl = 'http://localhost:8080/dhis/api';
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
