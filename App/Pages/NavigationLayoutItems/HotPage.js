/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule HotPage
 * @flow
 */

'use strict';

var React = require('react-native');
var {
    StyleSheet,
    View
    } = React;

var HotPage = React.createClass({
    render() {
        return (
            <View style={styles.container} />
        );
    }
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'red'
    }
});

module.exports = HotPage;