/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule VentureAppPage
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
  StyleSheet,
  View
} from 'react-native'

/*
 * defined Props type object
 */

type Props = {
  backgroundColor: React.PropTypes.string,
  pageStyle: View.propTypes.style
};

/*
 * defines the VentureAppPage class
 */

class VentureAppPage extends Component {

  /*
   * constructor(): instantiate class and initialize the state variables
   * @param: props, properties received from parent component
   */

  constructor(props:Props) {
    super(props);
  };

  /*
   * render(): returns JSX that declaratively specifies page UI
   */

  render() {
    return (
      <View style={[this.props.pageStyle || styles.container, {backgroundColor: this.props.backgroundColor}]}>
        {this.props.children}
      </View>
    )
  };
}

/*
 * CSS stylings
 */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    backgroundColor: '#02030F'
  }
});

/*
 * export the module so it can be imported into other components
 */

module.exports = VentureAppPage;