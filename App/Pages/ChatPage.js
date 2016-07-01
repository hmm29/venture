/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule ChatPage
 * @flow
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');

var {
  ActionSheetIOS,
  AlertIOS,
  AppStateIOS,
  Component,
  InteractionManager,
  LayoutAnimation,
  Linking,
  ListView,
  Navigator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  } = ReactNative;

var _ = require('lodash');
var Animatable = require('react-native-animatable');
var BackIcon = require('../Partials/Icons/NavigationButtons/BackIcon');
var Dimensions = require('Dimensions');
var DynamicCheckBoxIcon = require('../Partials/Icons/DynamicCheckBoxIcon');
var Firebase = require('firebase');
var GeoFire = require('geofire');
var GiftedMessenger = require('react-native-gifted-messenger');
var Header = require('../Partials/Header');
var Icon = require('react-native-vector-icons/Ionicons');
var Image = require('react-native-image-progress');
var LinearGradient = require('react-native-linear-gradient');
var ModalBase = require('../Partials/Modals/Base/ModalBase');
var ReactFireMixin = require('reactfire');
var TimerMixin = require('react-timer-mixin');
var VentureAppPage = require('./Base/VentureAppPage');

var {height, width} = Dimensions.get('window');
var CHAT_DURATION_IN_MINUTES = 5;
var HEADER_CONTAINER_HEIGHT = height / 20;
var MAX_TEXT_INPUT_VAL_LENGTH = 15;
var MESSAGE_TEXT_INPUT_HEIGHT = 30;
var MESSAGE_TEXT_INPUT_REF = 'messageTextInput';
var MESSAGES_LIST_REF = 'messagesList';
var PARSE_APP_ID = "ba2429b743a95fd2fe069f3ae4fe5c95df6b8f561bb04b62bc29dc0c285ab7fa";
var PARSE_SERVER_URL = "http://45.55.201.172:9999/ventureparseserver";
var RECIPIENT_INFO_BAR_HEIGHT = 78;
var SCREEN_HEIGHT = height;
var TIMER_BAR_HEIGHT = 40;

var GREEN_HEX_CODE = '#84FF9B';
var YELLOW_HEX_CODE = '#ffe770';
var WHITE_HEX_CODE = '#fff';

var STATUS_BAR_HEIGHT = Navigator.NavigationBar.Styles.General.StatusBarHeight;

var GiftedMessengerContainer = React.createClass({
  mixins: [TimerMixin, ReactFireMixin],

  getInitialState() {
    return {
      message: '',
      messages: [],
      isLoadingEarlierMessages: false,
      typingMessage: '',
      allLoaded: false
    }
  },

  _earlierMessages: null,

  componentDidMount() {
    let chatRoomRef = this.props.chatRoomRef,
      chatRoomMessagesRef = chatRoomRef && chatRoomRef.child('messages');

    this.bindAsArray(chatRoomMessagesRef, 'messages');
    this.setState({chatRoomMessagesRef});

    this.getInitialMessages();
    this._isMounted = true;
  },

  componentWillUnmount() {
    this._isMounted = false;
  },

  getInitialMessages() {
    this.props.chatRoomRef.child('messages').once('value', snapshot => {
      this.setMessages(snapshot.val() && _.size(snapshot.val()) >= 8 ? _.slice(_.cloneDeep(_.values(snapshot.val())), _.size(snapshot.val())-8) : _.cloneDeep(_.values(snapshot.val())) || []);
      if(_.size(snapshot.val()) >= 8) this._earlierMessages = _.slice(_.cloneDeep(_.values(snapshot.val())), 0, _.size(snapshot.val())-8);

      this.setState({allLoaded: !this._earlierMessages});
    })
  },

  setMessageStatus(uniqueId, status) {
    let messages = [];
    let found = false;

    for (let i = 0; i < this.state.messages.length; i++) {
      if (this.state.messages[i].uniqueId === uniqueId) {
        let clone = Object.assign({}, this.state.messages[i]);
        clone.status = status;
        messages.push(clone);
        found = true;
      } else {
        messages.push(this.state.messages[i]);
      }
    }

    if (found) {
      this.setMessages(messages);
    }
  },

  setMessages(messages) {
    this.props.getMessageListSize(_.size(messages));
    this.setState({
      messages: messages,
    });
  },

  handleSend(message = {}) {
    let messages = [];

    message.uniqueId = Math.round(Math.random() * 10000); // simulating server-side unique id generation
    message.date = (new Date()).toISOString();
    // mark the sent message as Seen
    this.state.chatRoomMessagesRef.push(message).then(() => {
      if(_.size(_.cloneDeep(_.values(this.state.messages))) >= 8) {
        if(this._earlierMessages && this.state.allLoaded) this.setState({allLoaded: false});
      } else { // for lists shorter than 8
        if(!this.state.allLoaded) this.setState({allLoaded: true});
      }
      messages = _.cloneDeep(_.values(this.state.messages));
      this.setMessages(messages); // here you can replace 'Seen' by any string you want
    });

    // if you couldn't send the message to your server :
    // this.setMessageStatus(message.uniqueId, 'ErrorButton');

    this.setTimeout(() => {
      if (_.size(_.cloneDeep(_.values(this.state.messages))) === 1) {
        this.props.chatRoomRef && this.props.chatRoomRef.child(`inChatRoom_${this.props.recipient && this.props.recipient.ventureId}`) && this.props.chatRoomRef.child(`inChatRoom_${this.props.recipient && this.props.recipient.ventureId}`).once('value', snapshot => {
          if (snapshot.val()) {
            let currentTime = new Date().getTime(),
              expireTime = new Date(currentTime + (CHAT_DURATION_IN_MINUTES * 60 * 1000)).getTime();

            this.props.chatRoomRef && this.props.chatRoomRef.child('timer') && this.props.chatRoomRef.child('timer').set({expireTime}); // @hmm: set chatroom expire time
            this.props.getExpireTime(expireTime);
          }
        })
      } else {
        this.props.chatRoomRef && this.props.chatRoomRef.child(`inChatRoom_${this.props.recipient && this.props.recipient.ventureId}`) && this.props.chatRoomRef.child(`inChatRoom_${this.props.recipient && this.props.recipient.ventureId}`).once('value', snapshot => {
          if (!snapshot.val()) {
            fetch(PARSE_SERVER_URL + '/functions/sendPushNotification', {
              method: 'POST',
              headers: {
                'Accept': 'application/json',
                'X-Parse-Application-Id': PARSE_APP_ID,
                'Content-Type': 'application/json',
              },
              body: `{"channels": ["${this.props.recipient && this.props.recipient.ventureId}"], "alert": "You have a new message from ${this.props.currentUserData && this.props.currentUserData.firstName}!"}`
            })
              .then(response => {
                console.log(JSON.stringify(response))
              })
              .catch(error => console.log(error))
          }
        })
      }
    }, 1);
  },

  onLoadEarlierMessages() {

    // display a loader until you retrieve the messages from your server
    this.setState({
      isLoadingEarlierMessages: true
    });

    // Your logic here
    // Eg: Retrieve old messages from your server

    // IMPORTANT
    // Oldest messages have to be at the begining of the array

    let earlierMessages = [];

    if (this._earlierMessages && !_.isEmpty(this._earlierMessages)) {
      earlierMessages = this._earlierMessages; //@hmm: show last 8 messages
    }

    this.setTimeout(() => {
      this.setMessages(earlierMessages.concat(this.state.messages)); // prepend the earlier messages to your list
      this.setState({
        isLoadingEarlierMessages: false, // hide the loader
        allLoaded: true, // hide the `Load earlier messages` button
      });
    }, 1000); // simulating network
  },

  onErrorButtonPress(message = {}) {
    // Your logic here
    // re-send the failed message

    // remove the status
    this.setMessageStatus(message.uniqueId, '');
  },

  // will be triggered when the Image of a row is touched
  onImagePress(message = {}) {
    // Your logic here
    // Eg: Navigate to the user profile
  },

  render() {
    return (
      <View style={{width, flex: 1}}>
        <GiftedMessenger
          ref={(c) => this._GiftedMessenger = c}

          styles={{
          bubbleRight: {
            marginLeft: width/10,
            backgroundColor: '#fff',
          },
          bubbleLeft: {
            marginRight: width/10,
            backgroundColor: '#222',
          },
            textLeft: {
            color: '#fff',
            fontFamily: 'AvenirNextCondensed-Regular'
          },
          textRight: {
            color: '#111',
            fontFamily: 'AvenirNextCondensed-Regular'
          }
        }}

          autoFocus={false}
          blurOnSubmit={true}
          forceRenderImage={true}
          messages={this.state.messages}
          handleSend={this.handleSend.bind(this)}
          onErrorButtonPress={this.onErrorButtonPress.bind(this)}
          maxHeight={height-(HEADER_CONTAINER_HEIGHT+RECIPIENT_INFO_BAR_HEIGHT+3.2*MESSAGE_TEXT_INPUT_HEIGHT)}

          loadEarlierMessagesButton={!this.state.allLoaded}
          onLoadEarlierMessages={this.onLoadEarlierMessages.bind(this)}

          senderName={this.props.currentUserData.firstName}
          senderImage={{uri: this.props.currentUserData.picture}}
          onImagePress={this.onImagePress}
          displayNames={true}
          hideTextInput={false}
          keyboardShouldPersistTaps={false}
          onChangeText={() => {
          }}

          parseText={false} // enable handlePhonePress, handleUrlPress and handleEmailPress
          handlePhonePress={this.handlePhonePress}
          handleUrlPress={this.handleUrlPress}
          handleEmailPress={this.handleEmailPress}

          isLoadingEarlierMessages={this.state.isLoadingEarlierMessages}
          typingMessage={this.state.typingMessage} />
        {!_.size(this.state.messages) ?
          <View
            style={[styles.timerBar, {backgroundColor: 'rgba(0,0,0,0.95)', position: 'absolute', top: 0}]}>
            <Text
              style={[styles.timer, {fontWeight: '400'}]}>
              The countdown timer will begin after the first message is opened!
            </Text>
          </View> : <View/>}
      </View>
    );
  },

  handleUrlPress(url) {
    Linking.canOpenURL(url).then(supported => {
      if (!supported) {
        console.log('Can\'t handle url: ' + url);
      } else {
        return Linking.openURL(url);
      }
    }).catch(err => console.error('An error occurred', err));
  },

// TODO
// make this compatible with Android
  handlePhonePress(phone) {
    if (Platform.OS !== 'android') {
      var BUTTONS = [
        'Text message',
        'Call',
        'Cancel',
      ];
      var CANCEL_INDEX = 2;

      ActionSheetIOS.showActionSheetWithOptions({
          options: BUTTONS,
          cancelButtonIndex: CANCEL_INDEX
        },
        (buttonIndex) => {
          switch (buttonIndex) {
            case 0:
              // Communications.phonecall(phone, true);
              break;
            case 1:
              // Communications.text(phone);
              break;
          }
        });
    }
  },

  handleEmailPress(email) {
    // Communications.email(email, null, null, null, null);
  }
});

var ChatPage = React.createClass({

  mixins: [ReactFireMixin, TimerMixin],

  getInitialState() {
    return {
      chatExists: true,
      chatRoomMessagesRef: null,
      chatRoomObjectCopy: {},
      contentOffsetYValue: 0,
      dataSource: new ListView.DataSource({
        rowHasChanged: (row1, row2) => !_.isEqual(row1, row2)
      }),
      expireTime: 0,
      extendChatCountdownTimerVal: 60,
      firebaseRef: this.props.firebaseRef,
      hasKeyboardSpace: false,
      hasTimerExpired: false,
      infoContentVisible: false,
      messageListSize: 0,
      showExtendChatModal: false,
    };
  },

  _handle: null,

  componentDidMount() {
    InteractionManager.runAfterInteractions(() => {
      let chatRoomRef = this.props.chatRoomRef, chatRoomMessagesRef = chatRoomRef.child('messages');

      this.setState({
        chatRoomMessagesRef,
      });

      chatRoomRef.once('value', snapshot => {
        if (!snapshot.val() || _.size(snapshot.val()) <= 4) {
          this.props.navigator.pop();
        }

        var seenMessagesId = `seenMessages_${this.props.currentUserData && this.props.currentUserData.ventureId}`;
        chatRoomRef.child(seenMessagesId).set(snapshot.val() && snapshot.val().messages && _.size(snapshot.val().messages) || 0);

        chatRoomRef.child(`inChatRoom_${this.props.currentUserData && this.props.currentUserData.ventureId}`).set(true);

        this.setState({
          seenMessagesId,
          chatRoomObjectCopy: snapshot.val(),
          expireTime: snapshot.val() && snapshot.val().timer && snapshot.val().timer.expireTime
        });
      });
    });
  },

  componentWillUnmount() {
    this.props.chatRoomRef.child(`inChatRoom_${this.props.currentUserData.ventureId}`).set(false);
  },

  closeKeyboard() {
    this.setState({hasKeyboardSpace: false, closeDropdownProfile: false});
    this.refs[MESSAGE_TEXT_INPUT_REF] && this.refs[MESSAGE_TEXT_INPUT_REF].blur();
  },

  getExpireTime(expireTime) {
    this.setState({expireTime});
  },

  getMessageListSize(messageListSize) {
    this.setState({messageListSize});
  },

  handleInfoContentVisibility(infoContentVisible:boolean) {
    this.setState({infoContentVisible});
  },

  handleSetHasTimerExpiredState(hasTimerExpired:boolean){
    //this.setState({hasTimerExpired, showExtendChatModal: hasTimerExpired});
    this.setState({hasTimerExpired});
    // if user in chat that partner has ended but hasnt tried typing anything
    if (!this.state.chatExists) this.props.navigator.pop();
  },

  render() {
    const chatRoomTitle = (this.props.chatRoomActivityPreferenceTitle ? this.props.chatRoomActivityPreferenceTitle :
    this.props.chatRoomEventTitle + '?');

    return (
      <VentureAppPage backgroundColor='rgba(0,0,0,0.96)'>
        <Header containerStyle={{backgroundColor: '#000'}}>
          <BackIcon onPress={() => {
              if(this.state.seenMessagesId) this.props.chatRoomRef.child(this.state.seenMessagesId).set(this.state.messageListSize);
              this.props.navigator.pop();
          }} style={{right: 10, bottom: 5}}/>
          <Text
            style={styles.activityPreferenceTitle}>
            {chatRoomTitle && chatRoomTitle.toUpperCase()} </Text>
          <Text />
        </Header>
        <View style={styles.container}>
          <RecipientInfoBar chatRoomEventTitle={this.props.chatRoomEventTitle}
                            chatRoomRef={this.props.chatRoomRef}
                            closeDropdownProfile={this.state.closeDropdownProfile}
                            closeKeyboard={this.closeKeyboard}
                            currentUserRef={this.props.currentUserRef}
                            expireTime={this.state.expireTime}
                            firebaseRef={this.state.firebaseRef}
                            handleInfoContentVisibility={this.handleInfoContentVisibility}
                            handleSetHasTimerExpiredState={this.handleSetHasTimerExpiredState}
                            _id={this.props._id}
                            messageListLength={this.state.messageListSize}
                            navigator={this.props.navigator}
                            recipientData={this.props}
                            targetUserRef={this.props.targetUserRef}/>
          <GiftedMessengerContainer
            chatRoomRef={this.props.chatRoomRef}
            currentUserData={this.props.currentUserData}
            getExpireTime={this.getExpireTime}
            getMessageListSize={this.getMessageListSize}
            recipient={this.props.recipient}
            />
        </View>
      </VentureAppPage>
    );
  }
});

var RecipientInfoBar = React.createClass({
  propTypes: {
    chatRoomEventTitle: React.PropTypes.string,
    chatRoomRef: React.PropTypes.object.isRequired,
    closeDropdownProfile: React.PropTypes.bool,
    closeKeyboard: React.PropTypes.func.isRequired,
    currentUserRef: React.PropTypes.object,
    expireTime: React.PropTypes.number,
    firebaseRef: React.PropTypes.object,
    handleInfoContentVisibilityChange: React.PropTypes.func,
    handleSetHasTimerExpiredState: React.PropTypes.func.isRequired,
    _id: React.PropTypes.string.isRequired,
    messageListLength: React.PropTypes.number,
    navigator: React.PropTypes.object,
    recipientData: React.PropTypes.object.isRequired,
    targetUserRef: React.PropTypes.object,
  },

  getInitialState() {
    return {
      backgroundColor: WHITE_HEX_CODE,
      currentUserActivityPreferenceTitle: this.props.recipientData.currentUserData.activityPreference.title,
      currentUserBio: this.props.recipientData.currentUserData.bio,
      dir: 'row',
      distance: this.props.recipientData.distance,
      hasKeyboardSpace: false,
      infoContent: 'recipient',
      time: '2'
    }
  },

  componentWillMount(){
    let _this = this;

    this.props.chatRoomRef && this.props.recipientData && this.props.recipientData.currentUserData
    && this.props.recipientData.currentUserData.ventureId && this.props.recipientData.recipient
    && this.props.recipientData.recipient.ventureId && this.props.chatRoomRef
      .child('user_activity_preference_titles')
      .on('value', snapshot => {
        _this.setState({
          currentUserActivityPreferenceTitle: snapshot.val()
          && snapshot.val()[this.props.recipientData.currentUserData.ventureId],
          targetUserActivityPreferenceTitle: snapshot.val()
          && snapshot.val()[this.props.recipientData.recipient.ventureId]
        })
      })

    this.props.targetUserRef.child('location/coordinates').on('value', snapshot => {
      this.setState({
        distance: snapshot.val() && this.calculateDistance([snapshot.val() && snapshot.val().latitude, snapshot.val() && snapshot.val().longitude],
          [this.props.recipientData && this.props.recipientData.currentUserData && this.props.recipientData.currentUserData.location && this.props.recipientData.currentUserData.location.coordinates && this.props.recipientData.currentUserData.location.coordinates.latitude,
            this.props.recipientData && this.props.recipientData.currentUserData && this.props.recipientData.currentUserData.location && this.props.recipientData.currentUserData.location.coordinates && this.props.recipientData.currentUserData.location.coordinates.longitude])
      })
    })
  },

  componentDidMount() {
    this.props.chatRoomRef && this.props.chatRoomRef.child('timer/expireTime').on('value', snapshot => {
      if (snapshot.val()) {
        this.setState({backgroundColor: GREEN_HEX_CODE});
      }
    });
  },

  calculateDistance(location1:Array, location2:Array) {
    return location1 && location2 && (GeoFire.distance(location1, location2) * 0.621371).toFixed(1);
  },

  componentWillUnmount() {
    this.props.chatRoomRef && this.props.chatRoomRef.child('timer/expireTime') && this.props.chatRoomRef.child('timer/expireTime').off();
    this.props.currentUserRef.child('location/coordinates') && this.props.currentUserRef.child('location/coordinates').off();
    this.props.chatRoomRef && this.props.recipientData && this.props.recipientData.currentUserData
    && this.props.recipientData.currentUserData.ventureId && this.props.recipientData.recipient
    && this.props.recipientData.recipient.ventureId && this.props.chatRoomRef
      .child('user_activity_preference_titles').off();
  },

  _getBackgroundColor() {
    let distance = this.state.distance;

    if (distance <= 5.0) {
      if (distance >= 4.0) {
        return '#de994e';
      }
      else if (distance < 4.0 && distance >= 3.0) {
        return '#e2b853';
      }
      else if (distance < 3.0 && distance >= 2.0) {
        return '#e5d659';
      }
      else if (distance < 2.0 && distance >= 1.0) {
        return '#dee95f';
      }
      else if (distance < 1.0 && distance >= 0.0) {
        if (distance >= 0.9) {
          return '#d7eb64';
        }
        else if (distance < 0.9 && distance >= 0.8) {
          return '#cfed69';
        }
        else if (distance < 0.8 && distance >= 0.7) {
          return '#c7ee6e';
        }
        else if (distance < 0.7 && distance >= 0.6) {
          return '#c0f073';
        }
        else if (distance < 0.6 && distance >= 0.5) {
          return '#b8f278';
        }
        else if (distance < 0.5 && distance >= 0.4) {
          return '#b1f47d';
        }
        else if (distance < 0.4 && distance >= 0.3) {
          return '#aaf682';
        }
        else if (distance < 0.3 && distance >= 0.2) {
          return '#a2f887';
        }
        else if (distance < 0.2 && distance >= 0.1) {
          return '#9bfa8c';
        }
        else if (distance < 0.1 && distance >= 0.0) {
          if (distance == 0.0) {
            return GREEN_HEX_CODE;
          }
          else if (distance <= 0.05) {
            return '#8bfd96';
          }
          else {
            return '#93fb91';
          }
        }
      }

    }
    else if (distance > 5.0 && distance <= 10.0) {
      return '#da7948';
    }
    else if (distance > 10.0 && distance <= 15.0) {
      return '#d75943';
    }
    else if (distance >= 15.0) {
      return '#d33e43'
    }
    else {
      return '#d33e43';
    }
  },

  render(){

    let config = layoutAnimationConfigs[0];

    let currentUserData = this.props.recipientData.currentUserData,
      recipient = this.props.recipientData.recipient,
      tags = (this.state.infoContent === 'recipient' ? recipient.activityPreference && recipient.activityPreference.tags
        : currentUserData.activityPreference && currentUserData.activityPreference.tags),
      user = (this.state.infoContent === 'recipient' ? recipient : currentUserData);

    let tagsSection = (
      <View style={[styles.tagBar, {bottom: (this.state.infoContent === 'recipient' ? 15 : 0), marginLeft: width/8}]}>
        <Text style={styles.tagsTitle}>TAGS: </Text>
        <ScrollView
          automaticallyAdjustContentInsets={false}
          horizontal={true}
          directionalLockEnabled={true}
          showsHorizontalScrollIndicator={true}
          style={[styles.scrollView, {height: 30}]}>
          {tags && tags.map((tag) => (
            <TouchableOpacity style={styles.tag}><Text
              style={styles.tagText}>{tag}</Text></TouchableOpacity>
          ))
          }
        </ScrollView>
      </View>
    );

    let infoContent = (
      <View
        style={{paddingVertical: (user === recipient ? height/30 : height/97), bottom: (this.state.hasKeyboardSpace ?
        height/3.5 : 0), backgroundColor: '#eee', flexDirection: 'column', justifyContent: 'center'}}>
        {this.state.infoContent === 'recipient' ?
          <Animatable.View ref="recipientPicture" onLayout={() => this.refs.recipientPicture.fadeIn(400)}>
            <Image source={{uri: recipient.picture}}
                   style={{width: width/2, height: width/2, borderRadius: width/4, alignSelf: 'center',
                     marginVertical: width/8}}/>
          </Animatable.View>
          :
          <Animatable.View ref="currentUserPicture"
                           onLayout={() => this.refs.currentUserPicture.fadeIn(400)}>
            <Image source={{uri: currentUserData.picture}}
                   style={{width: width/2, height: width/2, borderRadius: width/4, alignSelf: 'center',
                     marginVertical: width/8}}/>
          </Animatable.View>
        }
        <Text
          style={{color: '#222', fontSize: 20, fontFamily: 'AvenirNextCondensed-Medium', textAlign: 'center'}}>
          {user.firstName}, {user.age && user.age.value} {'\t'} |{'\t'}
          <Text style={{fontFamily: 'AvenirNextCondensed-Medium'}}>
            <Text
              style={{fontSize: 20}}>{user === currentUserData ? this.state.currentUserActivityPreferenceTitle
            && this.state.currentUserActivityPreferenceTitle.replace(/[^\w\s]|_/g, '').replace(/\s+/g, ' ') :
            this.state.targetUserActivityPreferenceTitle && this.state.targetUserActivityPreferenceTitle
              .replace(/[^\w\s]|_/g, '').replace(/\s+/g, ' ')}
              {this.props.recipientData.chatRoomEventTitle ? '' : ':'}</Text>
            {this.props.recipientData.chatRoomEventTitle ? '' : user.activityPreference
            && (user.activityPreference.start.time || user.activityPreference.status)}
            {'\n'}
          </Text>
        </Text>
        {user === currentUserData ?
          <TextInput
            onBlur={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                        this.setState({hasKeyboardSpace: false})
                        }}
            onFocus={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                        this.setState({hasKeyboardSpace: true})
                        }}
            autoCapitalize='none'
            autoCorrect={false}
            onChangeText={(text) => {
                            if(text.length > MAX_TEXT_INPUT_VAL_LENGTH) return;

                            let currentUserIDHashed = this.props.recipientData.currentUserData.ventureId,
                                upperCaseText = text.toUpperCase();

                            this.setState({currentUserActivityPreferenceTitle: upperCaseText});
                            this.props.chatRoomRef.child('user_activity_preference_titles')
                            .child(currentUserIDHashed)
                            .set(upperCaseText);
                        }}
            returnKeyType='default'
            style={styles.textInput}
            value={this.state.currentUserActivityPreferenceTitle}/> : <TextInput />}
        {!this.props.recipientData.chatRoomEventTitle ? tagsSection : <View style={{height: height / 18}}/>}
        <Text
          style={styles.bio}>{user.bio}</Text>
      </View>
    );

    return (
      <View style={{flexDirection: 'column', width: width}}>
        <View style={[styles.recipientInfoBar, {backgroundColor: this.state.backgroundColor}]}>
          <RecipientAvatar currentUserRef={this.props.currentUserRef} onPress={() => {
                    LayoutAnimation.configureNext(config);
                    this.props.handleInfoContentVisibility(this.state.infoContent === 'column');
                    this.setState({infoContent: 'recipient', dir: (this.state.dir === 'column' && this.state.infoContent
                    === 'recipient' ? 'row' : 'column')})
                }}
                           navigator={this.props.navigator}
                           recipient={recipient}
                           targetUserRef={this.props.targetUserRef}/>
          <View style={styles.rightContainer}>
            <Text style={styles.recipientDistance}> {this.state.distance} mi</Text>
          </View>

          <RecipientAvatar
            currentUserData={currentUserData}
            currentUserRef={this.props.currentUserRef}
            onPress={() => {
                    LayoutAnimation.configureNext(config);
                     this.props.handleInfoContentVisibility(this.state.infoContent === 'column');
                   this.setState({infoContent: 'currentUser', dir: (this.state.dir === 'column'
                   && this.state.infoContent === 'currentUser' ? 'row' : 'column')});
                }}
            navigator={this.props.navigator}
            style={{marginRight: 20}}/>
        </View>
        <TimerBar chatRoomEventTitle={this.props.chatRoomEventTitle}
                  chatRoomRef={this.props.chatRoomRef}
                  closeKeyboard={this.props.closeKeyboard}
                  currentUserData={currentUserData}
                  expireTime={this.props.expireTime}
                  firebaseRef={this.props.firebaseRef}
                  handleSetHasTimerExpiredState={this.props.handleSetHasTimerExpiredState}
                  _id={this.props._id}
                  infoContentOpen={this.state.dir === 'column'}
                  messageListLength={this.props.messageListLength}
                  navigator={this.props.navigator}
                  recipient={recipient}
                  recipientData={this.props.recipientData}
          />
        {this.state.dir === 'column' ?
          <View style={{backgroundColor: '#fff'}}>
            {infoContent}
          </View> :
          <View />
        }
      </View>
    );
  }
});


var RecipientAvatar = React.createClass({
  propTypes: {
    onPress: React.PropTypes.func,
    currentUserData: React.PropTypes.object,
    currentUserRef: React.PropTypes.object,
    recipient: React.PropTypes.object,
    targetUserRef: React.PropTypes.object,
  },

  getInitialState() {
    return {
      active: false,
    }
  },

  componentWillMount() {
    /*
    if (this.props.targetUserRef) {
     this.props.targetUserRef.child('status/appState').on('value', snapshot => {
       if (snapshot.val() === 'active') this.setState({active: true})
       else if (snapshot.val() === 'background') this.setState({active: false});
     })
    }
    
    else if (this.props.currentUserRef) {
     this.props.currentUserRef && this.props.currentUserRef.child('status/appState').on('value', snapshot => {
       if (snapshot.val() === 'active') this.setState({active: true})
       else if (snapshot.val() === 'background') this.setState({active: false});
     })
    }
    */
  },

  componentWillUnmount() {
    //this.props.targetUserRef && this.props.targetUserRef.off();
    //this.props.currentUserRef && this.props.currentUserRef.off();
  },

  render() {
    let currentUserData = this.props.currentUserData,
      recipient = this.props.recipient,
      user;

    if (this.props.recipient) user = {firstName: recipient.firstName, picture: recipient.picture};
    else user = {firstName: currentUserData.firstName, picture: currentUserData.picture};

    return (
      <TouchableOpacity onPress={this.props.onPress} style={styles.recipientAvatar}>
        <Image
          source={{uri: user.picture}}
          style={[styles.avatarImage, {/*borderWidth: 4, borderColor: (this.state.active ? GREEN_HEX_CODE : YELLOW_HEX_CODE*/}]}/>
        <Text
          style={styles.avatarActivityPreference}> {user.firstName} </Text>
      </TouchableOpacity>
    );
  }
});

var TimerBar = React.createClass({
  propTypes: {
    chatRoomEventTitle: React.PropTypes.string,
    chatRoomRef: React.PropTypes.object.isRequired,
    closeKeyboard: React.PropTypes.func.isRequired,
    currentUserData: React.PropTypes.object.isRequired,
    expireTime: React.PropTypes.number,
    firebaseRef: React.PropTypes.object,
    handleSetHasTimerExpiredState: React.PropTypes.func.isRequired,
    _id: React.PropTypes.string.isRequired,
    infoContentOpen: React.PropTypes.bool,
    messageListLength: React.PropTypes.number,
    navigator: React.PropTypes.object.isRequired,
    recipient: React.PropTypes.object.isRequired,
    recipientData: React.PropTypes.object.isRequired,
  },

  getInitialState() {
    return {
      activeToBackgroundTimeRecordInMs: null,
      currentAppState: AppStateIOS.currentState,
      currentTime: (new Date()).getTime(),
      _id: React.PropTypes.string.isRequired,
      firebaseRef: new Firebase('https://ventureappinitial.firebaseio.com/'),
      timerActive: true,
      timerValInSeconds: '..m ..s'
    }
  },

  mixins: [TimerMixin],

  _handle: null,

  // @hmm: timer object Firebase ops must be in componentWillMount
  componentWillMount() {
    let chatRoomRef = this.props.chatRoomRef,
      currentUserData = this.props.currentUserData,
      firebaseRef = this.props.firebaseRef,
      recipient = this.props.recipient,
      _this = this;

    chatRoomRef.child('timer/expireTime').on('value', snapshot => {
      // @hmm: if no timer value then return from function
      if(!snapshot.val() && _.isNumber(this.state.timerValInSeconds) && this.state.timerValInSeconds < CHAT_DURATION_IN_MINUTES*60) {
        this.props.navigator.pop();
      }
      else if (!snapshot.val()) {
        this.setState({timerValInSeconds: CHAT_DURATION_IN_MINUTES*60, timerActive: false});
        return;
      }

      if (!this.state.timerActive) this.setState({timerActive: true});

      // @hmm: for creator of chatroom
      if(Math.floor((snapshot.val() - this.state.currentTime) / 1000) > CHAT_DURATION_IN_MINUTES*60) {
        this.setState({timerValInSeconds: CHAT_DURATION_IN_MINUTES*60});
      } else {
        this.setState({timerValInSeconds: Math.floor((snapshot.val() - this.state.currentTime) / 1000)});
      }

      // @hmm: update in match_request objects so it can be referenced in users list for timer overlays
      if (this.props.recipientData.chatRoomEventTitle) {
        firebaseRef.child(`users/${currentUserData.ventureId}/event_invite_match_requests/${recipient.ventureId}`)
          .update({expireTime: snapshot.val()});
        firebaseRef.child(`users/${recipient.ventureId}/event_invite_match_requests/${currentUserData.ventureId}`)
          .update({expireTime: snapshot.val()});
      } else {
        firebaseRef.child(`users/${currentUserData.ventureId}/match_requests/${recipient.ventureId}`)
          .update({expireTime: snapshot.val()});
        firebaseRef.child(`users/${recipient.ventureId}/match_requests/${currentUserData.ventureId}`)
          .update({expireTime: snapshot.val()});
      }

      _this._handle = _this.setInterval(() => {
        if (this.state.timerValInSeconds-1 <= 0) {
          _this._destroyChatroom(chatRoomRef);
          _this.clearInterval(_this._handle);
        }

        if(this.state.timerValInSeconds > CHAT_DURATION_IN_MINUTES*60) {
          this.setState({timerValInSeconds: (CHAT_DURATION_IN_MINUTES*60)-1})
        } else {
          this.setState({timerValInSeconds: this.state.timerValInSeconds-1});
          // send you have new messages push notification at 1:30 chat duration mark
          if(this.state.timerValInSeconds === 90) {
            this.props.chatRoomRef && this.props.chatRoomRef.child(`seenMessages_${this.props.recipient && this.props.recipient.ventureId}`) && this.props.chatRoomRef.child(`seenMessages_${this.props.recipient && this.props.recipient.ventureId}`).once('value', snapshot => {
              // if other user has unread messages
              if(snapshot.val() !== this.props.messageListLength) {
                fetch(PARSE_SERVER_URL + '/functions/sendPushNotification', {
                  method: 'POST',
                  headers: {
                    'Accept': 'application/json',
                    'X-Parse-Application-Id': PARSE_APP_ID,
                    'Content-Type': 'application/json',
                  },
                  body: `{"channels": ["${this.props.recipient && this.props.recipient.ventureId}"], "alert": "You have new messages!"}`
                })
                  .then(response => {
                    console.log(JSON.stringify(response))
                  })
                  .catch(error => console.log(error))
              }
            });
          }
        }

      }, 1000);

    });
  },

  componentDidMount() {
    if (this.state.timerValInSeconds <= 0) {
      this.props.navigator.pop();
    }
    AppStateIOS.addEventListener('change', this._handleAppStateChange);
  },

  componentWillReceiveProps(nextProps) {
    this.setState({messageListLength: nextProps.messageListLength})
  },

  _destroyChatroom(chatRoomRef:string) {
    this.props.handleSetHasTimerExpiredState(true);

    let currentUserData = this.props.currentUserData,
      currentUserIDHashed = currentUserData.ventureId,
      firebaseRef = this.props.firebaseRef,
      currentUserMatchRequestsRef = firebaseRef.child('users/' + currentUserIDHashed + '/match_requests'),
      recipient = this.props.recipient,
      targetUserIDHashed = recipient.ventureId,
      targetUserMatchRequestsRef = firebaseRef.child('users/' + targetUserIDHashed + '/match_requests');

    this.props.closeKeyboard();
    // the destruction of the match requests is now conditional, and navigator.pop() is not part of this function
    this.props.navigator.pop();

    if (this.props.chatRoomEventTitle) {
      currentUserMatchRequestsRef = firebaseRef.child('users/' + currentUserIDHashed + '/event_invite_match_requests'),
        targetUserMatchRequestsRef = firebaseRef.child('users/' + targetUserIDHashed + '/event_invite_match_requests');
    }

    targetUserMatchRequestsRef.once('value', snapshot => {
      if (snapshot.val()) { // first user to leave chat
        // @hmm: destroy match requests
        targetUserMatchRequestsRef.child(currentUserIDHashed).set(null);
        currentUserMatchRequestsRef.child(targetUserIDHashed).set(null);
        chatRoomRef && chatRoomRef.off(); // @hmm: end subscription
        chatRoomRef && chatRoomRef.set(null); // @hmm: destroy chatRoom
      } else { // second user to leave chat
        chatRoomRef && chatRoomRef.off(); // @hmm: end subscription
        chatRoomRef && chatRoomRef.set(null); // @hmm: destroy chatRoom
      }
    });

    // @hmm: decrement chat count by 1
    firebaseRef.child(`users/${currentUserIDHashed}/chatCount`).once('value', snapshot => {
      firebaseRef.child(`users/${currentUserIDHashed}/chatCount`).set(snapshot.val() - 1);
    });
  },

  _handleAppStateChange(currentAppState) {
    let previousAppState = this.state.currentAppState;
    this.setState({currentAppState, previousAppState});

    if (currentAppState === 'background') {
      this.state.timerActive && this.setState({activeToBackgroundStateTimeRecordInMs: (new Date().getTime())})
    }

    if (currentAppState === 'active') {
      let currentTime = (new Date()).getTime(),
        timeSpentInBackgroundState = Math.floor((currentTime - this.state.activeToBackgroundStateTimeRecordInMs) / 1000);

      this.state.timerActive && this.setState({timerValInSeconds: this.state.timerValInSeconds - timeSpentInBackgroundState});

      if (this.state.timerValInSeconds - 1 <= 0) this._destroyChatroom(this.props.chatRoomRef);
    }
  },

  componentWillUnmount() {
    this.props.chatRoomRef.child('timer/expireTime') && this.props.chatRoomRef.child('timer/expireTime').off();
    AppStateIOS.removeEventListener('change', this._handleAppStateChange);
  },

  render() {
    return (
      <View>
        <View
          style={styles.timerBar}>
          <Text
            style={[styles.timer, (!_.isString(this.state.timerValInSeconds)
          && _.parseInt(this.state.timerValInSeconds/60) === 0 ? {color: '#F12A00'} :{})]}>
            {!_.isString(this.state.timerValInSeconds) && (this.state.timerValInSeconds >= 0)
            && _.parseInt(this.state.timerValInSeconds / 60) + 'm'} {!_.isString(this.state.timerValInSeconds)
          && (this.state.timerValInSeconds >= 0) && this.state.timerValInSeconds % 60 + 's'}</Text>
        </View>
      </View>
    )
  }
});

var styles = StyleSheet.create({
  activityPreferenceTitle: {
    color: '#fff',
    right: 10,
    fontSize: 22,
    fontFamily: 'AvenirNextCondensed-Medium'
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    padding: 8,
    marginTop: 8,
  },
  avatarActivityPreference: {
    fontSize: 12,
    color: 'black',
    fontFamily: 'AvenirNextCondensed-Regular',
    fontWeight: 'normal'
  },
  baseText: {
    fontFamily: 'AvenirNext-Regular',
    width: width / 1.6
  },
  bio: {
    color: '#222',
    fontFamily: 'AvenirNextCondensed-Medium',
    textAlign: 'center',
    fontSize: 16,
    marginVertical: 5,
    bottom: 5
  },
  captionStyle: {
    color: '#fff',
    fontFamily: 'AvenirNextCondensed-Regular'
  },
  container: {
    alignItems: 'center',
    flex: 1
  },
  extendChatModalText: {
    color: '#fff',
    fontFamily: 'AvenirNextCondensed-Medium',
    textAlign: 'center',
    fontSize: 18,
    alignSelf: 'center',
    width: width / 1.4,
    backgroundColor: 'transparent',
    padding: width / 15,
    borderRadius: width / 10
  },
  extendChatModalTextTitle: {
    fontSize: height / 30
  },
  extendChatModalStyle: {
    backgroundColor: '#02030F'
  },
  modalView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  messageList: {
    height: 1000,
    flex: 0.8,
    flexDirection: 'column',
    alignItems: 'center'
  },
  messageTextInput: {
    width: width / 1.2,
    backgroundColor: 'rgba(255,255,255,0.75)',
    height: MESSAGE_TEXT_INPUT_HEIGHT,
    paddingLeft: 10,
    borderColor: 'gray',
    borderRadius: 10,
    fontFamily: 'AvenirNext-Regular',
    color: '#111',
    borderWidth: 1,
    margin: width / 35
  },
  recipientActivity: {
    fontFamily: 'AvenirNextCondensed-Medium',
    fontSize: 24,
    marginRight: 40,
  },
  recipientInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    height: RECIPIENT_INFO_BAR_HEIGHT
  },
  recipientAvatar: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginHorizontal: 20
  },
  recipientDistance: {
    fontSize: 20,
    color: 'black',
    alignSelf: 'center',
    fontFamily: 'AvenirNext-UltraLight',
    fontWeight: '300'
  },
  rightContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  messageRow: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    borderColor: 'rgba(0,0,0,0.1)',
    borderWidth: 0.5,
    alignItems: 'center'
  },
  recipientAlign: {
    width: 40,
    height: 40,
    marginHorizontal: width / 40,
    borderRadius: 20
  },
  sentMessageRow: {
    flex: 1,
    flexDirection: 'column',
    padding: 10,
    marginLeft: 20
  },
  receivedMessageRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 10,
    marginRight: 20
  },
  receivedMessageText: {
    color: 'black',
    fontSize: 16
  },
  scrollView: {
    width: width / 1.3
  },
  sentMessageText: {
    color: 'white',
    fontSize: 16
  },
  tag: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    paddingHorizontal: width / 80,
    marginHorizontal: width / 70,
    paddingVertical: width / 170,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.4)'
  },
  tagBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10
  },
  tagsTitle: {
    color: '#222',
    fontSize: 16,
    fontFamily: 'AvenirNextCondensed-Regular',
    marginHorizontal: 20
  },
  tagText: {
    color: 'rgba(255,255,255,0.95)',
    fontFamily: 'AvenirNextCondensed-Medium'
  },
  textInput: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white',
    width: width / 1.25,
    height: width / 12,
    bottom: 10,
    borderRadius: 10,
    paddingLeft: width / 25,
    alignSelf: 'center',
    fontFamily: 'AvenirNextCondensed-Regular'
  },
  textBoxContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.98)',
    width: width
  },
  timer: {
    color: '#fff',
    fontFamily: 'AvenirNextCondensed-Medium'
  },
  timerBar: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    width: width,
    height: TIMER_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  userImage: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 1,
    margin: 6
  }
});

var animations = {
  layout: {
    spring: {
      duration: 750,
      create: {
        duration: 300,
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity
      },
      update: {
        type: LayoutAnimation.Types.spring,
        springDamping: 0.6
      }
    },
    spring1: {
      duration: 250,
      create: {
        duration: 300,
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity
      },
      update: {
        type: LayoutAnimation.Types.spring,
        springDamping: 0.6
      }
    },
    easeInEaseOut: {
      duration: 300,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.scaleXY
      },
      update: {
        delay: 100,
        type: LayoutAnimation.Types.easeInEaseOut
      }
    }
  }
};

var layoutAnimationConfigs = [
  animations.layout.spring,
  animations.layout.easeInEaseOut,
  animations.layout.spring1
];

module.exports = ChatPage;
