/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule ChatsListPageIcon
 * @flow
 */

'use strict';

import React, {
  Component,
  Dimensions,
  LayoutAnimation,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import Animatable from 'react-native-animatable';
import {Icon, } from 'react-native-icons';

var {height, width} = Dimensions.get('window');
const SIZE = 34;

type Props = {
  chatCount: React.PropTypes.number,
  color: React.PropTypes.string,
  onPress: React.PropTypes.func.isRequired,
  size: React.PropTypes.number,
  style: View.propTypes.style
};

class ChatsListPageIcon extends Component {
  constructor(props:Props) {
    super(props);
    this.state = {
      animationDidFinish: false,
      chatCount: 0
    };
  };

  componentDidMount() {
    this.timer = setTimeout(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      this.setState({animationDidFinish: true})
    }, 1500);
    this.refs.chatsListPageIcon && this.refs.chatsListPageIcon.fadeInDown(900); // do second after set timeout
  };

  componentWillReceiveProps(nextProps) {
    this.setState({chatCount: nextProps.chatCount});
  };

  componentWillUnmount() {
    clearTimeout(this.timer);
  };

  render() {
    let badge = (
      <View ref="badge" style={{flex: 1, top: 8, left: 6}}>
        <Text
          style={styles.badge}>{this.props.chatCount || this.state.chatCount}</Text>
      </View>
    );

    return (
      <TouchableOpacity activeOpacity={0.3} onPress={this.props.onPress}>
        {(this.props.chatCount > 0 || this.state.chatCount > 0)&& this.state.animationDidFinish ? badge : undefined}
        <Animatable.View ref="chatsListPageIcon">
          <TouchableOpacity
            onPress={this.props.onPress}
            style={[this.props.style, {width: (this.props.size || SIZE) * 2.78, paddingRight: SIZE/1.4, backgroundColor: 'transparent',
                      height: (this.props.size || SIZE) * 2.78, justifyContent: 'center', alignItems: 'flex-end'}]}>
            <Icon
              name="ion|ios-chatboxes"
              size={this.props.size || SIZE}
              color={this.props.color || '#ccc'}
              style={[styles.icon]}
              />
          </TouchableOpacity>
        </Animatable.View>
      </TouchableOpacity>
    );
  };
}

const styles = StyleSheet.create({
  badge: {
    width: SIZE / 1.6,
    height: SIZE / 1.6,
    fontSize: SIZE / 2.4,
    borderRadius: SIZE / 3.2,
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'AvenirNextCondensed-Medium',
    left: (width < 420 ? (width < 375 ? SIZE*2.3 : SIZE*2.45) : SIZE*1.7),
    bottom: (width < 420 ? (width < 375 ? -(SIZE/20) : SIZE/8) : SIZE/2),
    paddingTop: 1,
    backgroundColor: '#FF0017',
    color: 'white',
    textAlign: 'center',
    position: 'absolute',
    opacity: 0.8
  },
  icon: {
    opacity: 0.6,
    width: SIZE,
    height: SIZE
  }
});

module.exports = ChatsListPageIcon;