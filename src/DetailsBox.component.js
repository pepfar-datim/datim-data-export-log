import React from 'react';
import classes from 'classnames';

import FontIcon from 'material-ui/FontIcon/FontIcon';
import RaisedButton from 'material-ui/RaisedButton';
import Divider from 'material-ui/Divider';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';

import Translate from 'd2-ui/lib/i18n/Translate.mixin';
import camelCaseToUnderscores from 'd2-utilizr/lib/camelCaseToUnderscores';
import propTypes from 'material-ui/utils/propTypes';

export default React.createClass({
    propTypes: {
        fields: React.PropTypes.array,
        showDetailBox: React.PropTypes.bool,
        source: React.PropTypes.object,
        onClose: React.PropTypes.func,
    },

    getInitialState() {
        return {
            summaryModalOpen: false
        };
    },

    mixins: [Translate],

    handleSummaryOpen(){
        this.setState({summaryModalOpen: true});
    },

    handleSummaryClose(){
        this.setState({summaryModalOpen: false});
    },

    getDefaultProps() {
        return {
            fields: [
                'exportedBy',
                'created',
                'id',
                'href',
            ],
            showDetailBox: false,
            onClose: () => {},
        };
    },

    getDetailBoxContent() {
        if (!this.props.source) {
            return (
                <div className="detail-box__status">Loading details...</div>
            );
        }

        return this.props.fields
            .filter(fieldName => this.props.source[fieldName])
            .map((fieldName) => {
                const valueToRender = this.getValueToRender(fieldName, this.props.source[fieldName]);

                var header;

                if (fieldName !== 'downloadAdx' && fieldName !== 'viewSummary'){
                    header = (<div className={`detail-field__label detail-field__${fieldName}-label`}>{this.getTranslation(camelCaseToUnderscores(fieldName))}</div>);
                }

                return (
                    <div key={fieldName} className="detail-field">
                        {header}
                        <div className={`detail-field__value detail-field__${fieldName}`}>{valueToRender}</div>
                    </div>
                );
            });
    },

    getValueToRender(fieldName, value) {
        const getDateString = (dateValue) => {
            const stringifiedDate = new Date(dateValue).toString();
            return stringifiedDate === 'Invalid Date' ? dateValue : stringifiedDate;
        };

        if (Array.isArray(value) && value.length) {
            const namesToDisplay = value
                .map(v => v.displayName ? v.displayName : v.name)
                .filter(name => name);

            return (
                <ul>
                    {namesToDisplay.map(name => <li key={name}>{name}</li>)}
                </ul>
            );
        }

        if (fieldName === 'created' || fieldName === 'lastUpdated') {
            return getDateString(value);
        }

        if (fieldName === 'href') {
            
            // Suffix the url with the .json extension to always get the json representation of the api resource
            return <a style={{ wordBreak: 'break-all' }} href={`${value}.json`} target="_blank">{value}</a>;
        }

        if (fieldName === 'downloadAdx'){

            const index = this.props.source.id;

            var buttonDisplay;

            if (this.props.source.hasAdxMessage === true){
                buttonDisplay = (<RaisedButton primary={true} type="submit" ref={"button_" + index} key={"button_" + index} id={"downloadbutton" + index} label="Download ADX Message"/>);
            }else{
                buttonDisplay = (<RaisedButton disabled={true} type="submit" ref={"button_" + index} key={"button_" + index} id={"downloadbutton" + index} label="ADX Message not generated"/>);
            }

            return (<div key={"buttondiv_"+ index} id={"buttondiv_"+ index}>
                        <form action={value} method="get" >
                            {buttonDisplay}
                        </form>
                    </div>);
        }

        if (fieldName === 'viewSummary'){

            
            //for the summary Modal
            const actions = [
                <FlatButton
                label="OK"
                primary={true}
                onClick={this.handleSummaryClose}
                />
            ];

            return (<div>

                <Divider style={{margin : '5px'}}/>
                <FlatButton secondary={true} label="View Summary" onClick={this.handleSummaryOpen} />
                
                <Dialog
                    title="View Summary"
                    actions={actions}
                    modal={true}
                    open={this.state.summaryModalOpen}
                    autoScrollBodyContent={true}
                    contentStyle={{width: '90%', maxWidth: 'none'}}>
                    {this.props.source.viewSummary}
                    </Dialog>
                
                </div>);
                
                return;
        }

        return value;
    },

    render() {
        const classList = classes('details-box');

        if (this.props.showDetailBox === false) {
            return null;
        }

        const actions = [
            <FlatButton
            label="OK"
            primary={true}
            onClick={this.handleSummaryClose}
            />
        ];

        return (
            <div className={classList}>
                <FontIcon className="details-box__close-button material-icons" onClick={this.props.onClose}>close</FontIcon>

                <div>
                    {this.getDetailBoxContent()}
                </div>

            </div>
        );
    },

});