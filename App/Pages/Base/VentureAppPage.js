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
'use strict';

import React, {Component} from 'react';
import {
  InteractionManager,
  StyleSheet,
  View
} from 'react-native'

type Props = {
  backgroundColor: React.PropTypes.string,
  pageStyle: View.propTypes.style
};

class VentureAppPage extends Component {
  constructor(props:Props) {
    super(props);
  };

  render() {
    return (
      <View style={[this.props.pageStyle || styles.container, {backgroundColor: this.props.backgroundColor}]}>
        {this.props.children}
      </View>
    )
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    backgroundColor: '#02030F'
  }
});

module.exports = VentureAppPage;