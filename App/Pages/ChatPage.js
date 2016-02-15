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

/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule Chat
 * @flow
 */

'use strict';

var React = require('react-native');

var {
    AppStateIOS,
    Image,
    InteractionManager,
    LayoutAnimation,
    ListView,
    Navigator,
    PushNotificationIOS,
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
var Firebase = require('firebase');
var Header = require('../Partials/Header');
var Icon = require('react-native-vector-icons/Ionicons');
var InvertibleScrollView = require('react-native-invertible-scroll-view');
var LinearGradient = require('react-native-linear-gradient');
var ReactFireMixin = require('reactfire');
var SGListView = require('react-native-sglistview');
var TimerMixin = require('react-timer-mixin');

var {height, width} = Dimensions.get('window');
var MAX_TEXT_INPUT_VAL_LENGTH = 15;
var MESSAGE_TEXT_INPUT_REF = 'messageTextInput';
var MESSAGES_LIST_REF = 'messagesList';

var ChatPage = React.createClass({

    mixins: [ReactFireMixin, TimerMixin],

    getInitialState() {
        return {
            chatRoomMessagesRef: null,
            contentOffsetYValue: 0,
            dataSource: new ListView.DataSource({
                rowHasChanged: (row1, row2) => !_.isEqual(row1, row2)
            }),
            hasKeyboardSpace: false,
            hasTimerExpired: false,
            loaded: false,
            message: '',
            messageList: Object
        };
    },

    componentWillMount() {
        InteractionManager.runAfterInteractions(() => {
            let chatRoomMessagesRef = this.props.chatRoomRef.child('messages'), _this = this;

            this.bindAsObject(chatRoomMessagesRef, 'messageList');

            chatRoomMessagesRef.on('value', (snapshot) => {
                _this.setState({
                    contentOffsetYValue: 0,
                    message: '',
                    messageList: snapshot.val() && _.cloneDeep(_.values(snapshot.val()))
                });
                _this.updateMessages(_.cloneDeep(_.values(snapshot.val())))
            });

            this.setState({chatRoomMessagesRef});
        });
    },

    componentWillUnmount() {
        this.refs[MESSAGE_TEXT_INPUT_REF].blur();
    },

    closeKeyboard() {
        this.setState({hasKeyboardSpace: false, closeDropdownProfile: false});
        this.refs[MESSAGE_TEXT_INPUT_REF].blur();
    },

    containerTouched(event) {
        this.refs[MESSAGE_TEXT_INPUT_REF].blur();
        return false;
    },

    handleSetHasTimerExpiredState(hasTimerExpired:boolean){
        this.setState({hasTimerExpired});
    },

    updateMessages(messages:Array<Object>) {
        this.setState({
            dataSource: new ListView.DataSource({
                rowHasChanged: (row1, row2) => !_.isEqual(row1, row2)
            }).cloneWithRows(messages),
            loaded: true
        });
    },

    _renderHeader() {
        let chatRoomTitle = (this.props.chatRoomActivityPreferenceTitle ? this.props.chatRoomActivityPreferenceTitle : this.props.chatRoomEventTitle);

        return (
            <Header containerStyle={{backgroundColor: '#040A19'}}>
                <BackIcon onPress={() => {
                this.props.navigator.pop();
                }} style={{right: 10, bottom: 5}}
                    />
                <Text
                    style={styles.activityPreferenceTitle}>
                    {chatRoomTitle && chatRoomTitle.toUpperCase()} </Text>
                <Text />
            </Header>
        );
    },

    _renderMessage(message:Object, sectionID:number, rowID:number) {
        if (this.state.visibleRows && this.state.visibleRows[sectionID] && this.state.visibleRows[sectionID][rowID] && !this.state.visibleRows[sectionID][rowID]) return <View />;

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
                colors={(!sentByCurrentUser) ? ['#124B8F', '#2C90C8', '#fff'] : ['#fff', '#fff']}
                start={[0,1]}
                end={[1,0.9]}
                locations={[0,1.0,0.9]}
                style={styles.messageRow}>
                { (!sentByCurrentUser) ? avatarThumbnail : null }
                <View style={messageRowStyle}>
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

    _sendMessage() {
        if (this.state.hasTimerExpired) return;

        let messageObj = {
            senderIDHashed: this.props.currentUserData.ventureId,
            body: this.state.message
        }, _this = this;

        this.state.chatRoomMessagesRef.push(messageObj);
        this.state.chatRoomMessagesRef.once('value', (snapshot) => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
            _this.setState({
                contentOffsetYValue: 0,
                message: ''
            });
            _this.updateMessages(_.cloneDeep(_.values(snapshot.val())));
            _this.refs[MESSAGE_TEXT_INPUT_REF].blur();
        });
    },

    render() {
        let messageTextInput = (
            <TextInput
                autoCorrect={false}
                ref={MESSAGE_TEXT_INPUT_REF}
                onBlur={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                    this.setState({hasKeyboardSpace: false, closeDropdownProfile: false})
                    }}
                onFocus={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                    this.setState({hasKeyboardSpace: true, closeDropdownProfile: true})
                    }}
                multiline={true}
                style={styles.messageTextInput}
                onChangeText={(text) => this.setState({message: text})}
                value={this.state.message}
                returnKeyType='default'
                keyboardType='default'
                />
        );

        return (
            <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.96)'}}>
                <View>
                    {this._renderHeader()}
                </View>
                <View onStartShouldSetResponder={this.containerTouched} style={styles.container}>
                    <RecipientInfoBar chatRoomRef={this.props.chatRoomRef}
                                      closeDropdownProfile={this.state.closeDropdownProfile}
                                      closeKeyboard={this.closeKeyboard}
                                      handleSetHasTimerExpiredState={this.handleSetHasTimerExpiredState}
                                      _id={this.props._id}
                                      navigator={this.props.navigator}
                                      recipientData={this.props}
                        />
                    <SGListView
                        ref={MESSAGES_LIST_REF}
                        contentOffset={{x: 0, y: this.state.contentOffsetYValue}}
                        dataSource={this.state.dataSource}
                        renderRow={this._renderMessage}
                        onChangeVisibleRows={(visibleRows, changedRows) => this.setState({visibleRows, changedRows})}
                        renderScrollComponent={props => <InvertibleScrollView {...props} />}
                        initialListSize={15}
                        pageSize={15}
                        scrollsToTop={false}
                        automaticallyAdjustContentInsets={false}
                        style={{backgroundColor: 'rgba(0,0,0,0.01)', width: width}}
                        />
                    <View style={{height: width / 8}}/>
                    <View style={{position: 'absolute', bottom: 0}}>
                        <View
                            style={[styles.textBoxContainer, {marginBottom: this.state.hasKeyboardSpace ? height/3.1 : 0}]}>
                            {messageTextInput}
                            <TouchableOpacity onPress={() => {
                        if(this.state.message.length) this._sendMessage();
                        else this.refs[MESSAGE_TEXT_INPUT_REF].blur();
                    }}>
                                <Text
                                    style={{color: 'white', fontFamily: 'AvenirNextCondensed-Regular', marginHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 3}}>Send</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        );
    }
});

var RecipientInfoBar = React.createClass({
    propTypes: {
        chatRoomRef: React.PropTypes.string.isRequired,
        closeDropdownProfile: React.PropTypes.bool.isRequired,
        closeKeyboard: React.PropTypes.func.isRequired,
        handleSetHasTimerExpiredState: React.PropTypes.func.isRequired,
        _id: React.PropTypes.string.isRequired,
        navigator: React.PropTypes.object,
        recipientData: React.PropTypes.object.isRequired,
    },

    getInitialState() {
        return {
            age: _.random(19, 23),
            currentUserActivityPreferenceTitle: this.props.recipientData.currentUserData.activityPreference.title,
            currentUserBio: this.props.recipientData.currentUserData.bio,
            dir: 'row',
            hasKeyboardSpace: false,
            infoContent: 'recipient',
            time: '2'
        }
    },

    componentWillMount(){
        let _this = this;

        this.props.chatRoomRef && this.props.recipientData && this.props.recipientData.currentUserData && this.props.recipientData.currentUserData.ventureId && this.props.recipientData.recipient && this.props.recipientData.recipient.ventureId && this.props.chatRoomRef.child('user_activity_preference_titles').on('value', snapshot => {
            _this.setState({
                currentUserActivityPreferenceTitle: snapshot.val() && snapshot.val()[this.props.recipientData.currentUserData.ventureId],
                targetUserActivityPreferenceTitle: snapshot.val() && snapshot.val()[this.props.recipientData.recipient.ventureId]
            })
        })
    },

    render(){

        let currentUserData = this.props.recipientData.currentUserData,
            recipient = this.props.recipientData.recipient,
            tags = (this.state.infoContent === 'recipient' ? recipient.activityPreference && recipient.activityPreference.tags : currentUserData.activityPreference && currentUserData.activityPreference.tags),
            user = (this.state.infoContent === 'recipient' ? recipient : currentUserData);

        let tagsSection = (
            <View style={[styles.tagBar, {bottom: 10}]}>
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
                style={{paddingVertical: (user === recipient ? height/30 : height/97), bottom: (this.state.hasKeyboardSpace ? height/3.5 : 0), backgroundColor: '#eee', flexDirection: 'column', justifyContent: 'center'}}>
                {this.state.infoContent === 'recipient' ?
                    <TouchableOpacity onPress={() => this.refs.recipientPicture.tada(400)}>
                        <Animatable.View ref="recipientPicture" onLayout={() => this.refs.recipientPicture.fadeIn(400)}>
                            <Image source={{uri: recipient.picture}}
                                   style={{width: width/2, height: width/2, borderRadius: width/4, alignSelf: 'center', marginVertical: width/18}}/>
                        </Animatable.View>
                    </TouchableOpacity>
                    :
                    <TouchableOpacity onPress={() => this.refs.currentUserPicture.tada(400)}>
                        <Animatable.View ref="currentUserPicture"
                                         onLayout={() => this.refs.currentUserPicture.fadeIn(400)}>
                            <Image source={{uri: currentUserData.picture}}
                                   style={{width: width/2, height: width/2, borderRadius: width/4, alignSelf: 'center', marginVertical: width/18}}/>
                        </Animatable.View>
                    </TouchableOpacity>
                }
                <Text
                    style={{color: '#222', fontSize: 20, fontFamily: 'AvenirNextCondensed-Medium', textAlign: 'center'}}>
                    {user.firstName}, {user.age && user.age.value} {'\t'} |{'\t'}
                    <Text style={{fontFamily: 'AvenirNextCondensed-Medium'}}>
                        <Text
                            style={{fontSize: 20}}>{user === currentUserData ? this.state.currentUserActivityPreferenceTitle && this.state.currentUserActivityPreferenceTitle.replace(/[^\w\s]|_/g, '').replace(/\s+/g, ' ') :
                        this.state.targetUserActivityPreferenceTitle && this.state.targetUserActivityPreferenceTitle.replace(/[^\w\s]|_/g, '').replace(/\s+/g, ' ')} {this.props.recipientData.chatRoomEventTitle ? '' : ':'}</Text> {this.props.recipientData.chatRoomEventTitle ? '' : user.activityPreference && (user.activityPreference.start.time || user.activityPreference.status)}
                        {'\n'}
                    </Text>
                </Text>
                {user === currentUserData ? <TextInput
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
                            this.props.chatRoomRef.child('user_activity_preference_titles').child(currentUserIDHashed).set(upperCaseText);
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
                <View style={styles.recipientBar}>
                    <RecipientAvatar onPress={() => {
                    var config = layoutAnimationConfigs[0];
                    LayoutAnimation.configureNext(config);
                    this.setState({infoContent: 'recipient', dir: (this.state.dir === 'column' && this.state.infoContent === 'recipient' ? 'row' : 'column')})
                }} navigator={this.props.navigator} recipient={recipient}/>
                    <View style={styles.rightContainer}>
                        <Text style={styles.recipientDistance}> {this.props.recipientData.distance} </Text>
                    </View>

                    <RecipientAvatar onPress={() => {
                    var config = layoutAnimationConfigs[0];
                    LayoutAnimation.configureNext(config);
                   this.setState({infoContent: 'currentUser', dir: (this.state.dir === 'column' && this.state.infoContent === 'currentUser' ? 'row' : 'column')})
                }} navigator={this.props.navigator} currentUserData={currentUserData} style={{marginRight: 20}}/>
                </View>
                <TimerBar chatRoomRef={this.props.chatRoomRef}
                          closeKeyboard={this.props.closeKeyboard}
                          currentUserData={currentUserData}
                          handleSetHasTimerExpiredState={this.props.handleSetHasTimerExpiredState}
                          _id={this.props._id}
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
        recipient: React.PropTypes.object,
    },

    render() {
        let currentUserData = this.props.currentUserData,
            recipient = this.props.recipient,
            user;

        if (this.props.recipient) user = {firstName: recipient.firstName, picture: recipient.picture}
        else user = {firstName: currentUserData.firstName, picture: currentUserData.picture}

        return (
            <TouchableOpacity onPress={this.props.onPress} style={styles.recipientAvatar}>
                <Image
                    source={{uri: user.picture}}
                    style={styles.avatarImage}/>
                <Text
                    style={styles.avatarActivityPreference}> {user.firstName} </Text>
            </TouchableOpacity>
        );
    }
});

var TimerBar = React.createClass({
    propTypes: {
        chatRoomRef: React.PropTypes.string.isRequired,
        closeKeyboard: React.PropTypes.func.isRequired,
        currentUserData: React.PropTypes.object.isRequired,
        handleSetHasTimerExpiredState: React.PropTypes.func.isRequired,
        _id: React.PropTypes.string.isRequired,
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
            timerValInSeconds: '..m ..s'
        }
    },

    mixins: [TimerMixin],

    _handle: null,

    // must be in componentWillMount
    componentWillMount() {
        let chatRoomRef = this.props.chatRoomRef,
            currentUserData = this.props.currentUserData,
            firebaseRef = this.state.firebaseRef,
            recipient = this.props.recipient,
            _this = this;

        chatRoomRef.child('timer/expireTime').once('value', snapshot => {
            // @hmm: for creator of chatroom
            this.setState({timerValInSeconds: Math.floor((snapshot.val() - this.state.currentTime) / 1000)});

            // @hmm: update in match_request objects so it can be referenced in users list for timer overlays

            if (this.props.recipientData.chatRoomEventTitle) {
                firebaseRef.child(`users/${currentUserData.ventureId}/event_invite_match_requests/${recipient.ventureId}`).update({expireTime: snapshot.val()});
                firebaseRef.child(`users/${recipient.ventureId}/event_invite_match_requests/${currentUserData.ventureId}`).update({expireTime: snapshot.val()});
            } else {
                firebaseRef.child(`users/${currentUserData.ventureId}/match_requests/${recipient.ventureId}`).update({expireTime: snapshot.val()});
                firebaseRef.child(`users/${recipient.ventureId}/match_requests/${currentUserData.ventureId}`).update({expireTime: snapshot.val()});
            }


            _this.handle = _this.setInterval(() => {
                if (this.state.timerValInSeconds - 1 <= 0) {
                    _this.clearInterval(_this.handle);
                    _this._destroyChatroom(chatRoomRef);
                }

                this.setState({timerValInSeconds: this.state.timerValInSeconds - 1})

            }, 1000);

        });
    },

    componentDidMount() {
        if (this.state.timerValInSeconds <= 0) this._destroyChatroom(this.props.chatRoomRef);

        AppStateIOS.addEventListener('change', this._handleAppStateChange);
    },

    _destroyChatroom(chatRoomRef:string) {
        this.props.handleSetHasTimerExpiredState(true);

        let currentUserData = this.props.currentUserData,
            currentUserIDHashed = currentUserData.ventureId,
            firebaseRef = this.state.firebaseRef,
            currentUserMatchRequestsRef = firebaseRef.child('users/' + currentUserIDHashed + '/match_requests'),
            recipient = this.props.recipient,
            targetUserIDHashed = recipient.ventureId,
            targetUserMatchRequestsRef = firebaseRef.child('users/' + targetUserIDHashed + '/match_requests');

        if (this.props.recipientData.chatRoomEventTitle) {
            currentUserMatchRequestsRef = firebaseRef.child('users/' + currentUserIDHashed + '/event_invite_match_requests'),
                targetUserMatchRequestsRef = firebaseRef.child('users/' + targetUserIDHashed + '/event_invite_match_requests');
        }

        this.props.closeKeyboard();

        // decrement chat count by 1
        firebaseRef.child(`users/${currentUserIDHashed}/chatCount`).once('value', snapshot => {
            firebaseRef.child(`users/${currentUserIDHashed}/chatCount`).set(snapshot.val()-1);
        });

        chatRoomRef.off();
        chatRoomRef.set({null}); // destroy chatRoom

        // destroy match requests
        targetUserMatchRequestsRef.child(currentUserIDHashed).set(null);
        currentUserMatchRequestsRef.child(targetUserIDHashed).set(null);

        this.props.navigator.pop();
    },

    _handleAppStateChange(currentAppState) {
        let previousAppState = this.state.currentAppState;
        this.setState({currentAppState, previousAppState});

        if (currentAppState === 'background') {
            this.setState({activeToBackgroundStateTimeRecordInMs: (new Date().getTime())})
        }

        if (previousAppState === 'background' && currentAppState === 'active') {
            let currentTime = (new Date()).getTime(),
                timeSpentInBackgroundState = Math.floor((currentTime - this.state.activeToBackgroundStateTimeRecordInMs) / 1000)

            this.setState({timerValInSeconds: this.state.timerValInSeconds - timeSpentInBackgroundState});

            if (this.state.timerValInSeconds - 1 <= 0) this._destroyChatroom(this.props.chatRoomRef);
        }
    },

    componentWillUnmount() {
        AppStateIOS.removeEventListener('change', this._handleAppStateChange);
    },

    render() {
        return (
            <View
                style={styles.timerBar}>
                <Text
                    style={[styles.timer, (!_.isString(this.state.timerValInSeconds) && _.parseInt(this.state.timerValInSeconds/60) === 0 ? {color: '#F12A00'} :{})]}>{!_.isString(this.state.timerValInSeconds) && (this.state.timerValInSeconds >= 0) && _.parseInt(this.state.timerValInSeconds / 60) + 'm'} {!_.isString(this.state.timerValInSeconds) && (this.state.timerValInSeconds >= 0) && this.state.timerValInSeconds % 60 + 's'}</Text>
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
        marginTop: 8
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
        marginTop: 15
    },
    container: {
        alignItems: 'center',
        flex: 1
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
        height: 30,
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
    recipientBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        height: 78
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
        fontFamily: 'AvenirNextCondensed-Regular'
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
        height: 40,
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
