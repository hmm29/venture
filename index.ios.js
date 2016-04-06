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

const PARSE_APP_ID = "ba2429b743a95fd2fe069f3ae4fe5c95df6b8f561bb04b62bc29dc0c285ab7fa";
const PARSE_JAVASCRIPT_KEY = "9a7de08c37355cbc3e2913fab10e6ae1b7fce47f4592412678abe597f98aa786";

class VentureApp extends Component {
  componentWillMount() {
    Parse.initialize(PARSE_APP_ID, PARSE_JAVASCRIPT_KEY);
    Parse.serverURL = 'http://45.55.201.172:9999/ventureparseserver';
    Orientation.lockToPortrait();
  };

  componentDidMount() {
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