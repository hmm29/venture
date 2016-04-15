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

var React = require('react-native');

var {
  AlertIOS,
  AppStateIOS,
  Image,
  InteractionManager,
  LayoutAnimation,
  ListView,
  Navigator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  } = React;

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

var Messenger = React.createClass({
  getInitialState() {
    return {
      loaded: false,
      message: '',
      messageList: Object,
    }
  },

  componentDidMount() {


  },

  getMessages() {
    return [
      {text: 'Are you building a chat app?', name: 'React-Native', image: {uri: 'https://facebook.github.io/react/img/logo_og.png'}, position: 'left', date: new Date(2015, 10, 16, 19, 0)},
      {
        text: "Yes, and I use Gifted Messenger!",
        name: 'Developer',
        image: null,
        position: 'right',
        date: new Date(2015, 10, 17, 19, 0)
        // If needed, you can add others data (eg: userId, messageId)
      },
      {
        text: 'This is a touchable phone number 0606060606 parsed by taskrabbit/react-native-parsed-text',
        name: 'Developer',
        image: null,
        position: 'right',
        date: new Date(2014, 0, 1, 20, 0),
      }, {
        text: 'React Native enables you to build world-class application experiences on native platforms using a consistent developer experience based on JavaScript and React. https://github.com/facebook/react-native',
        name: 'React-Native',
        image: {uri: 'https://facebook.github.io/react/img/logo_og.png'},
        position: 'left',
        date: new Date(2013, 0, 1, 12, 0),
      },
      {
        text: 'This is a touchable phone number 0606060606 parsed by taskrabbit/react-native-parsed-text',
        name: 'Developer',
        image: null,
        position: 'right',
        date: new Date(2014, 0, 1, 20, 0),
      }, {
        text: 'React Native enables you to build world-class application experiences on native platforms using a consistent developer experience based on JavaScript and React. https://github.com/facebook/react-native',
        name: 'React-Native',
        image: {uri: 'https://facebook.github.io/react/img/logo_og.png'},
        position: 'left',
        date: new Date(2013, 0, 1, 12, 0),
      },
      {
        text: 'This is a touchable phone number 0606060606 parsed by taskrabbit/react-native-parsed-text',
        name: 'Developer',
        image: null,
        position: 'right',
        date: new Date(2014, 0, 1, 20, 0),
      }, {
        text: 'React Native enables you to build world-class application experiences on native platforms using a consistent developer experience based on JavaScript and React. https://github.com/facebook/react-native',
        name: 'React-Native',
        image: {uri: 'https://facebook.github.io/react/img/logo_og.png'},
        position: 'left',
        date: new Date(2013, 0, 1, 12, 0),
      },
    ];
  },

  handleSend(message = {}, rowID = null) {
    // Your logic here
    // Send message.text to your server

    // this._GiftedMessenger.setMessageStatus('Sent', rowID);
    // this._GiftedMessenger.setMessageStatus('Seen', rowID);
    // this._GiftedMessenger.setMessageStatus('Custom label status', rowID);
    if (this.isMounted()) {
      this._GiftedMessenger.setMessageStatus('ErrorButton', rowID); // => In this case, you need also to set onErrorButtonPress
    }
  },

  // @oldestMessage is the oldest message already added to the list
  onLoadEarlierMessages(oldestMessage = {}, callback = () => {}) {

    // Your logic here
    // Eg: Retrieve old messages from your server

    // newest messages have to be at the begining of the array
    var earlierMessages = [
      {
        text: 'This is a touchable phone number 0606060606 parsed by taskrabbit/react-native-parsed-text',
        name: 'Developer',
        image: null,
        position: 'right',
        date: new Date(2014, 0, 1, 20, 0),
      }, {
        text: 'React Native enables you to build world-class application experiences on native platforms using a consistent developer experience based on JavaScript and React. https://github.com/facebook/react-native',
        name: 'React-Native',
        image: {uri: 'https://facebook.github.io/react/img/logo_og.png'},
        position: 'left',
        date: new Date(2013, 0, 1, 12, 0),
      },
    ];

    setTimeout(() => {
      callback(earlierMessages, false); // when second parameter is true, the "Load earlier messages" button will be hidden
    }, 1000);
  },

  handleReceive(message = {}) {
    if (this.isMounted()) {
      this._GiftedMessenger.appendMessage(message);
    }
  },

  onErrorButtonPress(message = {}, rowID = null) {
    // Your logic here
    // Eg: Re-send the message to your server

    setTimeout(() => {
      // will set the message to a custom status 'Sent' (you can replace 'Sent' by what you want - it will be displayed under the row)
      if (this.isMounted()) {
        this._GiftedMessenger.setMessageStatus('Sent', rowID);
      }
      setTimeout(() => {
        // will set the message to a custom status 'Seen' (you can replace 'Seen' by what you want - it will be displayed under the row)
        if (this.isMounted()) {
          this._GiftedMessenger.setMessageStatus('Seen', rowID);
        }
        setTimeout(() => {
          // append an answer
          this.handleReceive({text: 'I saw your message', name: 'React-Native', image: {uri: 'https://facebook.github.io/react/img/logo_og.png'}, position: 'left', date: new Date()});
        }, 500);
      }, 1000);
    }, 500);
  },

  // will be triggered when the Image of a row is touched
  onImagePress(rowData = {}, rowID = null) {
    // Your logic here
    // Eg: Navigate to the user profile
  },

  render() {
    return (
      <GiftedMessenger
        ref={(c) => this._GiftedMessenger = c}

        styles={{
          bubbleRight: {
            marginLeft: 70,
            backgroundColor: '#007aff',
          },
        }}

        autoFocus={false}
        messages={this.state.messages}
        handleSend={this.handleSend.bind(this)}
        onErrorButtonPress={this.onErrorButtonPress.bind(this)}
        maxHeight={Dimensions.get('window').height-(HEADER_CONTAINER_HEIGHT+RECIPIENT_INFO_BAR_HEIGHT+TIMER_BAR_HEIGHT)}
        loadEarlierMessagesButton={true}
        onLoadEarlierMessages={this.onLoadEarlierMessages.bind(this)}
        senderName='Developer'
        senderImage={null}
        onImagePress={this.onImagePress.bind(this)}
        displayNames={true}
        parseText={true} // enable handlePhonePress and handleUrlPress
        inverted={true}
        />

    );
  }
});

var ChatMateTypingLoader = React.createClass({
  componentDidMount() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  },

  render() {
    return (
      <View ref="chatMateTypingLoader" style={{alignSelf: 'center', bottom: height/20}}>
        <TouchableOpacity onPress={() => {this.refs.chatMateTypingLoader.jello(300)}}>
          <Text
            style={{color: '#ccc', fontFamily: 'AvenirNextCondensed-UltraLight', textAlign: 'center', fontSize: 50}}>
            <Text style={{fontSize: height/30, top: 15}}>{this.props.recipientFirstName + ' is typing ...'}</Text>
          </Text>
        </TouchableOpacity>
      </View>
    )
  }
});

var ChatPage = React.createClass({

  mixins: [ReactFireMixin, TimerMixin],

  getInitialState() {
    return {
      chatExists: true,
      chatMateIsTyping: false,
      chatRoomMessagesRef: null,
      chatRoomObjectCopy: {},
      contentOffsetYValue: 0,
      dataSource: new ListView.DataSource({
        rowHasChanged: (row1, row2) => !_.isEqual(row1, row2)
      }),
      extendChatCountdownTimerVal: 60,
      firebaseRef: this.props.firebaseRef,
      hasKeyboardSpace: false,
      hasTimerExpired: false,
      infoContentVisible: false,
      showExtendChatModal: false,
    };
  },

  // @hmm: see http://stackoverflow.com/questions/33049731/scroll-to-bottom-of-scrollview-in-react-native
  footerY: 0,
  _handle: null,
  listHeight: 0,

  componentWillMount() {
    InteractionManager.runAfterInteractions(() => {
        let chatRoomRef = this.props.chatRoomRef,
          chatRoomMessagesRef = chatRoomRef && chatRoomRef.child('messages');

        this.bindAsObject(chatRoomMessagesRef, 'messageList');
        this.scrollResponder = this.refs[MESSAGES_LIST_REF] && this.refs[MESSAGES_LIST_REF].getScrollResponder();

        this.setState({
          chatRoomMessagesRef,
          message: ''
        });

        this.props.chatRoomRef.child(`isTyping_${this.props.recipient.ventureId}`).on('value', snapshot => {
          this.setState({chatMateIsTyping: snapshot.val()});
        });

    });
  },

  componentDidMount() {
    InteractionManager.runAfterInteractions(() => {
        this.setTimeout(() => {
          let chatRoomRef = this.props.chatRoomRef,
            chatRoomMessagesRef = chatRoomRef && chatRoomRef.child('messages');

          chatRoomRef.once('value', snapshot => {
            if (!snapshot.val() || _.size(snapshot.val()) <= 4) {
              this.props.navigator.pop();
            }

            var seenMessagesId = `seenMessages_${this.props.currentUserData && this.props.currentUserData.ventureId}`;
            chatRoomRef.child(seenMessagesId).set(snapshot.val() && snapshot.val().messages && _.size(snapshot.val().messages) || 0);

            this.footerY = snapshot.val() && snapshot.val().layoutMarkers
              && snapshot.val().layoutMarkers[this.props.currentUserData && this.props.currentUserData.ventureId]
              && snapshot.val().layoutMarkers[this.props.currentUserData && this.props.currentUserData.ventureId].messageListHeightRef;
            this.setState({
              contentOffsetYValue: snapshot.val() && snapshot.val().layoutMarkers
              && snapshot.val().layoutMarkers[this.props.currentUserData && this.props.currentUserData.ventureId]
              && snapshot.val().layoutMarkers[this.props.currentUserData && this.props.currentUserData.ventureId].contentOffsetYValue,
              chatRoomObjectCopy: snapshot.val(),
              expireTime: snapshot.val() && snapshot.val().timer && snapshot.val().timer.expireTime
            });
            if (!_.isEmpty(snapshot.val().messages)) {
              this.updateMessages(snapshot.val() && snapshot.val().messages && _.cloneDeep(_.values(snapshot.val().messages)));
            }
          });
        }, 0);
    });
  },

  componentWillUnmount() {
    this.props.chatRoomRef.child(`layoutMarkers/${this.props.currentUserData.ventureId}`).update({messageListHeightRef: this.footerY || 0});
    this.props.chatRoomRef.child(`layoutMarkers/${this.props.currentUserData.ventureId}`).update({contentOffsetYValue: this.state.contentOffsetYValue || 0});
    let seenMessagesId = `seenMessages_${this.props.currentUserData && this.props.currentUserData.ventureId}`;
    this.props.chatRoomRef.child(seenMessagesId).set(this.state.messageList
      && (_.cloneDeep(_.values(_.omit(this.state.messageList, '.key')))).length || 0);
  },

  closeKeyboard() {
    this.setState({hasKeyboardSpace: false, closeDropdownProfile: false});
    this.refs[MESSAGE_TEXT_INPUT_REF] && this.refs[MESSAGE_TEXT_INPUT_REF].blur();
  },

  containerTouched(evt) {
    this.closeKeyboard();
    return false;
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

  updateMessages(messages:Array<Object>) {
    this.setState({
      dataSource: new ListView.DataSource({
        rowHasChanged: (row1, row2) => !_.isEqual(row1, row2)
      }).cloneWithRows(messages),
      loaded: true
    });
  },

  _renderMessage(message:Object, sectionID:number, rowID:number) {
    if (this.state.visibleRows && this.state.visibleRows[sectionID] && this.state.visibleRows[sectionID][rowID]
      && !this.state.visibleRows[sectionID][rowID]) return <View />;

    var recipient = this.props.recipient,
      currentUserData = this.props.currentUserData,
      currentUserIDHashed = this.props.currentUserData.ventureId,
      messageRowStyle = styles.receivedMessageRow,
      messageTextStyle = styles.receivedMessageText,
      sentByCurrentUser = (message.senderIDHashed === currentUserIDHashed);

    if (!sentByCurrentUser) {
      messageRowStyle = styles.sentMessageRow;
      messageTextStyle = styles.sentMessageText;
    }

    var avatarThumbnailURL = (!sentByCurrentUser) ? recipient.picture : currentUserData.picture;

    var avatarThumbnail = (
      <Image
        source={{uri: avatarThumbnailURL}}
        style={styles.recipientAlign}/>
    );
    return (
      <LinearGradient
        colors={(!sentByCurrentUser) ? ['#000', '#111', '#222'] : ['#fff', '#fff']}
        start={[0,1]}
        end={[1,0.9]}
        locations={[0,1.0,0.9]}
        style={styles.messageRow}>
        { (!sentByCurrentUser) ? avatarThumbnail : null }
        <View
          style={messageRowStyle}>
          <Text style={styles.baseText}>
            <Text style={messageTextStyle}>
              {message.body}
            </Text>
          </Text>
        </View>
        { (sentByCurrentUser) ? avatarThumbnail : null }
      </LinearGradient>
    );
  },

  scrollToBottom() {
    // @hmm: see https://github.com/FaridSafi/react-native-gifted-messenger/blob/master/GiftedMessenger.js
    // @hmm: listHeight > 10 make sure info content is not down and compressing list
    if (this.listHeight && this.footerY && (this.footerY > this.listHeight) && (this.listHeight > 10)) {
      var scrollDistance = this.listHeight - this.footerY;
      this.scrollResponder.scrollTo({
        y: -scrollDistance + RECIPIENT_INFO_BAR_HEIGHT + HEADER_CONTAINER_HEIGHT +
        TIMER_BAR_HEIGHT + MESSAGE_TEXT_INPUT_HEIGHT * 3
      }); // @hmm: leave some space so user tempted to add message
    }
  },

  // TODO: reorganize this function
  _sendMessage() {
    this.closeKeyboard();

    InteractionManager.runAfterInteractions(() => {
      if (!this.state.message.length) {
        return;
      }

      let messageObj = {
        senderIDHashed: this.props.currentUserData.ventureId,
        body: this.state.message
      }, _this = this;

      this.state.chatRoomMessagesRef.push(messageObj);
      this.setState({message: ''})
      this.updateMessages(_.cloneDeep(_.values(_.omit(this.state.messageList, '.key'))));
      this.setState({
        messageListLength: (_.cloneDeep(_.values(_.omit(this.state.messageList, '.key')))).length,
      });

      InteractionManager.runAfterInteractions(() => {

        // TODO I don't get this
        //@hmm: if both users in chatroom when first message is sent
        if (this.state.messageList && (_.cloneDeep(_.values(_.omit(this.state.messageList, '.key')))).length === 1) {
          this.props.chatRoomRef && this.props.chatRoomRef.child(`seenMessages_${this.props.recipient && this.props.recipient.ventureId}`) && this.props.chatRoomRef.child(`seenMessages_${this.props.recipient && this.props.recipient.ventureId}`).once('value', snapshot => {
            // if other user's seen messages count is above 0, then start
            if (snapshot.val() > 0) {
              let currentTime = new Date().getTime(),
                expireTime = new Date(currentTime + (CHAT_DURATION_IN_MINUTES * 60 * 1000)).getTime();

              this.props.chatRoomRef && this.props.chatRoomRef.child('timer') && this.props.chatRoomRef.child('timer').set({expireTime}); // @hmm: set chatroom expire time
            }
          })
        }

        this.props.chatRoomRef && this.props.chatRoomRef.child(`seenMessages_${this.props.recipient.ventureId}`) && this.props.chatRoomRef.child(`seenMessages_${this.props.recipient.ventureId}`).once('value', snapshot => {
          if (this.state.messageList && ((_.cloneDeep(_.values(_.omit(this.state.messageList, '.key')))).length - snapshot.val() >= 1)) { //@hmm: reset point when target user has seen all messages except one just sent

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
        });
      });
    });
  },

  render() {
    const chatRoomTitle = (this.props.chatRoomActivityPreferenceTitle ? this.props.chatRoomActivityPreferenceTitle :
    this.props.chatRoomEventTitle + '?');

    let messageTextInput = (
      <TextInput
        autoCorrect={false}
        ref={MESSAGE_TEXT_INPUT_REF}
        onBlur={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                    this.setState({hasKeyboardSpace: false, closeDropdownProfile: false});
                    }}
        onChange={() => {
                     }}
        onEndEditing={() => {
                      this.setTimeout(() => {
                      this.scrollToBottom();
                      InteractionManager.runAfterInteractions(() => {
                        this.props.chatRoomRef.child(`isTyping_${this.props.currentUserData.ventureId}`).set(false);
                      })}, 0);
                      }}
        onFocus={() => {             
                    this.setState({hasKeyboardSpace: true, closeDropdownProfile: true});

                    InteractionManager.runAfterInteractions(() => {
                       this.scrollToBottom();
                       if (this.state.hasTimerExpired) this.props.navigator.pop();

                       this.props.chatRoomRef.child(`isTyping_${this.props.currentUserData.ventureId}`).set(true);
                    })
                    }}
        multiline={true}
        style={styles.messageTextInput}
        onChangeText={(text) => this.setState({message: text})}
        value={this.state.message}
        returnKeyType='default'
        keyboardType='default'/>
    );

    return (
      <VentureAppPage backgroundColor='rgba(0,0,0,0.96)'>
        <Header containerStyle={{backgroundColor: '#000'}}>
          <BackIcon onPress={() => {
            this.updateMessages([]);
            this.props.navigator.pop();
          }} style={{right: 10, bottom: 5}}/>
          <Text
            style={styles.activityPreferenceTitle}>
            {chatRoomTitle && chatRoomTitle.toUpperCase()} </Text>
          <Text />
        </Header>
        <View onStartShouldSetResponder={this.containerTouched} style={styles.container}>
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
                            messageListLength={this.state.messageList && _.size(_.omit(this.state.messageList, '.key', '.value')) || 0}
                            navigator={this.props.navigator}
                            recipientData={this.props}
                            targetUserRef={this.props.targetUserRef}/>
          <Messenger/>
          {this.state.chatMateIsTyping && !this.state.infoContentVisible ? <ChatMateTypingLoader
            recipientFirstName={this.props.recipient && this.props.recipient.firstName}/> : undefined}
          <View style={{height: width / 8}}/>
          <View style={{position: 'absolute', bottom: 0}}>
            <View
              style={[styles.textBoxContainer, {marginBottom: this.state.hasKeyboardSpace ? height/3.1 : 0}]}>
              {messageTextInput}
              <TouchableOpacity onPress={this._sendMessage}>
                <Text
                  style={{color: 'white', fontFamily: 'AvenirNextCondensed-Regular', marginHorizontal: 20,
                  backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 10, paddingVertical: 4,
                  borderRadius: 3}}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
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
          <TouchableOpacity onPress={() => {
                    if(!this.state.hasKeyboardSpace) this.refs.recipientPicture.tada(900)
                    }}>
            <Animatable.View ref="recipientPicture" onLayout={() => this.refs.recipientPicture.fadeIn(400)}>
              <Image source={{uri: recipient.picture}}
                     style={{width: width/2, height: width/2, borderRadius: width/4, alignSelf: 'center',
                     marginVertical: width/18}}/>
            </Animatable.View>
          </TouchableOpacity>
          :
          <TouchableOpacity onPress={() => {
                        if(!this.state.hasKeyboardSpace) this.refs.currentUserPicture.tada(900)
                        }}>
            <Animatable.View ref="currentUserPicture"
                             onLayout={() => this.refs.currentUserPicture.fadeIn(400)}>
              <Image source={{uri: currentUserData.picture}}
                     style={{width: width/2, height: width/2, borderRadius: width/4, alignSelf: 'center',
                     marginVertical: width/18}}/>
            </Animatable.View>
          </TouchableOpacity>
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
                   && this.state.infoContent === 'currentUser' ? 'row' : 'column')})
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
    //if (this.props.targetUserRef) {
    //  this.props.targetUserRef.child('status/appState').on('value', snapshot => {
    //    if (snapshot.val() === 'active') this.setState({active: true})
    //    else if (snapshot.val() === 'background') this.setState({active: false});
    //  })
    //}
    //
    //else if (this.props.currentUserRef) {
    //  this.props.currentUserRef && this.props.currentUserRef.child('status/appState').on('value', snapshot => {
    //    if (snapshot.val() === 'active') this.setState({active: true})
    //    else if (snapshot.val() === 'background') this.setState({active: false});
    //  })
    //}
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
      expireTime = this.props.expireTime,
      firebaseRef = this.props.firebaseRef,
      recipient = this.props.recipient,
      _this = this;

    // TODO: change to look at props and
    // @hmm: if no timer value then return from function
    if (!expireTime && _.isNumber(this.state.timerValInSeconds) && this.state.timerValInSeconds < CHAT_DURATION_IN_MINUTES * 60) {
      this.props.navigator.pop();
    }
    else if (!expireTime) {
      this.setState({timerValInSeconds: CHAT_DURATION_IN_MINUTES * 60, timerActive: false});
      return;
    }

    // @hmm: for creator of chatroom
    if (Math.floor((expireTime - this.state.currentTime) / 1000) > CHAT_DURATION_IN_MINUTES * 60) {
      this.setState({timerValInSeconds: CHAT_DURATION_IN_MINUTES * 60});
    } else {
      this.setState({timerValInSeconds: Math.floor((expireTime - this.state.currentTime) / 1000)});
    }

    // @hmm: update in match_request objects so it can be referenced in users list for timer overlays
    if (this.props.recipientData.chatRoomEventTitle) {
      firebaseRef.child(`users/${currentUserData.ventureId}/event_invite_match_requests/${recipient.ventureId}`)
        .update({expireTime});
      firebaseRef.child(`users/${recipient.ventureId}/event_invite_match_requests/${currentUserData.ventureId}`)
        .update({expireTime});
    } else {
      firebaseRef.child(`users/${currentUserData.ventureId}/match_requests/${recipient.ventureId}`)
        .update({expireTime});
      firebaseRef.child(`users/${recipient.ventureId}/match_requests/${currentUserData.ventureId}`)
        .update({expireTime});
    }

    this.handle = this.setInterval(() => {
      if (this.state.timerValInSeconds - 1 <= 0) {
        this._destroyChatroom(chatRoomRef);
        this.clearInterval(this.handle);
      }

      if (this.state.timerValInSeconds > CHAT_DURATION_IN_MINUTES * 60) {
        this.setState({timerValInSeconds: (CHAT_DURATION_IN_MINUTES * 60) - 1})
      } else {
        this.setState({timerValInSeconds: this.state.timerValInSeconds - 1});
        // send you have new messages push notification at 1:30 chat duration mark
        if (this.state.timerValInSeconds === 90) {
          this.props.chatRoomRef && this.props.chatRoomRef.child(`seenMessages_${this.props.recipient && this.props.recipient.ventureId}`) && this.props.chatRoomRef.child(`seenMessages_${this.props.recipient && this.props.recipient.ventureId}`).once('value', snapshot => {
            // if other user has unread messages
            if (snapshot.val() !== this.props.messageListLength) {
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

  },

  componentDidMount() {
    if (this.state.timerValInSeconds <= 0) {
      this.props.navigator.pop();
      // // if youve already done this, then just exit
      // this.props.chatRoomRef && this.props.chatRoomRef.child(`extendChat/${this.props.currentUserData && this.props.currentUserData.ventureId}`).once('value', snapshot => {
      //   if(snapshot.val() === true) {
      //     // pop back
      //     this.setTimeout(() => this.props.navigator.pop(), 1000);
      //   } else {
      //     // will only show if timer is 0
      //     this.props.handleSetHasTimerExpiredState(true);
      //   }
      // });
    }
    AppStateIOS.addEventListener('change', this._handleAppStateChange);
  },

  componentWillReceiveProps(nextProps) {
    this.setState({messageListLength: nextProps.messageListLength});
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
        {!this.state.messageListLength && !this.props.infoContentOpen ?
          <View
            style={styles.timerBar}>
            <Text
              style={[styles.timer, {fontWeight: '400'}]}>
              The countdown timer will begin after the first message is opened!
            </Text>
          </View> : <View />}
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

