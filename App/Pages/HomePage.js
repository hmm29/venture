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

var React = require('react-native');

var {
    AlertIOS,
    AppStateIOS,
    AsyncStorage,
    Component,
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
    } = React;

var _ = require('lodash');
var Animatable = require('react-native-animatable');
var Dimensions = require('Dimensions');
var Firebase = require('firebase');
import {Icon, } from 'react-native-icons';
var SubmitActivityIcon = require('../Partials/Icons/SubmitActivityIcon');
var TabBarLayout = require('../NavigationLayouts/TabBarLayout.ios');

var ChatsListPageIcon = require('../Partials/Icons/NavigationButtons/ChatsListPageIcon');
var Header = require('../Partials/Header');
var BrandLogo = require('../Partials/BrandLogo');
var LoginPage = require('../Pages/LoginPage');
var ProfilePageIcon = require('../Partials/Icons/NavigationButtons/ProfilePageIcon');

var DynamicCheckBoxIcon = require('../Partials/Icons/DynamicCheckBoxIcon');
var ChevronIcon = require('../Partials/Icons/ChevronIcon');
var DynamicTimeSelectionIcon = require('../Partials/Icons/DynamicTimeSelectionIcon');
var TimerMixin = require('react-timer-mixin');
var VentureAppPage = require('./Base/VentureAppPage');

var ADD_INFO_BUTTON_SIZE = 28;
var ACTIVITY_TEXT_INPUT_PADDING = 5;
var ACTIVITY_TITLE_INPUT_REF = 'activityTitleInput'
var LOGO_WIDTH = 200;
var LOGO_HEIGHT = 120;
var MAX_TEXT_INPUT_VAL_LENGTH = 15;
var NEXT_BUTTON_SIZE = 28;
var TAG_SELECTION_INPUT_REF = 'tagSelectionInput';
var TAG_TEXT_INPUT_PADDING = 3;

var {height, width} = Dimensions.get('window');

var HomePage = React.createClass({
    getInitialState() {
        return {
            activeTimeOption: 'now',
            activityTitleInput: '',
            brandLogoVisible: false,
            contentOffsetXVal: 0,
            currentAppState: AppStateIOS.currentState,
            currentUserLocationCoords: null,
            date: new Date(),
            events: [],
            firebaseRef: new Firebase('https://ventureappinitial.firebaseio.com/'),
            hasIshSelected: false,
            hasKeyboardSpace: false,
            hasSpecifiedTime: false,
            isLoggedIn: false,
            ready: false,
            showAddInfoBox: false,
            showAddInfoButton: true,
            showNextButton: false,
            showTextInput: false,
            showTimeSpecificationOptions: false,
            showTrendingItems: false,
            tagsArr: [],
            tagInput: '',
            timeZoneOffsetInHours: (-1) * (new Date()).getTimezoneOffset() / 60,
            trendingContent: 'YALIES',
            trendingContentOffsetXVal: 0,
            ventureId: '',
            viewStyle: {
                marginHorizontal: 0,
                borderRadius: 0
            },
            yalies: []
        }
    },

    mixins: [TimerMixin],


    componentWillMount(){
        AsyncStorage.getItem('@AsyncStorage:Venture:account')
            .then((account:string) => {
                account = JSON.parse(account);

                if (account === null) {
                    this.navigateToLoginPage();
                    return;
                }

                this.setState({isLoggedIn: true, showTextInput: true});

                let firebaseRef = this.state.firebaseRef || new Firebase('https://ventureappinitial.firebaseio.com/'),
                    usersListRef = firebaseRef && firebaseRef.child('users'),
                    currentUserRef = usersListRef.child(account.ventureId),
                    trendingItemsRef = firebaseRef && firebaseRef.child('trending'),
                    chatRoomsRef = firebaseRef && firebaseRef.child('chat_rooms'),
                    _this = this;

                currentUserRef.child(`chatCount`).set(0);

                trendingItemsRef.once('value', snapshot => {
                        _this.setState({
                            currentUserRef,
                            events: snapshot.val() && snapshot.val().events && _.slice(snapshot.val().events, 0, 1),
                            yalies: snapshot.val() && snapshot.val().yalies && _.slice(snapshot.val().yalies, 0, 3),
                            showTrendingItems: true
                        })
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                    }
                );

                //@hmm: get current user location & save to firebase object
                // make sure this fires before navigating away!

                navigator.geolocation.getCurrentPosition(
                    (currentPosition) => {
                        currentUserRef.child(`location/coordinates`).set(currentPosition.coords);
                        this.setState({currentUserLocationCoords: [currentPosition.coords.latitude, currentPosition.coords.longitude]});
                    },
                    (error) => {
                        console.error(error);
                    },
                    {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000}
                );

                this.setState({ventureId: account.ventureId});
                AppStateIOS.addEventListener('change', this._handleAppStateChange);

                // @hmm: MODIFIED CLEAN UP (in case of reload): remove old match requests based on expireTime

                currentUserRef.child('match_requests').once('value', snapshot => {
                    snapshot.val() && _.each(snapshot.val(), (match) => {
                        if (match && match.expireTime) {
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
                        if (match && match.expireTime) {
                            currentUserRef.child(`event_invite_match_requests/${match._id}/expireTime`).set(null);
                            usersListRef.child(`${match._id}/event_invite_match_requests/${account.ventureId}/expireTime`).set(null);
                        }
                        if (match && match.chatRoomId) {
                            chatRoomsRef.child(match.chatRoomId).set(null)
                        }
                    });
                });

                // listener: for notifications when user receives a new request

                currentUserRef.child('match_requests').on('child_added', childSnapshot => {
                    childSnapshot.val() && childSnapshot.val()._id && firebaseRef.child(`users/${childSnapshot.val()._id}/firstName`).once('value', snapshot => {
                        if(childSnapshot.val() && (childSnapshot.val().status === 'received')) {
                            this._sendNotification(snapshot.val(), childSnapshot.val().status);
                        }
                    })
                });

                // listener: for notifications when user receives a new request

                currentUserRef.child('event_invite_match_requests').on('child_added', childSnapshot => {
                    childSnapshot.val() && childSnapshot.val()._id && firebaseRef.child(`users/${childSnapshot.val()._id}/firstName`).once('value', snapshot => {
                        if(childSnapshot.val() && (childSnapshot.val().status === 'received')) {
                            this._sendNotification(snapshot.val(), childSnapshot.val().status);
                        }
                    })
                });

                // listener: for notifications when match

                currentUserRef.child('match_requests').on('child_changed', childSnapshot => {
                    childSnapshot.val() && childSnapshot.val()._id && firebaseRef.child(`users/${childSnapshot.val()._id}/firstName`).once('value', snapshot => {
                        if (childSnapshot.val() && (childSnapshot.val().status === 'matched')) {
                            this._sendNotification(snapshot.val(), childSnapshot.val().status);
                        }
                    })
                });

                // listener: for notifications when match

                currentUserRef.child('event_invite_match_requests').on('child_changed', childSnapshot => {
                    childSnapshot.val() && childSnapshot.val()._id && firebaseRef.child(`users/${childSnapshot.val()._id}/firstName`).once('value', snapshot => {
                        if (childSnapshot.val() && (childSnapshot.val().status === 'matched')) {
                            this._sendNotification(snapshot.val(), childSnapshot.val().status);
                        }
                    })
                });


                // listener: decrease chat count when chat destroyed, only need this here once on users list and not in chats page
                chatRoomsRef.on('child_removed', function (oldChildSnapshot) {
                    // if old snapshot has current users id in it, then subtract one from current user chat count
                    if (oldChildSnapshot && oldChildSnapshot.val() && oldChildSnapshot.val()._id && (oldChildSnapshot.val()._id).indexOf(account.ventureId) > -1) {
                        firebaseRef.child(`users/${account.ventureId}/chatCount`).once('value', snapshot => {
                            alert('remove');
                            firebaseRef.child(`users/${account.ventureId}/chatCount`).set(snapshot.val()-1);
                            PushNotificationIOS.setApplicationIconBadgeNumber(snapshot.val()-1);
                        });
                    }
                });

                chatRoomsRef.on('child_added', function (childSnapshot) {
                    if (childSnapshot && childSnapshot.val() && childSnapshot.val()._id && (childSnapshot.val()._id).indexOf(account.ventureId) > -1) {
                        firebaseRef.child(`users/${account.ventureId}/chatCount`).once('value', snapshot => {
                            alert('add');
                            firebaseRef.child(`users/${account.ventureId}/chatCount`).set(snapshot.val() + 1);
                            PushNotificationIOS.setApplicationIconBadgeNumber(snapshot.val()+1);
                        });
                    }
                });

            })
            .catch((error) => console.log(error.message))
            .done();

        if (this.state.currentUserLocationCoords === null) {
            navigator.geolocation.getCurrentPosition(
                (currentPosition) => {
                    this.setState({currentUserLocationCoords: [currentPosition.coords.latitude, currentPosition.coords.longitude]});
                },
                (error) => {
                    console.error(error);
                },
                {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000}
            );
        }

        if(!this.state.firebaseRef) this.setState({firebaseRef: new Firebase('https://ventureappinitial.firebaseio.com/')});

        AsyncStorage.getItem('@AsyncStorage:Venture:currentUser:friendsAPICallURL')
            .then((friendsAPICallURL) => friendsAPICallURL)
            .then((friendsAPICallURL) => {
                AsyncStorage.getItem('@AsyncStorage:Venture:currentUserFriends')
                    .then((currentUserFriends) => {

                        currentUserFriends = JSON.parse(currentUserFriends);

                        if (currentUserFriends) {
                            this.setState({currentUserFriends});
                            // push notification when user's friend has joined the app

                            this.state.firebaseRef.child('users').on('child_added', childSnapshot => {
                                if(childSnapshot.val() && childSnapshot.val().firstName && _.findIndex(currentUserFriends, {firstName: childSnapshot.val().firstName}) > -1) {
                                    this._sendNotification(childSnapshot.val().firstName, 'joined');
                                }
                            });
                        }

                        else {
                            AsyncStorage.getItem('@AsyncStorage:Venture:isOnline')
                                .then((isOnline) => {
                                    if (isOnline === 'true') {
                                        fetch(friendsAPICallURL)
                                            .then(response => response.json())
                                            .then(responseData => {

                                                AsyncStorage.setItem('@AsyncStorage:Venture:currentUserFriends', JSON.stringify(responseData.data))
                                                    .catch(error => console.log(error.message))
                                                    .done();

                                                this.setState({currentUserFriends: responseData.data});
                                            })
                                            .then(() => {
                                                // push notification when user's friend has joined the app

                                                this.state.firebaseRef.child('users').on('child_added', childSnapshot => {
                                                    if(childSnapshot.val() && childSnapshot.val().firstName && _.findIndex(this.state.currentUserFriends, {firstName: childSnapshot.val().firstName}) > -1) {
                                                        this._sendNotification(childSnapshot.val().firstName, 'joined');
                                                    }
                                                });

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

        PushNotificationIOS.requestPermissions();
        PushNotificationIOS.addEventListener('notification', this._onNotification);
    },

    componentWillUnmount() {
        AppStateIOS.removeEventListener('change', this._handleAppStateChange);
        this.state.firebaseRef && this.state.firebaseRef.off();
        PushNotificationIOS.removeEventListener('notification', this._onNotification);
    },

    animateViewLayout(text:string) {
        this.setState({
            viewStyle: {
                borderRadius: text.length ? 10 : 0
            }
        });
    },

    _createTrendingItem(type, uri, i) {
        if (type === 'user') return (
            <TouchableOpacity key={i} onPress={() => {
                this._handleTrendingContentChange(' : ' + uri.substring(uri.lastIndexOf("/")+1,uri.lastIndexOf("%")))
            }} style={styles.trendingItem}>
                <Image
                    onLoadEnd={() => {
                        // reset trending content title to yalies when image loads
                        this.setState({trendingContent: 'YALIES'})
                    }}
                    style={styles.trendingUserImg}
                    source={{uri}}/>
            </TouchableOpacity>
        );

        return (
            <TouchableOpacity key={i} onPress={() => {
                    this.props.navigator.push({title: 'Events', component: TabBarLayout, passProps: {currentUserFriends: this.state.currentUserFriends, currentUserLocationCoords: this.state.currentUserLocationCoords, firebaseRef: this.state.firebaseRef, selectedTab: 'events', ventureId: this.state.ventureId}});
            }} style={styles.trendingItem}>
                <Image style={styles.trendingEventImg} source={{uri}}/>
            </TouchableOpacity>
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

    _getTimeString(date) {
        var t = date.toLocaleTimeString();
        t = t.replace(/\u200E/g, '');
        t = t.replace(/^([^\d]*\d{1,2}:\d{1,2}):\d{1,2}([^\d]*)$/, '$1$2');
        // @hmm: get rid of time zone
        t = t.substr(0, t.length - 4);

        if (this.state.hasIshSelected) return t.split(' ')[0] + '-ish ' + t.split(' ')[1]; // e.g. 9:10ish PM
        return t;
    },


    _handleAppStateChange(currentAppState) {
        this.setState({currentAppState});

        if(currentAppState === 'background') {
            this.refs[ACTIVITY_TITLE_INPUT_REF].blur();
        }

        if (currentAppState === 'active') {
            navigator.geolocation.getCurrentPosition(
                (currentPosition) => {
                    this.state.currentUserRef && this.state.currentUserRef.child(`location/coordinates`).set(currentPosition.coords);
                    this.setState({currentUserLocationCoords: [currentPosition.coords.latitude, currentPosition.coords.longitude]});
                },
                (error) => {
                    console.error(error);
                },
                {enableHighAccuracy: true, timeout: 40000, maximumAge: 1000}
            );
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
            showNextButton: !!this.state.activityTitleInput,
            showTextInput: true
        });
    },

    onDateChange(date): void {
        this.setState({date: date});
    },

    _onFocus() {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring)
        this.setState({hasKeyboardSpace: true, showAddInfoButton: false, showNextButton: false, showTextInput: false});
    },

    _onNotification(notification) {
        PushNotificationIOS.scheduleLocalNotification({
            fireDate: (new Date(new Date().getTime() + 5000)).getTime(),
            alertBody: notification.getMessage()
        })
    },

    onSubmitActivity() {
        let activityTitleInput = (this.state.activityTitleInput),
            activityPreferenceChange = {
                title: activityTitleInput + '?',
                tags: this.state.tagsArr,
                status: this.state.activeTimeOption.toUpperCase(),
                start: {
                    time: (this.state.activeTimeOption === 'specify' ? this._getTimeString(this.state.date) : ''),
                    dateTime: this.state.date,
                    timeZoneOffsetInHours: this.state.timeZoneOffsetInHours
                },
                createdAt: new Date(),
                updatedAt: new Date()
            },
            firebaseRef = this.state.firebaseRef;
        if(!firebaseRef) firebaseRef = new Firebase('https://ventureappinitial.firebaseio.com/');

        firebaseRef.child(`users/${this.state.ventureId}/activityPreference`).set(activityPreferenceChange);
        this.props.navigator.push({
            title: 'Users',
            component: TabBarLayout,
            passProps: {
                currentUserFriends: this.state.currentUserFriends,
                currentUserLocationCoords: this.state.currentUserLocationCoords,
                firebaseRef: this.state.firebaseRef,
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

    _sendNotification(userFirstName, action) {
        if(action === 'joined') {
            require('RCTDeviceEventEmitter').emit('remoteNotificationReceived', {
                aps: {
                    alert: `Your friend ${userFirstName} just joined Venture!`,
                    badge: '+1',
                    sound: 'default',
                    category: 'VENTURE'
                }
            });
        } else {
            require('RCTDeviceEventEmitter').emit('remoteNotificationReceived', {
                aps: {
                    alert: `${userFirstName} just ${(action === 'received' ? 'sent you an activity request' : 'accepted your activity request')} on Venture!`,
                    badge: '+1',
                    sound: 'default',
                    category: 'VENTURE'
                }
            });
        }
    },

    render() {
        let content,
            isAtScrollViewStart = this.state.contentOffsetXVal === 0,
            isAtTrendingScrollViewStart = this.state.trendingContentOffsetXVal === 0,
            tagSelection;

        let activityTitleInput = (
            <View onLayout={() => LayoutAnimation.configureNext(LayoutAnimation.Presets.spring)}>
                <TextInput
                    ref={ACTIVITY_TITLE_INPUT_REF}
                    autoCapitalize='none'
                    autoCorrect={false}
                    onChangeText={(text) => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                        this.animateViewLayout(text);

                        // applies for emojis too, dont use maxLength prop just check manually
                        if(text.length > MAX_TEXT_INPUT_VAL_LENGTH) return;
                        if(!text) this.setState({showTimeSpecificationOptions: false});
                        this.setState({activityTitleInput: text.toUpperCase(), showNextButton: !!text});
                    }}
                    placeholder={'What do you want to do?'}
                    placeholderTextColor={'rgba(255,255,255,1.0)'}
                    returnKeyType='done'
                    style={[styles.activityTitleInput, this.state.viewStyle, {marginTop: height/48}]}
                    value={this.state.activityTitleInput}/>
            </View>
        );

        let addInfoButton = (
            <View
                style={[styles.addInfoButtonContainer, {bottom: (this.state.showNextButton && this.state.showAddInfoBox ? height/20 : height/32 )}]}>
                <TouchableOpacity
                    activeOpacity={0.4}
                    onPress={() => {
                            this.refs[ACTIVITY_TITLE_INPUT_REF].blur();
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                            this.setState({activeTimeOption: 'now', date: new Date(), showAddInfoBox: !this.state.showAddInfoBox, tagInput: '', tags: []})
                        }}>
                    <Icon
                        name={"ion|" + (this.state.showAddInfoBox ? 'chevron-up' : 'ios-plus')}
                        size={ADD_INFO_BUTTON_SIZE}
                        color='#fff'
                        style={{width: ADD_INFO_BUTTON_SIZE, height: ADD_INFO_BUTTON_SIZE}}
                        />
                </TouchableOpacity>
            </View>
        );

        let submitActivityIcon;

        if (Platform.OS === 'ios') {
            submitActivityIcon = (
                <View style={styles.submitActivityIconContainer}>
                    <SubmitActivityIcon
                        onPress={this.onSubmitActivity}/>
                </View>
            );
        } else {
            submitActivityIcon = <View />;
        }

        let trendingItemsCarousel = (
            <Animatable.View ref="trendingItemsCarousel" style={styles.trendingItemsCarousel}>
                <Title>TRENDING <Text style={{color: '#ee964b'}}>{this.state.trendingContent}</Text></Title>
                <ScrollView
                    automaticallyAdjustContentInsets={false}
                    canCancelContentTouches={false}
                    contentOffset={{x: this.state.trendingContentOffsetXVal, y: 0}}
                    horizontal={true}
                    directionalLockEnabled={true}
                    showsHorizontalScrollIndicator={true}
                    style={[styles.scrollView, styles.horizontalScrollView, {marginTop: 10}]}>
                    {this.state.yalies && this.state.yalies.map(this._createTrendingItem.bind(null, 'user'))}
                    {this.state.events && this.state.events.map(this._createTrendingItem.bind(null, 'event'))}
                </ScrollView>
                <View
                    style={[styles.scrollbarArrow, {bottom: height / 13.5}, (isAtTrendingScrollViewStart ? {right: 5} : {left: 5})]}>
                    <ChevronIcon
                        color='rgba(255,255,255,0.8)'
                        size={25}
                        direction={isAtTrendingScrollViewStart ? 'right' : 'left'}
                        onPress={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                            this.setState({trendingContentOffsetXVal: (isAtTrendingScrollViewStart ? width / 1.31 : 0), trendingContent: (isAtTrendingScrollViewStart ? 'EVENTS' : 'YALIES')})
                            }}/>
                </View>
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
                        contentContainerStyle={{flex: 1, flexDirection: 'row', width: width * 1.18, alignItems: 'center'}}
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
                            caption={this.state.hasSpecifiedTime ? this._getTimeString(this._roundDateDownToNearestXMinutes(this.state.date, 5)) : 'specify'}
                            captionStyle={styles.captionStyle}
                            onPress={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                            this.setState({hasSpecifiedTime: true, showTimeSpecificationOptions: true});
                            this.setState({activeTimeOption: 'specify'})
                        }}/>
                    </ScrollView>
                    <View style={[styles.scrollbarArrow, (isAtScrollViewStart ? {right: 10} : {left: 10})]}>
                        <ChevronIcon
                            size={25}
                            direction={isAtScrollViewStart ? 'right' : 'left'}
                            onPress={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                            this.setState({contentOffsetXVal: (isAtScrollViewStart ? width/2.65 : 0)})
                            }}/>
                    </View>
                </View>
            );

        tagSelection = (
            <View style={styles.tagSelection}>
                <TextInput
                    ref={TAG_SELECTION_INPUT_REF}
                    onFocus={this._onFocus}
                    onBlur={this._onBlur}
                    autoCapitalize='none'
                    autoCorrect={false}
                    onChangeText={(text) => {
                        // applies for emojis
                        if(text.length > MAX_TEXT_INPUT_VAL_LENGTH) return;
                        this.setState({tagInput: text});
                    }}
                    onSubmitEditing={() => {
                        let tagsArr = this.state.tagsArr,
                            text = this.state.tagInput;

                        //@hmm: check that tag isn't already present, that text is not all whitespace, and that max num of tags is 5
                        if(tagsArr.indexOf(text) < 0 && !(text.replace(/^\s+|\s+$/g, '').length == 0) && tagsArr.length <= 5) {
                        tagsArr.push(text);
                        }
                        this.setState({tagsArr, tagInput: ''});
                    }}
                    placeholder={'Type a tag and submit. Tap to delete.'}
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

        // @hmm keep addInfoBox down here after assigning content and tagSelection
        let addInfoBox = (
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
                    defaultSource={require('../../img/home_background.png')}
                    source={require('../../img/home_background.png')}
                    onLoad={() => {
                        this.setState({ready: true});
                    }}
                    style={styles.backdrop}>
                    {this.state.isLoggedIn && this.state.ready ?
                        <View style={{backgroundColor: 'transparent'}}>
                            <Header>
                                <ProfilePageIcon
                                    style={{bottom: height/20}}
                                    onPress={() => {
                                    this.props.navigator.push({title: 'Profile', component: TabBarLayout, passProps: {currentUserFriends: this.state.currentUserFriends, currentUserLocationCoords: this.state.currentUserLocationCoords, firebaseRef: this.state.firebaseRef, selectedTab: 'profile', ventureId: this.state.ventureId}});
                                 }}/>
                                <ChatsListPageIcon
                                    style={{bottom: height/20}}
                                    onPress={() => {
                                            this.props.navigator.push({title: 'Chats', component: TabBarLayout, passProps: {currentUserFriends: this.state.currentUserFriends, currentUserLocationCoords: this.state.currentUserLocationCoords, firebaseRef: this.state.firebaseRef, selectedTab: 'chats', ventureId: this.state.ventureId}});
                                           }}/>
                            </Header>
                            <BrandLogo
                                onLayout={() => {
                                    this.setState({brandLogoVisible: true});
                                    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                                    }
                                    }
                                //onHomePage={true}
                                logoContainerStyle={styles.logoContainerStyle}
                                />
                            {this.state.showTextInput && this.state.brandLogoVisible ? activityTitleInput : <View />}
                            {this.state.showNextButton ? submitActivityIcon : <View />}
                            {this.state.showAddInfoButton && !this.state.showTimeSpecificationOptions && this.state.activityTitleInput ? addInfoButton :
                                <View />}
                        </View>
                        : <View />}
                    {this.state.showAddInfoBox && this.state.activityTitleInput && this.state.isLoggedIn && this.state.ready ? addInfoBox :
                        <View/>}
                    {this.state.showTrendingItems && !this.state.showAddInfoBox && this.state.isLoggedIn && this.state.ready && this.state.brandLogoVisible ? trendingItemsCarousel :
                        <View/>}
                </Image>
            </VentureAppPage>
        );
    }
});

class Title extends Component {
    render() {
        return (
            <Text
                style={[styles.title, {fontSize: this.props.fontSize}, this.props.titleStyle]}>{this.props.children}</Text>
        );
    }
}

const styles = StyleSheet.create({
    activityTitleInput: {
        height: 52,
        width,
        textAlign: 'center',
        fontSize: height / 23,
        color: 'white',
        backgroundColor: 'rgba(0,0,0,0.7)',
        fontFamily: 'AvenirNextCondensed-UltraLight'
    },
    addInfoBox: {
        position: 'absolute',
        width: width / 1.2,
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
    submitActivityIconContainer: {
        bottom: 40,
        right: width / 28,
        alignSelf: 'flex-end'
    },
    scrollbarArrow: {
        position: 'absolute',
        bottom: height / 28
    },
    scrollView: {
        backgroundColor: 'rgba(0,0,0,0.008)'
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
    title: {
        color: '#fff',
        fontFamily: 'AvenirNextCondensed-Regular',
        fontSize: 20,
        textAlign: 'center',
        paddingTop: 5
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
        marginTop: 8,
        height: height / 6.6,
        paddingTop: 19,
        paddingHorizontal: 25,
        bottom: 5
    },
    timeSpecificationDatePicker: {
        top: 10,
        height: 40,
        justifyContent: 'center',
        alignSelf: 'center',
        backgroundColor: 'rgba(255,255,255,0.8)'
    },
    tagText: {
        color: 'rgba(255,255,255,0.5)',
        fontFamily: 'AvenirNextCondensed-Medium'
    },
    trendingItems: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center'
    },
    trendingItem: {
        borderRadius: 3,
        marginHorizontal: width / 29.9
    },
    trendingItemsCarousel: {
        position: 'absolute',
        bottom: height / 35,
        width: width / 1.18,
        alignSelf: 'center',
        justifyContent: 'center',
        marginHorizontal: (width - (width / 1.2)) / 2,
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 10
    },
    trendingUserImg: {
        width: width / 5.3,
        height: 64,
        resizeMode: 'contain'
    },
    trendingEventImg: {
        width: width / 1.34,
        height: 64,
        resizeMode: 'contain'
    }
});

module.exports = HomePage;


