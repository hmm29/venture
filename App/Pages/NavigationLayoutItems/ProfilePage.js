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
var Dimensions = require('Dimensions');
var EditProfilePageIcon = require('../../Partials/Icons/NavigationButtons/EditProfilePageIcon');
var EditProfilePage = require('../EditProfilePage');
var FBLogin = require('react-native-facebook-login');
var Firebase = require('firebase');
var Header = require('../../Partials/Header');
var HomePageIcon = require('../../Partials/Icons/NavigationButtons/HomePageIcon');
var LoginPage = require('../LoginPage');
var ModalBase = require('../../Partials/ModalBase');
var sha256 = require('sha256');
var TimerMixin = require('react-timer-mixin');
var VentureAppPage = require('../Base/VentureAppPage');

var {height, width} = Dimensions.get('window');

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
            currentUserRef = usersListRef && usersListRef.child(ventureId),
            loginStatusRef = currentUserRef && currentUserRef.child(`status/isOnline`);

        if (!isOnline) {

            loginStatusRef.set(false);
            currentUserRef.child('match_requests').set(null); // @hmm: clear users match interactions

            usersListRef.once('value', snapshot => {
                snapshot.val() && _.each(snapshot.val(), (user) => {
                    if (user.match_requests && user.match_requests[ventureId]) {
                        usersListRef.child(`${user.ventureId}/match_requests/${ventureId}`).set(null);
                    }

                    if (user.event_invite_match_requests && user.event_invite_match_requests[ventureId]) {
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
                    .then(() => this._navigateToNextPage())
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
                    }} style={{right: 14}}/>
                <Text>MY PROFILE</Text>
                <EditProfilePageIcon
                    onPress={() => {
                          this.props.navigator.push({title: 'Edit Profile', component: EditProfilePage,  passProps: {firebaseRef: this.state.firebaseRef, ventureId: this.state.ventureId}});
                    }} style={{left: 14}}/>
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
                            { user && ventureId && <Info firebaseRef={this.state.firebaseRef} ventureId={ventureId} user={user}/>}
                        </View>

                        <FBLogin style={styles.FBLoginButton}
                                 permissions={['email', 'user_friends']}
                                 onLogout={function(){

                                    _this.props.navigator.resetTo({title: 'Login', component: LoginPage});

                                    if(user && ventureId) _this._updateUserLoginStatus(false);
                                    _this.setState({user : null, ventureId: null});

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
                <View style={styles.photoContent}>
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
                </View>
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
            renderLoadingView: false
        };
    },
    componentWillMount() {
        let _this = this,
            firebaseCurrentUserDataRef = this.state.firebaseRef.child(`users/${this.props.ventureId}`);

        firebaseCurrentUserDataRef.on('value', snapshot =>
                _this.setState({
                    firebaseCurrentUserDataRef,
                    renderLoadingView: false,
                    info: {
                        firstName: snapshot.val() && snapshot.val().firstName,
                        gender: snapshot.val() && snapshot.val().gender,
                        age: snapshot.val() && snapshot.val().age,
                        bio: snapshot.val() && snapshot.val().bio
                    }
                })
        );
    },

    componentWillUnmount() {
        this.state.firebaseCurrentUserDataRef && this.state.firebaseCurrentUserDataRef.off();
    },

    render() {
        if (this.state.renderLoadingView) {
            return this._renderLoadingView();
        }

        let info = this.state.info;

        return (
            <View style={styles.infoContent}>
                <Text
                    style={[styles.infoText, styles.infoTextNameAge]}>{ info && (info.firstName + ', ') } { info && info.age && info.age.value }</Text>
                <Text
                    style={[styles.infoText, styles.infoTextGender]}>{ info && info.gender && info.gender.capitalize() }</Text>
                <Text style={[styles.infoText, styles.infoTextBio]}>{ info && info.bio }</Text>
            </View>
        );
    },

    _renderLoadingView() {
        return (
            <ModalBase
                animated={true}
                modalVisible={true}
                transparent={false}>
                <View style={{alignSelf: 'center', backgroundColor: 'green'}}>
                    <Text style={{color: '#fff'}}>Loading...</Text>
                    <ActivityIndicatorIOS
                        color='#eee'
                        animating={true}
                        style={styles.loadingViewActivityIndicatorIOS}
                        size="small"/>
                </View>
            </ModalBase>
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
    loadingViewActivityIndicatorIOS: {
        height: 80,
        alignSelf: 'center'
    },
    loadingViewContainer: {
        flex: 1,
        alignItems: 'center',
        width,
        height
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