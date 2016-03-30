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

const CHAT_DURATION_IN_MINUTES = 5;
const SIZE = 25;

import {Icon, } from 'react-native-icons';

type Props = {
  chatRoomId: React.PropTypes.string,
  currentUserIDHashed: React.PropTypes.string,
  color: React.PropTypes.string,
  firebaseRef: React.PropTypes.object,
  onPress: React.PropTypes.func.isRequired,
  size: React.PropTypes.number,
  style: View.propTypes.style,
  targetUserIDHashed: React.PropTypes.string
};

class MatchSuccessIcon extends Component {
  constructor(props:Props) {
    super(props);
    this.state = {
      chatRoomRef: null
    };
  };

  componentWillMount() {
   this._createCallbacksWithCurrentProps(this.props);
  };

  componentWillReceiveProps(nextProps) {
    this._createCallbacksWithCurrentProps(nextProps);
  };

  componentWillUnmount() {
    this.setState({badgeValue: 0}); // @hmm: is this necessary??
    // @hmm: NOTE: pay attention to when you turn off refs.
    // like, you cant call chatRoomMessagesRef.off() or chatRoomRef.off() because will turn off other functionality
    this.state.chatRoomRef && this.state.chatRoomRef.off();

  };

  _calculateBadgeValue(chatRoomRef) {
    this.setState({chatRoomRef});
    chatRoomRef.on('value', snapshot => {
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

  _createCallbacksWithCurrentProps(props) {
    let chatRoomsListRef = props.firebaseRef && props.firebaseRef.child('chat_rooms'),
      currentUserIDHashed = props.currentUserIDHashed,
      targetUserIDHashed = props.targetUserIDHashed;

    if(props.chatRoomId) {

      let chatRoomRef = chatRoomsListRef.child(props.chatRoomId);
      this._calculateBadgeValue(chatRoomRef);

    } else {
      let eventInviteMatchRequestChatIDPossibility1, eventInviteMatchRequestChatIDPossibility2, matchRequestChatIDPossibility1, matchRequestChatIDPossibility2;
      eventInviteMatchRequestChatIDPossibility1 = 'EVENT_INVITE_' + currentUserIDHashed + '_TO_' + targetUserIDHashed;
      eventInviteMatchRequestChatIDPossibility2 = 'EVENT_INVITE_' + targetUserIDHashed + '_TO_' + currentUserIDHashed;
      matchRequestChatIDPossibility1 = currentUserIDHashed + '_TO_' + targetUserIDHashed;
      matchRequestChatIDPossibility2 = targetUserIDHashed + '_TO_' + currentUserIDHashed;

      chatRoomsListRef.child(matchRequestChatIDPossibility1).once('value')
        .then(snapshot => {
          if(!snapshot.val()) {
            chatRoomsListRef.child(matchRequestChatIDPossibility2).once('value')
              .then(snapshot => {
                if(!snapshot.val()) {
                  chatRoomsListRef.child(eventInviteMatchRequestChatIDPossibility1).once('value')
                    .then(snapshot => {
                      if(!snapshot.val()) {
                        chatRoomsListRef.child(eventInviteMatchRequestChatIDPossibility2).once('value')
                          .then(snapshot => {
                            if(!snapshot.val()) {
                              return;
                            } else {
                              chatRoomsListRef.child(eventInviteMatchRequestChatIDPossibility2).once('value')
                            }
                          });
                          } else {
                        this._calculateBadgeValue(eventInviteMatchRequestChatIDPossibility1)
                      }
                    });
                    } else {
                  this._calculateBadgeValue(chatRoomsListRef.child(matchRequestChatIDPossibility2))
                }
              })
          } else {
            this._calculateBadgeValue(chatRoomsListRef.child(matchRequestChatIDPossibility1));
          }
        }, error => console.log(error))
    }
  };

  render() {
    let badge = (
      <View style={{flex: 1, top: 8, left: 6}}>
        <Text
          style={styles.badge}>{this.state.badgeValue}</Text>
      </View>
    );

    return (
      <TouchableOpacity
        activeOpacity={0.3}
        onPress={() => {
         if(this.state.messageListCount && this.state.badgeValue && (this.state.messageListCount === this.state.badgeValue)) {
            let currentTime = new Date().getTime(),
              expireTime = new Date(currentTime + (CHAT_DURATION_IN_MINUTES * 60 * 1000)).getTime();

            this.props.firebaseRef && this.props.chatRoomId && this.props.firebaseRef.child(`chat_rooms/${this.props.chatRoomId}/timer`).set({expireTime}); // @hmm: set chatroom expire time
          }
          this.props.onPress();
        }}
        style={[this.props.style,{justifyContent: 'center', bottom: 10, width: (this.props.size || SIZE) * 1.58,
                height: (this.props.size || SIZE) * 1.58}]}>
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
    color: 'white',
    textAlign: 'center',
    position: 'absolute',
    opacity: 0.8
  },
  icon: {
    opacity: 1.0,
    width: SIZE,
    height: SIZE,
    alignSelf: 'center'
  }
});

module.exports = MatchSuccessIcon;