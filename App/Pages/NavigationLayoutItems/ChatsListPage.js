/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule ChatsListPage
 * @flow
 */

'use strict';

var React = require('react-native');
var {
  ActivityIndicatorIOS,
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
  TouchableHighlight,
  TouchableOpacity,
  View
  } = React;

var _ = require('lodash');
var Animatable = require('react-native-animatable');
var BrandLogo = require('../../Partials/BrandLogo');
var ChatPage = require('../ChatPage');
var Dimensions = require('Dimensions');
var FiltersModal = require('../../Partials/Modals/FiltersModal');
var GeoFire = require('geofire');
var ModalBase = require('../../Partials/Modals/Base/ModalBase');
var LinearGradient = require('react-native-linear-gradient');
var ReactFireMixin = require('reactfire');
var SGListView = require('react-native-sglistview');
var Swipeout = require('react-native-swipeout');
var TimerMixin = require('react-timer-mixin');
var VentureAppPage = require('../Base/VentureAppPage');

// Header Components
var FiltersModalIcon = require('../../Partials/Icons/NavigationButtons/FiltersModalIcon');
var Header = require('../../Partials/Header');
var HomePageIcon = require('../../Partials/Icons/NavigationButtons/HomePageIcon');

// Match Status Indicators
var DefaultMatchStatusIcon = require('../../Partials/Icons/MatchStatusIndicators/DefaultMatchStatusIcon');
var MatchSuccessIcon = require('../../Partials/Icons/MatchStatusIndicators/MatchSuccessIcon');
var ReceivedRequestIcon = require('../../Partials/Icons/MatchStatusIndicators/ReceivedRequestIcon');
var SentRequestIcon = require('../../Partials/Icons/MatchStatusIndicators/SentRequestIcon');

// Globals
var {height, width} = Dimensions.get('window');
var CHAT_DURATION_IN_MINUTES = 5;
var INITIAL_LIST_SIZE = 8;
var LOGO_WIDTH = 200;
var LOGO_HEIGHT = 120;
var PAGE_SIZE = 10;
var PARSE_APP_ID = "ba2429b743a95fd2fe069f3ae4fe5c95df6b8f561bb04b62bc29dc0c285ab7fa";
var PARSE_SERVER_URL = "http://45.55.201.172:9999/ventureparseserver";
var THUMBNAIL_SIZE = 50;

var BLUE_HEX_CODE = '#40cbfb';
var GREEN_HEX_CODE = '#84FF9B';
var WHITE_HEX_CODE = '#fff';
var YELLOW_HEX_CODE = '#ffe770';

String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

var User = React.createClass({
  propTypes: {
    chatsListHandle: React.PropTypes.number,
    currentUserLocationCoords: React.PropTypes.array,
    currentUserData: React.PropTypes.object,
    data: React.PropTypes.object,
    firebaseRef: React.PropTypes.object,
    firstSession: React.PropTypes.object,
    navigator: React.PropTypes.object,
    updateRows: React.PropTypes.func
  },

  mixins: [TimerMixin],

  getInitialState() {
    return {
      currentTimeInMs: this.props.currentTimeInMs,
      currentAppState: AppStateIOS.currentState,
      dir: 'row',
      expireTime: '',
      showTimerVal: true
    }
  },

  componentWillMount() {
    let distance = this.props.data && this.props.data.location && this.props.data.location.coordinates
        && this.calculateDistance(this.props.currentUserLocationCoords, [this.props.data.location.coordinates.latitude,
          this.props.data.location.coordinates.longitude]),
      _this = this;

    if (this.props.data && this.props.data.isEventInvite) {
      // clear old
      this.props.firebaseRef && this.props.data && this.props.data.ventureId && this.props.currentUserIDHashed
      && this.props.firebaseRef.child(`users/${this.props.currentUserIDHashed}/event_invite_match_requests`)
        .child(this.props.data.ventureId)
      && (this.props.firebaseRef).child(`users/${this.props.currentUserIDHashed}/event_invite_match_requests`)
        .child(this.props.data.ventureId).off();

      this.props.firebaseRef && this.props.data && this.props.data.ventureId && this.props.currentUserIDHashed
      && this.props.firebaseRef.child(`users/${this.props.currentUserIDHashed}/event_invite_match_requests`)
        .child(this.props.data.ventureId)
      && (this.props.firebaseRef).child(`users/${this.props.currentUserIDHashed}/event_invite_match_requests`)
        .child(this.props.data.ventureId).once('value', snapshot => {
          _this.setState({
            chatRoomId: snapshot.val() && snapshot.val().chatRoomId,
            distance,
            status: snapshot.val() && snapshot.val().status,
            expireTime: snapshot.val() && snapshot.val().expireTime,
            hasRequestedExtension: snapshot.val() && snapshot.val().hasRequestedExtension
          });

          // @hmm: onboarding tutorial logic
          if (this.props.firstSession) {
            if (this.state.status === 'received' && !this.props.firstSession.hasReceivedFirstRequest) { // @hmm: most probable for componentDidMount
              // @hmm: account for case in which user already has received requests before first nav to chats list
              AlertIOS.alert(
                'Someone Is Interested In Your Activity!',
                'Tap on their smiley face icon to match with them!'
              );
              this.props.firebaseRef
                .child(`users/${this.props.currentUserIDHashed}/firstSession/hasReceivedFirstRequest`).set(true);
            }
            else if (this.state.status === 'matched' && !this.props.firstSession.hasMatched) {
              AlertIOS.alert(
                'You Matched With Someone!',
                'You matched with another user! Tap on the message bubble to chat!'
              );
              this.props.firebaseRef
                .child(`users/${this.props.currentUserIDHashed}/firstSession/hasMatched`).set(true);
            }
          }
        });

    } else {
      // clear old
      this.props.firebaseRef && this.props.data && this.props.data.ventureId && this.props.currentUserIDHashed
      && this.props.firebaseRef.child(`users/${this.props.currentUserIDHashed}/match_requests`)
        .child(this.props.data.ventureId)
      && (this.props.firebaseRef).child(`users/${this.props.currentUserIDHashed}/match_requests`)
        .child(this.props.data.ventureId).off();

      this.props.firebaseRef && this.props.data && this.props.data.ventureId && this.props.currentUserIDHashed
      && this.props.firebaseRef.child(`users/${this.props.currentUserIDHashed}/match_requests`)
        .child(this.props.data.ventureId)
      && (this.props.firebaseRef).child(`users/${this.props.currentUserIDHashed}/match_requests`)
        .child(this.props.data.ventureId).once('value', snapshot => {
          _this.setState({
            chatRoomId: snapshot.val() && snapshot.val().chatRoomId,
            distance,
            status: snapshot.val() && snapshot.val().status,
            expireTime: snapshot.val() && snapshot.val().expireTime,
            hasRequestedExtension: snapshot.val() && snapshot.val().hasRequestedExtension
          });

          // @hmm: onboarding tutorial logic
          if (this.props.firstSession) {
            if (this.state.status === 'received' && !this.props.firstSession.hasReceivedFirstRequest) {
              AlertIOS.alert(
                'Someone Is Interested In Your Activity!',
                'Tap on their smiley face icon to match with them!'
              );
              this.props.firebaseRef
                .child(`users/${this.props.currentUserIDHashed}/firstSession/hasReceivedFirstRequest`).set(true);
            }
            else if (this.state.status === 'matched' && !this.props.firstSession.hasMatched) {
              AlertIOS.alert(
                'You Matched With Someone!',
                'You matched with another user! Tap on the message bubble to chat!'
              );
              this.props.firebaseRef
                .child(`users/${this.props.currentUserIDHashed}/firstSession/hasMatched`).set(true);
            }
          }
        });
    }
  },

  componentDidMount() {
    AppStateIOS.addEventListener('change', this._handleAppStateChange);
  },

  _handleAppStateChange(currentAppState) {
    if (currentAppState === 'background') {
      this.state.showTimerVal && this.setState({showTimerVal: false})
    }
    if (currentAppState === 'active') {
      !this.state.timerVal && this.setState({showTimerVal: true});
    }
  },

  componentWillReceiveProps(nextProps) {
    this._handle = this.setInterval(() => {
      this.setState({currentTimeInMs: (new Date()).getTime()})
    }, 1000);

    this.setState({currentTimeInMs: nextProps.currentTimeInMs});

    let distance = nextProps.data && nextProps.data.location && nextProps.data.location.coordinates
        && this.calculateDistance(nextProps.currentUserLocationCoords, [nextProps.data.location.coordinates.latitude,
          nextProps.data.location.coordinates.longitude]),
      matchRequestsRef,
      _this = this;

    if (nextProps.data && nextProps.data.isEventInvite) {
      // @hmm: must have this to clean up old match subscriptions
      nextProps.firebaseRef && nextProps.data && nextProps.data.ventureId && nextProps.currentUserIDHashed
      && nextProps.firebaseRef.child(`users/${nextProps.currentUserIDHashed}/event_invite_match_requests`)
        .child(nextProps.data.ventureId)
      && (nextProps.firebaseRef).child(`users/${nextProps.currentUserIDHashed}/event_invite_match_requests`)
        .child(nextProps.data.ventureId).off();

      matchRequestsRef = `users/${nextProps.currentUserIDHashed}/event_invite_match_requests`;
    } else {
      // @hmm: must have this to clean up old match subscriptions
      nextProps.firebaseRef && nextProps.data && nextProps.data.ventureId && nextProps.currentUserIDHashed
      && nextProps.firebaseRef.child(`users/${nextProps.currentUserIDHashed}/match_requests`)
        .child(nextProps.data.ventureId)
      && (nextProps.firebaseRef).child(`users/${nextProps.currentUserIDHashed}/match_requests`)
        .child(nextProps.data.ventureId).off();

      matchRequestsRef = `users/${nextProps.currentUserIDHashed}/match_requests`;
    }

    nextProps.firebaseRef && nextProps.data && nextProps.data.ventureId && nextProps.currentUserIDHashed
    && nextProps.firebaseRef.child(matchRequestsRef)
      .child(nextProps.data.ventureId)
    && (nextProps.firebaseRef).child(matchRequestsRef)
      .child(nextProps.data.ventureId).once('value', snapshot => {
        let status = this.state.status;
          _this.setState({status: ''}); // @hmm: quick clear before changing status value
          _this.setState({
          chatRoomId: snapshot.val() && snapshot.val().chatRoomId,
          distance,
          status: snapshot.val() && snapshot.val().status,
          expireTime: snapshot.val() && snapshot.val().expireTime,
          hasRequestedExtension: snapshot.val() && snapshot.val().hasRequestedExtension
        });

        if (status !== this.state.status) {
          console.log('changed'); //@hmm: do something here, helps with live updates
        }

        // @hmm: onboarding tutorial logic
        if (nextProps.firstSession && (status !== this.state.status)) { // @hmm: only fire if status has changed and previous status was not null
          if (this.state.status === 'received' && !nextProps.firstSession.hasReceivedFirstRequest) {
            AlertIOS.alert(
              'Someone Is Interested In Your Activity!',
              'Tap on their smiley face icon to match with them!'
            );
            nextProps.firebaseRef
              .child(`users/${nextProps.currentUserIDHashed}/firstSession/hasReceivedFirstRequest`).set(true);
          }
          else if (this.state.status === 'matched' && !nextProps.firstSession.hasMatched) {
            AlertIOS.alert(
              'You Matched With Someone!',
              'You matched with another user! Tap on the message bubble to chat!'
            );
            nextProps.firebaseRef
              .child(`users/${nextProps.currentUserIDHashed}/firstSession/hasMatched`).set(true);
          }
        }
      });

  },

  componentWillUnmount() {
    if(this.props.data.isEventInvite) {
      this.props.firebaseRef && this.props.data && this.props.data.ventureId && this.props.currentUserIDHashed
      && this.props.firebaseRef.child(`users/${this.props.currentUserIDHashed}/event_invite_match_requests`)
        .child(this.props.data.ventureId)
      && (this.props.firebaseRef).child(`users/${this.props.currentUserIDHashed}/event_invite_match_requests`)
        .child(this.props.data.ventureId).off();
    } else {
      this.props.firebaseRef && this.props.data && this.props.data.ventureId && this.props.currentUserIDHashed
      && this.props.firebaseRef.child(`users/${this.props.currentUserIDHashed}/match_requests`)
        .child(this.props.data.ventureId)
      && (this.props.firebaseRef).child(`users/${this.props.currentUserIDHashed}/match_requests`)
        .child(this.props.data.ventureId).off();
    }

    AppStateIOS.removeEventListener('change', this._handleAppStateChange);
  },

  calculateDistance(location1:Array, location2:Array) {
    return location1 && location2 && (GeoFire.distance(location1, location2) * 0.621371).toFixed(1);
  },

  _getSecondaryStatusColor() {
    switch (this.state.status) {
      case 'sent':
        return '#FFF9B9';
      case 'received':
        return '#D1F8FF';
      case 'matched':
        return '#AAFFA9';
      default:
        return '#FBFBF1';
    }
  },

  getStatusColor() {
    switch (this.state.status) {
      case 'sent':
        return YELLOW_HEX_CODE;
      case 'received':
        return BLUE_HEX_CODE;
      case 'matched':
        return GREEN_HEX_CODE;
      default:
        return WHITE_HEX_CODE;
    }
  },

  _getTimerValue(currentTimeInMs:number) {
    if (!(this.state.expireTime && currentTimeInMs)) return -1;

    let timerValInSeconds = Math.floor((this.state.expireTime - currentTimeInMs) / 1000);

    if (timerValInSeconds >= 0) return timerValInSeconds;

    let targetUserIDHashed = this.props.data.ventureId,
      currentUserIDHashed = this.props.currentUserIDHashed,
      firebaseRef = this.props.firebaseRef,
      targetUserMatchRequestsRef = firebaseRef.child('users/' + targetUserIDHashed + '/match_requests'),
      currentUserMatchRequestsRef = firebaseRef.child('users/' + currentUserIDHashed + '/match_requests');

    // @hmm: end match interactions
    targetUserMatchRequestsRef.child(currentUserIDHashed).set(null);
    currentUserMatchRequestsRef.child(targetUserIDHashed).set(null);

    this.state.chatRoomId && firebaseRef.child(`chat_rooms/${this.state.chatRoomId}`).set(null);

    return -1;
  },

  handleMatchInteraction() {
    let targetUserIDHashed = this.props.data.ventureId,
      currentUserIDHashed = this.props.currentUserIDHashed,
      firebaseRef = this.props.firebaseRef,
      usersListRef = firebaseRef.child('users'),
      currentUserRef = usersListRef.child(currentUserIDHashed),
      targetUserRef = usersListRef.child(targetUserIDHashed),
      firstSessionRef = currentUserRef.child('firstSession'),
      _this = this;

    if (this.props.data && this.props.data.isEventInvite) {
      let targetUserEventInviteMatchRequestsRef = targetUserRef.child('event_invite_match_requests'),
        currentUserEventInviteMatchRequestsRef = currentUserRef.child('event_invite_match_requests');

      let chatRoomEventTitle,
        distance = this.state.distance + ' mi',
        _id;

      currentUserEventInviteMatchRequestsRef.child(targetUserIDHashed).once('value', snapshot => {
        chatRoomEventTitle = snapshot.val() && snapshot.val().eventTitle;

        if (snapshot.val() && snapshot.val().role === 'sender') {
          _id = 'EVENT_INVITE_' + targetUserIDHashed + '_TO_' + currentUserIDHashed;
        } else {
          _id = 'EVENT_INVITE_' + currentUserIDHashed + '_TO_' + targetUserIDHashed;
        }

        // @hmm: put chat ids in match request object so overlays know which chat to destroy
        currentUserEventInviteMatchRequestsRef.child(targetUserIDHashed).update({chatRoomId: _id});
        targetUserEventInviteMatchRequestsRef.child(currentUserIDHashed).update({chatRoomId: _id});

        firebaseRef.child(`chat_rooms/${_id}`).once('value', snapshot => {

          let chatRoomRef = firebaseRef.child(`chat_rooms/${_id}`);

          if (!snapshot.val() || !snapshot.val()._id) { // check if chat object has _id
            // TODO: in the future should be able to account for timezone differences?
            // probably not because if youre going to match with someone youll be in same timezone

            let currentTime = new Date().getTime();

            chatRoomRef.child('_id').set(_id); // @hmm: set unique chat Id
            chatRoomRef.child(`seenMessages_${currentUserIDHashed}`).set(0); // @hmm: set current user seen messages count
            chatRoomRef.child(`seenMessages_${targetUserIDHashed}`).set(0); // @hmm: set target user seen messages count
            chatRoomRef.child('createdAt').set(currentTime); // @hmm: set unique chat Id
            chatRoomRef.child('user_activity_preference_titles').child(currentUserIDHashed).set(chatRoomEventTitle);
            chatRoomRef.child('user_activity_preference_titles').child(targetUserIDHashed).set(chatRoomEventTitle);

          }

          _this.props.navigator.push({
            title: 'Chat',
            component: ChatPage,
            passProps: {
              _id,
              recipient: _this.props.data,
              distance,
              chatRoomEventTitle,
              chatRoomRef,
              currentUserData: _this.props.currentUserData,
              currentUserRef,
              firebaseRef,
              targetUserRef
            }
          });

          if (this.props.firstSession && !this.props.firstSession.hasStartedFirstChat) {
            AlertIOS.alert(
              'Countdown Timer!',
              'Welcome to your first chat! After 5 minutes, this conversation will expire. Let your match know what you want to do. No time to waste!'
            );
            firstSessionRef.child('hasStartedFirstChat').set(true);
          }

        })
      });

    } else {

      let targetUserMatchRequestsRef = targetUserRef.child('match_requests'),
        currentUserMatchRequestsRef = currentUserRef.child('match_requests');

      let chatRoomActivityPreferenceTitle,
        distance = this.state.distance + 'mi',
        _id;

      currentUserMatchRequestsRef.child(targetUserIDHashed).once('value', snapshot => {

        if (snapshot.val() && snapshot.val().role === 'sender') {
          _id = targetUserIDHashed + '_TO_' + currentUserIDHashed;
          chatRoomActivityPreferenceTitle = this.props.currentUserData.activityPreference.title
        } else {
          _id = currentUserIDHashed + '_TO_' + targetUserIDHashed;
          chatRoomActivityPreferenceTitle = this.props.currentUserData.activityPreference.title
        }

        // @hmm: put chat ids in match request object so overlays know which chat to destroy
        currentUserMatchRequestsRef.child(targetUserIDHashed).update({chatRoomId: _id});
        targetUserMatchRequestsRef.child(currentUserIDHashed).update({chatRoomId: _id});

        firebaseRef.child(`chat_rooms/${_id}`).once('value', snapshot => {

          let chatRoomRef = firebaseRef.child(`chat_rooms/${_id}`);

          if (!snapshot.val() || !snapshot.val()._id) { // check if chat object has _id
            // TODO: in the future should be able to account for timezone differences?
            // good for now because in nearly all cases your match will be in same timezone
            let currentTime = new Date().getTime();

            chatRoomRef.child('_id').set(_id); // @hmm: set unique chat Id
            chatRoomRef.child(`seenMessages_${currentUserIDHashed}`).set(0); // @hmm: set current user seen messages count
            chatRoomRef.child(`seenMessages_${targetUserIDHashed}`).set(0); // @hmm: set target user seen messages count
            chatRoomRef.child('createdAt').set(currentTime); // @hmm: set unique chat Id
            chatRoomRef.child('user_activity_preference_titles') // @hmm: set activity preference titles for chat
              .child(currentUserIDHashed)
              .set(this.props.currentUserData.activityPreference.title);
            chatRoomRef.child('user_activity_preference_titles')
              .child(targetUserIDHashed)
              .set(this.props.data.activityPreference.title);
          }

          _this.props.navigator.push({
            title: 'Chat',
            component: ChatPage,
            passProps: {
              _id,
              recipient: _this.props.data,
              distance,
              chatRoomActivityPreferenceTitle,
              chatRoomRef,
              currentUserData: _this.props.currentUserData,
              currentUserRef,
              firebaseRef,
              targetUserRef
            }
          });

          if (this.props.firstSession && !this.props.firstSession.hasStartedFirstChat) {
            AlertIOS.alert(
              'Countdown Timer!',
              'Welcome to your first chat! After 5 minutes, this conversation will expire. Let your match know what you want to do. No time to waste!'
            );
            firstSessionRef.child('hasStartedFirstChat').set(true);
          }
        });
      });

    }
  },

  handleReceivedInteraction() {
    let _this = this,
      matchRequests = 'match_requests';

    if (this.props.data && this.props.data.isEventInvite) {
      matchRequests = 'event_invite_match_requests';
    }

    _this.setTimeout(() => {
      this.props.firebaseRef && this.props.data && this.props.data.ventureId
      && this.props.currentUserIDHashed && this.props.firebaseRef
        .child(`users/${this.props.currentUserIDHashed}`).child(matchRequests).child(this.props.data.ventureId)
      && (this.props.firebaseRef).child(`users/${this.props.currentUserIDHashed}`).child(matchRequests)
        .child(this.props.data.ventureId).once('value', snapshot => {
          _this.setState({
            chatRoomId: snapshot.val() && snapshot.val().chatRoomId,
            status: snapshot.val() && snapshot.val().status,
            expireTime: snapshot.val() && snapshot.val().expireTime
          });
        });
    }, 0);

    let targetUserIDHashed = this.props.data.ventureId,
      currentUserIDHashed = this.props.currentUserIDHashed,
      firebaseRef = this.props.firebaseRef,
      usersListRef = firebaseRef.child('users'),
      currentUserRef = usersListRef.child(currentUserIDHashed),
      targetUserRef = usersListRef.child(targetUserIDHashed);

    if (this.props.data && this.props.data.isEventInvite) {
      let targetUserEventInviteMatchRequestsRef = targetUserRef.child('event_invite_match_requests'),
        currentUserEventInviteMatchRequestsRef = currentUserRef.child('event_invite_match_requests');

      // @hmm: accept the request
      // chatroom reference uses id of the user who accepts the received matchInteraction
      targetUserEventInviteMatchRequestsRef.child(currentUserIDHashed).update({
        _id: currentUserIDHashed,
        status: 'matched',
        role: 'recipient'
      });

      currentUserEventInviteMatchRequestsRef.child(targetUserIDHashed).update({
        _id: targetUserIDHashed,
        status: 'matched',
        role: 'sender'
      });

      fetch(PARSE_SERVER_URL + '/functions/sendPushNotification', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'X-Parse-Application-Id': PARSE_APP_ID,
          'Content-Type': 'application/json',
        },
        body: `{"channels": ["${targetUserIDHashed}"], "alert": "You have a new match!"}`
      })
        .then(response => {
          console.log(JSON.stringify(response))
        })
        .catch(error => console.log(error))

    } else {

      let targetUserMatchRequestsRef = targetUserRef.child('match_requests'),
        currentUserMatchRequestsRef = currentUserRef.child('match_requests');

      // @hmm: accept the request
      // chatroom reference uses id of the user who accepts the received matchInteraction
      targetUserMatchRequestsRef.child(currentUserIDHashed).setWithPriority({
        _id: currentUserIDHashed,
        status: 'matched',
        role: 'recipient'
      }, 100);

      currentUserMatchRequestsRef.child(targetUserIDHashed).setWithPriority({
        _id: targetUserIDHashed,
        status: 'matched',
        role: 'sender'
      }, 100);

      fetch(PARSE_SERVER_URL + '/functions/sendPushNotification', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'X-Parse-Application-Id': PARSE_APP_ID,
          'Content-Type': 'application/json',
        },
        body: `{"channels": ["${targetUserIDHashed}"], "alert": "You have a new match!"}`
      })
        .then(response => {
          console.log(JSON.stringify(response))
        })
        .catch(error => console.log(error))

    }

  },

  handleSentInteraction() {
    let _this = this,
      matchRequests = 'match_requests';

    if (this.props.data && this.props.data.isEventInvite) {
      matchRequests = 'event_invite_match_requests';
    }

    _this.setTimeout(() => {
      this.props.firebaseRef && this.props.data && this.props.data.ventureId
      && this.props.currentUserIDHashed && this.props.firebaseRef
        .child(`users/${this.props.currentUserIDHashed}`).child(matchRequests).child(this.props.data.ventureId)
      && (this.props.firebaseRef).child(`users/${this.props.currentUserIDHashed}`).child(matchRequests)
        .child(this.props.data.ventureId).once('value', snapshot => {
          _this.setState({
            chatRoomId: snapshot.val() && snapshot.val().chatRoomId,
            status: snapshot.val() && snapshot.val().status,
            expireTime: snapshot.val() && snapshot.val().expireTime
          });
        });
    }, 0);

    let targetUserIDHashed = this.props.data.ventureId,
      currentUserIDHashed = this.props.currentUserIDHashed,
      firebaseRef = this.props.firebaseRef,
      usersListRef = firebaseRef.child('users'),
      currentUserRef = usersListRef.child(currentUserIDHashed),
      targetUserRef = usersListRef.child(targetUserIDHashed);

    if (this.props.data && this.props.data.isEventInvite) {
      let targetUserEventInviteMatchRequestsRef = targetUserRef.child('event_invite_match_requests'),
        currentUserEventInviteMatchRequestsRef = currentUserRef.child('event_invite_match_requests');

      // @hmm: delete the requests
      targetUserEventInviteMatchRequestsRef.child(currentUserIDHashed).set(null);
      currentUserEventInviteMatchRequestsRef.child(targetUserIDHashed).set(null);

    } else {

      let targetUserMatchRequestsRef = targetUserRef.child('match_requests'),
        currentUserMatchRequestsRef = currentUserRef.child('match_requests');

      targetUserMatchRequestsRef.child(currentUserIDHashed).set(null);
      currentUserMatchRequestsRef.child(targetUserIDHashed).set(null);
    }
  },

  _onPressItem() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    this.setState({dir: this.state.dir === 'row' ? 'column' : 'row'});
  },

  _renderStatusIcon() {
    switch (this.state.status) {
      case 'sent':
        return <SentRequestIcon
          color='rgba(0,0,0,0.2)'
          onPress={this.handleSentInteraction}
          style={{left: 10, bottom: 6}}
          />;
      case 'received':
        return <ReceivedRequestIcon
          color='rgba(0,0,0,0.2)'
          onPress={this.handleReceivedInteraction}
          style={{left: 10,  bottom: 6}}
          />;
      case 'matched':
        return <MatchSuccessIcon
          chatRoomId={this.state.chatRoomId}
          currentUserIDHashed={this.props.currentUserIDHashed}
          color='rgba(0,0,0,0.2)'
          firebaseRef={this.props.firebaseRef}
          onPress={this.handleMatchInteraction}
          style={{left: 10,  bottom: 6}}
          targetUserIDHashed={this.props.data.ventureId}
          />;
      default: // will not be in chats list page
        return <DefaultMatchStatusIcon
          onPress={() => {}}
          style={{left: 10, bottom: 6}}
          />
    }
  },

  render() {
    if (this.state.status === null) return <View />;

    let swipeoutBtns = this.state.status === 'matched' ?
      [{
        text: 'Unmatch',
        backgroundColor: '#000',
        onPress: () => {
          let targetUserIDHashed = this.props.data.ventureId,
            currentUserIDHashed = this.props.currentUserIDHashed,
            firebaseRef = this.props.firebaseRef,
            usersListRef = firebaseRef.child('users'),
            currentUserRef = usersListRef.child(currentUserIDHashed),
            targetUserRef = usersListRef.child(targetUserIDHashed),
            chatRoomRef = this.state.chatRoomId && firebaseRef.child(`chat_rooms/${this.state.chatRoomId}`);

          if(this.props.data.isEventInvite) {
            currentUserRef.child(`event_invite_match_requests/${targetUserIDHashed}`).set(null);
            targetUserRef.child(`event_invite_match_requests/${currentUserIDHashed}`).set(null);
          } else  {
            currentUserRef.child(`match_requests/${targetUserIDHashed}`).set(null);
            targetUserRef.child(`match_requests/${currentUserIDHashed}`).set(null);
          }

          if (chatRoomRef) {
            chatRoomRef.set(null)
          }
        }
      },
      //{
      //  text: 'Block',
      //  backgroundColor: '#af3349',
      //  onPress: () => {}
      //}
      ]
      :
      [
      //  {
      //  text: 'Block',
      //  backgroundColor: '#af3349',
      //  onPress: () => {}
      //}
      ];

    let profileModal, userRowContent;

    if (this.props.data && this.props.data.isEventInvite) {
      profileModal = (
        <View style={styles.profileModalContainer}>
          <View
            style={[styles.profileModal, {backgroundColor: this._getSecondaryStatusColor()}]}>
            <Image
              source={{uri: this.props.data && this.props.data.picture}}
              style={styles.profileModalUserPicture}/>
            <Text
              style={styles.profileModalNameAgeInfo}>{this.props.data && this.props.data.firstName},
              {this.props.data && this.props.data.age && (' ' + this.props.data.age.value)} {' \t'}
              | {'\t'}
              <Text style={styles.profileModalActivityInfo}>
                <Text
                  style={styles.profileModalActivityPreference}>{this.props.data && this.props.data.activityPreference.title}</Text>
                {'\n'} {this.props.data && this.props.data.activityPreference
              && (this.props.data.activityPreference.start.time || this.props.data.activityPreference.status)}
              </Text>
            </Text>
            <Text
              style={[styles.profileModalSectionTitle, {textAlign: 'center'}]}>{this.props.data
            && this.props.data.eventLogistics}</Text>
            <Text
              style={styles.profileModalBio}>Bio: {this.props.data && this.props.data.bio}</Text>
          </View>
        </View>
      );

      userRowContent = (
        <View style={styles.rightContainer}>
          <Image
            onPress={this._onPressItem}
            source={{uri: this.props.data && this.props.data.picture}}
            style={[styles.thumbnail]}>
            {this.state.showTimerVal ?
              <View style={(this.state.expireTime ? styles.timerValOverlay : {})}>
                <Text
                  style={[styles.timerValText, (!_.isString(this._getTimerValue(this.state.currentTimeInMs))
                  && _.parseInt((this._getTimerValue(this.state.currentTimeInMs))/60) === 0 ? {color: '#F12A00'} :{})]}>
                  {this.state.hasRequestedExtension ? '+5 ?' : !_.isString(this._getTimerValue(this.state.currentTimeInMs))
                  && (this._getTimerValue(this.state.currentTimeInMs) >= 0)
                  && _.parseInt(this._getTimerValue(this.state.currentTimeInMs) / 60) + 'm '}
                  {this.state.hasRequestedExtension ? '' : !_.isString(this._getTimerValue(this.state.currentTimeInMs))
                  && (this._getTimerValue(this.state.currentTimeInMs) >= 0)
                  && this._getTimerValue(this.state.currentTimeInMs) % 60 + 's'}
                </Text>
              </View> : <View />}
          </Image>
          <Text
            style={styles.distance}>{this.state.distance ? this.state.distance + ' mi' : ''}</Text>
          <Text style={styles.activityPreference}>
            {this.props.data && this.props.data.activityPreference && this.props.data.activityPreference.title} ?
          </Text>
          <View style={{top: 10,  right: width/25}}>{this._renderStatusIcon()}</View>
        </View>
      )
    } else {
      profileModal = (
        <View style={styles.profileModalContainer}>
          <View
            style={[styles.profileModal, {backgroundColor: this._getSecondaryStatusColor()}]}>
            <Image
              source={{uri: this.props.data && this.props.data.picture}}
              style={[styles.profileModalUserPicture]}/>
            <Text
              style={styles.profileModalNameAgeInfo}>{this.props.data && this.props.data.firstName}, {this.props.data && this.props.data.age && this.props.data.age.value}
              {'\n'}
              <Text style={styles.profileModalActivityInfo}>
                <Text
                  style={styles.profileModalActivityPreference}>{this.props.data
                && this.props.data.activityPreference && this.props.data.activityPreference.title
                && this.props.data.activityPreference.title.slice(0, -1)} {'\n\n'}</Text><Text
                style={[styles.profileModalSectionTitle]}>When: {this.props.data && this.props.data.activityPreference
              && (this.props.data.activityPreference.start.time
              || this.props.data.activityPreference.status)}</Text>{'\n'}
              </Text>
            </Text>
            <View
              style={[styles.tagBar, {bottom: 15, width: this.tagsTitleWidth + this.tagsScrollBarWidth, alignSelf: 'center'}]}>
              <Text
                onLayout={(e)=>{
                          this.tagsTitleWidth = parseFloat(e.nativeEvent.layout.width) || 30.5;
                        }}
                style={[styles.profileModalSectionTitle, {marginHorizontal: 0, alignSelf: 'center'}]}>Tags:</Text>
              <ScrollView
                automaticallyAdjustContentInsets={false}
                contentContainerStyle={{flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}} //@hmm: scrollview styles go here
                horizontal={true}
                directionalLockEnabled={true}
                onContentSizeChange={(e)=>{
                          this.tagsScrollBarWidth = parseFloat(e);
                        }}
                showsHorizontalScrollIndicator={true}
                style={[{height: 30}]}>
                {this.props.data && this.props.data.activityPreference
                && this.props.data.activityPreference.tags
                && this.props.data.activityPreference.tags.map((tag, i) => (
                  <TouchableOpacity key={i} style={styles.tag}><Text
                    style={styles.tagText}>{tag}</Text></TouchableOpacity>
                ))
                }
              </ScrollView>
            </View>
            <Text
              style={styles.profileModalBio}>Bio: {this.props.data && this.props.data.bio}</Text>
          </View>
        </View>
      );

      userRowContent = (
        <View style={styles.rightContainer}>
          <Image
            onPress={this._onPressItem}
            source={{uri: this.props.data && this.props.data.picture}}
            style={[styles.thumbnail]}>
            {this.state.showTimerVal ? // @hmm: so that timer will keep going after app state from bg -> active
              <View style={(this.state.expireTime ? styles.timerValOverlay : {})}>
                <Text
                  style={[styles.timerValText, (!_.isString(this._getTimerValue(this.state.currentTimeInMs))
                  && _.parseInt((this._getTimerValue(this.state.currentTimeInMs))/60) === 0 ? {color: '#F12A00'} :{})]}>
                  {!_.isString(this._getTimerValue(this.state.currentTimeInMs))
                  && (this._getTimerValue(this.state.currentTimeInMs) >= 0)
                  && _.parseInt(this._getTimerValue(this.state.currentTimeInMs) / 60) + 'm '}
                  {!_.isString(this._getTimerValue(this.state.currentTimeInMs))
                  && (this._getTimerValue(this.state.currentTimeInMs) >= 0)
                  && this._getTimerValue(this.state.currentTimeInMs) % 60 + 's'}
                </Text>
              </View> : <View /> }
          </Image>
          <Text style={styles.distance}>{this.state.distance ? this.state.distance + ' mi' : ''}</Text>
          <Text style={styles.activityPreference}>
            {this.props.data && this.props.data.activityPreference && this.props.data.activityPreference.title}
          </Text>
          <View style={{top: 10, right: width/25}}>{this._renderStatusIcon()}</View>
        </View>
      );
    }

    return (
      <Swipeout autoClose={true} right={!_.isEmpty(swipeoutBtns) ? swipeoutBtns : null}>
        <TouchableHighlight
          underlayColor={WHITE_HEX_CODE}
          activeOpacity={0.3}
          onPress={this._onPressItem}
          style={styles.userRow}>
          <View
            style={[styles.userContentWrapper, {flexDirection: this.state.dir}]}>
            <LinearGradient
              colors={(this.props.backgroundColor && [this.props.backgroundColor, this.props.backgroundColor])
            || [this.getStatusColor(), this._getSecondaryStatusColor(), WHITE_HEX_CODE, 'transparent']}
              start={[0,1]}
              end={[1,1]}
              locations={[0.3,0.99,1.0]}
              style={styles.container}>
              {userRowContent}
            </LinearGradient>
            {this.state.dir === 'column' ? profileModal : <View />}
          </View>
        </TouchableHighlight>
      </Swipeout>
    );
  }
});

var ChatsListPage = React.createClass({
  mixins: [ReactFireMixin, TimerMixin],

  statics: {
    title: '<ChatsListPage/>',
    description: 'See current connections/interactions.'
  },

  watchID: null,

  getInitialState() {
    let firebaseRef = this.props.firebaseRef,
      usersListRef = firebaseRef.child('users');

    return {
      dataSource: new ListView.DataSource({
        rowHasChanged: (row1, row2) => !_.isEqual(row1, row2)
      }),
      firebaseRef,
      funFact: '1 in every 16 Yale students\nis a section asshole.',
      userRows: [],
      showFiltersModal: false,
      showFunFact: false,
      showLoadingModal: false,
      usersListRef
    };
  },

  _handle: null,

  componentWillMount() {
    this._handle = this.setInterval(() => {
      this.setState({currentTimeInMs: (new Date()).getTime()})
    }, 1000);
  },

  componentDidMount() {
    InteractionManager.runAfterInteractions(() => {
      let eventInvites = [], usersListRef = this.state.firebaseRef.child('users'),
        currentUserRef = usersListRef.child(this.props.ventureId), _this = this;

      this.bindAsArray(usersListRef, 'userRows');

      this.props.ventureId && usersListRef.on('value', snapshot => {

        let usersListSnapshotVal = snapshot.val();

        usersListRef.child(`${this.props.ventureId}/event_invite_match_requests`).once('value', snapshot => {
          _.each(snapshot.val(), (eventInviteMatchRequest) => {
            //@hmm: copy event_invite objects to match_requests object in user obj that will go in filteredUsersArray
            let JSONMatchReqObj = `{"match_requests":{"${this.props.ventureId}" : {"status" : "${eventInviteMatchRequest.status}"}}}`;

            eventInvites.push(_.assign(JSON.parse(JSONMatchReqObj), eventInviteMatchRequest.account));
          });

          // @hmm: add event invites into general activity interactions
          let compositeUsersList = (_.cloneDeep(_.values(usersListSnapshotVal))).concat(eventInvites),
            filteredUsersArray = [];

          // @hmm: filter according to currentUser matching preferences before putting into usersRow Array :)
          currentUserRef && currentUserRef.child('matchingPreferences').on('value', snapshot => {

            this.setState({currentUserMatchingPreferencesRef: currentUserRef.child('matchingPreferences')});

            let matchingPreferences = snapshot.val(),
              maxSearchDistance = matchingPreferences && matchingPreferences.maxSearchDistance;

            compositeUsersList && _.each(compositeUsersList, (user) => {
              if (!user) return;

              // @hmm: because of cumulative privacy selection, only have to check for friends+ for both 'friends+' and 'all'
              if (matchingPreferences && matchingPreferences.privacy
                && matchingPreferences.privacy.indexOf('friends+') > -1) {
                if (this.props.currentUserLocationCoords && user.location && user.location.coordinates
                  && user.location.coordinates.latitude && user.location.coordinates.longitude
                  && GeoFire.distance(this.props.currentUserLocationCoords, [user.location.coordinates.latitude,
                    user.location.coordinates.longitude]) <= maxSearchDistance * 1.609) {
                  if (matchingPreferences && matchingPreferences.gender && matchingPreferences.gender
                      .indexOf(user.gender) > -1) filteredUsersArray.push(user);
                  if (matchingPreferences && matchingPreferences.gender && matchingPreferences.gender
                      .indexOf(user.gender) === -1 && matchingPreferences.gender.indexOf('other') > -1
                    && user.gender !== 'male' && user.gender !== 'female') filteredUsersArray.push(user);
                }
              } else if (matchingPreferences && matchingPreferences.privacy && matchingPreferences.privacy
                  .indexOf('friends') > -1 && matchingPreferences.privacy.length === 1) {
                if (this.props.currentUserFriends
                  && _.findIndex(this.props.currentUserFriends, {name: user.name}) > -1) {
                  if (this.props.currentUserLocationCoords && user.location && user.location.coordinates
                    && user.location.coordinates.latitude && user.location.coordinates.longitude
                    && GeoFire.distance(this.props.currentUserLocationCoords, [user.location.coordinates.latitude,
                      user.location.coordinates.longitude]) <= maxSearchDistance * 1.609) {
                    if (matchingPreferences && matchingPreferences.gender && matchingPreferences.gender
                        .indexOf(user.gender) > -1) filteredUsersArray.push(user);
                    if (matchingPreferences && matchingPreferences.gender && matchingPreferences.gender
                        .indexOf(user.gender) === -1 && matchingPreferences.gender.indexOf('other') > -1
                      && user.gender !== 'male' && user.gender !== 'female') filteredUsersArray.push(user);
                  }
                }
              } else {
                if (this.props.currentUserLocationCoords && user.location && user.location.coordinates
                  && user.location.coordinates.latitude && user.location.coordinates.longitude
                  && GeoFire.distance(this.props.currentUserLocationCoords, [user.location.coordinates.latitude,
                    user.location.coordinates.longitude]) <= maxSearchDistance * 1.609) {
                  if (matchingPreferences && matchingPreferences.gender && matchingPreferences.gender
                      .indexOf(user.gender) > -1) filteredUsersArray.push(user);
                  if (matchingPreferences && matchingPreferences.gender && matchingPreferences.gender
                      .indexOf(user.gender) === -1 && matchingPreferences.gender.indexOf('other') > -1
                    && user.gender !== 'male' && user.gender !== 'female') filteredUsersArray.push(user);
                }
              }

            });

          });

          _this.updateRows(filteredUsersArray);
          _this.setState({
            currentUserVentureId: this.props.ventureId,
            userRows: _.cloneDeep(_.values(filteredUsersArray)),
            usersListRef
          });

          // @hmm: reset eventInvites to prevent redundant event invites in chats list
          eventInvites = [];

          if (!_.isEmpty(usersListSnapshotVal && usersListSnapshotVal[this.props.ventureId].match_requests)
            || !_.isEmpty(usersListSnapshotVal
              && usersListSnapshotVal[this.props.ventureId].event_invite_match_requests)) {
            this.setState({showFunFact: false});
          }
          else {
            this.setTimeout(() => {
              if (!this.state.done) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            }, 0); // prevent flash
            this.setState({showFunFact: true, done: true});
          }

        });

      });

      this.state.firebaseRef.child(`users/${this.props.ventureId}`).once('value', snapshot => {
        _this.setState({currentUserData: snapshot.val()});
      });

    });

    this.setTimeout(() => {
      // @hmm: show loading modal if no user rows ready after 2 seconds and no fun fact
      if (_.isEmpty(this.state.userRows) && !this.state.showFunFact) this.setState({showLoadingModal: true});
      this.setTimeout(() => {
        if (this.state.showLoadingModal) this.setState({showLoadingModal: false});
      }, 5000); // @hmm: timeout for loading modal

      //@hmm: Tutorial modal
      let firstSessionRef = this.props.firebaseRef && this.props.ventureId
        && this.props.firebaseRef.child('users/' + this.props.ventureId + '/firstSession');

      if (this.props.firstSession && !this.props.firstSession.hasVisitedChatsListPage) {
        AlertIOS.alert(
          'Your Connections',
          'Here you\'ll find an overview of all your active interactions: matches (green), received requests (blue), and sent requests (yellow). Keep an eye on your chat timers too; once a chat expires, the match will reset.'
        );
        firstSessionRef.child('hasVisitedChatsListPage').set(true);
      }
    }, 800);
  },

  componentWillUnmount() {
    this.state.usersListRef && this.state.usersListRef.off();
    this.state.currentUserMatchingPreferencesRef && this.state.currentUserMatchingPreferencesRef.off();
  },

  _handleShowFiltersModal(showFiltersModal:boolean){
    this.setState({showFiltersModal});
  },

  _navigateToHomePage() {
    this.props.navigator.popToTop();
  },

  updateRows(userRows:Array) {
    // @hmm: sorting logic goes here, sort by match status which
    // happens to be alphabetical => "matched" > "received" > "sent"

    userRows = _.orderBy(userRows, [`match_requests.${this.props.ventureId}.status`], ['asc']);

    this.setState({dataSource: this.state.dataSource.cloneWithRows(userRows)});
    if (userRows.length) this.setState({showFunFact: false, showLoadingModal: false})
  },
  _renderHeader() {
    return (
      <Header containerStyle={{position: 'relative'}}>
        <HomePageIcon onPress={() => this._navigateToHomePage()}/>
        <Text>MY CONNECTIONS</Text>
        <FiltersModalIcon
          onPress={() => {
												this.setState({showFiltersModal: true});
										}}
          style={{left: 14}}/>
      </Header>
    )
  },

  _renderUser(user:Object, sectionID:number, rowID:number) {
    if (user.ventureId === this.state.currentUserVentureId || (user.status && !user.status.isOnline)) return <View />;

    return <User chatsListHandle={this._handle}
                 currentTimeInMs={this.state.currentTimeInMs}
                 currentUserData={this.state.currentUserData}
                 currentUserIDHashed={this.state.currentUserVentureId}
                 currentUserLocationCoords={this.props.currentUserLocationCoords}
                 data={user}
                 firebaseRef={this.state.firebaseRef}
                 firstSession={this.props.firstSession} // @hmm: will update as remote firstSession prop updates
                 navigator={this.props.navigator}
                 updateRows={() => this.updateRows(this.state.userRows)}/>;
  },

  render() {
    let funFact = (
      <View style={{alignSelf: 'center', bottom: height/2.5}}>
        <TouchableOpacity onPress={() => {this.refs.funFact && this.refs.funFact.jello && this.refs.funFact.jello(500)}}>
          <Animatable.View ref="funFact">
            <Text
              style={{color: '#fff', fontFamily: 'AvenirNextCondensed-Medium', textAlign: 'center', fontSize: 18}}>
              <Text style={{fontSize: height/30, top: 15}}>Did You Know ?</Text> {'\n\n'} {this.state.funFact}</Text>
          </Animatable.View>
        </TouchableOpacity>
      </View>
    );

    return (
      <VentureAppPage backgroundColor='#040A19'>
        <View>
          {this._renderHeader()}
        </View>
        <ListView
          dataSource={this.state.dataSource}
          renderRow={this._renderUser}
          // renderScrollComponent={props => <SGListView {...props} premptiveLoading={5}/>}
          initialListSize={INITIAL_LIST_SIZE}
          onChangeVisibleRows={(visibleRows, changedRows) => {
            this.setState({visibleRows, changedRows})
          }}
          pageSize={PAGE_SIZE}
          automaticallyAdjustContentInsets={false}
          scrollRenderAheadDistance={600}
          />
        {this.state.showFunFact ? funFact : <View />}
        <View style={{height: 48}}></View>
        <ModalBase
          animated={true}
          modalStyle={styles.loadingModalStyle}
          modalVisible={this.state.showLoadingModal}>
          <View style={styles.modalView}>
            <BrandLogo
              logoContainerStyle={styles.logoContainerStyle}
              logoStyle={styles.logoStyle}/>
            <ActivityIndicatorIOS
              color='#fff'
              animating={this.state.animating}
              style={styles.loadingModalActivityIndicatorIOS}
              size='small'/>
            <TouchableOpacity activeOpacity={0.8}>
              <Text
                style={styles.loadingModalFunFactText}>
                <Text style={styles.loadingModalFunFactTextTitle}>Did You Know ?</Text>
                {'\n\n'} The average Yalie eats 5 chicken {'\n'} tenders in a week.</Text>
            </TouchableOpacity>
          </View>
        </ModalBase>
        {this.state.showFiltersModal ?
          <FiltersModal
            firebaseRef={this.state.firebaseRef}
            handleShowFiltersModal={this._handleShowFiltersModal}
            modalVisible={this.state.showFiltersModal}
            ventureId={this.props.ventureId} // @hmm: important to pass this.props.ventureId bc its available immediately
            /> : <View/>}
      </VentureAppPage>
    )
  }
});

var styles = StyleSheet.create({
  activityPreference: {
    width: width / 3.2,
    fontSize: 18,
    fontFamily: 'AvenirNextCondensed-UltraLight',
    fontWeight: '400',
    textAlign: 'left'
  },
  backdrop: {
    paddingTop: 30,
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'center',
    width,
    height
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderColor: 'rgba(100,100,105,0.2)',
    borderWidth: 1
  },
  customRefreshingActivityIndicatorIOS: {
    height: 20,
    top: 5
  },
  customRefreshingIndicatorContainer: {
    alignSelf: 'center',
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 10
  },
  customRefreshingIndicatorText: {
    color: '#fff',
    fontFamily: 'AvenirNextCondensed-Regular'
  },
  distance: {
    width: width / 4,
    textAlign: 'center',
    fontSize: 16,
    marginHorizontal: 25,
    fontFamily: 'AvenirNext-UltraLight',
    fontWeight: '300',
  },
  eventTitle: {
    width: 154,
    right: 20,
    fontSize: 17,
    top: 2,
    fontFamily: 'AvenirNextCondensed-Regular',
    fontWeight: '400'
  },
  filterPageButton: {
    width: 30,
    height: 30
  },
  loadingModalActivityIndicatorIOS: {
    height: 80,
    bottom: height / 40
  },
  loadingModalFunFactText: {
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
  loadingModalFunFactTextTitle: {
    fontSize: height / 30
  },
  loadingModalStyle: {
    backgroundColor: '#02030F'
  },
  logoContainerStyle: {
    marginHorizontal: (width - LOGO_WIDTH) / 2
  },
  logoStyle: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT
  },
  modalView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  profileModal: {
    paddingVertical: height / 30,
    flexDirection: 'column',
    justifyContent: 'center'
  },
  profileModalContainer: {
    backgroundColor: WHITE_HEX_CODE
  },
  profileModalActivityInfo: {
    fontFamily: 'AvenirNextCondensed-Medium'
  },
  profileModalActivityPreference: {
    fontFamily: 'AvenirNextCondensed-Medium'
  },
  profileModalBio: {
    color: '#222',
    fontFamily: 'AvenirNextCondensed-Regular',
    textAlign: 'center',
    fontSize: 16,
  },
  profileModalNameAgeInfo: {
    color: '#222',
    fontSize: 20,
    fontFamily: 'AvenirNextCondensed-Medium',
    textAlign: 'center'
  },
  profileModalSectionTitle: {
    color: '#222',
    fontSize: 16,
    fontFamily: 'AvenirNextCondensed-Regular',
  },
  profileModalUserPicture: {
    width: width / 2.6,
    height: width / 2.6,
    borderRadius: width / 5.2,
    alignSelf: 'center',
    marginBottom: width / 22
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: width / 10
  },
  scrollView: {
    width: width / 1.3
  },
  tag: {
    backgroundColor: 'rgba(4,22,43,0.5)',
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
    alignItems: 'center'
  },
  tagText: {
    color: 'rgba(255,255,255,0.95)',
    fontFamily: 'AvenirNextCondensed-Medium'
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: THUMBNAIL_SIZE / 2,
    marginVertical: 7,
    marginLeft: width/20 // for thumbnail columnwise alignment
  },
  timerValText: {
    opacity: 1.0,
    color: '#fff',
    fontFamily: 'AvenirNextCondensed-Medium'
  },
  timerValOverlay: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: THUMBNAIL_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center'
  },
  userContentWrapper: {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent'
  },
  userRow: {
    flex: 1,
    backgroundColor: '#fefefb',
    overflow: 'hidden',
  }
});

module.exports = ChatsListPage;