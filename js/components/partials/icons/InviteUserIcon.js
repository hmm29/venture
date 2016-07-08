/**
 * Created by harrisonmiller on 2/15/16.
 */

/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule InviteUserIcon
 * @flow
 */

'use strict';

import React, {Component} from 'react';
import {
  InteractionManager,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const SIZE = 38;

import * as Animatable from 'react-native-animatable';
import {Icon, } from 'react-native-icons';

type Props = {
  color: React.PropTypes.string,
  onPress: React.PropTypes.func.isRequired,
  size: React.PropTypes.number,
  style: View.propTypes.style
};

class InviteUserIcon extends Component {
  constructor(props:Props) {
    super(props);
    this.state = {};
  };

  componentDidMount() {
    this._animate();
  };

  _animate() {
    InteractionManager.runAfterInteractions(() => {
      this.refs.inviteUserIcon && this.refs.inviteUserIcon.pulse(1000, 2000);
    });
  };

  render() {
    return (
      <Animatable.View ref="inviteUserIcon">
        <TouchableOpacity
          activeOpacity={0.3}
          onPress={this.props.onPress}
          style={[{backgroundColor: '#3b5998', width: (this.props.size || SIZE), // @hmm: facebook blue bg color
                    height: (this.props.size || SIZE), justifyContent: 'center', alignItems: 'center', borderRadius: (this.props.size || SIZE) * 0.5}, this.props.style]}>
          <Icon
            name="ion|ios-personadd"
            size={this.props.size || SIZE * 0.6}
            color={this.props.color || 'rgba(255,255,255,0.4'}
            style={[styles.icon]}
            />
        </TouchableOpacity>
      </Animatable.View>
    );
  };
}

const styles = StyleSheet.create({
  icon: {
    opacity: 0.85,
    width: SIZE,
    height: SIZE
  }
});

module.exports = InviteUserIcon;