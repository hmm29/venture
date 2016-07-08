/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule ProfilePageIcon
 * @flow
 */

'use strict';

import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const SIZE = 34;

import * as Animatable from 'react-native-animatable';
import {Icon, } from 'react-native-icons';

type Props = {
  color: React.PropTypes.string,
  onPress: React.PropTypes.func.isRequired,
  size: React.PropTypes.number,
  style: View.propTypes.style
};

class ProfilePageIcon extends Component {
  constructor(props:Props) {
    super(props);
    this.state = {};
  };

  componentDidMount() {
    this.refs.profilePageIcon && this.refs.profilePageIcon.fadeInDown(900);
  };

  render() {
    return (
      <Animatable.View ref="profilePageIcon">
        <TouchableOpacity
          activeOpacity={0.2} // @hmm: slightly more noticeable active opacity
          onPress={this.props.onPress}
          style={[this.props.style, {width: (this.props.size || SIZE) * 2.78, paddingLeft: SIZE/1.4, backgroundColor: 'transparent',
                height: (this.props.size || SIZE) * 2.78, justifyContent: 'center', alignItems: 'flex-start'}]}>
          <Icon
            name="ion|person"
            size={this.props.size || SIZE}
            color={this.props.color || '#ccc'}
            style={[styles.icon]}
            />
        </TouchableOpacity>
      </Animatable.View>
    );
  };
}

const styles = StyleSheet.create({
  icon: {
    opacity: 0.6,
    width: SIZE,
    height: SIZE
  }
});

module.exports = ProfilePageIcon;