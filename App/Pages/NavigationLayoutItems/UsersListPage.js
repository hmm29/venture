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

var React = require('react-native');
var {
    ActivityIndicatorIOS,
    Animated,
    AsyncStorage,
    Image,
    InteractionManager,
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
var BlankIcon = require('../../Partials/Icons/BlankIcon');
var ChatPage = require('../ChatPage');
var Dimensions = require('Dimensions');
var FiltersModal = require('../../Partials/Modals/FiltersModal')
var Firebase = require('firebase');
var GeoFire = require('geofire');
var LinearGradient = require('react-native-linear-gradient');
var ModalBase = require('../../Partials/Modals/Base/ModalBase');
var SentRequestIcon = require('../../Partials/Icons/MatchStatusIndicators/SentRequestIcon');
var DefaultMatchStatusIcon = require('../../Partials/Icons/MatchStatusIndicators/DefaultMatchStatusIcon');
var MatchSuccessIcon = require('../../Partials/Icons/MatchStatusIndicators/MatchSuccessIcon');
var ReceivedRequestIcon = require('../../Partials/Icons/MatchStatusIndicators/ReceivedRequestIcon');
var TimerMixin = require('react-timer-mixin');

var CHAT_DURATION_IN_MINUTES = 5;
var INITIAL_LIST_SIZE = 8;
var LOGO_WIDTH = 200;
var LOGO_HEIGHT = 120;
var PAGE_SIZE = 10;
var {height, width} = Dimensions.get('window');
var SEARCH_TEXT_INPUT_REF = 'searchTextInput';
var THUMBNAIL_SIZE = 50;
var USERS_LIST_VIEW_REF = "usersListView";

var YELLOW_HEX_CODE = '#ffe770';
var BLUE_HEX_CODE = '#40cbfb';
var GREEN_HEX_CODE = '#84FF9B';
var WHITE_HEX_CODE = '#fff';

String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

var User = React.createClass({

    propTypes: {
        currentTime: React.PropTypes.number,
        currentUserLocationCoords: React.PropTypes.array,
        currentUserData: React.PropTypes.object,
        data: React.PropTypes.object,
        isCurrentUser: React.PropTypes.func,
        navigator: React.PropTypes.object
    },

    getInitialState() {
        return {
            dir: 'row',
            expireTime: ''
        }
    },

    componentWillMount() {
        let distance = this.props.currentUserLocationCoords && this.props.data && this.props.data.location && this.props.data.location.coordinates && this.calculateDistance(this.props.currentUserLocationCoords, [this.props.data.location.coordinates.latitude, this.props.data.location.coordinates.longitude]),
            _this = this;

        // must have this to clean up old match subs
        this.props.firebaseRef && this.props.data && this.props.data.ventureId && this.props.currentUserIDHashed && this.props.firebaseRef.child(`users/${this.props.currentUserIDHashed}/match_requests`).child(this.props.data.ventureId)
        && (this.props.firebaseRef).child(`users/${this.props.currentUserIDHashed}/match_requests`).child(this.props.data.ventureId).off();

        this.props.firebaseRef && this.props.data && this.props.data.ventureId && this.props.currentUserIDHashed && this.props.firebaseRef.child(`users/${this.props.currentUserIDHashed}/match_requests`).child(this.props.data.ventureId)
        && (this.props.firebaseRef).child(`users/${this.props.currentUserIDHashed}/match_requests`).child(this.props.data.ventureId).on('value', snapshot => {
            _this.setState({
                chatRoomId: snapshot.val() && snapshot.val().chatRoomId,
                distance,
                status: snapshot.val() && snapshot.val().status,
                expireTime: snapshot.val() && snapshot.val().expireTime
            });
        });
    },

    componentDidMount() {
        this.refs.user.fadeInUp(600);
    },

    componentWillReceiveProps(nextProps) {
        let distance = nextProps.currentUserLocationCoords && nextProps.data && nextProps.data.location && nextProps.data.location.coordinates && this.calculateDistance(nextProps.currentUserLocationCoords, [nextProps.data.location.coordinates.latitude, nextProps.data.location.coordinates.longitude]),
            _this = this;

        // must have this to clean up old match subs
        nextProps.firebaseRef && nextProps.data && nextProps.data.ventureId && nextProps.currentUserIDHashed && nextProps.firebaseRef.child(`users/${nextProps.currentUserIDHashed}/match_requests`).child(nextProps.data.ventureId)
        && (nextProps.firebaseRef).child(`users/${nextProps.currentUserIDHashed}/match_requests`).child(nextProps.data.ventureId).off();

        nextProps.firebaseRef && nextProps.data && nextProps.data.ventureId && nextProps.currentUserIDHashed && nextProps.firebaseRef.child(`users/${nextProps.currentUserIDHashed}/match_requests`).child(nextProps.data.ventureId)
        && (nextProps.firebaseRef).child(`users/${nextProps.currentUserIDHashed}/match_requests`).child(nextProps.data.ventureId).on('value', snapshot => {
            //@hmm: quickly reset status
            _this.setState({
                chatRoomId: snapshot.val() && snapshot.val().chatRoomId,
                distance,
                status: snapshot.val() && snapshot.val().status,
                expireTime: snapshot.val() && snapshot.val().expireTime
            });
        });
    },

    componentWillUnmount() {
        let currentUserIDHashed = this.props.currentUserIDHashed,
            firebaseRef = this.props.firebaseRef,
            currentUserMatchRequestsRef = firebaseRef && firebaseRef.child('users/' + currentUserIDHashed + '/match_requests');

        this.props.firebaseRef && this.props.data && this.props.data.ventureId && this.props.currentUserIDHashed && this.props.firebaseRef.child(`users/${this.props.currentUserIDHashed}/match_requests`).child(this.props.data.ventureId)
        && (this.props.firebaseRef).child(`users/${this.props.currentUserIDHashed}/match_requests`).child(this.props.data.ventureId).off();

        currentUserMatchRequestsRef && currentUserMatchRequestsRef.off();
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

        let timerValInSeconds = Math.floor((this.state.expireTime - currentTimeInMs) / 1000);

        if (timerValInSeconds >= 0) return timerValInSeconds;

        let targetUserIDHashed = this.props.data.ventureId,
            currentUserIDHashed = this.props.currentUserIDHashed,
            firebaseRef = this.props.firebaseRef,
            targetUserMatchRequestsRef = firebaseRef.child('users/' + targetUserIDHashed + '/match_requests'),
            currentUserMatchRequestsRef = firebaseRef.child('users/' + currentUserIDHashed + '/match_requests');

        // end match interactions
        targetUserMatchRequestsRef.child(currentUserIDHashed).set(null);
        currentUserMatchRequestsRef.child(targetUserIDHashed).set(null);

        this.state.chatRoomId && firebaseRef.child(`chat_rooms/${this.state.chatRoomId}`).set(null);

        return -1;

    },

    handleMatchInteraction() {
        // @hmm: use hashed targetUserID as key for data for user in list

        let targetUserIDHashed = this.props.data.ventureId,
            currentUserIDHashed = this.props.currentUserIDHashed,
            firebaseRef = this.props.firebaseRef,
            targetUserMatchRequestsRef = firebaseRef.child('users/' + targetUserIDHashed + '/match_requests'),
            currentUserMatchRequestsRef = firebaseRef.child('users/' + currentUserIDHashed + '/match_requests'),
            _this = this;

        if (this.state.status === 'sent') {

            // @hmm: delete the request

            targetUserMatchRequestsRef.child(currentUserIDHashed).set(null);
            currentUserMatchRequestsRef.child(targetUserIDHashed).set(null);
        }

        else if (this.state.status === 'received') {

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
        }

        else if (this.state.status === 'matched') {
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

                // @hmm put chat ids in match request object so overlays know which chat to destroy
                currentUserMatchRequestsRef.child(targetUserIDHashed).update({chatRoomId: _id});
                targetUserMatchRequestsRef.child(currentUserIDHashed).update({chatRoomId: _id});

                firebaseRef.child(`chat_rooms/${_id}`).once('value', snapshot => {

                    let chatRoomRef = firebaseRef.child(`chat_rooms/${_id}`);

                    if (snapshot.val() === null) {
                        // TODO: in the future should be able to account for timezone differences?
                        // probably not because if youre going to match with someone youll be in same timezone

                        let currentTime = new Date().getTime(),
                            expireTime = new Date(currentTime + (CHAT_DURATION_IN_MINUTES * 60 * 1000)).getTime();

                        chatRoomRef.child('_id').set(_id); // @hmm: set unique chat Id
                        chatRoomRef.child('createdAt').set(currentTime); // @hmm: set unique chat Id
                        chatRoomRef.child('timer').set({expireTime}); // @hmm: set chatroom expire time
                        chatRoomRef.child('user_activity_preference_titles').child(currentUserIDHashed).set(this.props.currentUserData.activityPreference.title);
                        chatRoomRef.child('user_activity_preference_titles').child(targetUserIDHashed).set(this.props.data.activityPreference.title);
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
                            currentUserData: _this.props.currentUserData
                        }
                    });

                });
            });
        }

        else {
            targetUserMatchRequestsRef.child(currentUserIDHashed).setWithPriority({
                status: 'received',
                _id: currentUserIDHashed
            }, 200);
            currentUserMatchRequestsRef.child(targetUserIDHashed).setWithPriority({
                status: 'sent',
                _id: targetUserIDHashed
            }, 300);
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
                    style={{left: 10, bottom: 6}}
                    />
            case 'received':
                return <ReceivedRequestIcon
                    color='rgba(0,0,0,0.2)'
                    onPress={this.handleMatchInteraction}
                    style={{left: 10,  bottom: 6}}
                    />
            case 'matched':
                return <MatchSuccessIcon
                    color='rgba(0,0,0,0.2)'
                    onPress={this.handleMatchInteraction}
                    style={{left: 10,  bottom: 6}}
                    />
            default:
                return <DefaultMatchStatusIcon
                    onPress={this.handleMatchInteraction}
                    style={{left: 10, bottom: 6}}
                    />
        }
    },

    render() {
        let profileModal = (
            <View style={styles.profileModalContainer}>
                <View
                    style={[styles.profileModal, {backgroundColor: this._getSecondaryStatusColor()}]}>
                    <Image
                        source={{uri: this.props.data && this.props.data.picture}}
                        style={[styles.profileModalUserPicture, (this.state.isFacebookFriend ? {borderWidth: 3, borderColor: '#4E598C'} : {})]}/>
                    <Text
                        style={styles.profileModalNameAgeInfo}>{this.props.data && this.props.data.firstName}, {this.props.data && this.props.data.age && this.props.data.age.value} {'\t'}
                        | {'\t'}
                        <Text style={styles.profileModalActivityInfo}>
                            <Text
                                style={styles.profileModalActivityPreference}>{this.props.data && this.props.data.activityPreference && this.props.data.activityPreference.title && this.props.data.activityPreference.title.slice(0, -1)} </Text>:
                            {'\t'} {this.props.data && this.props.data.activityPreference && (this.props.data.activityPreference.start.time || this.props.data.activityPreference.status)} {'\n'}
                        </Text>
                    </Text>
                    <View style={[styles.tagBar, {bottom: 10}]}>
                        <Text
                            style={styles.profileModalSectionTitle}>TAGS: </Text>
                        {this.props.data && this.props.data.activityPreference && this.props.data.activityPreference.tags && this.props.data.activityPreference.tags.map((tag, i) => (
                            <TouchableOpacity key={i} style={styles.tag}><Text
                                style={styles.tagText}>{tag}</Text></TouchableOpacity>
                        ))
                        }
                    </View>
                    <Text
                        style={styles.profileModalBio}>{this.props.data && this.props.data.bio}</Text>
                </View>
            </View>
        );

        return (
            <Animatable.View ref="user">
                <TouchableHighlight
                    underlayColor={WHITE_HEX_CODE}
                    activeOpacity={0.3}
                    onPress={this._onPressItem}
                    style={styles.userRow}>
                    <View
                        style={[styles.userContentWrapper, {flexDirection: this.state.dir}]}>
                        <LinearGradient
                            colors={(this.props.backgroundColor && [this.props.backgroundColor, this.props.backgroundColor]) || [this.getStatusColor(), this._getSecondaryStatusColor(), WHITE_HEX_CODE, 'transparent']}
                            start={[0,1]}
                            end={[1,1]}
                            locations={[0.3,0.99,1.0]}
                            style={styles.container}>
                            <View style={styles.rightContainer}>
                                <Image
                                    onPress={this._onPressItem}
                                    source={{uri: this.props.data && this.props.data.picture}}
                                    style={[styles.thumbnail]}>
                                    <View style={(this.state.expireTime ? styles.timerValOverlay : {})}>
                                        <Text
                                            style={[styles.timerValText, (!_.isString(this._getTimerValue(this.props.currentTimeInMs)) && _.parseInt((this._getTimerValue(this.props.currentTimeInMs))/60) === 0 ? {color: '#F12A00'} :{})]}>
                                            {!_.isString(this._getTimerValue(this.props.currentTimeInMs)) && (this._getTimerValue(this.props.currentTimeInMs) >= 0) && _.parseInt(this._getTimerValue(this.props.currentTimeInMs) / 60) + 'm'} {!_.isString(this._getTimerValue(this.props.currentTimeInMs)) && (this._getTimerValue(this.props.currentTimeInMs) >= 0) && this._getTimerValue(this.props.currentTimeInMs) % 60 + 's'}
                                        </Text>
                                    </View>
                                </Image>
                                <Text
                                    style={[styles.distance]}>{this.state.distance ? this.state.distance + ' mi' : '      '}</Text>
                                <Text style={[styles.activityPreference]}>
                                    {this.props.data && this.props.data.activityPreference && this.props.data.activityPreference.title}
                                </Text>
                                <View>
                                    {!this.props.isCurrentUser ?
                                        <View style={{top: 10, right: width/25}}>{this._renderStatusIcon()}</View> :
                                        <View style={{top: 10, right: width/25}}><BlankIcon
                                            style={{left: 10, bottom: 6}}/></View>}
                                </View>
                            </View>
                        </LinearGradient>
                        {this.state.dir === 'column' ? profileModal : <View />}
                    </View>
                </TouchableHighlight>
            </Animatable.View>
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

    getInitialState() {
        return {
            animating: false,
            contentOffsetYValue: 0,
            dataSource: new ListView.DataSource({
                rowHasChanged: (row1, row2) => !_.isEqual(row1, row2)
            }),
            firebaseRef: this.props.firebaseRef,
            maxSearchDistance: null,
            rows: [],
            searchText: '',
            showCurrentUser: false,
            showFiltersModal: false,
            showLoadingModal: false
        };
    },

    _handle: null,

    componentDidMount() {
        InteractionManager.runAfterInteractions(() => {

            let currentUserRef = this.props.ventureId && this.state.firebaseRef && this.state.firebaseRef.child(`users/${this.props.ventureId}`),
                firebaseRef = this.state.firebaseRef,
                usersListRef = firebaseRef.child('users'),
                _this = this;

            this.setState({animating: true});

            // @hmm: speed up by putting fetch here

            // @hmm: short delay to allow filtering for initial loaded users list
            // also prevents RCTURLLoader equal priority error

            currentUserRef && currentUserRef.child('matchingPreferences').on('value', snapshot => {

                let matchingPreferences = snapshot.val(),
                    maxSearchDistance = matchingPreferences && matchingPreferences.maxSearchDistance,
                    filteredUsersArray = [];

                InteractionManager.runAfterInteractions(() => {

                    usersListRef.once('value', snapshot => {
                        // @hmm: clear and re-render rows
                        _this.updateRows([]);

                        // @hmm: show users based on filter settings
                        snapshot.val() && _.each(snapshot.val(), (user) => {

                            if (user.status && !user.status.isOnline) return;

                            // @hmm: because of cumulative privacy selection, only have to check for friends+ for both 'friends+' and 'all'
                            if (matchingPreferences && matchingPreferences.privacy && matchingPreferences.privacy.indexOf('friends+') > -1) {
                                if (this.props.currentUserLocationCoords && user.location && user.location.coordinates && user.location.coordinates.latitude && user.location.coordinates.longitude && GeoFire.distance(this.props.currentUserLocationCoords, [user.location.coordinates.latitude, user.location.coordinates.longitude]) <= maxSearchDistance * 1.609) {
                                    if (matchingPreferences && matchingPreferences.gender && matchingPreferences.gender.indexOf(user.gender) > -1) filteredUsersArray.push(user);
                                    if (matchingPreferences && matchingPreferences.gender && matchingPreferences.gender.indexOf(user.gender) === -1 && matchingPreferences.gender.indexOf('other') > -1 && user.gender !== 'male' && user.gender !== 'female') filteredUsersArray.push(user);
                                }
                            } else if (matchingPreferences && matchingPreferences.privacy && matchingPreferences.privacy.indexOf('friends') > -1 && matchingPreferences.privacy.length === 1) {
                                if (this.props.currentUserFriends && _.findIndex(this.props.currentUserFriends, {name: user.name}) > -1) {
                                    if (this.props.currentUserLocationCoords && user.location && user.location.coordinates && user.location.coordinates.latitude && user.location.coordinates.longitude && GeoFire.distance(this.props.currentUserLocationCoords, [user.location.coordinates.latitude, user.location.coordinates.longitude]) <= maxSearchDistance * 1.609) {
                                        if (matchingPreferences && matchingPreferences.gender && matchingPreferences.gender.indexOf(user.gender) > -1) filteredUsersArray.push(user);
                                        if (matchingPreferences && matchingPreferences.gender && matchingPreferences.gender.indexOf(user.gender) === -1 && matchingPreferences.gender.indexOf('other') > -1 && user.gender !== 'male' && user.gender !== 'female') filteredUsersArray.push(user);
                                    }
                                }
                            } else {
                                if (this.props.currentUserLocationCoords && user.location && user.location.coordinates && user.location.coordinates.latitude && user.location.coordinates.longitude && GeoFire.distance(this.props.currentUserLocationCoords, [user.location.coordinates.latitude, user.location.coordinates.longitude]) <= maxSearchDistance * 1.609) {
                                    if (matchingPreferences && matchingPreferences.gender && matchingPreferences.gender.indexOf(user.gender) > -1) filteredUsersArray.push(user);
                                    if (matchingPreferences && matchingPreferences.gender && matchingPreferences.gender.indexOf(user.gender) === -1 && matchingPreferences.gender.indexOf('other') > -1 && user.gender !== 'male' && user.gender !== 'female') filteredUsersArray.push(user);
                                }
                            }

                        });
                        _this.setTimeout(() => {
                            _this.updateRows(_.cloneDeep(_.values(filteredUsersArray)));
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            _this.setState({
                                rows: _.cloneDeep(_.values(filteredUsersArray)),
                                currentUserRef,
                                usersListRef
                            });

                        }, 0)

                    });
                });

            });

            this.setState({currentUserVentureId: this.props.ventureId});

            firebaseRef.child(`/users/${this.props.ventureId}`).once('value', snapshot => {
                _this.setState({currentUserData: snapshot.val(), showCurrentUser: true});
            });

            _this._handle = _this.setInterval(() => {
                _this.setState({currentTimeInMs: (new Date()).getTime()})
            }, 1000);
        });

        this.setTimeout(() => {
            if (_.isEmpty(this.state.rows)) this.setState({showLoadingModal: true});
        }, 1000);
    },

    componentWillUnmount() {
        this.state.usersListRef && this.state.usersListRef.off();
        this.state.firebaseRef.child('chat_rooms') && this.state.firebaseRef.child('chat_rooms').off();
        this.state.firebaseRef.off();
    },

    _handleShowFiltersModal(showFiltersModal:boolean){
        this.setState({showFiltersModal});
    },

    _navigateToHome() {
        this.props.navigator.popToTop();
    },

    search(text:string) {
        let checkFilter = user => {
            let activity = (user.activityPreference.title).toLowerCase(),
                lowText = text.toLowerCase(),
                name = (user.firstName).toLowerCase();

            return (activity.indexOf(lowText) > -1 || name.indexOf(lowText) > -1);
        };

        this.updateRows(_.cloneDeep(_.values(_.filter(this.state.rows, checkFilter))));
    },

    shuffleUsers() {
        this.updateRows(_.shuffle(_.cloneDeep(_.values(this.state.rows))));
        this.forceUpdate();
    },

    updateRows(rows) {
        this.setState({dataSource: this.state.dataSource.cloneWithRows(rows)});
        if (rows.length) this.setState({showLoadingModal: false});
    },

    _renderCurrentUser() {
        return (
            <User backgroundColor={'rgba(255,245,226, 0.5)'}
                  data={this.state.currentUserData}
                  editable={true}
                  isCurrentUser={true}/>
        )
    },

    _renderHeader() {
        var FiltersModalIcon = require('../../Partials/Icons/NavigationButtons/FiltersModalIcon');
        var Header = require('../../Partials/Header');
        var HomePageIcon = require('../../Partials/Icons/NavigationButtons/HomePageIcon');

        return (
            <Header>
                <HomePageIcon onPress={() => this._navigateToHome()}/>
                <TextInput
                    ref={SEARCH_TEXT_INPUT_REF}
                    autoCapitalize='none'
                    autoCorrect={true}
                    clearButtonMode='always'
                    onChangeText={(text) => this.search(text)}
                    placeholder='Search name or activity'
                    placeholderTextColor='rgba(0,0,0,0.4)'
                    returnKeyType='done'
                    style={styles.searchTextInput}/>
                <FiltersModalIcon
                    onPress={() => {
                        this.setState({showFiltersModal: true});
                    }}
                    style={{left: 14}}/>
                <Text />
            </Header>
        )
    },


    _renderUser(user:Object, sectionID:number, rowID:number) {
        if (user.ventureId === this.state.currentUserVentureId) return <View />;

        if (this.state.visibleRows && this.state.visibleRows[sectionID] && this.state.visibleRows[sectionID][rowID] && !this.state.visibleRows[sectionID][rowID]) return
        <View />;

        return <User currentTimeInMs={this.state.currentTimeInMs}
                     currentUserData={this.state.currentUserData}
                     currentUserIDHashed={this.state.currentUserVentureId}
                     currentUserLocationCoords={this.props.currentUserLocationCoords}
                     data={user}
                     firebaseRef={this.state.firebaseRef}
                     navigator={this.props.navigator}
                     rowID={rowID}
            />;
    },

    render() {
        var BrandLogo = require('../../Partials/BrandLogo');
        var RefreshableListView = require('react-native-refreshable-listview');

        return (
            <View style={styles.usersListBaseContainer}>
                <View>
                    {this._renderHeader()}
                    {this.state.showCurrentUser ? this._renderCurrentUser() : <View/>}
                </View>
                <RefreshableListView
                    ref={USERS_LIST_VIEW_REF}
                    contentOffset={{x: 0, y: this.state.contentOffsetYValue}}
                    dataSource={this.state.dataSource}
                    renderRow={this._renderUser}
                    initialListSize={INITIAL_LIST_SIZE}
                    pageSize={PAGE_SIZE}
                    minPulldownDistance={5}
                    automaticallyAdjustContentInsets={false}
                    loadData={this.shuffleUsers}
                    onChangeVisibleRows={(visibleRows, changedRows) => {
                        this.setState({visibleRows, changedRows});
                    }}
                    onEndReachedThreshold={height/20}
                    onEndReached={() => {
                        if(this.state.rows.length > INITIAL_LIST_SIZE) this.setState({contentOffsetYValue: this.state.contentOffsetYValue + height/20}); // scroll to show remaining content
                    }}
                    refreshDescription="Everyday I'm shufflin'..."
                    scrollRenderAheadDistance={600}
                    refreshingIndictatorComponent={CustomRefreshingIndicator}
                    removeClippedSubviews={true}
                    />
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
                            animating={this.state.animating}
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
                <FiltersModal
                    firebaseRef={this.state.firebaseRef}
                    handleShowFiltersModal={this._handleShowFiltersModal}
                    modalVisible={this.state.showFiltersModal}
                    ventureId={this.props.ventureId} // @hmm: important to pass this.props.ventureId bc its available immediately
                    />
            </View>
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
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height
    },
    container: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderColor: 'rgba(100,100,105,0.2)',
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
        justifyContent: 'space-around',
        paddingHorizontal: width / 10
    },
    searchTextInput: {
        color: '#222',
        backgroundColor: 'white',
        borderRadius: 3,
        borderWidth: 1,
        width: 200,
        height: 30,
        paddingLeft: 10,
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'AvenirNextCondensed-Regular'
    },
    tag: {
        backgroundColor: 'rgba(4,22,43,0.5)',
        borderRadius: 12,
        paddingHorizontal: Dimensions.get('window').width / 80,
        marginHorizontal: Dimensions.get('window').width / 70,
        paddingVertical: Dimensions.get('window').width / 170,
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
    },
    usersListBaseContainer: {
        flex: 1,
        backgroundColor: '#040A19'
    }
});

module.exports = UsersListPage;