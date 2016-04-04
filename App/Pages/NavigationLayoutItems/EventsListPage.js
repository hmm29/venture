/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule EventsListPage
 * @flow
 */

'use strict';

var React = require('react-native');
var {
  ActivityIndicatorIOS,
  AlertIOS,
  Image,
  LayoutAnimation,
  ListView,
  Navigator,
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
var DynamicCheckBoxIcon = require('../../Partials/Icons/DynamicCheckBoxIcon');
var Firebase = require('firebase');
var GeoFire = require('geofire');
var LinearGradient = require('react-native-linear-gradient');
var ModalBase = require('../../Partials/Modals/Base/ModalBase');
var ReactFireMixin = require('reactfire');
var SGListView = require('react-native-sglistview');
var Swipeout = require('react-native-swipeout');
var sha256 = require('sha256');
var TimerMixin = require('react-timer-mixin');
var VentureAppPage = require('../Base/VentureAppPage');

// Header Components
var CloseIcon = require('../../Partials/Icons/CloseIcon');
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
var PUSH_NOTIFICATION_REFRACTORY_DURATION_IN_MINUTES = 10;
var THUMBNAIL_SIZE = 50;

var BLACK_HEX_CODE = '#000';
var BLUE_HEX_CODE = '#40cbfb';
var GREEN_HEX_CODE = '#84FF9B';
var WHITE_HEX_CODE = '#fff';
var YELLOW_HEX_CODE = '#ffe770';

String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

var hash = (msg:string) => sha256(msg);

var User = React.createClass({
  mixins: [TimerMixin],

  propTypes: {
    closeAttendeeListModal: React.PropTypes.func,
    currentTime: React.PropTypes.number,
    currentUserLocationCoords: React.PropTypes.array,
    currentUserData: React.PropTypes.object,
    currentUserIDHashed: React.PropTypes.string,
    data: React.PropTypes.object,
    isCurrentUser: React.PropTypes.func,
    firebaseRef: React.PropTypes.object,
    firstSession: React.PropTypes.object,
    navigator: React.PropTypes.object
  },

  getInitialState() {
    return {
      dir: 'row',
      expireTime: '',
      hasShown: false,
      lastPushNotificationSentTime: 0,
      thumbnailReady: false
    }
  },

  componentWillMount() {
    let distance = this.props.currentUserLocationCoords && this.props.data
        && this.props.data.location && this.props.data.location.coordinates
        && this.calculateDistance(this.props.currentUserLocationCoords,
          [this.props.data.location.coordinates.latitude, this.props.data.location.coordinates.longitude]),
      _this = this;

    // clear old data
    this.props.firebaseRef && this.props.data && this.props.data.ventureId && this.props.currentUserIDHashed
    && this.props.firebaseRef.child(`users/${this.props.currentUserIDHashed}/event_invite_match_requests`)
      .child(this.props.data.ventureId)
    && (this.props.firebaseRef).child(`users/${this.props.currentUserIDHashed}/event_invite_match_requests`)
      .child(this.props.data.ventureId).off();

    // prevent conflict with data clearing
    this.setTimeout(() => {

      this.props.firebaseRef && this.props.data && this.props.data.ventureId
      && this.props.currentUserIDHashed && this.props.firebaseRef
        .child(`users/${this.props.currentUserIDHashed}/event_invite_match_requests`).child(this.props.data.ventureId)
      && (this.props.firebaseRef).child(`users/${this.props.currentUserIDHashed}/event_invite_match_requests`)
        .child(this.props.data.ventureId).on('value', snapshot => {
          _this.setState({
            chatRoomId: snapshot.val() && snapshot.val().chatRoomId,
            distance,
            status: snapshot.val() && snapshot.val().status,
            expireTime: snapshot.val() && snapshot.val().expireTime
          });

          this.setTimeout(() => {
            // @hmm: onboarding tutorial logic
            if (this.props.firstSession && !this.state.hasShown) {
              if (this.state.status === 'received' && !this.props.firstSession.hasReceivedFirstRequest) { // @hmm: most probable for componentDidMount
                // @hmm: account for case in which user already has received requests before first nav to users list
                AlertIOS.alert(
                  'Someone Is Interested In Your Activity!',
                  'Tap on their smiley face icon to match with them!'
                );
                this.props.firebaseRef
                  .child(`users/${this.props.currentUserIDHashed}/firstSession/hasReceivedFirstRequest`).set(true);
                this.setState({hasShown: true});
              }
              else if (this.state.status === 'matched' && !this.props.firstSession.hasMatched) {
                AlertIOS.alert(
                  'You Matched With Someone!',
                  'You matched with another user! Tap on the message bubble to chat!'
                );
                this.props.firebaseRef
                  .child(`users/${this.props.currentUserIDHashed}/firstSession/hasMatched`).set(true);
                this.setState({hasShown: true});
              }
              else if(this.state.status === 'sent' && !this.props.firstSession.hasSentFirstRequest) {
                AlertIOS.alert(
                  'Activity Request Sent!',
                  'You have just shown interest in another user\'s activity! If they accept, you will match with them!'
                );
                this.props.firebaseRef
                  .child(`users/${this.props.currentUserIDHashed}/firstSession/hasSentFirstRequest`).set(true);
                this.setState({hasShown: true});
              }
            }
          }, 0);
        });
    }, 900);
  },

  componentDidMount() {
    //this.refs.attendee.fadeIn(600);
  },

  componentWillUnmount() {
    this.props.firebaseRef && this.props.data && this.props.data.ventureId && this.props.currentUserIDHashed
    && this.props.firebaseRef.child(`users/${this.props.currentUserIDHashed}/event_invite_match_requests`)
      .child(this.props.data.ventureId)
    && (this.props.firebaseRef).child(`users/${this.props.currentUserIDHashed}/event_invite_match_requests`)
      .child(this.props.data.ventureId).off();
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
      targetUserEventInviteMatchRequestsRef = firebaseRef.child('users/' + targetUserIDHashed + '/event_invite_match_requests'),
      currentUserEventInviteMatchRequestsRef = firebaseRef.child('users/' + currentUserIDHashed + '/event_invite_match_requests');

    // end match interactions
    targetUserEventInviteMatchRequestsRef.child(currentUserIDHashed).set(null);
    currentUserEventInviteMatchRequestsRef.child(targetUserIDHashed).set(null);

    this.state.chatRoomId && firebaseRef.child(`chat_rooms/${this.state.chatRoomId}`).set(null);

    return -1;
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
      targetUserEventInviteMatchRequestsRef = targetUserRef.child('event_invite_match_requests'),
      currentUserEventInviteMatchRequestsRef = currentUserRef.child('event_invite_match_requests'),
      _this = this;

    if (this.state.status === 'sent') {

      // @hmm: delete the requests
      targetUserEventInviteMatchRequestsRef.child(currentUserIDHashed).set(null);
      currentUserEventInviteMatchRequestsRef.child(targetUserIDHashed).set(null);
    }

    else if (this.state.status === 'received') {

      // @hmm: accept the request
      // chatroom reference uses id of the user who accepts the received matchInteraction
      targetUserEventInviteMatchRequestsRef.child(currentUserIDHashed).update({
        _id: currentUserIDHashed,
        status: 'matched',
        role: 'recipient'
      }, () => {});

      currentUserEventInviteMatchRequestsRef.child(targetUserIDHashed).update({
        _id: targetUserIDHashed,
        status: 'matched',
        role: 'sender'
      }, () => {});

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

    else if (this.state.status === 'matched') {
      let chatRoomActivityPreferenceTitle,
        distance = this.state.distance + 'mi',
        _id;

      currentUserEventInviteMatchRequestsRef.child(targetUserIDHashed).once('value', snapshot => {

        if (snapshot.val() && snapshot.val().role === 'sender') {
          _id = 'EVENT_INVITE_' + targetUserIDHashed + '_TO_' + currentUserIDHashed;
          chatRoomActivityPreferenceTitle = this.props.currentUserData.activityPreference.title
        } else {
          _id = 'EVENT_INVITE_' + currentUserIDHashed + '_TO_' + targetUserIDHashed;
          chatRoomActivityPreferenceTitle = this.props.currentUserData.activityPreference.title
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
            chatRoomRef.child('user_activity_preference_titles').child(currentUserIDHashed)
              .set(this.props.eventTitle);
            chatRoomRef.child('user_activity_preference_titles').child(targetUserIDHashed)
              .set(this.props.eventTitle);
          }

          _this.props.navigator.push({
            title: 'Chat',
            component: ChatPage,
            passProps: {
              _id,
              recipient: _this.props.data,
              distance,
              chatRoomEventTitle: this.props.eventTitle,
              chatRoomRef,
              currentUserData: _this.props.currentUserData,
              currentUserRef,
              firebaseRef,
              targetUserRef
            }
          });

          if(this.props.firstSession && !this.props.firstSession.hasStartedFirstChat) {
            AlertIOS.alert(
              'Countdown Timer!',
              'Welcome to your first chat! After 5 minutes, this conversation will expire. Let your match know what you want to do. No time to waste!'
            );
            firstSessionRef.child('hasStartedFirstChat').set(true);
          }

        });
      });
    }

    else {
      targetUserEventInviteMatchRequestsRef.child(currentUserIDHashed).setWithPriority({
        eventTitle: this.props.eventTitle,
        status: 'received',
        _id: currentUserIDHashed
      }, 200);
      currentUserEventInviteMatchRequestsRef.child(targetUserIDHashed).setWithPriority({
        eventTitle: this.props.eventTitle,
        status: 'sent',
        _id: targetUserIDHashed
      }, 300);

      this.setTimeout(() => {
        usersListRef.child(currentUserIDHashed).once('value', snapshot => {
          let accountObj = _.pick(snapshot.val(), 'ventureId', 'name', 'firstName',
            'lastName', 'activityPreference', 'age', 'picture', 'bio', 'location', 'gender');

          targetUserEventInviteMatchRequestsRef.child(currentUserIDHashed).update({
            account: _.set(_.set(_.set(accountObj, 'isEventInvite', true), 'activityPreference.start.time', this.props.eventLogistics), 'activityPreference.title', this.props.eventTitle)
          });
        });

        usersListRef.child(targetUserIDHashed).once('value', snapshot => {
          let accountObj = _.pick(snapshot.val(), 'ventureId', 'name', 'firstName',
            'lastName', 'activityPreference', 'age', 'picture', 'bio', 'location', 'gender');

          currentUserEventInviteMatchRequestsRef.child(targetUserIDHashed).update({
            account: _.set(_.set(_.set(accountObj, 'isEventInvite', true), 'activityPreference.start.time', this.props.eventLogistics), 'activityPreference.title', this.props.eventTitle)
          });

        });
      }, 0);

      targetUserEventInviteMatchRequestsRef && targetUserEventInviteMatchRequestsRef.once('value', snapshot => {
        if(snapshot.val() && (_.size(snapshot.val()) === 1 || _.size(snapshot.val()) % 2 === 0)) { //send push notification if object just added was new/first or if size of match obj divisible by 2
          // @hmm: prevents spamming push notification invites on repeated tapping of user bar, but will reset with each dismount then mount
          // only send if current time is not in push notification refractory period
          const currentTime = new Date().getTime();
          if(currentTime > (new Date(this.state.lastPushNotificationSentTime + (PUSH_NOTIFICATION_REFRACTORY_DURATION_IN_MINUTES * 60 * 1000))).getTime()) {
            fetch(PARSE_SERVER_URL + '/functions/sendPushNotification', {
              method: 'POST',
              headers: {
                'Accept': 'application/json',
                'X-Parse-Application-Id': PARSE_APP_ID,
                'Content-Type': 'application/json',
              },
              body: `{"channels": ["${targetUserIDHashed}"], "alert": "Someone is interested in going to an event with you!"}`
            })
              .then(response => {
                _this.setState({lastPushNotificationSentTime: (new Date()).getTime()})
                console.log(JSON.stringify(response))
              })
              .catch(error => console.log(error))
          }
          
        }
      })
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
          onPress={this.handleMatchInteraction}
          style={{left: 10, bottom: 6}} />;
      case 'received':
        return <ReceivedRequestIcon
          color='rgba(0,0,0,0.2)'
          onPress={this.handleMatchInteraction}
          style={{left: 10, bottom: 6}} />;
      case 'matched':
        return <MatchSuccessIcon
          chatRoomId={this.state.chatRoomId}
          currentUserIDHashed={this.props.currentUserIDHashed}
          color='rgba(0,0,0,0.2)'
          firebaseRef={this.props.firebaseRef}
          onPress={() => { this.props.closeAttendeeListModal(); this.handleMatchInteraction()}}
          style={{left: 10,  bottom: 6}}
          targetUserIDHashed={this.props.data.ventureId}
          />;
      default:
        return <DefaultMatchStatusIcon
          color='rgba(0,0,0,0.2)'
          onPress={this.handleMatchInteraction}
          style={{left: 10, bottom: 6}} />
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

          if(this.props.eventTitle && currentUserRef && targetUserRef) {
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

    let profileModal = (
      <View style={[styles.profileModalContainer, {alignSelf: 'center'}]}>
        <View
          style={[styles.profileModal, {backgroundColor: this._getSecondaryStatusColor()}]}>
          <Image
            source={{uri: this.props.data && this.props.data.picture}}
            style={styles.profileModalUserPicture}/>
          <Text
            style={styles.profileModalNameAgeInfo}>{this.props.data && this.props.data.firstName}, {this.props.data && this.props.data.age && this.props.data.age.value} {'\t'}
            | {'\t'}
            <Text style={styles.profileModalActivityInfo}>
              <Text
                style={styles.profileModalActivityPreference}>{this.props.eventTitle}</Text>
            </Text>
          </Text>
          <Text
            style={[styles.profileModalSectionTitle, {alignSelf: 'center'}]}>{this.props.eventLogistics}</Text>
          <Text
            style={[styles.profileModalBio, {alignSelf: 'center'}]}>Bio: {this.props.data && this.props.data.bio}</Text>
        </View>
      </View>
    );

    return (
      <Swipeout autoClose={true} right={!_.isEmpty(swipeoutBtns) ? swipeoutBtns : null}>
      <Animatable.View ref="attendee">
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
              <View style={styles.rightContainer}>
                <Image
                  onLoadEnd={() => this.setState({thumbnailReady: true})}
                  onPress={this._onPressItem}
                  source={{uri: this.props.data && this.props.data.picture}}
                  style={[styles.thumbnail, (this.state.thumbnailReady ? {} : {backgroundColor: '#040A19'}), {left: width/50}]}>
                  <View style={(this.state.expireTime ? styles.timerValOverlay : {})}>
                    <Text
                      style={[styles.timerValText, (!_.isString(this._getTimerValue(this.props.currentTimeInMs))
                                    && _.parseInt((this._getTimerValue(this.props.currentTimeInMs))/60) === 0 ?
                                    {color: '#F12A00'} :{})]}>
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
                  style={styles.distance}>{this.state.distance ? this.state.distance + ' mi' : ''}</Text>
                <Text style={styles.eventTitle}>
                  {this.props.eventTitle} ?
                </Text>
                <View style={{top: 10, right: (width < 375 ? width/17 : width/60)}}>{this._renderStatusIcon()}</View>
              </View>
            </LinearGradient>
            {this.state.dir === 'column' ? profileModal : <View />}
          </View>
        </TouchableHighlight>
      </Animatable.View>
        </Swipeout>
    );
  }
});


var AttendeeList = React.createClass({
  mixins: [TimerMixin, ReactFireMixin],

  getInitialState() {
    return {
      dataSource: new ListView.DataSource({
        rowHasChanged: (row1, row2) => !_.isEqual(row1, row2)
      }),
      rows: []
    };
  },

  _handle: null,

  componentWillMount() {
    let attendeesListRef = this.props.eventsListRef && this.props.eventData && this.props.eventData.id
        && this.props.eventsListRef.child(`${this.props.eventData.id}/attendees`),
      usersListRef = this.props.firebaseRef && this.props.firebaseRef.child('users'),
      _this = this;

    attendeesListRef && attendeesListRef.on('value', snapshot => {
      _this.updateRows(_.cloneDeep(_.values(snapshot.val())));
      _this.setState({rows: _.cloneDeep(_.values(snapshot.val())), attendeesListRef, usersListRef});
    });

    this.bindAsArray(usersListRef, 'rows');

    this._handle = this.setInterval(() => {
      this.setState({currentTimeInMs: (new Date()).getTime()})
    }, 1000);
  },

  componentWillUnmount() {
    //this.state.attendeesListRef && this.state.attendeesListRef.off();
  },

  updateRows(rows) {
    this.setState({dataSource: this.state.dataSource.cloneWithRows(rows)});
  },

  _renderHeader() {
    // @hmm: make sure to have three children in Header with text in center
    return (
      <Header>
        <View />
        <Text>{(this.props.eventData
        && this.props.eventData.title 
        && this.props.eventData.title.length < 24 ? "WHO'S GOING TO : " : "")} 
        <Text style={{color: '#F06449', width: width/3, overflow: 'hidden'}}>{this.props.eventData
        && this.props.eventData.title}</Text></Text>
        <CloseIcon style={{bottom: height / 15, left: (width < 420 ? width/21 : 0)}}
                   onPress={this.props.closeAttendeeListModal}/>
      </Header>
    )
  },


  _renderUser(user:Object, sectionID:number, rowID:number) {
    if (user.ventureId === this.props.ventureId) return <View />;

    return <User closeAttendeeListModal={this.props.closeAttendeeListModal}
                 currentTimeInMs={this.state.currentTimeInMs}
                 currentUserData={this.props.currentUserData}
                 currentUserIDHashed={this.props.ventureId}
                 currentUserLocationCoords={this.props.currentUserLocationCoords}
                 data={user}
                 eventId={this.props.eventData && this.props.eventData.id}
                 eventLogistics={`${this.props.eventData && this.props.eventData.start
                     && this.props.eventData.start.date}, ${this.props.eventData
                     && this.props.eventData.start && this.props.eventData.start.dateTime}   @   ${this.props.eventData
                     && this.props.eventData.location}`}
                 eventTitle={this.props.eventData && this.props.eventData.title}
                 firebaseRef={this.props.firebaseRef}
                 firstSession={this.props.firstSession}
                 navigator={this.props.navigator}/>;
  },

  render() {
    return (
      <View style={styles.attendeeListBaseContainer}>
        <View>
        {this._renderHeader()}
        </View>
        <ListView
          style={{height: height/1.35}}
          dataSource={this.state.dataSource}
          renderRow={this._renderUser}
          initialListSize={INITIAL_LIST_SIZE}
          onChangeVisibleRows={(visibleRows, changedRows) => this.setState({visibleRows, changedRows})}
          pageSize={PAGE_SIZE}
          automaticallyAdjustContentInsets={false}
          scrollRenderAheadDistance={600}/>
      </View>
    )
  }
});

var Event = React.createClass({
  getInitialState() {
    return {
      dir: 'row',
      status: 'notAttending'
    }
  },

  componentWillMount() {
    let _this = this;

    this.props.eventsListRef && this.props.data && this.props.currentUserData
    && this.props.currentUserIDHashed && this.props.data.id
    && this.props.eventsListRef.child(`${this.props.data.id}/attendees/${this.props.currentUserIDHashed}`)
      .once('value', snapshot => {
        if (snapshot.val()) _this.setState({status: 'attending'});
        else _this.setState({status: 'notAttending'});
      });

    // TODO: handle push notification cancelling for canceled events
    // Note: reminder gets sent after you come back to page and are still subscribed, instead of whenever you tap the event attendance icon :)
    this.props.usersListRef && this.props.data && this.props.currentUserIDHashed && this.props.data.id
    && this.props.usersListRef.child(`${this.props.currentUserIDHashed}/events/${this.props.data.id}/hasBeenSentPushNotificationReminder`)
      .once('value', snapshot => {
        if(snapshot.val() === false) {
          // send push notification, then set to true
          fetch(PARSE_SERVER_URL + '/functions/sendPushNotification', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'X-Parse-Application-Id': PARSE_APP_ID,
              'Content-Type': 'application/json',
            },
            body: `{"channels": ["${this.props.currentUserIDHashed}"], "push_time" : "${this.props.data && this.props.data.reminder && this.props.data.reminder.sendTime}", "expiration_interval":"86400", "alert": "${this.props.data && this.props.data.title} is starting soon!"}`
          })
            .then(response => {
              console.log(JSON.stringify(response))
            })
            .catch(error => console.log(error))

          this.props.usersListRef.child(`${this.props.currentUserIDHashed}/events/${this.props.data.id}/hasBeenSentPushNotificationReminder`).set(true);
        }
      })
  },

  componentDidMount() {
      this.refs.event.fadeIn(300);
  },

  componentWillReceiveProps(nextProps) {
    let _this = this;

    nextProps.eventsListRef && nextProps.data && nextProps.currentUserData
    && nextProps.currentUserIDHashed && nextProps.data.id
    && nextProps.eventsListRef.child(`${nextProps.data.id}/attendees/${nextProps.currentUserIDHashed}`)
      .once('value', snapshot => {
        _this.setState({status: ''});
        if (snapshot.val()) _this.setState({status: 'attending'});
        else _this.setState({status: 'notAttending'});
      });

  },

  _getSecondaryStatusColor() {
    switch (this.state.status) {
      case 'attending':
        return '#AAFFA9';
      default:
        return '#111';
    }
  },

  _getEventProfileBackgroundColor() {
    switch (this.state.status) {
      case 'attending':
        return '#AAFFA9';
      default:
        return '#FBFBF1';
    }
  },

  getStatusColor() {
    switch (this.state.status) {
      case 'attending':
        return GREEN_HEX_CODE;
      default:
        return BLACK_HEX_CODE;
    }
  },

  handleEventInteraction() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (this.state.status === 'notAttending') {
      this.setState({status: 'attending'});
      this.props.eventsListRef && this.props.data && this.props.currentUserData && this.props.currentUserIDHashed
      && this.props.data.id && this.props.eventsListRef
        .child(`${this.props.data.id}/attendees/${this.props.currentUserIDHashed}`)
        .set(_.pick(this.props.currentUserData, 'firstName', 'name', 'picture', 'ventureId', 'bio', 'age', 'location'));
      this.props.usersListRef && this.props.data && this.props.currentUserIDHashed && this.props.data.id
      && this.props.usersListRef.child(`${this.props.currentUserIDHashed}/events/${this.props.data.id}`)
        .set(_.set(_.pick(this.props.data, 'id', 'title', 'description', 'location', 'start'), 'hasBeenSentPushNotificationReminder', false));
    }
    else {
      this.setState({status: 'notAttending'});
      this.props.eventsListRef && this.props.data && this.props.currentUserData && this.props.currentUserIDHashed
      && this.props.data.id && this.props.eventsListRef
        .child(`${this.props.data.id}/attendees/${this.props.currentUserIDHashed}`)
        .set(null);
      this.props.usersListRef && this.props.data && this.props.currentUserIDHashed
      && this.props.data.id && this.props.usersListRef
        .child(`${this.props.currentUserIDHashed}/events/${this.props.data.id}`)
        .set(null);
    }
  },

  _onPressItem() {
    // @hmm: set to selected event for attendee list
    // have to press item to access attendee list so makes sense to change selected event here
    this.props.handleSelectedEventStateChange(this.props.data);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    this.setState({dir: this.state.dir === 'row' ? 'column' : 'row'});
  },

  _renderEventAttendanceStatusIcon() {
    return (
      <DynamicCheckBoxIcon
        size={27}
        selected={this.state.status === 'attending'}
        showChevronWhenDisabled={[true, 'right']}
        onPress={this.handleEventInteraction}
        style={styles.eventAttendanceStatusIcon}
        />
    );
  },

  render() {

    let profileModal = (
      <View style={[styles.profileModalContainer, {flexDirection: 'column', alignItems: 'center'}]}>
        <View
          style={[styles.profileModal, {backgroundColor: this._getEventProfileBackgroundColor(),
                    alignSelf: 'stretch', alignItems: 'center'}]}>
          <Text style={styles.profileModalNameAgeInfo}>WHEN: {this.props.data
          && this.props.data.start && this.props.data.start.date}, {this.props.data
          && this.props.data.start && this.props.data.start.dateTime} {'\n'}
          </Text>
          <Text style={styles.profileModalNameAgeInfo}>WHERE: {this.props.data
          && this.props.data.location} {'\n'}
          </Text>
          <Text style={styles.profileModalSectionTitle}>EVENT DESCRIPTION:</Text>
          <Text style={[styles.profileModalBio, {width: width / 1.4}]}>{this.props.data
          && this.props.data.description} {'\n'}</Text>

          <TouchableOpacity onPress={() => {
                     this.props.openAttendeeListModal();
                     }} style={{backgroundColor: 'rgba(0,0,0,0.001)'}}><Text style={{color: '#3F7CFF',
                     fontFamily: 'AvenirNextCondensed-Medium', fontSize: 20, paddingHorizontal: 40, paddingBottom: 10}}>
            {"WHO\'S GOING?"}</Text></TouchableOpacity>
        </View>
      </View>
    );

    return (
      <Animatable.View ref="event">
        <TouchableHighlight
          activeOpacity={0.9}
          onPress={this._onPressItem}
          style={[{height: THUMBNAIL_SIZE * 2}]}>
          <View
            style={[styles.userContentWrapper, {flexDirection: this.state.dir}]}>
            <LinearGradient
              colors={(this.props.backgroundColor && [this.props.backgroundColor, this.props.backgroundColor])
                        || [this.getStatusColor(), this._getSecondaryStatusColor(), WHITE_HEX_CODE, 'transparent']}
              start={[0,1]}
              end={[1,1]}
              locations={[0.3,0.99,1.0]}
              onLayout={() => LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)}
              style={styles.container}>
              <Image
                onLoad={() => {this.props.handleShowLoadingModal(false);
                            }}
                source={{uri: this.props.data && this.props.data.event_img}}
                style={{resizeMode: 'cover', height: THUMBNAIL_SIZE * 2, flex: 1, flexDirection: 'row',
                            backgroundColor: '#040A19', justifyContent: 'space-between', alignItems: 'center'}}>
                <View
                  onPress={this._onPressItem}
                  style={[styles.eventThumbnail, {backgroundColor: 'rgba(0,0,0,0.9)', justifyContent:
                                'center', alignItems: 'center'}]}>
                  <Text style={{fontFamily: 'AvenirNextCondensed-Regular', color: '#fff'}}>
                    {this.props.data && this.props.data.organization
                    && this.props.data.organization.displayName
                    && this.props.data.organization.displayName.split('').join(' ')}</Text>
                </View>
                <View style={[styles.rightContainer, {flexDirection: 'row', justifyContent: 'space-between',
                            alignItems: 'center'}]}>
                  <Text style={{}}>{/*THIS IS A PADDER FOR THE STATUS ICON*/}</Text>
                  <View style={{position: 'absolute', right: width/10}}>
                    {this._renderEventAttendanceStatusIcon()}</View>
                </View>
              </Image>
            </LinearGradient>
            {this.state.dir === 'column' ? profileModal : <View />}
          </View>
        </TouchableHighlight>
      </Animatable.View>
    );
  }
});

var EventsListPage = React.createClass({
  mixins: [ReactFireMixin, TimerMixin],

  statics: {
    title: '<EventsListPage/>',
    description: 'Events list view.'
  },

  watchID: null,

  getInitialState() {
    let firebaseRef = new Firebase('https://ventureappinitial.firebaseio.com/'),
      eventsListRef = firebaseRef && firebaseRef.child('events'),
      usersListRef = firebaseRef && firebaseRef.child('users');

    return {
      currentPosition: null,
      dataSource: new ListView.DataSource({
        rowHasChanged: (row1, row2) => !_.isEqual(row1, row2)
      }),
      eventsListRef,
      firebaseRef,
      eventsRows: [],
      selectedEvent: null,
      showAttendeeListModal: false,
      showLoadingModal: false,
      userRows: [],
      usersListRef
    };
  },

  componentWillMount() {
    let eventsListRef = this.state.eventsListRef,
      usersListRef = this.state.usersListRef,
      _this = this;

    this.bindAsArray(usersListRef, 'userRows');
    this.bindAsArray(eventsListRef, 'eventsRows');

    eventsListRef.on('value', snapshot => {
      _this.updateRows(_.cloneDeep(_.values(snapshot.val())));
      _this.setState({eventsRows: _.cloneDeep(_.values(snapshot.val())), eventsListRef, usersListRef});
    });

    this.setState({currentUserVentureId: this.props.ventureId});

    this.state.firebaseRef.child(`/users/${this.props.ventureId}`).once('value', snapshot => {
      _this.setState({currentUserData: snapshot.val()});
    });

  },

  componentDidMount() {
    this.setTimeout(() => {
      // @hmm: show loading modal if eventsRows still empty after 2 seconds
      if (_.isEmpty(this.state.eventsRows)) this.setState({showLoadingModal: true});
      this.setTimeout(() => {
        if (this.state.showLoadingModal) this.setState({showLoadingModal: false});
      }, 5000); // @hmm: timeout for loading modal

      //@hmm: Tutorial modal
      let firstSessionRef = this.props.firebaseRef && this.props.ventureId
        && this.props.firebaseRef.child('users/' + this.props.ventureId + '/firstSession');

      if(this.props.firstSession && !this.props.firstSession.hasVisitedEventsPage) {
        AlertIOS.alert(
          'Follow Events!',
          'What’s happening near you?\n Tap an event to learn more details and interact with other people who are going. Use the arrow to RSVP!'
        );
        firstSessionRef.child('hasVisitedEventsPage').set(true);
      }

    }, 800);
  },

  componentWillUnmount() {
    let eventsListRef = this.state.eventsListRef,
      usersListRef = this.state.usersListRef;

    eventsListRef && eventsListRef.off();
    usersListRef && usersListRef.off();
  },

  _openAttendeeListModal() {
    this.setState({showAttendeeListModal: true});
  },

  _closeAttendeeListModal() {
    this.setState({showAttendeeListModal: false});
  },

  _handleSelectedEventStateChange(selectedEvent:Object) {
    this.setState({selectedEvent});
  },

  _handleShowLoadingModal(showLoadingModal:boolean) {
    this.setState({showLoadingModal});
  },

  _navigateToHome() {
    this.props.navigator.popToTop();
  },

  updateRows(eventsRows:Array) {
    this.setState({dataSource: this.state.dataSource.cloneWithRows(eventsRows)});
  },
  _renderHeader() {
    return (
      <Header containerStyle={{position: 'relative'}}>
        <HomePageIcon onPress={() => this._navigateToHome()}/>
        <Text>EVENTS</Text>
        <View />
      </Header>
    )
  },


  _renderEvent(event:Object, sectionID:number, rowID:number) {
    // @hmm: not needed thanks to sglistview
    // if (this.state.visibleRows && this.state.visibleRows[sectionID] && this.state.visibleRows[sectionID][rowID]
    //  && !this.state.visibleRows[sectionID][rowID]) return <View />;

    return <Event currentUserData={this.state.currentUserData}
                  currentUserIDHashed={this.state.currentUserVentureId}
                  data={event}
                  eventsListRef={this.state.eventsListRef}
                  firebaseRef={this.state.firebaseRef}
                  handleSelectedEventStateChange={this._handleSelectedEventStateChange}
                  handleShowLoadingModal={this._handleShowLoadingModal}
                  openAttendeeListModal={this._openAttendeeListModal}
                  navigator={this.props.navigator}
                  usersListRef={this.state.usersListRef}/>;
  },

  render() {
    return (
      <VentureAppPage backgroundColor='#040A19'>
        <View>
          {this._renderHeader()}
        </View>
        <ListView
          dataSource={this.state.dataSource}
          renderRow={this._renderEvent}
          // renderScrollComponent={props => <SGListView {...props} premptiveLoading={5} />}
          initialListSize={INITIAL_LIST_SIZE}
          pageSize={PAGE_SIZE}
          onChangeVisibleRows={(visibleRows, changedRows) => this.setState({visibleRows, changedRows})}
          automaticallyAdjustContentInsets={false}
          scrollRenderAheadDistance={600}
          />
        <View style={{height: 48}}></View>
        <ModalBase
          modalStyle={styles.modalStyle}
          animated={true}
          modalVisible={this.state.showLoadingModal}
          transparent={false}>
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
                {'\n\n'} The phrase "Let's grab a meal" has a 12% success rate.</Text>
            </TouchableOpacity>
          </View>
        </ModalBase>
        <ModalBase
          animated={true}
          modalStyle={styles.attendeeModalStyle}
          modalVisible={this.state.showAttendeeListModal}>
          <View>
            {this.state.selectedEvent ?
              <AttendeeList
                closeAttendeeListModal={this._closeAttendeeListModal}
                currentUserData={this.state.currentUserData}
                currentUserLocationCoords={this.props.currentUserLocationCoords}
                eventData={this.state.selectedEvent}
                eventsListRef={this.state.eventsListRef}
                firebaseRef={this.state.firebaseRef}
                firstSession={this.props.firstSession}
                navigator={this.props.navigator}
                ventureId={this.props.ventureId}/> : <View/> }
          </View>
        </ModalBase>
      </VentureAppPage>
    )
  }
});

var styles = StyleSheet.create({
  attendeeListBaseContainer: {
    flex: 1,
    backgroundColor: '#040A19',
    paddingTop: height / 18
  },
  attendeeModalStyle: {
    backgroundColor: '#02030F',
    justifyContent: 'flex-start'
  },
  eventAttendanceStatusIcon: {
    width: 22,
    height: 22,
    marginHorizontal: 20,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    left: width / 15
  },
  eventThumbnail: {
    width: height / 10,
    height: height / 10,
    borderRadius: height / 20,
    marginVertical: 7,
    marginLeft: 10
  },
  eventTitleBanner: {
    fontFamily: 'AvenirNextCondensed-Medium',
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: width / 1.1,
    fontSize: height / 35,
    paddingVertical: height / 130,
    paddingLeft: width / 15,
    paddingRight: width / 9.5,
    textAlign: 'center',
    right: width / 30,
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
  modalStyle: {
    backgroundColor: '#02030F',
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
    backgroundColor: WHITE_HEX_CODE,
    width
  },
  profileModalActivityInfo: {
    fontFamily: 'AvenirNextCondensed-Medium'
  },
  profileModalActivityPreference: {
    fontFamily: 'AvenirNextCondensed-Medium'
  },
  profileModalBio: {
    color: '#222',
    fontFamily: 'AvenirNextCondensed-Medium',
    textAlign: 'center',
    fontSize: 16,
    marginTop: 15
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
    fontFamily: 'AvenirNextCondensed-Regular'
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
    justifyContent: 'center'
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: THUMBNAIL_SIZE / 2,
    marginVertical: 7,
    marginLeft: (width < 420 ? 10 : width/8)
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
    width
  },
  eventTitle: {
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
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: 'rgba(100,100,105,0.2)',
    borderWidth: 1
  },
  distance: {
    width: width / 4,
    left: 10,
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
  timerValText: {
    opacity: 1.0,
    color: '#fff',
    fontFamily: 'AvenirNextCondensed-Medium'
  }
});

module.exports = EventsListPage;