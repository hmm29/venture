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
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    View
    } = React;

var Dimensions = require('Dimensions');
var SubmitActivityIcon = require('../Partials/Icons/SubmitActivityIcon');
var TabBarLayout = require('../NavigationLayouts/TabBarLayout.ios');

var {height, width} = Dimensions.get('window');

var HomePage = React.createClass({
    getInitialState() {
        return {
            firebaseRef: new Firebase('https://ventureappinitial.firebaseio.com/')
        }
    },

    render() {
        let submitActivityIcon;

        if (Platform.OS === 'ios') {
            submitActivityIcon = (
                <SubmitActivityIcon
                    onPress={() => this.props.navigator.push({
                            title: 'Users',
                            component: TabBarLayout,
                            passProps: {
                                currentUserFriends: [],
                                currentUserLocationCoords: [],
                                firebaseRef: this.state.firebaseRef,
                                selectedTab: 'users',
                                ventureId: ""
                            }})
                            }/>
            );
        } else {
            submitActivityIcon = <View />;
        }

        return (
            <View style={styles.container}>
                <Image
                    source={require('../../img/home_background.png')}
                    style={styles.backdrop}
                    >
                    {submitActivityIcon}
                </Image>
            </View>
        )
    }
});

const styles = StyleSheet.create({
    backdrop: {
        width,
        height,
        paddingTop: 10,
        alignItems: 'center'
    },
    container: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
    }
});

module.exports = HomePage;

