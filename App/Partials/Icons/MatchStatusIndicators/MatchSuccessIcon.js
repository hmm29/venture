/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule MatchSuccessIcon
 * @flow
 */

'use strict';

import React, {
  Component,
  InteractionManager,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const SIZE = 25;

import {Icon, } from 'react-native-icons';

type Props = {
  color: React.PropTypes.string,
  onPress: React.PropTypes.func.isRequired,
  size: React.PropTypes.number,
  style: View.propTypes.style,
};

class MatchSuccessIcon extends Component {
  constructor(props:Props) {
    super(props);
    this.state = {
      badgeValue: 0
    };
  };

  componentWillMount() {
    this.props.chatRoomRef.on('value', snapshot => {
      let badgeValue, messageList, messageListCount, seenMessageCount, seenMessagesId;

      if (snapshot.val() && snapshot.val().messages === null) {
        messageListCount = 0;
      }
      else {
        messageList = _.cloneDeep(_.values(snapshot.val() && snapshot.val().messages));
        messageListCount = messageList && messageList.length;
      }

      seenMessagesId = `seenMessages_${this.props.currentUserIDHashed}`;

      if (snapshot.val() && snapshot.val()[seenMessagesId]) {
        seenMessageCount = snapshot.val() && snapshot.val()[seenMessagesId];
      }
      else {
        seenMessageCount = 0;
      }

      badgeValue = messageListCount - seenMessageCount;

      this.setState({badgeValue, messageListCount})
    });
  };

  componentWillUnmount() {
    this.setState({badgeValue: 0});

    // @hmm: NOTE: pay attention to when you turn off refs.
    // like, you cant call chatRoomMessagesRef.off() or chatRoomRef.off() because will turn off other functionality
  };

  render() {
    let badge = (
      <View style={{flex: 1}}>
        <Text
          style={styles.badge}>{this.state.badgeValue}</Text>
      </View>
    );

    return (
      <TouchableOpacity
        activeOpacity={0.3}
        onPress={() => {
         if(this.state.messageListCount && this.state.badgeValue && this.state.messageListCount === this.state.badgeValue) {
            let currentTime = new Date().getTime(),
              expireTime = new Date(currentTime + (CHAT_DURATION_IN_MINUTES * 60 * 1000)).getTime();

            this.props.chatRoomRef.child('timer').set({expireTime}); // @hmm: set chatroom expire time
          }
          this.props.onPress();
        }}
        style={[this.props.style,{width: (this.props.size || SIZE) * 1.18,
                height: (this.props.size || SIZE) * 1.18}]}>
        {this.state.badgeValue > 0 ? badge : undefined}
        <Icon
          name="ion|chatboxes"
          size={this.props.size || SIZE}
          color={this.props.color || 'rgba(0,0,0,0.2)'}
          style={[styles.icon]}
          />
      </TouchableOpacity>
    );
  };
}

const styles = StyleSheet.create({
  badge: {
    width: SIZE / 1.4,
    height: SIZE / 1.4,
    fontSize: SIZE / 2,
    borderRadius: SIZE / 2.8,
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'AvenirNextCondensed-Medium',
    left: SIZE / 1.4,
    bottom: SIZE / 8,
    paddingTop: 1,
    backgroundColor: '#FF0017',
    opacity: 1.0,
    color: 'white',
    textAlign: 'center'
  },
  icon: {
    opacity: 1.0,
    width: SIZE,
    height: SIZE
  }
});

module.exports = MatchSuccessIcon;