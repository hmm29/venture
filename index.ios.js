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
import Parse from 'parse/react-native';

var APP_ID = "ba2429b743a95fd2fe069f3ae4fe5c95df6b8f561bb04b62bc29dc0c285ab7fa";
var MASTER_KEY = "54768afb0a2047887510999c7eeb7bb297b126800654480dabf7453cf134494f";

class VentureApp extends Component {
  componentWillMount() {
    Parse.initialize(APP_ID, MASTER_KEY);
  };

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