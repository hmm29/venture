/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule ModalBase
 * @flow
 */

'use strict';

var React = require('react-native');
var {
    Modal,
    StyleSheet,
    View,
    } = React;

var ModalBase = React.createClass({
    propTypes: {
        animated: React.PropTypes.bool.isRequired,
        modalStyle: View.propTypes.style,
        modalVisible: React.PropTypes.bool.isRequired,
        transparent: React.PropTypes.bool.isRequired
    },

    render() {
        var modalBackgroundStyle = {
            backgroundColor: this.props.transparent ? 'rgba(0, 0, 0, 0.5)' : '#f5fcff',
        };
        var innerContainerTransparentStyle = this.props.transparent
            ? {backgroundColor: '#fff', padding: 20}
            : null;

        return (
                <Modal
                    animated={this.props.animated || false}
                    transparent={this.props.transparent || false}
                    visible={this.props.modalVisible}>
                    <View style={[styles.container, modalBackgroundStyle, this.props.modalStyle]}>
                        <View style={[styles.innerContainer, innerContainerTransparentStyle]}>
                            {this.props.children}
                        </View>
                    </View>
                </Modal>
        );
    }
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
    }
});

module.exports = ModalBase;