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

import React, {
  AppRegistry,
  Component,
  NavigatorIOS,
  StatusBarIOS,
  StyleSheet,
  View
  } from 'react-native';

import HomePage from './App/Pages/HomePage';
import Orientation from 'react-native-orientation';

class VentureApp extends Component {
  componentDidMount() {
    Orientation.lockToPortrait();
    StatusBarIOS.setStyle('light-content', true);
  };

  render() {
    return (
      <View style={{flex: 1}}>
        <NavigatorIOS
          ref="nav"
          navigationBarHidden={true}
          style={styles.container}
          initialRoute={{
                    title: 'HomePage',
                    component: HomePage
                  }}
          />
      </View>
    );
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});

AppRegistry.registerComponent('VentureApp', () => VentureApp);

module.exports = VentureApp;
