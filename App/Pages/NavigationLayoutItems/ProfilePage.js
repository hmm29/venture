/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule ProfilePage
 * @flow
 */

'use strict';

var React = require('react-native');

var {
    ActivityIndicatorIOS,
    AsyncStorage,
    Image,
    LayoutAnimation,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
    } = React;

var _ = require('lodash');
var Animatable = require('react-native-animatable');
var BrandLogo = require('../../Partials/BrandLogo');
var Dimensions = require('Dimensions');
var EditProfilePageIcon = require('../../Partials/Icons/NavigationButtons/EditProfilePageIcon');
var EditProfilePage = require('../EditProfilePage');
var FBLogin = require('react-native-facebook-login');
var Firebase = require('firebase');
var Header = require('../../Partials/Header');
var HomePageIcon = require('../../Partials/Icons/NavigationButtons/HomePageIcon');
var LoginPage = require('../LoginPage');
var ModalBase = require('../../Partials/Modals/Base/ModalBase');
var sha256 = require('sha256');
var TimerMixin = require('react-timer-mixin');
var VentureAppPage = require('../Base/VentureAppPage');

var {height, width} = Dimensions.get('window');
var LOGO_WIDTH = 200;
var LOGO_HEIGHT = 120;

String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

var hash = (msg:string) => sha256(sha256(sha256(msg)));

var ProfilePage = React.createClass({
    statics: {
        title: '<ProfilePage/>',
        description: 'See current user info.'
    },

    mixins: [TimerMixin],

    getInitialState() {
        return {
            asyncStorageAccountData: null,
            firebaseRef: this.props.firebaseRef,
            user: null
        }
    },

    componentWillUnmount() {
        this.state.firebaseRef && this.state.firebaseRef.off();
    },

    _updateUserLoginStatus(isOnline:boolean) {
        if (!this.state.firebaseRef) {
            this.setState({firebaseRef: new Firebase('https://ventureappinitial.firebaseio.com/')})
        }

        let ventureId = this.state.ventureId,
            usersListRef = this.state.firebaseRef && this.state.firebaseRef.child('users'),
            chatRoomsRef = this.state.firebaseRef && this.state.firebaseRef.child('chat_rooms'),
            currentUserRef = usersListRef && usersListRef.child(ventureId),
            loginStatusRef = currentUserRef && currentUserRef.child(`status/isOnline`);

        if (!isOnline) {

            loginStatusRef.set(false);
            currentUserRef.child('match_requests').set(null); // @hmm: clear users match interactions

            usersListRef.once('value', snapshot => {
                snapshot.val() && _.each(snapshot.val(), (user) => {
                    if (user.match_requests && user.match_requests[ventureId]) {
                        if(user.match_requests[ventureId].chatRoomId) {
                            chatRoomsRef.child(usersListRef.child(`${user.ventureId}/match_requests/${ventureId}/chatRoomId`)).set(null)
                        }
                        usersListRef.child(`${user.ventureId}/match_requests/${ventureId}`).set(null);
                    }

                    if (user.event_invite_match_requests && user.event_invite_match_requests[ventureId]) {
                        if(user.match_requests[ventureId].chatRoomId) {
                            chatRoomsRef.child(usersListRef.child(`${user.ventureId}/match_requests/${ventureId}/chatRoomId`)).set(null)
                        }
                        usersListRef.child(`${user.ventureId}/event_invite_match_requests/${ventureId}`).set(null);
                    }
                });
            });

            return;
        }

        if (isOnline && loginStatusRef) loginStatusRef.set(isOnline);

        currentUserRef.once('value', snapshot => {
            let asyncStorageAccountData = _.pick(snapshot.val(), 'ventureId', 'name', 'firstName', 'lastName', 'activityPreference', 'age', 'picture', 'bio', 'gender', 'matchingPreferences');

            // @hmm: slight defer to allow time for snapshot.val()
            this.setTimeout(() => {
                AsyncStorage.setItem('@AsyncStorage:Venture:account', JSON.stringify(asyncStorageAccountData))
                    .catch(error => console.log(error.message))
                    .done();
            }, 0);
        });
    },


    renderHeader() {
        return (
            <Header containerStyle={{backgroundColor: '#040A19'}}>
                <HomePageIcon onPress={() => {
                        this.props.navigator.popToTop();
                    }}/>
                <Text>MY PROFILE</Text>
                <EditProfilePageIcon
                    onPress={() => {
                          this.props.navigator.push({title: 'Edit Profile', component: EditProfilePage,  passProps: {firebaseRef: this.state.firebaseRef, ventureId: this.state.ventureId}});
                    }}/>
            </Header>
        )
    },

    render() {
        let _this = this,
            user = this.state.user,
            ventureId = this.state.ventureId;

        return (
            <VentureAppPage>
                <View>
                    {this.renderHeader()}
                </View>
                <Image defaultSource={require('../../../img/about.png')}
                       style={styles.backdrop}>
                    <View style={styles.loginContainer}>
                        <View>
                            { user && <Photo user={user}/> }
                            { user && ventureId &&
                            <Info firebaseRef={this.state.firebaseRef} ventureId={ventureId} user={user}/>}
                        </View>

                        <FBLogin style={styles.FBLoginButton}
                                 permissions={['email', 'user_friends']}
                                 onLogout={function(){
                                    if(user && ventureId) _this._updateUserLoginStatus(false);
                                    _this.setState({user : null, ventureId: null});
                                    _this.props.navigator.resetTo({title: 'Login', component: LoginPage});

                                     AsyncStorage.multiRemove(['@AsyncStorage:Venture:account', '@AsyncStorage:Venture:currentUser:friendsAPICallURL', '@AsyncStorage:Venture:currentUserFriends', '@AsyncStorage:Venture:isOnline'])
                                        .catch(error => console.log(error.message))
                                        .done();
                                }}

                                 onLoginFound={function(data){

                                _this.setState({ user : data.credentials, ventureId: hash(data.credentials.userId)});
                                console.log("Existing login found.");

                                }}

                                 onLoginNotFound={function(){

                                _this.setState({ user : null, ventureId: null });

                                console.log("No user logged in.");

                                }}

                                 onError={function(data){
                                console.error("Error in fetching facebook data: ", data);
                                }}

                                 onCancel={function(){
                                console.log("User cancelled.");
                                }}

                                 onPermissionsMissing={function(data){
                                console.error("Check permissions!");
                                }}
                            />
                    </View>
                </Image>
            </VentureAppPage>
        )
    },
});

var Photo = React.createClass({
    propTypes: {
        user: React.PropTypes.object.isRequired
    },

    render() {
        if (this.props.user.userId) {
            return (
                <Animatable.View ref="currentUserPhoto" style={styles.photoContent}>
                    <TouchableOpacity onPress={() => this.refs.currentUserPhoto.pulse(800)}>
                        <Image
                            style={
                    {
                      height: width/1.8,
                      width: width/1.8,
                      borderRadius: width/3.6,
                      bottom: 20
                    }
                  }
                            source={{uri: `https://res.cloudinary.com/dwnyawluh/image/facebook/q_80/${this.props.user.userId}.jpg`}}
                            />
                    </TouchableOpacity>
                </Animatable.View>
            );
        }
    }
});

var Info = React.createClass({
    propTypes: {
        firebaseRef: React.PropTypes.string,
        user: React.PropTypes.object.isRequired,
        ventureId: React.PropTypes.string
    },

    getInitialState() {
        return {
            info: null,
            firebaseRef: this.props.firebaseRef,
            firebaseCurrentUserDataRef: null,
            showLoadingModal: false
        };
    },

    mixins: [TimerMixin],

    componentWillMount() {
        let _this = this,
            firebaseCurrentUserDataRef = this.state.firebaseRef.child(`users/${this.props.ventureId}`);

        firebaseCurrentUserDataRef.on('value', snapshot =>
                _this.setState({
                    firebaseCurrentUserDataRef,
                    showLoadingModal: false,
                    info: {
                        firstName: snapshot.val() && snapshot.val().firstName,
                        gender: snapshot.val() && snapshot.val().gender,
                        age: snapshot.val() && snapshot.val().age,
                        bio: snapshot.val() && snapshot.val().bio
                    }
                })
        );
    },

    componentDidMount() {
        this.setTimeout(() => {
            if(_.isEmpty(this.state.info)) this.setState({showLoadingModal: true});
        }, 1000);
    },

    componentWillUnmount() {
        this.state.firebaseCurrentUserDataRef && this.state.firebaseCurrentUserDataRef.off();
    },

    render() {
        let info = this.state.info;

        return (
            <View>
                <View style={styles.infoContent}>
                    <Text
                        style={[styles.infoText, styles.infoTextNameAge]}>{ info && (info.firstName + ', ') } { info && info.age && info.age.value }</Text>
                    <Text
                        style={[styles.infoText, styles.infoTextGender]}>{ info && info.gender && info.gender.capitalize() }</Text>
                    <Text style={[styles.infoText, styles.infoTextBio]}>{ info && info.bio }</Text>
                </View>
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
                                {'\n\n'} GHeav makes almost three hundred Bacon, Egg, &amp; Cheeses every day.</Text>
                        </TouchableOpacity>
                    </View>
                </ModalBase>
            </View>
        );
    }
});

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width,
        backgroundColor: 'transparent'
    },
    FBLoginButton: {
        top: height / 16
    },
    infoContent: {
        paddingLeft: 20,
        paddingTop: 20
    },
    infoText: {
        color: 'white',
        fontSize: 18,
        fontFamily: 'AvenirNextCondensed-Medium'
    },
    infoTextBio: {
        width: width / 2,
        textAlign: 'left'
    },
    infoTextNameAge: {
        fontSize: 24
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
        backgroundColor: '#02030F'
    },
    modalView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    loginContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 20,
        padding: 20,
        bottom: 40,
        width,
        height
    },
    photoContent: {
        paddingTop: 20
    }
});

module.exports = ProfilePage;