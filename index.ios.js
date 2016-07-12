/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @flow
 */

/* 
 * enable JS strict mode for any ES5 code 
 */

'use strict';

/*
 * imports required modules
 */

import React, {Component} from 'react';
import {
  Alert,
  AppRegistry,
  NavigatorIOS,
  NetInfo,
  StatusBar,
  StyleSheet,
  View
  } from 'react-native';

import HomePage from './App/Pages/HomePage';
import Orientation from 'react-native-orientation';
import Parse from 'parse/react-native';

/*
 * Parse push notification server app data
 */

const PARSE_APP_ID = "ba2429b743a95fd2fe069f3ae4fe5c95df6b8f561bb04b62bc29dc0c285ab7fa";
const PARSE_JAVASCRIPT_KEY = "9a7de08c37355cbc3e2913fab10e6ae1b7fce47f4592412678abe597f98aa786";

/*
 * defines the VentureApp class
 */

class VentureApp extends Component {

  /*
   * componentWillMount(): runs before component renders
   */

  componentWillMount() {

   /*
    * set up Parse server connection
    */

    Parse.initialize(PARSE_APP_ID, PARSE_JAVASCRIPT_KEY);
    Parse.serverURL = 'http://104.236.211.208:9999/ventureparseserver';

    Orientation.lockToPortrait(); // only use portrait mode
  };

  /*
   * componentDidMount(): runs once the component renders
   */

  componentDidMount() {
    StatusBar.setBarStyle('light-content', true); // use API for status bar style

    // ensure Internet connection
    NetInfo.isConnected.fetch().then(isConnected => {
      console.log('First, is ' + (isConnected ? 'online' : 'offline'));
      if(!isConnected) Alert.alert('No Internet Connection', 'Please connect to the Internet before using Venture.')
    });
  };

  /*
   * render(): returns JSX that declaratively specifies component UI
   */

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

/*
 * CSS stylings
 */

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});

/*
 * registers this component as the top-level app
 */

AppRegistry.registerComponent('VentureApp', () => VentureApp);