/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule LoadingModal
 * @flow
 */

'use strict';

var React = require('react-native');
var {
    Modal,
    StyleSheet,
    Text,
    TouchableHighlight,
    View,
    } = React;

var Button = React.createClass({
    getInitialState() {
        return {
            active: false,
        };
    },

    _onHighlight() {
        this.setState({active: true});
    },

    _onUnhighlight() {
        this.setState({active: false});
    },

    render() {
        var colorStyle = {
            color: this.state.active ? '#fff' : '#000',
        };
        return (
            <TouchableHighlight
                onHideUnderlay={this._onUnhighlight}
                onPress={this.props.onPress}
                onShowUnderlay={this._onHighlight}
                style={[styles.button, this.props.style]}
                underlayColor="#a9d9d4">
                <Text style={[styles.buttonText, colorStyle]}>{this.props.children}</Text>
            </TouchableHighlight>
        );
    }
});

var LoadingModal = React.createClass({
    getInitialState() {
        return {
            animated: true,
            modalVisible: false,
            transparent: false,
        };
    },

    _setModalVisible(visible) {
        this.setState({modalVisible: visible});
    },

    _toggleAnimated() {
        this.setState({animated: !this.state.animated});
    },

    _toggleTransparent() {
        this.setState({transparent: !this.state.transparent});
    },

    render() {
        var modalBackgroundStyle = {
            backgroundColor: this.state.transparent ? 'rgba(0, 0, 0, 0.5)' : '#f5fcff',
        };
        var innerContainerTransparentStyle = this.state.transparent
            ? {backgroundColor: '#fff', padding: 20}
            : null;

        return (
            <View>
                <Modal
                    animated={this.state.animated}
                    transparent={this.state.transparent}
                    visible={this.state.modalVisible}>
                    <View style={[styles.container, modalBackgroundStyle]}>
                        <View style={[styles.innerContainer, innerContainerTransparentStyle]}>
                            <Text>This loading modal was presented {this.state.animated ? 'with' : 'without'} animation.</Text>
                            <Button
                                onPress={this._setModalVisible.bind(this, false)}
                                style={styles.modalButton}>
                                Close
                            </Button>
                        </View>
                    </View>
                </Modal>

                <Button onPress={this._setModalVisible.bind(this, true)}>
                    Present
                </Button>
            </View>
        );
    },
});

var styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    innerContainer: {
        borderRadius: 10,
        alignItems: 'center',
    },
    row: {
        alignItems: 'center',
        flex: 1,
        flexDirection: 'row',
        marginBottom: 20,
    },
    rowTitle: {
        flex: 1,
        fontWeight: 'bold',
    },
    button: {
        borderRadius: 5,
        flex: 1,
        height: 44,
        alignSelf: 'stretch',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    buttonText: {
        fontSize: 18,
        margin: 5,
        textAlign: 'center',
    },
    modalButton: {
        marginTop: 10,
    },
});

module.exports = LoadingModal;