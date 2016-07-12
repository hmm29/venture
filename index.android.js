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

/* 
 * enable JS strict mode for any ES5 code 
 */

'use strict';

/*
 * imports required modules
 */

import React, {Component} from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View
} from 'react-native';

/*
 * defines the VentureApp class
 */

class VentureApp extends Component {

  /*
   * render(): returns JSX that declaratively specifies page UI
   */

  render() {
    return (
      <View style={styles.container}>
      </View>
    );
  };
}

/*
 * CSS stylings
 */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  }
});

/*
 * registers this component as the top-level app
 */

AppRegistry.registerComponent('VentureApp', () => VentureApp);
