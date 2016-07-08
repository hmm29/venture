/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule HomePage
 * @flow
 */
'use strict';

import React, { Component } from 'react';
import {
  AlertIOS,
  AppStateIOS,
  AsyncStorage,
  DatePickerIOS,
  Image,
  InteractionManager,
  LayoutAnimation,
  PixelRatio,
  Platform,
  PushNotificationIOS,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  View
  } from 'react-native';

var _ = require('lodash');
var Animatable = require('react-native-animatable');
var BrandLogo = require('../Partials/BrandLogo');
var DeviceUUID = require("react-native-device-uuid");
var Dimensions = require('Dimensions');
var dismissKeyboard = require('dismissKeyboard');
var Firebase = require('firebase');
var {Icon, } = require('react-native-icons');
var LoginPage = require('../Pages/LoginPage');
var SubmitActivityIcon = require('../Partials/Icons/SubmitActivityIcon');
var Swiper = require('react-native-swiper');
var TabBarLayout = require('../NavigationLayouts/TabBarLayout.ios');
var TimerMixin = require('react-timer-mixin');
var VentureAppPage = require('./Base/VentureAppPage');

// Header Components
var ChatsListPageIcon = require('../Partials/Icons/NavigationButtons/ChatsListPageIcon');
var Header = require('../Partials/Header');
var ProfilePageIcon = require('../Partials/Icons/NavigationButtons/ProfilePageIcon');

// Add Info Box Icons
var ChevronIcon = require('../Partials/Icons/ChevronIcon');
var DynamicCheckBoxIcon = require('../Partials/Icons/DynamicCheckBoxIcon');
var DynamicTimeSelectionIcon = require('../Partials/Icons/DynamicTimeSelectionIcon');

// Globals
var {height, width} = Dimensions.get('window');
var ACTIVITY_TEXT_INPUT_PADDING = 5;
var ACTIVITY_TITLE_INPUT_REF = 'activityTitleInput';
var ADD_INFO_BUTTON_SIZE = 28;
var CATEGORY_OF_USERS = 'YALIES';
var DEFAULT_CITY_COORDINATES = {latitude: 41.310809, longitude: -72.924953}; // New Haven coords
var LOGO_WIDTH = 200;
var LOGO_HEIGHT = 120;
var MAX_TEXT_INPUT_VAL_LENGTH = 15;
var NEXT_BUTTON_SIZE = 28;
var PARSE_APP_ID = "ba2429b743a95fd2fe069f3ae4fe5c95df6b8f561bb04b62bc29dc0c285ab7fa";
var TAG_SELECTION_INPUT_REF = 'tagSelectionInput';
var TAG_TEXT_INPUT_PADDING = 3;
var TRENDING_ITEMS_CAROUSEL_REF = 'trendingItemsCarousel';

class Title extends Component {
  render() {
    return (
      <Text
        style={[styles.title, {fontSize: this.props.fontSize},
                this.props.titleStyle]}>{this.props.children}</Text>
    );
  }
}

var HomePage = React.createClass({
  getInitialState() {
    return {
      activeTimeOption: 'now',
      activityTitleInput: '',
      brandLogoVisible: false,
      chatCount: 0,
      contentOffsetXVal: 0,
      currentAppState: AppStateIOS.currentState,
      currentUserLocationCoords: null,
      date: new Date(),
      events: [],
      firebaseRef: new Firebase('https://ventureappinitial.firebaseio.com/'),
      firstSession: null,
      hasIshSelected: false,
      hasKeyboardSpace: false,
      hasSpecifiedTime: false,
      isLoggedIn: false,
      ready: false,
      showAddInfoBox: false,
      showAddInfoButton: true,
      showSubmitActivityIcon: false,
      showTextInput: false,
      showTimeSpecificationOptions: false,
      showTrendingItems: false,
      tagsArr: [],
      tagInput: '',
      timeZoneOffsetInHours: (-1) * (new Date()).getTimezoneOffset() / 60,
      trendingContent: CATEGORY_OF_USERS,
      trendingContentOffsetXVal: 0,
      trendingItemsLoadEnded: false,
      userFullName: '',
      ventureId: null,
      viewStyle: {
        marginHorizontal: 0,
        borderRadius: 0
      },
      yalies: []
    }
  },

  mixins: [TimerMixin],

  _handle: null,

  componentWillMount(){
    AsyncStorage.getItem('@AsyncStorage:Venture:account')
      .then((account:string) => {
        account = JSON.parse(account);

        if (account === null) {
          this.navigateToLoginPage();
          return;
        }

        this.setState({account, userFullName: account.name});

        this.setState({isLoggedIn: true, showTextInput: true, ventureId: account.ventureId});
        PushNotificationIOS.addEventListener('register', this._getDeviceToken);

        let firebaseRef = this.state.firebaseRef,
          eventsListRef = firebaseRef && firebaseRef.child('events'),
          usersListRef = firebaseRef && firebaseRef.child('users'),
          currentUserRef = usersListRef.child(this.state.ventureId || account.ventureId),
          chatCountRef = currentUserRef.child('chatCount'),
          firstSessionRef = currentUserRef.child('firstSession'),
          trendingItemsRef = firebaseRef && firebaseRef.child('trending'),
          chatRoomsRef = firebaseRef && firebaseRef.child('chat_rooms'),
          _this = this;

        // @hmm: ensure remote and local isOnline markers synced
        currentUserRef.child('status/isOnline').once('value', snapshot => {
          if(!snapshot.val()) {
            currentUserRef.child('status/isOnline').set(true);
          }
        });

        chatCountRef.on('value', snapshot => {
          _this.setState({chatCount: snapshot.val(), chatCountRef});
        });

        // @hmm: fetch first session object to update as tutorial gets completed
        firstSessionRef.on('value', snapshot => {
          _this.setState({firstSession: snapshot.val(), firstSessionRef});
        });

        trendingItemsRef.once('value', snapshot => {
            _this.setState({
              currentUserRef,
              events: snapshot.val() && snapshot.val().events && _.slice(snapshot.val().events, 0, 1),
              yalies: snapshot.val() && snapshot.val().yalies && _.slice(snapshot.val().yalies, 0, 3),
              showTrendingItems: true
            });
            LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
          }
        );

        //@hmm: readd current user to attendee lists of events he/she rsvp'd to
        currentUserRef.child('events').once('value', snapshot => {
          snapshot.val() && _.each(snapshot.val(), (event) => {
            if(event && event.id) {
                eventsListRef.child(`${event.id}/attendees/${this.state.ventureId}`).set(_.pick(this.state.account, 'firstName', 'name', 'picture', 'ventureId', 'bio', 'age', 'location'));
            }
          });
        });

        chatRoomsRef.set(null); //@hmm: reset chats
        PushNotificationIOS.setApplicationIconBadgeNumber(0);

        // @hmm: get current user location & save to firebase object
        // and make sure this fires before navigating away!
        if(this.state.ventureId) {
          PushNotificationIOS.requestPermissions();
          navigator.geolocation.getCurrentPosition(
            (currentPosition) => {
              currentUserRef.child(`location/coordinates`).set(currentPosition.coords);
              this.setState({
                currentUserLocationCoords: [currentPosition.coords.latitude,
                  currentPosition.coords.longitude]
              });
            },
            (error) => {
              AlertIOS.alert('Please Enable Location', 'Venture uses location to figure out who\'s near you. ' +
                'You can enable Location Services in Settings > Venture Yale > Location');
              currentUserRef.child(`location/coordinates`).set(DEFAULT_CITY_COORDINATES);
              this.setState({
                currentUserLocationCoords: [DEFAULT_CITY_COORDINATES.latitude,
                  DEFAULT_CITY_COORDINATES.longitude]
              });
            },
            {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000}
          );
        }

        AppStateIOS.addEventListener('change', this._handleAppStateChange);


        // @hmm: for now, persist chats and match data even after app restart

        // @hmm: modified clean up procedure (in case of reload): remove old chats and match requests
        currentUserRef.child('match_requests').once('value', snapshot => {
          snapshot.val() && _.each(snapshot.val(), (match) => {
            if (match && match._id && match.expireTime) {
              currentUserRef.child(`match_requests/${match._id}/expireTime`).set(null);
              usersListRef.child(`${match._id}/match_requests/${account.ventureId}/expireTime`).set(null);
            }
            if (match && match.chatRoomId) {
              chatRoomsRef.child(match.chatRoomId).set(null)
            }
          });
        });

        // @hmm: remove old event invite matches
        currentUserRef.child('event_invite_match_requests').once('value', snapshot => {
          snapshot.val() && _.each(snapshot.val(), (match) => {
            if (match && match._id && match.expireTime) {
              currentUserRef.child(`event_invite_match_requests/${match._id}/expireTime`).set(null);
              usersListRef
                .child(`${match._id}/event_invite_match_requests/${account.ventureId}/expireTime`)
                .set(null);
            }
            if (match && match.chatRoomId) {
              chatRoomsRef.child(match.chatRoomId).set(null)
            }
          });
        });
      })
      .catch((error) => console.log(error.message))
      .done();

    if (this.state.ventureId && this.state.currentUserLocationCoords === null) {
      navigator.geolocation.getCurrentPosition(
        (currentPosition) => {
          this.setState({
            currentUserLocationCoords: [currentPosition.coords.latitude,
              currentPosition.coords.longitude]
          });
        },
        (error) => {
          // @hmm: no need to call Alert.IOS again since it was called before
          this.setState({
            currentUserLocationCoords: [DEFAULT_CITY_COORDINATES.latitude,
              DEFAULT_CITY_COORDINATES.longitude]
          });
        },
        {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000}
      );
    }

    AsyncStorage.getItem('@AsyncStorage:Venture:currentUser:friendsAPICallURL')
      .then((friendsAPICallURL) => friendsAPICallURL)
      .then((friendsAPICallURL) => {
        AsyncStorage.getItem('@AsyncStorage:Venture:currentUserFriends')
          .then((currentUserFriends) => {

            currentUserFriends = JSON.parse(currentUserFriends);

            if (currentUserFriends) {
              this.setState({currentUserFriends});
            }

            else {
              AsyncStorage.getItem('@AsyncStorage:Venture:isOnline')
                .then((isOnline) => {
                  if (isOnline === 'true') {
                    fetch(friendsAPICallURL)
                      .then(response => response.json())
                      .then(responseData => {

                        AsyncStorage.setItem('@AsyncStorage:Venture:currentUserFriends',
                          JSON.stringify(responseData.data))
                          .catch(error => console.log(error.message))
                          .done();

                        this.setState({currentUserFriends: responseData.data});
                      })
                      .done();
                  }
                })
                .done()
            }
          })
          .catch(error => console.log(error.message))
          .done();
      })
      .catch(error => console.log(error.message))
      .done();

    // PushNotificationIOS.addEventListener('notification', this._onNotification);
  },

  componentWillUnmount() {
    AppStateIOS.removeEventListener('change', this._handleAppStateChange);
    this.state.firebaseRef && this.state.firebaseRef.off();
    // PushNotificationIOS.removeEventListener('notification', this._onNotification);
    PushNotificationIOS.removeEventListener('register', this._getDeviceToken);
    this.state.firstSessionRef && this.state.firstSessionRef.off();
    this.state.chatCountRef && this.state.chatCountRef.off();
  },

  animateViewLayout(text:string) {
    this.setState({
      viewStyle: {
        borderRadius: text.length ? 10 : 0
      }
    });
    if (!text.length) this.setState({showAddInfoBox: false});
  },

  _createTrendingItem(type, uri, i) {
    if (type === 'user') return (
      <TouchableOpacity key={i} onPress={() => {
                this._handleTrendingContentChange(': ' + uri.substring(uri.lastIndexOf("/")+1,uri.lastIndexOf("%")))
            }} style={styles.trendingItem}>
        <Image
          onLoadEnd={() => {
                        // @hmm: reset trending content title to yalies when image loads
                        this.setState({trendingContent: 'YALIES'})
                        !this.state.trendingItemsLoadEnded && this.setState({trendingItemsLoadEnded: true});
                    }}
          style={styles.trendingUserImg}
          source={{uri}}/>
      </TouchableOpacity>
    );

    // TODO: View for now but eventually TouchableOpacity
    return (
      <View key={i} onPress={() => {
                    /* this.props.navigator.push({
                    title: 'Events',
                    component: TabBarLayout,
                    passProps: {
                      currentUserFriends: this.state.currentUserFriends,
                      currentUserLocationCoords: this.state.currentUserLocationCoords,
                      firebaseRef: this.state.firebaseRef,
                      firstSession: this.state.firstSession,
                      selectedTab: 'events',
                      ventureId: this.state.ventureId
                    }}); */
            }} style={styles.trendingItem}>
        <Image style={styles.trendingEventImg} source={{uri}}/>
      </View>
    )

  },

  _createTag(tag:string) {
    return (
      <TouchableOpacity onPress={() => {
                            this.setState({tagsArr: _.remove(this.state.tagsArr,
                                (tagVal) => {
                                return tagVal !== tag;
                                }
                            )});
                        }} style={styles.tag}><Text
        style={styles.tagText}>{tag}</Text>
      </TouchableOpacity>
    )
  },

  _getDeviceToken(token) {
    if(!token) return;

    let url = "http://45.55.201.172:9999/ventureparseserver";
    url += "/installations";

    DeviceUUID.getUUID().then((uuid) => {
      fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'X-Parse-Application-Id': PARSE_APP_ID,
          'Content-Type': 'application/json',
        },
        body: `{"deviceType": "ios","deviceToken": "${token}", "appName": "Venture Yale", "installationId": "${uuid}", "ventureId":"${this.state.ventureId}", "channels": ["yale-ios-users", "${this.state.ventureId}", "${this.state.userFullName}"]}`
      })
        .then(response => {
          console.log(JSON.stringify(response))
        })
        .catch(error => console.log(error))
    });
  },

  _getTimeString(date) {
    var t = date.toLocaleTimeString();
    t = t.replace(/\u200E/g, ''); // remove left-to-right marks
    t = t.replace(/^([^\d]*\d{1,2}:\d{1,2}):\d{1,2}([^\d]*)$/, '$1$2');
    t = t.substr(0, t.length - 4); // @hmm: get rid of time zone

    if (this.state.hasIshSelected) return t.split(' ')[0] + '-ish ' + t.split(' ')[1]; // e.g. 9:10ish PM
    return t;
  },

  _handleAppStateChange(currentAppState) {
    this.setState({currentAppState});

    if (currentAppState === 'background') {
      this.state.currentUserRef && this.state.currentUserRef.child('status/appState').set('background');
      this.refs[ACTIVITY_TITLE_INPUT_REF] && this.refs[ACTIVITY_TITLE_INPUT_REF].blur();
    }

    if (currentAppState === 'active') {
      this.state.currentUserRef && this.state.currentUserRef.child('status/appState').set('active');
      navigator.geolocation.getCurrentPosition(
        (currentPosition) => {
          this.state.currentUserRef && this.state.currentUserRef.child(`location/coordinates`)
          && this.state.currentUserRef.child(`location/coordinates`).set(currentPosition.coords);
          this.setState({
            currentUserLocationCoords: [currentPosition.coords.latitude,
              currentPosition.coords.longitude]
          });
        },
        (error) => {
          AlertIOS.alert('Please Enable Location', 'Venture uses location to figure out who\'s near you. ' +
            'You can enable Location Services in Settings > Venture Yale > Location');
          this.state.currentUserRef && this.state.currentUserRef.child(`location/coordinates`)
          && this.state.currentUserRef.child(`location/coordinates`).set(DEFAULT_CITY_COORDINATES);
          this.setState({
            currentUserLocationCoords: [DEFAULT_CITY_COORDINATES.latitude,
              DEFAULT_CITY_COORDINATES.longitude]
          });
        },
        {enableHighAccuracy: true, timeout: 40000, maximumAge: 1000}
      );

      // @hmm: log user back into firebase if they're not already logged in
      // should apply to entire app bc home page never unmounts
      let authData, ref = new Firebase('https://ventureappinitial.firebaseio.com/');
      authData = ref.getAuth();
      if(!authData) {
        AsyncStorage.getItem('@AsyncStorage:Venture:authToken')
          .then((authToken) => {
            ref.authWithOAuthToken("facebook", authToken, function(error, authData) {
              if (error) {
                console.log("Login Failed!", error);
              } else {
                console.log("Authenticated successfully with payload: "+JSON.stringify(authData));
              }
            });
          })
          .catch((error) => console.log(error.message))
          .done(() => ref.off());
      }

      this.state.chatCountRef && this.state.chatCountRef.once('value', snapshot => {
          this.setState({chatCount: snapshot.val()});
        });
    }
  },

  _handleTrendingContentChange(trendingContent) {
    this.setState({trendingContent})
  },

  navigateToLoginPage() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.linear);
    this.props.navigator.replace({title: 'Login', component: LoginPage});
  },

  _onBlur() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    this.setState({
      hasKeyboardSpace: false,
      showAddInfoButton: true,
      showSubmitActivityIcon: !!this.state.activityTitleInput,
      showTextInput: true
    });
  },

  onDateChange(date): void {
    this.setState({date: date});
  },

  _onFocus() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    this.setState({hasKeyboardSpace: true, showAddInfoButton: false, showSubmitActivityIcon: false, showTextInput: false});
  },

  /*
  // @hmm: No need for these until RN supports background tasks
  _onNotification(notification) {
    PushNotificationIOS.presentLocalNotification({
      alertBody: notification.getMessage()
    })
  },

  _sendNotification(details) {
      require('RCTDeviceEventEmitter').emit('remoteNotificationReceived', {
        aps: {
          alert: details.alertBody,
          badge: '+1',
          sound: 'default',
          category: 'VENTURE'
        }
      });
  },
  */

  onSubmitActivity() {
    let activityTitleInput = (this.state.activityTitleInput),
      activityPreferenceChange = {
        title: activityTitleInput + '?',
        tags: this.state.tagsArr,
        status: this.state.activeTimeOption.capitalize(),
        start: {
          time: (this.state.activeTimeOption === 'specify' ? this._getTimeString(this.state.date) : ''),
          dateTime: this.state.date,
          timeZoneOffsetInHours: this.state.timeZoneOffsetInHours
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      firebaseRef = this.state.firebaseRef;
    if (!firebaseRef) {
      firebaseRef = new Firebase('https://ventureappinitial.firebaseio.com/');
      this.setState({firebaseRef});
    }

    firebaseRef.child(`users/${this.state.ventureId}/activityPreference`).set(activityPreferenceChange);
    this.props.navigator.push({
      title: 'Users',
      component: TabBarLayout,
      passProps: {
        currentUserFriends: this.state.currentUserFriends,
        currentUserLocationCoords: this.state.currentUserLocationCoords,
        firebaseRef: this.state.firebaseRef,
        firstSession: this.state.firstSession,
        selectedTab: 'users',
        ventureId: this.state.ventureId
      }
    });

    this.refs[ACTIVITY_TITLE_INPUT_REF].blur();
  },

  _roundDateDownToNearestXMinutes(date, num) {
    var coeff = 1000 * 60 * num;
    return new Date(Math.floor(date.getTime() / coeff) * coeff);
  },

  render() {
    let activityTitleInput,
      addInfoBox,
      addInfoButton,
      content,
      isAtScrollViewStart = this.state.contentOffsetXVal === 0,
      submitActivityIcon,
      tagSelection,
      trendingItemsCarousel;

    activityTitleInput = (
      <View onLayout={() => LayoutAnimation.configureNext(LayoutAnimation.Presets.spring)}>
        <TextInput
          ref={ACTIVITY_TITLE_INPUT_REF}
          autoCapitalize='none'
          autoCorrect={false}
          onChangeText={(text) => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                        this.animateViewLayout(text);

                        // @hmm: applies for emojis too, dont use maxLength prop just check manually
                        if(text.length > MAX_TEXT_INPUT_VAL_LENGTH) return;
                        if(!text) this.setState({showTimeSpecificationOptions: false});
                        this.setState({activityTitleInput: text.toUpperCase(), showSubmitActivityIcon: !!text});
                    }}
          placeholder={(this.state.firstSession && this.state.trendingItemsLoadEnded ? 'Type your activity here!' : 'What do you want to do?')}
          placeholderTextColor={'rgba(255,255,255,1.0)'}
          returnKeyType='done'
          style={[styles.activityTitleInput, this.state.viewStyle]}
          value={this.state.activityTitleInput}/>
      </View>
    );

    addInfoButton = (
      <Animatable.View
        ref="addInfoButton"
        onLayout={() => {
          if(this.state.firstSession && !this.state.firstSession.hasSeenAddInfoButtonTutorial) {
            this._handle = this.setInterval(() => this.refs.addInfoButton && this.refs.addInfoButton.tada(1000), 2000);
          }
        }}
        style={[styles.addInfoButtonContainer, {bottom: (this.state.showSubmitActivityIcon
                && this.state.showAddInfoBox ? height/10.4 : height/11.5 )}, (width < 420 ? {} : {bottom: (this.state.showSubmitActivityIcon
                && this.state.showAddInfoBox ? -(height/88) : -(height/89) )}), (width < 375 ? {bottom: (this.state.showSubmitActivityIcon
                && this.state.showAddInfoBox ? height/7.2 : height/11.5  )} : {})]}>
        <TouchableOpacity
          activeOpacity={0.4}
          onPress={() => {
                            this.refs[ACTIVITY_TITLE_INPUT_REF].blur();

                            InteractionManager.runAfterInteractions(() => {
                              LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                              this.setState({activeTimeOption: 'now', date: new Date(),
                              showAddInfoBox: !this.state.showAddInfoBox, tagInput: '', tags: []});

                              // @hmm: disable add info button tutorial
                              if(this.state.firstSession && !this.state.firstSession.hasSeenAddInfoButtonTutorial) {

                                AlertIOS.alert(
                                  'Add More Info!',
                                  'Tap the (+) icon to add more information about your activity. Set a time, and add a tag that users can search.'
                                );

                                this.clearInterval(this._handle);

                                this.setState({firstSession:{hasSeenAddInfoButtonTutorial: true}});
                                // @hmm: update remote Firebase obj prop
                                this.state.currentUserRef.child('firstSession/hasSeenAddInfoButtonTutorial').set(true);

                                // @hmm: ensure it's cleaned up
                                if(this._handle) this.clearInterval(this._handle);
                              }
                            });
                        }}>
          <Icon
            name={"ion|" + (this.state.showAddInfoBox ? 'chevron-up' : 'ios-plus')}
            size={ADD_INFO_BUTTON_SIZE}
            color='#fff'
            style={{width: ADD_INFO_BUTTON_SIZE, height: ADD_INFO_BUTTON_SIZE}}
            />
        </TouchableOpacity>
      </Animatable.View>
    );

    if (this.state.showTimeSpecificationOptions)
      content = (
        <View style={styles.timeSpecificationOptions}>
          <DatePickerIOS
            date={this.state.date}
            mode="time"
            timeZoneOffsetInMinutes={this.state.timeZoneOffsetInHours * 60}
            onDateChange={this.onDateChange}
            minuteInterval={5}
            style={styles.timeSpecificationDatePicker}/>
          <View style={styles.timeSpecificationButtons}>
            <DynamicTimeSelectionIcon
              selected={false}
              caption='done'
              captionStyle={styles.captionStyle}
              onPress={() => this.setState({showTimeSpecificationOptions: false})}/>
            <DynamicCheckBoxIcon
              selected={this.state.hasIshSelected}
              caption='-ish'
              captionStyle={styles.captionStyle}
              onPress={() => this.setState({hasIshSelected: !this.state.hasIshSelected})}/>
          </View>
        </View>
      );
    else
      content = (
        <View style={styles.addTimeInfoContainer}>
          <ScrollView
            automaticallyAdjustContentInsets={false}
            canCancelContentTouches={false}
            centerContent={true}
            contentContainerStyle={{flex: 1, flexDirection: 'row', width: width*1.18, alignItems: 'center'}}
            contentOffset={{x: this.state.contentOffsetXVal, y: 0}}
            decelerationRate={0.7}
            horizontal={true}
            directionalLockEnabled={true}
            style={[styles.scrollView, styles.horizontalScrollView, {paddingTop: 10}]}>
            <DynamicCheckBoxIcon
              selected={this.state.activeTimeOption === 'now'}
              caption='now'
              captionStyle={styles.captionStyle}
              color='#7cff9d'
              onPress={() => this.setState({activeTimeOption: 'now', hasSpecifiedTime: false})}/>
            <DynamicCheckBoxIcon
              selected={this.state.activeTimeOption === 'later'}
              caption='later'
              captionStyle={styles.captionStyle}
              color='#ffd65c'
              onPress={() => this.setState({activeTimeOption: 'later', hasSpecifiedTime: false})}/>
            <DynamicTimeSelectionIcon
              selected={this.state.activeTimeOption === 'specify'}
              caption={this.state.hasSpecifiedTime ?
                            this._getTimeString(this._roundDateDownToNearestXMinutes(this.state.date, 5)) : 'specify'}
              captionStyle={styles.captionStyle}
              onPress={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                            this.setState({hasSpecifiedTime: true, showTimeSpecificationOptions: true});
                            this.setState({activeTimeOption: 'specify'})
                        }}/>
          </ScrollView>
          <View style={[styles.scrollbarArrow, (isAtScrollViewStart ? {right: 5} : {left: 5})]}>
            <ChevronIcon
              size={28}
              style={{top: height/80}}
              direction={isAtScrollViewStart ? 'right' : 'left'}
              onPress={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                            this.setState({contentOffsetXVal: (isAtScrollViewStart ? width/2.65 : 0)})
                            }}/>
          </View>
        </View>
      );

    //@hmm: platform differences will have this format
    if (Platform.OS === 'ios') {
      submitActivityIcon = (
        <View style={[styles.submitActivityIconContainer]}>
          <SubmitActivityIcon
            onPress={this.onSubmitActivity}/>
        </View>
      );
    } else {
      submitActivityIcon = <View />;
    }

    tagSelection = (
      <View style={styles.tagSelection}>
        <TextInput
          ref={TAG_SELECTION_INPUT_REF}
          onFocus={this._onFocus}
          onBlur={this._onBlur}
          autoCapitalize='none'
          autoCorrect={false}
          onChangeText={(text) => {
                        // @hmm: applies for emojis
                        if(text.length > MAX_TEXT_INPUT_VAL_LENGTH) return;
                        this.setState({tagInput: text});
                    }}
          onSubmitEditing={() => {
                        let tagsArr = this.state.tagsArr,
                            text = this.state.tagInput;

                        // @hmm: check that tag isn't already added, that tag != all whitespace, & that tag count <= 5
                        if(tagsArr.indexOf(text) < 0 && !(text.replace(/^\s+|\s+$/g, '').length == 0)
                        && tagsArr.length <= 5) {
                        tagsArr.push(text);
                        }
                        this.setState({tagsArr, tagInput: ''});
                    }}
          placeholder={'Type a tag and submit. Tap a tag to delete it.'}
          placeholderTextColor={'rgba(0,0,0,0.8)'}
          returnKeyType='done'
          style={styles.tagsInputText}
          value={this.state.tagInput}/>
        <ScrollView
          automaticallyAdjustContentInsets={false}
          centerContent={true}
          horizontal={true}
          directionalLockEnabled={true}
          showsHorizontalScrollIndicator={true}
          style={[styles.scrollView, {height: 20}]}>
          {this.state.tagsArr.map(this._createTag)}
        </ScrollView>
      </View>
    );

    let users = this.state.yalies,
      events = this.state.events,
      len = users.length + events.length, slide1, slide2, slide3, slide4, swiper;

    if(len >= 3) {
      slide1 = (
        <View style={styles.slide}>
          {users && _.slice(users, 0, 3) && _.slice(users, 0, 3).map(this._createTrendingItem.bind(null, 'user'))}
        </View>
      );
    }

    if(len === 4) {
      slide2 = (
        <View style={styles.slide}>
          {events && _.slice(events, 0, 1) && _.slice(events, 0, 1).map(this._createTrendingItem.bind(null, 'event'))}
        </View>
      )
    }

    if(len === 5) {
      slide3 = (
        <View style={styles.slide}>
          {events && _.slice(events, 1, 2) && _.slice(events, 1, 2).map(this._createTrendingItem.bind(null, 'event'))}
        </View>
      )
    }

    if(len === 6) {
      slide4 = (
        <View style={styles.slide}>
          {events && _.slice(events, 2, 3) && _.slice(events, 2, 3).map(this._createTrendingItem.bind(null, 'event'))}
        </View>
      )
    }

    swiper = (len === 4  ?
      <Swiper ref={TRENDING_ITEMS_CAROUSEL_REF}
              buttonWrapperStyle={styles.buttonWrapperStyle}
              height={100}
              index={this.state.trendingContent !== 'EVENTS' ? 0 : 1} // this works!
              width={width/1.2}
              onMomentumScrollEnd={(e, state, context) => {
                console.log('state: ' + JSON.stringify(state) + ',\n' + JSON.stringify(context.state));
                this.setState({trendingContent: (this.state.trendingContent !== 'EVENTS' ? 'EVENTS' : CATEGORY_OF_USERS)});
              }}
              showsButtons={true}
              showsPagination={false}
              loop={false}
              prevButton={
                    <ChevronIcon
                      isStatic={true}
                      size={height/20}
                      direction={'left'}
                      style={{}}/>
                  }
              nextButton={<ChevronIcon
                      isStatic={true}
                      size={height/20}
                      direction={'right'}
                      style={{}}/>}
              style={styles.swiper}>
        {slide1}
        {slide2}
      </Swiper>

      :

      (
        len === 6 ?
          <Swiper ref={TRENDING_ITEMS_CAROUSEL_REF}
                  buttonWrapperStyle={styles.buttonWrapperStyle}
                  height={100}
                  index={this.state.trendingContent !== 'EVENTS' ? 0 : 1} // this works!
                  width={width/1.2}
                  onMomentumScrollEnd={(e, state, context) => {
                console.log('state: ' + JSON.stringify(state) + ',\n' + JSON.stringify(context.state));
                // @hmm: use 'EVENTS' as comparison bc trendingContent is either 'EVENTS', 'YALIES', or '{TRENDING_YALIE_FIRST_NAME}'
                this.setState({trendingContent: (this.state.trendingContent !== 'EVENTS' ? 'EVENTS' : CATEGORY_OF_USERS)});
              }}
                  showsButtons={true}
                  showsPagination={false}
                  loop={false}
                  prevButton={
                    <ChevronIcon
                      isStatic={true}
                      size={height/20}
                      direction={'left'}
                      style={{}}/>
                  }
                  nextButton={<ChevronIcon
                      isStatic={true}
                      size={height/20}
                      direction={'right'}
                      style={{}}/>}
                  style={styles.swiper}>
            {slide1}
            {slide2}
            {slide3}
            {slide4}
          </Swiper>
          :
          <Swiper ref={TRENDING_ITEMS_CAROUSEL_REF}
                  buttonWrapperStyle={styles.buttonWrapperStyle}
                  height={100}
                  index={this.state.trendingContent !== 'EVENTS' ? 0 : 1} // this works!
                  width={width/1.2}
                  onMomentumScrollEnd={(e, state, context) => {
                console.log('state: ' + JSON.stringify(state) + ',\n' + JSON.stringify(context.state));
                this.setState({trendingContent: (this.state.trendingContent !== 'EVENTS' ? 'EVENTS' : CATEGORY_OF_USERS)});
              }}
                  showsButtons={true}
                  showsPagination={false}
                  loop={false}
                  prevButton={
                    <ChevronIcon
                      isStatic={true}
                      size={height/20}
                      direction={'left'}
                      style={{}}/>
                  }
                  nextButton={<ChevronIcon
                      isStatic={true}
                      size={height/20}
                      direction={'right'}
                      style={{}}/>}
                  style={styles.swiper}>
            {slide1}
            {slide2}
            {slide3}
          </Swiper>
      ));

    trendingItemsCarousel = (
      <Animatable.View ref="trendingItemsCarousel" style={styles.trendingItemsCarousel}>
        <Title>TRENDING <Text style={{color: '#ee964b'}}>{this.state.trendingContent}</Text></Title>
        {swiper}
      </Animatable.View>
    );

    // @hmm: keep addInfoBox code down here, since we need to have previously assigned content and tagSelection children
    addInfoBox = (
      <View
        style={[styles.addInfoBox, {bottom: (this.state.hasKeyboardSpace ? height/3 : height / 35)}]}>
        <View style={{top: 5}}><Title>WHEN?</Title></View>
        {content}
        {tagSelection}
      </View>
    );

    return (
      <VentureAppPage>
        <Image
          defaultSource={require('../../img/home_background.jpg')}
          source={require('../../img/home_background.jpg')}
          onLoad={() => {
                        this.setState({ready: true});
                    }}
          style={styles.backdrop}>
          {this.state.isLoggedIn && this.state.ready ?
            <View style={{backgroundColor: 'transparent'}}>
              <Header>
                <ProfilePageIcon
                  style={{bottom: height/19, right: (width < 420 ? width/12 : 0)}}
                  onPress={() => {
                                    this.props.navigator.push({title: 'Profile', component: TabBarLayout,
                                    passProps: {
                                    currentUserFriends: this.state.currentUserFriends,
                                    currentUserLocationCoords: this.state.currentUserLocationCoords,
                                    firebaseRef: this.state.firebaseRef,
                                    firstSession: this.state.firstSession,
                                    selectedTab: 'profile',
                                    ventureId: this.state.ventureId}});
                                 }}/>
                <ChatsListPageIcon
                  chatCount={this.state.showTextInput && this.state.trendingItemsLoadEnded ? this.state.chatCount : 0}
                  style={{bottom: height/19, left: (width < 420 ? width/12 : 0)}}
                  onPress={() => {
                                    this.props.navigator.push({title: 'Chats', component: TabBarLayout,
                                    passProps: {
                                      currentUserFriends: this.state.currentUserFriends,
                                      currentUserLocationCoords: this.state.currentUserLocationCoords,
                                      firebaseRef: this.state.firebaseRef,
                                      firstSession: this.state.firstSession,
                                      selectedTab: 'chats',
                                      ventureId: this.state.ventureId
                                    }});
                                   }}/>
              </Header>
              <BrandLogo
                onLayout={() => {
                                    this.setState({brandLogoVisible: true});
                                    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                                    }
                                    }
                logoContainerStyle={styles.logoContainerStyle}/>
              {this.state.showTextInput && this.state.brandLogoVisible ? activityTitleInput : <View />}
              {this.state.showSubmitActivityIcon ? submitActivityIcon : <View />}
              {this.state.showAddInfoButton && !this.state.showTimeSpecificationOptions
              && this.state.activityTitleInput ? addInfoButton :
                <View />}
            </View>
            : <View />}
          {this.state.showAddInfoBox && this.state.activityTitleInput && this.state.isLoggedIn
          && this.state.ready ? addInfoBox :
            <View/>}
          {this.state.showTrendingItems && !this.state.showAddInfoBox && this.state.isLoggedIn
          && this.state.ready && this.state.brandLogoVisible ? trendingItemsCarousel :
            <View/>}
        </Image>
      </VentureAppPage>
    );
  }
});

const styles = StyleSheet.create({
  activityTitleInput: {
    height: 52,
    width,
    textAlign: 'center',
    fontSize: height / 23,
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.7)',
    fontFamily: 'AvenirNextCondensed-UltraLight',
    marginBottom: height/20,
    top: (width < 420 ? 0 : height/10)
  },
  addInfoBox: {
    position: 'absolute',
    width: width / 1.2,
    height: height/3,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    marginHorizontal: (width - (width / 1.2)) / 2,
    padding: 2
  },
  addInfoButton: {},
  addInfoButtonContainer: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    width: width,
    marginTop: height / 30
  },
  addTimeInfoContainer: {},
  backdrop: {
    flex: 1,
    width,
    height,
    alignItems: 'center',
    paddingTop: 10
  },
  captionStyle: {
    color: '#fff',
    fontFamily: 'AvenirNextCondensed-Regular'
  },
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  horizontalScrollView: {
    height: 85
  },
  logoContainerStyle: {
    bottom: height / 28,
  },
  scrollbarArrow: {
    position: 'absolute',
    bottom: height / 28
  },
  scrollView: {
    backgroundColor: 'rgba(0,0,0,0.008)'
  },
  slide: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    width: width / 1.2,
  },
  submitActivityIconContainer: {
    bottom: (width < 420 ? (width < 375 ? height/8.5 : (height >= 736 ? height/10 : height/9.3)) : -(height/80)),
    right: width / 28,
    alignSelf: 'flex-end'
  },
  tag: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: width / 10,
    paddingHorizontal: width / 80,
    marginHorizontal: width / 70,
    paddingVertical: width / 300,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.4)',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    top: width / 90,
    height: width / 15
  },
  tagsInputText: {
    top: 5,
    borderWidth: 0.5,
    borderColor: '#0f0f0f',
    backgroundColor: 'rgba(255,255,255,0.4)',
    flex: 1,
    padding: TAG_TEXT_INPUT_PADDING,
    height: height / 158,
    fontSize: height / 52,
    color: '#000',
    textAlign: 'center',
    fontFamily: 'AvenirNextCondensed-Regular',
    borderRadius: 5,
    bottom: 8
  },
  tagSelection: {
    marginTop: 16,
    height: height / 6.6,
    paddingTop: 19,
    paddingHorizontal: 25,
    bottom: 5
  },
  tagText: {
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'AvenirNextCondensed-Medium'
  },
  timeSpecificationOptions: {
    flex: 1,
    flexDirection: 'column'
  },
  timeSpecificationButtons: {
    top: 20,
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  timeSpecificationDatePicker: {
    top: 10,
    height: 40,
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)'
  },
  title: {
    color: '#fff',
    fontFamily: 'AvenirNextCondensed-Regular',
    fontSize: 20,
    textAlign: 'center',
    paddingTop: 5,
    marginBottom: height/180
  },
  trendingEventImg: {
    width: width / 2,
    left: width/134,
    height: 64,
    resizeMode: 'contain',
    top: width < 420 ? height/80 : 0
  },
  trendingItem: {
    borderRadius: 3,
  },
  trendingItemsCarousel: {
    position: 'absolute',
    bottom: height / 35,
    width: width / 1.18,
    alignSelf: 'center',
    justifyContent: 'center',
    marginHorizontal: (width - (width / 1.2)) / 2,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 5,
  },
  trendingUserImg: {
    width: (width < 420 ? width / 6 : width/10),
    height: (width < 420 ? width / 6 : width/10),
    resizeMode: 'contain',
    backgroundColor: '#040A19',
    borderRadius: (width < 420 ? width / 12 : width/20),
    marginHorizontal: width/48,
    top: width < 375 ? height/27 : (width < 420 ? height/60 : 0)
  }
});

module.exports = HomePage;


