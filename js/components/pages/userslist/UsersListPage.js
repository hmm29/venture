/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule UsersListPage
 * @flow
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  ActivityIndicatorIOS,
  AlertIOS,
  Animated,
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
  } = ReactNative;

var _ = require('lodash');
var Animatable = require('react-native-animatable');
var BlankIcon = require('../../Partials/Icons/BlankIcon');
var BrandLogo = require('../../Partials/BrandLogo');
var ChatPage = require('../ChatPage');
var Dimensions = require('Dimensions');
var FiltersModal = require('../../Partials/Modals/FiltersModal');
var Firebase = require('firebase');
var GeoFire = require('geofire');
var Image = require('react-native-image-progress');
var LinearGradient = require('react-native-linear-gradient');
var ModalBase = require('../../Partials/Modals/Base/ModalBase');
var RefreshableListView = require('../../Partials/RefreshableListView');
var Swipeout = require('react-native-swipeout');
var TimerMixin = require('react-timer-mixin');
var VentureAppPage = require('../Base/VentureAppPage');

// Match Status Indicator Icons
var DefaultMatchStatusIcon = require('../../Partials/Icons/MatchStatusIndicators/DefaultMatchStatusIcon');
var MatchSuccessIcon = require('../../Partials/Icons/MatchStatusIndicators/MatchSuccessIcon');
var ReceivedRequestIcon = require('../../Partials/Icons/MatchStatusIndicators/ReceivedRequestIcon');
var SentRequestIcon = require('../../Partials/Icons/MatchStatusIndicators/SentRequestIcon');

// Header Components
var FiltersModalIcon = require('../../Partials/Icons/NavigationButtons/FiltersModalIcon');
var Header = require('../../Partials/Header');
var HomePageIcon = require('../../Partials/Icons/NavigationButtons/HomePageIcon');

// Globals
var {height, width} = Dimensions.get('window');
var CHAT_DURATION_IN_MINUTES = 5;
var INITIAL_USERS_LIST_SIZE = 24;
var LOGO_WIDTH = 200;
var LOGO_HEIGHT = 120;
var MAX_USERS_LIST_SIZE = 100;
var PAGE_SIZE = 10;
var PARSE_APP_ID = "ba2429b743a95fd2fe069f3ae4fe5c95df6b8f561bb04b62bc29dc0c285ab7fa";
var PARSE_SERVER_URL = "http://104.236.211.208:9999/ventureparseserver";
var PUSH_NOTIFICATION_REFRACTORY_DURATION_IN_MINUTES = 10;
var SEARCH_TEXT_INPUT_REF = 'searchTextInput';
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
    currentTime: React.PropTypes.number,
    currentUserLocationCoords: React.PropTypes.array,
    currentUserData: React.PropTypes.object,
    data: React.PropTypes.object,
    firebaseRef: React.PropTypes.object,
    firstSession: React.PropTypes.object,
    isCurrentUser: React.PropTypes.bool,
    navigator: React.PropTypes.object,
  },

  mixins: [TimerMixin],

  getInitialState() {
    return {
      dir: 'row',
      expireTime: '',
      lastPushNotificationSentTime: 0,
      thumbnailReady: false
    }
  },

  componentWillMount() {
    let distance = this.props.currentUserLocationCoords && this.props.data && this.props.data.location
      && this.props.data.location.coordinates && this.calculateDistance(this.props.currentUserLocationCoords,
        [this.props.data.location.coordinates.latitude, this.props.data.location.coordinates.longitude]);

    this.setState({
      distance
    })
  },

  componentDidMount() {
    this.props.firebaseRef && this.props.data && this.props.data.ventureId && this.props.currentUserIDHashed
    && this.props.firebaseRef.child(`users/${this.props.data.ventureId}/match_requests`)
      .child(this.props.currentUserIDHashed)
    && (this.props.firebaseRef).child(`users/${this.props.data.ventureId}/match_requests`)
      .child(this.props.currentUserIDHashed).on('value', snapshot => {
        if (!snapshot.val()) this.setState({status: ''});
        else if (snapshot.val() && snapshot.val().status === 'sent') {
          this.setState({status: 'received'});
        } else if (snapshot.val() && snapshot.val().status === 'received') {
          this.setState({status: 'sent'});
        } else {
          this.setState({status: 'matched'});
        }
      });
  },

  componentWillReceiveProps(nextProps) {
    let distance = nextProps.currentUserLocationCoords && nextProps.data && nextProps.data.location
      && nextProps.data.location.coordinates && this.calculateDistance(nextProps.currentUserLocationCoords,
        [nextProps.data.location.coordinates.latitude, nextProps.data.location.coordinates.longitude]);

    // @hmm: must have this to clean up old match subscriptions
    nextProps.firebaseRef && nextProps.data && nextProps.data.ventureId && nextProps.currentUserIDHashed
    && nextProps.firebaseRef.child(`users/${nextProps.currentUserIDHashed}/match_requests`)
      .child(nextProps.data.ventureId)
    && (nextProps.firebaseRef).child(`users/${nextProps.currentUserIDHashed}/match_requests`)
      .child(nextProps.data.ventureId).off();

    nextProps.firebaseRef && nextProps.data && nextProps.data.ventureId && nextProps.currentUserIDHashed
    && nextProps.firebaseRef.child(`users/${nextProps.currentUserIDHashed}/match_requests`)
      .child(nextProps.data.ventureId)
    && (nextProps.firebaseRef).child(`users/${nextProps.currentUserIDHashed}/match_requests`)
      .child(nextProps.data.ventureId).on('value', snapshot => {
        let status = this.state.status;

        this.setState({
          chatRoomId: snapshot.val() && snapshot.val().chatRoomId,
          distance,
          status: snapshot.val() && snapshot.val().status,
          expireTime: snapshot.val() && snapshot.val().expireTime
        });

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
    this.props.firebaseRef && this.props.data && this.props.data.ventureId && this.props.currentUserIDHashed
    && this.props.firebaseRef.child(`users/${this.props.data.ventureId}/match_requests`)
      .child(this.props.currentUserIDHashed)
    && (this.props.firebaseRef).child(`users/${this.props.data.ventureId}/match_requests`)
      .child(this.props.currentUserIDHashed).off();
  },

  calculateDistance(location1:Array, location2:Array) {
    return location1 && location2 && (GeoFire.distance(location1, location2) * 0.621371).toFixed(1);
  },

  _getSecondaryStatusColor() {
    if (this.props.isCurrentUser) return '#FBFBF1';

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
    if (!currentTimeInMs) currentTimeInMs = (new Date()).getTime();

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

  handleDefaultInteraction() {
    let _this = this;

    _this.setTimeout(() => {
      this.props.firebaseRef && this.props.data && this.props.data.ventureId
      && this.props.currentUserIDHashed && this.props.firebaseRef
        .child(`users/${this.props.currentUserIDHashed}/match_requests`).child(this.props.data.ventureId)
      && (this.props.firebaseRef).child(`users/${this.props.currentUserIDHashed}/match_requests`)
        .child(this.props.data.ventureId).once('value', snapshot => {
          _this.setState({
            chatRoomId: snapshot.val() && snapshot.val().chatRoomId,
            status: snapshot.val() && snapshot.val().status,
            expireTime: snapshot.val() && snapshot.val().expireTime
          });
        });
    }, 1);

    if (this.props.firstSession) { // @hmm: only fire if status has changed and previous status was not null
      if (!this.props.firstSession.hasSentFirstRequest) {
        AlertIOS.alert(
          'Activity Request Sent!',
          'You have just shown interest in another user\'s activity! If they accept, you will match with them!'
        );
        this.props.firebaseRef
          .child(`users/${this.props.currentUserIDHashed}/firstSession/hasSentFirstRequest`).set(true);
      }
    }

    // @hmm: use hashed targetUserID as key for data for user in list
    let targetUserIDHashed = this.props.data.ventureId,
      currentUserIDHashed = this.props.currentUserIDHashed,
      firebaseRef = this.props.firebaseRef,
      usersListRef = firebaseRef.child('users'),
      currentUserRef = usersListRef.child(currentUserIDHashed),
      targetUserRef = usersListRef.child(targetUserIDHashed),
      targetUserMatchRequestsRef = targetUserRef.child('match_requests'),
      currentUserMatchRequestsRef = currentUserRef.child('match_requests');

    targetUserMatchRequestsRef.child(currentUserIDHashed).setWithPriority({
      status: 'received',
      _id: currentUserIDHashed
    }, 200);
    currentUserMatchRequestsRef.child(targetUserIDHashed).setWithPriority({
      status: 'sent',
      _id: targetUserIDHashed
    }, 300);

    targetUserMatchRequestsRef && targetUserMatchRequestsRef.once('value', snapshot => {
      if (snapshot.val() && (_.size(snapshot.val()) === 1 || _.size(snapshot.val()) % 4 === 0)) { //send push notification if object just added was new/first or if size of match obj divisible by 4
        // @hmm: prevents spamming push notification invites on repeated tapping of user bar, but will reset with each dismount then mount
        // only send if current time is not in push notification refractory period
        const currentTime = new Date().getTime();
        if (currentTime > (new Date(this.state.lastPushNotificationSentTime + (PUSH_NOTIFICATION_REFRACTORY_DURATION_IN_MINUTES * 60 * 1000))).getTime()) {
          this.setState({lastPushNotificationSentTime: (new Date()).getTime()});
          fetch(PARSE_SERVER_URL + '/functions/sendPushNotification', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'X-Parse-Application-Id': PARSE_APP_ID,
              'Content-Type': 'application/json',
            },
            body: `{"channels": ["${targetUserIDHashed}"], "alert": "Someone is interested in your activity!"}`
          })
            .then(response => {
              console.log(JSON.stringify(response))
            })
            .catch(error => console.log(error))
        }
      }
    });
  },

  handleMatchInteraction() {
    // @hmm: use hashed targetUserID as key for data for user in list
    let targetUserIDHashed = this.props.data.ventureId,
      currentUserIDHashed = this.props.currentUserIDHashed,
      firebaseRef = this.props.firebaseRef,
      usersListRef = firebaseRef.child('users'),
      currentUserRef = usersListRef.child(currentUserIDHashed),
      targetUserRef = usersListRef.child(targetUserIDHashed),
      firstSessionRef = currentUserRef.child('firstSession'),
      targetUserMatchRequestsRef = targetUserRef.child('match_requests'),
      currentUserMatchRequestsRef = currentUserRef.child('match_requests'),
      _this = this;

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
  },

  handleReceivedInteraction() {
    let _this = this;

    _this.setTimeout(() => {
      this.props.firebaseRef && this.props.data && this.props.data.ventureId
      && this.props.currentUserIDHashed && this.props.firebaseRef
        .child(`users/${this.props.currentUserIDHashed}/match_requests`).child(this.props.data.ventureId)
      && (this.props.firebaseRef).child(`users/${this.props.currentUserIDHashed}/match_requests`)
        .child(this.props.data.ventureId).once('value', snapshot => {
          _this.setState({
            chatRoomId: snapshot.val() && snapshot.val().chatRoomId,
            status: snapshot.val() && snapshot.val().status,
            expireTime: snapshot.val() && snapshot.val().expireTime
          });
        });
    }, 1);

    // @hmm: use hashed targetUserID as key for data for user in list
    let targetUserIDHashed = this.props.data.ventureId,
      currentUserIDHashed = this.props.currentUserIDHashed,
      firebaseRef = this.props.firebaseRef,
      usersListRef = firebaseRef.child('users'),
      currentUserRef = usersListRef.child(currentUserIDHashed),
      targetUserRef = usersListRef.child(targetUserIDHashed),
      targetUserMatchRequestsRef = targetUserRef.child('match_requests'),
      currentUserMatchRequestsRef = currentUserRef.child('match_requests');

    // @hmm: accept the request
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
  },

  handleSentInteraction() {
    let _this = this;

    _this.setTimeout(() => {
      this.props.firebaseRef && this.props.data && this.props.data.ventureId
      && this.props.currentUserIDHashed && this.props.firebaseRef
        .child(`users/${this.props.currentUserIDHashed}/match_requests`).child(this.props.data.ventureId)
      && (this.props.firebaseRef).child(`users/${this.props.currentUserIDHashed}/match_requests`)
        .child(this.props.data.ventureId).once('value', snapshot => {
          _this.setState({
            chatRoomId: snapshot.val() && snapshot.val().chatRoomId,
            status: snapshot.val() && snapshot.val().status,
            expireTime: snapshot.val() && snapshot.val().expireTime
          });
        });
    }, 1);

    // @hmm: use hashed targetUserID as key for data for user in list
    let targetUserIDHashed = this.props.data.ventureId,
      currentUserIDHashed = this.props.currentUserIDHashed,
      firebaseRef = this.props.firebaseRef,
      usersListRef = firebaseRef.child('users'),
      currentUserRef = usersListRef.child(currentUserIDHashed),
      targetUserRef = usersListRef.child(targetUserIDHashed),
      targetUserMatchRequestsRef = targetUserRef.child('match_requests'),
      currentUserMatchRequestsRef = currentUserRef.child('match_requests');

    // @hmm: delete the request
    targetUserMatchRequestsRef.child(currentUserIDHashed).set(null);
    currentUserMatchRequestsRef.child(targetUserIDHashed).set(null);
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
          style={{left: 10, bottom: 6}}/>;
      case 'received':
        return <ReceivedRequestIcon
          color='rgba(0,0,0,0.2)'
          onPress={this.handleReceivedInteraction}
          style={{left: 10,  bottom: 6}}/>;
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
      default:
        return <DefaultMatchStatusIcon
          onPress={this.handleDefaultInteraction}
          style={{left: 10, bottom: 6}}/>
    }
  },

  render() {
    let swipeoutBtns = this.state.status === 'matched' ?
      [{
        text: 'Unmatch',
        backgroundColor: '#000',
        onPress: () => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);

          let targetUserIDHashed = this.props.data.ventureId,
            currentUserIDHashed = this.props.currentUserIDHashed,
            firebaseRef = this.props.firebaseRef,
            usersListRef = firebaseRef.child('users'),
            currentUserRef = usersListRef.child(currentUserIDHashed),
            targetUserRef = usersListRef.child(targetUserIDHashed),
            chatRoomRef = this.state.chatRoomId && firebaseRef.child(`chat_rooms/${this.state.chatRoomId}`);

          if (currentUserRef && targetUserRef) {
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

    let profileModal = (
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

    return (
      <Swipeout autoClose={true} right={!this.props.isCurrentUser && !_.isEmpty(swipeoutBtns) ? swipeoutBtns : null}>
        <View ref="user">
          <TouchableHighlight
            underlayColor={WHITE_HEX_CODE}
            activeOpacity={0.3}
            onPress={this._onPressItem}
            style={styles.userRow}>
            <View
              style={[styles.userContentWrapper, {flexDirection: this.state.dir}]}>
              <LinearGradient
                colors={(this.props.backgroundColor
                            && [this.props.backgroundColor, this.props.backgroundColor])
                            || [this.getStatusColor(), this._getSecondaryStatusColor(), WHITE_HEX_CODE, 'transparent']}
                start={[0,1]}
                end={[1,1]}
                locations={[0.3,0.99,1.0]}
                style={[styles.container, {borderColor: (this.props.isCurrentUser ? 'rgba(255,255,255,0.02)' : 'rgba(100,100,105,0.2)')}]}>
                <View style={styles.rightContainer}>
                  <Image
                    onPress={this._onPressItem}
                    onLoadEnd={() => this.setState({thumbnailReady: true})}
                    source={{uri: this.props.data && this.props.data.picture}}
                    style={[styles.thumbnail, {right: (this.props.isCurrentUser && width < 420 ? width/80 : (this.props.isCurrentUser ? width/135 : 0))}, (this.state.thumbnailReady ? {} : {backgroundColor: '#040A19'})]}>
                    <View style={(this.state.expireTime ? styles.timerValOverlay : {})}>
                      <Text
                        style={[styles.timerValText, (!_.isString(this._getTimerValue(this.props.currentTimeInMs))
                                             && _.parseInt((this._getTimerValue(this.props.currentTimeInMs))/60) === 0
                                             ? {color: '#F12A00'} :{})]}>
                        {!_.isString(this._getTimerValue(this.props.currentTimeInMs))
                        && (this._getTimerValue(this.props.currentTimeInMs) >= 0)
                        && _.parseInt(this._getTimerValue(this.props.currentTimeInMs) / 60) + 'm '}
                        {!_.isString(this._getTimerValue(this.props.currentTimeInMs))
                        && (this._getTimerValue(this.props.currentTimeInMs) >= 0)
                        && this._getTimerValue(this.props.currentTimeInMs) % 60 + 's'}
                      </Text>
                    </View>
                  </Image>
                  <Text
                    style={[styles.distance]}>{this.state.distance ? this.state.distance + ' mi' : '      '}</Text>
                  <Text
                    style={[styles.activityPreference, {right: (this.props.isCurrentUser ? width/45 : 0), color: (this.props.isCurrentUser ? '#fff' : '#000')}]}>
                    {this.props.data && this.props.data.activityPreference && this.props.data.activityPreference.title}
                  </Text>
                  <View>
                    {!this.props.isCurrentUser ?
                      <View
                        style={{top: 10, right: width/25}}>{this.state.distance && this._renderStatusIcon()}</View> :
                      <View style={{top: 10, right: width/25}}><BlankIcon
                        style={{left: 10, bottom: 6}}/></View>}
                  </View>
                </View>
              </LinearGradient>
              {this.state.dir === 'column' ? profileModal : <View />}
            </View>
          </TouchableHighlight>
        </View>
      </Swipeout>
    );
  }
});

var CustomRefreshingIndicator = React.createClass({
  render() {
    return (
      <View style={styles.customRefreshingIndicatorContainer}>
        <Text style={styles.customRefreshingIndicatorText}>{this.props.description}</Text>
        <ActivityIndicatorIOS
          color='#fff'
          animating={true}
          style={styles.customRefreshingActivityIndicatorIOS}
          size='small'/>
      </View>
    )
  }
});

var UsersListPage = React.createClass({
  mixins: [TimerMixin],

  statics: {
    title: '<UsersListPage/>',
    description: 'Central users list view.'
  },

  getInitialState() {
    return {
      dataSource: new ListView.DataSource({
        rowHasChanged: (row1, row2) => !_.isEqual(row1, row2)
      }),
      firebaseRef: this.props.firebaseRef,
      headerHeight: 0,
      maxSearchDistance: null,
      rows: [],
      searchText: '',
      showCurrentUser: false,
      showFiltersModal: false,
      showLoadingModal: false
    };
  },

  _handle: null,
  _ii: 0,

  componentWillMount() {
    // @hmm: handle must go in componentWillMount
    // and DO NOT clear it in componentWillUnmount
    this._handle = this.setInterval(() => {
      this.setState({currentTimeInMs: (new Date()).getTime()})
    }, 1000);
  },

  componentDidMount() {
    let firebaseRef = this.state.firebaseRef,
      _this = this;

    this.setState({currentUserVentureId: this.props.ventureId});

    firebaseRef.child(`/users/${this.props.ventureId}`).once('value', snapshot => {
      _this.setState({currentUserData: snapshot.val(), showCurrentUser: true});
    });

    this.setTimeout(() => {
      if (_.isEmpty(this.state.rows)) this.setState({showLoadingModal: true});
      this.setTimeout(() => {
        if (this.state.showLoadingModal) this.setState({showLoadingModal: false});
      }, 5000); // @hmm: timeout for loading modal
    }, 1000);
  },

  componentWillUnmount() {
    this.state.currentUserMatchingPreferencesRef && this.state.currentUserMatchingPreferencesRef.off();
    this.state.usersListRef && this.state.usersListRef.child(`${this.props.ventureId}/match_requests`) && this.state.usersListRef.child(`${this.props.ventureId}/match_requests`).off();
  },

  getMoreUsers(rows, startIndex, amountToAdd, callback){
    var endIndex = (startIndex + amountToAdd) < rows.length ? (startIndex + amountToAdd) : rows.length;
    if (startIndex < endIndex) {
      callback(_.slice(rows, startIndex, endIndex));
    } else {
      callback([]);
    }

    this.setState({lastIndex: endIndex});
  },

  _handleShowFiltersModal(showFiltersModal:boolean){
    this.setState({showFiltersModal});
  },

  _navigateToHome() {
    this.props.navigator.popToTop();
  },

  search(text:string) {
    this.setState({text});

    let checkFilter = user => {
      let activity = (user.activityPreference.title).toLowerCase(),
        lowText = text.toLowerCase(),
        name = (user.firstName).toLowerCase();

      return (activity.indexOf(lowText) > -1 || name.indexOf(lowText) > -1);
    };

    // @hmm: refresh list to prevent freezing of timers once filtering over
    if (_.size(_.cloneDeep(_.values(_.filter(this.state.rows, checkFilter)))) === this.state.rows.length) this.updateRows([]);
    this.updateRows(_.cloneDeep(_.values(_.filter(this.state.rows, checkFilter))));
  },

  updateRows(rows) {
    // @hmm: max length of list view
    if (rows.length > MAX_USERS_LIST_SIZE) {
      rows = _.take(rows, MAX_USERS_LIST_SIZE);
    }

    if (rows.length) this.setState({showLoadingModal: false});
    this.setState({dataSource: this.state.dataSource.cloneWithRows(rows)});
  },

  _renderCurrentUser() {
    return (
      <User backgroundColor={'#040A19'}
            data={this.state.currentUserData}
            editable={true}
            isCurrentUser={true}/>
    )
  },

  _renderHeader() {
    let firstSessionRef = this.state.firebaseRef && this.state.firebaseRef.child('users/' + this.state.currentUserVentureId + '/firstSession');

    return (
      <View onLayout={(event) => {
                    var {x, y, width, height} = event.nativeEvent.layout;
                    this.setState({headerHeight: height});
                }}>
        <Header>
          <HomePageIcon onPress={() => this._navigateToHome()}/>
          <TextInput
            ref={SEARCH_TEXT_INPUT_REF}
            autoCapitalize='none'
            autoCorrect={true}
            clearButtonMode='always'
            onChangeText={(text) => this.search(text)}
            placeholder='Search for a name or activity'
            placeholderTextColor='rgba(0,0,0,0.4)'
            returnKeyType='done'
            style={styles.searchTextInput}/>
          <FiltersModalIcon
            firstSession={this.props.firstSession}
            firstSessionRef={firstSessionRef}
            onPress={() => {
                        this.setState({showFiltersModal: true});
                    }}
            style={{left: 14}}/>
          <Text />
        </Header>
      </View>
    )
  },


  _renderUser(user:Object) {
    if (user.ventureId === this.state.currentUserVentureId) return <View />;

    return <User currentTimeInMs={this.state.currentTimeInMs}
                 currentUserData={this.state.currentUserData}
                 currentUserIDHashed={this.state.currentUserVentureId}
                 currentUserLocationCoords={this.props.currentUserLocationCoords}
                 data={user}
                 firebaseRef={this.state.firebaseRef}
                 firstSession={this.props.firstSession} // @hmm: will update as remote firstSession prop updates
                 navigator={this.props.navigator}/>;
  },

  render() {
    return (
      <VentureAppPage backgroundColor='#040A19'>
        <View>
          {this._renderHeader()}
          {this.state.showCurrentUser ? this._renderCurrentUser() : <View/>}
        </View>
        {this.state.text ?
          <ListView
            contentOffset={{x: 0, y: this.state.contentOffsetYValue}}
            dataSource={this.state.dataSource}
            enableEmptySections={true}
            renderRow={this._renderUser}
            initialListSize={INITIAL_USERS_LIST_SIZE}
            pageSize={PAGE_SIZE}
            minPulldownDistance={35} // 35 px
            minBetweenTime={500} // 1000 ms
            minDisplayTime={40} // 40 ms
            automaticallyAdjustContentInsets={false}
            onChangeVisibleRows={(visibleRows, changedRows) => {
                        this.setState({visibleRows, changedRows});
                    }}/>
          :
          <RefreshableListView
            initialListSize={INITIAL_USERS_LIST_SIZE}
            loadMoreText={this.state.rows.length > INITIAL_USERS_LIST_SIZE ? 'Load More...' : ''}
            scrollRenderAheadDistance={height/1.5}
            renderRow={(row) => this._renderUser(row)}
            onRefresh={(page, callback) => {
            if (page != 1 && this.state.rows){
                  this.getMoreUsers(this.state.rows, this.state.lastIndex, INITIAL_USERS_LIST_SIZE, callback);
             } else {
                let currentUserRef = this.props.ventureId && this.state.firebaseRef && this.state.firebaseRef
                  .child(`users/${this.props.ventureId}`),
                firebaseRef = this.state.firebaseRef,
                usersListRef = firebaseRef.child('users'), _this = this;

                currentUserRef && currentUserRef.child('matchingPreferences').on('value', snapshot => {

                this.setState({currentUserMatchingPreferencesRef: currentUserRef.child('matchingPreferences')});

                let matchingPreferences = snapshot.val(),
                  maxSearchDistance = matchingPreferences && matchingPreferences.maxSearchDistance,
                  filteredUsersArray = [];

                  // @hmm: use usersListRef.once and not usersListRef.on, to prevent over-updating and repeated user rows
                  usersListRef.once('value', snapshot => {
                    // @hmm: show users based on filter settings
                    snapshot.val() && _.each(snapshot.val(), (user) => {

                      if (user.status && !user.status.isOnline) return;
                      if(user.ventureId === this.props.ventureId) return; // must use this.props.ventureId for comparison here

                      // @hmm: bc of cumulative privacy selection, only check for friends+ for both 'friends+' and 'all'
                      // right now only yalies use the app so friends+ and all are equivalent
                      if (matchingPreferences && matchingPreferences.privacy && matchingPreferences.privacy
                          .indexOf('friends+') > -1) {
                        if (this.props.currentUserLocationCoords && user.location && user.location.coordinates
                          && user.location.coordinates.latitude && user.location.coordinates.longitude
                          && GeoFire.distance(this.props.currentUserLocationCoords,
                            [user.location.coordinates.latitude,
                              user.location.coordinates.longitude]) <= maxSearchDistance * 1.609) {
                          if (matchingPreferences && matchingPreferences.gender
                            && matchingPreferences.gender.indexOf(user.gender) > -1) filteredUsersArray.push(user);
                          if (matchingPreferences && matchingPreferences.gender
                            && matchingPreferences.gender.indexOf(user.gender) === -1
                            && matchingPreferences.gender.indexOf('other') > -1 && user.gender !== 'male'
                            && user.gender !== 'female') filteredUsersArray.push(user);
                        }
                      } else if (matchingPreferences && matchingPreferences.privacy
                        && matchingPreferences.privacy.indexOf('friends') > -1 && matchingPreferences.privacy.length === 1) {
                        if (this.props.currentUserFriends && _.findIndex(this.props.currentUserFriends,
                            {name: user.name}) > -1) {
                          if (this.props.currentUserLocationCoords && user.location
                            && user.location.coordinates && user.location.coordinates.latitude
                            && user.location.coordinates.longitude
                            && GeoFire.distance(this.props.currentUserLocationCoords, [user.location.coordinates.latitude,
                              user.location.coordinates.longitude]) <= maxSearchDistance * 1.609) {
                            if (matchingPreferences && matchingPreferences.gender
                              && matchingPreferences.gender.indexOf(user.gender) > -1) filteredUsersArray.push(user);
                            if (matchingPreferences && matchingPreferences.gender
                              && matchingPreferences.gender.indexOf(user.gender) === -1
                              && matchingPreferences.gender.indexOf('other') > -1
                              && user.gender !== 'male' && user.gender !== 'female') filteredUsersArray.push(user);
                          }
                        }
                      } else {
                        if (this.props.currentUserLocationCoords && user.location && user.location.coordinates
                          && user.location.coordinates.latitude && user.location.coordinates.longitude
                          && GeoFire.distance(this.props.currentUserLocationCoords,
                            [user.location.coordinates.latitude, user.location.coordinates.longitude])
                          <= maxSearchDistance * 1.609) {
                          if (matchingPreferences && matchingPreferences.gender
                            && matchingPreferences.gender.indexOf(user.gender) > -1) filteredUsersArray.push(user);
                          if (matchingPreferences && matchingPreferences.gender
                            && matchingPreferences.gender.indexOf(user.gender) === -1
                            && matchingPreferences.gender.indexOf('other') > -1 && user.gender !== 'male'
                            && user.gender !== 'female') filteredUsersArray.push(user);
                        }
                      }

                    });
                    _this.setTimeout(() => {
                      callback(_.shuffle(_.slice(_.cloneDeep(_.values(filteredUsersArray)), 0, INITIAL_USERS_LIST_SIZE)));
                      _this.setState({
                        rows: _.cloneDeep(_.values(filteredUsersArray)),
                        currentUserRef,
                        usersListRef
                      });
                      _this.setState({lastIndex: INITIAL_USERS_LIST_SIZE});
                    }, 0)

                  });

              });
             }
          }}
            backgroundColor={'#F6F6EF'}
            />}
        <View style={{height: 48}}></View>
        <ModalBase
          animated={true}
          modalStyle={styles.loadingModalStyle}
          modalVisible={this.state.showLoadingModal}
          transparent={false}>
          <View style={styles.modalView}>
            <BrandLogo
              logoContainerStyle={styles.logoContainerStyle}
              logoStyle={styles.logoStyle}/>
            <ActivityIndicatorIOS
              animating={true}
              color='#fff'
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
            modalVisible={this.state.showFiltersModal}  // @hmm: btw important to dismount component so that it updates between being called to keep users list and chats list filters modals synced
            ventureId={this.props.ventureId} // @hmm: !! pass this.props.ventureId bc its available immediately
            /> : <View /> }
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
    borderWidth: 1,
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
    fontFamily: 'AvenirNextCondensed-Medium',
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
    marginHorizontal: 20
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
    marginRight: width / 64
  },
  searchTextInput: {
    color: '#222',
    backgroundColor: 'white',
    borderRadius: 3,
    borderWidth: 1,
    width: width / 1.7,
    height: 30,
    paddingLeft: 10,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'AvenirNextCondensed-Regular'
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
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginLeft: width / 20 // for thumbnail columnwise alignment
  },
  thumbnailLoading: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: THUMBNAIL_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center'
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
    overflow: 'hidden'
  }
});

module.exports = UsersListPage;
