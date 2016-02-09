/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule HomePage
 * @flow
 */

'use strict';

var React = require('react-native');

var {
    Animated,
    AppState,
    AsyncStorage,
    DatePickerIOS,
    Image,
    InteractionManager,
    LayoutAnimation,
    PixelRatio,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    View
    } = React;

var Dimensions = require('Dimensions');
var SentRequestIcon = require('../Partials/Icons/MatchStatusIndicators/SentRequestIcon');

var {height, width} = Dimensions.get('window');

var HomePage = React.createClass({
    render() {
        return (
            <View style={styles.container}>
                <Image
                    source={require('../../img/home_background.png')}
                    style={styles.backdrop}
                    >
                    <SentRequestIcon
                        onPress={() => alert('hey')}
                        />
                </Image>
            </View>
        )
    }
});

const styles = {
    backdrop: {
        width,
        height,
        paddingTop: 10,
        alignItems: 'center',
    },
    container: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
    }
};

module.exports = HomePage;

