/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule VentureApp
 * @flow
 */

'use strict';

var React = require('react-native');
var {
    AppRegistry,
    NavigatorIOS,
    StatusBarIOS,
    StyleSheet,
    View
} = React;

var HomePage = require('./App/Pages/HomePage');
var Orientation = require('react-native-orientation');

var VentureApp = React.createClass({
  componentDidMount() {
      Orientation.lockToPortrait();
      StatusBarIOS.setStyle('light-content', true);
  },

  render() {
    return (
        <View style={{flex: 1}}>
          <NavigatorIOS
              ref="nav"
              itemWrapperStyle={styles.itemWrapperStyle}
              navigationBarHidden={true}
              style={styles.container}
              initialRoute={{
                    title: 'HomePage',
                    component: HomePage
                  }}
              />
        </View>
    );
  }
});

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  itemWrapperStyle: {
    backgroundColor: '#02030F'
  }
});

AppRegistry.registerComponent('VentureApp', () => VentureApp);

module.exports = VentureApp;
