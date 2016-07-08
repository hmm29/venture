/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule BlankIcon
 * @flow
 */

'use strict';

import React, {Component} from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import {Icon, } from 'react-native-icons';

const SIZE = 28;

type Props = {
  style: View.propTypes.style
};

class BlankIcon extends Component {
  constructor(props:Props) {
    super(props);
    this.state = {};
  };

  render() {
    return (
      <TouchableOpacity
        activeOpacity={0.3}
        onPress={this.props.onPress}
        style={[this.props.style]}>
        <Icon
          name="ion|happy-outline"
          size={this.props.size || SIZE}
          color={this.props.color || 'transparent'}
          style={[{width: (this.props.size || SIZE) * 1.18,
                    height: (this.props.size || SIZE) * 1.18}, styles.icon]}
          />
      </TouchableOpacity>
    );
  };
}

const styles = StyleSheet.create({
  icon: {
    width: SIZE,
    height: SIZE
  }
});

module.exports = BlankIcon;