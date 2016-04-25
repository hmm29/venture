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
  InteractionManager,
  LayoutAnimation,
  NativeModules,
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
var FBLoginManager = require('NativeModules').FBLoginManager;
var FBSDKShare = require('react-native-fbsdkshare');
var {
  FBSDKAppInviteContent,
  FBSDKAppInviteDialog
  } = FBSDKShare;

var Firebase = require('firebase');
var Header = require('../../Partials/Header');
var HomePageIcon = require('../../Partials/Icons/NavigationButtons/HomePageIcon');
var InviteUserIcon = require('../../Partials/Icons/InviteUserIcon');
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
  mixins: [TimerMixin],

  statics: {
    title: '<ProfilePage/>',
    description: 'See current user info.'
  },

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

      // @hmm: clean up user session: remove old match requests
      currentUserRef.child('match_requests').once('value', snapshot => {
        snapshot.val() && _.each(snapshot.val(), (match) => {
          if (match && match._id) {
            currentUserRef.child(`match_requests/${match._id}`).set(null);
            usersListRef.child(`${match._id}/match_requests/${ventureId}`).set(null);
          }
          if (match && match.chatRoomId) {
            chatRoomsRef.child(match.chatRoomId).set(null)
          }
        });
      });

      // @hmm: remove old event invite match requests
      currentUserRef.child('event_invite_match_requests').once('value', snapshot => {
        snapshot.val() && _.each(snapshot.val(), (match) => {
          if (match && match._id) {
            currentUserRef.child(`event_invite_match_requests/${match._id}`).set(null);
            usersListRef.child(`${match._id}/event_invite_match_requests/${ventureId}`).set(null);
          }
          if (match && match.chatRoomId) {
            chatRoomsRef.child(match.chatRoomId).set(null)
          }
        });
      });

      currentUserRef.child('match_requests').set(null); // @hmm: clear users match interactions
      currentUserRef.child('event_invite_match_requests').set(null); // @hmm: clear users match interactions
      currentUserRef.child('chatCount').set(0); //@hmm: set chat count to 0
    }
  },

  _openAppInviteDialog() {
    // @hmm: Build up an app invite link.
    var linkContent = new FBSDKAppInviteContent('https://fb.me/595538540605551',
      'http://res.cloudinary.com/dwnyawluh/image/upload/c_scale,w_1200/v1455585747/Venture_Signature_180x180_hwbaqu.png');

    FBSDKAppInviteDialog.canShow((result) => {
      if(result) {
        FBSDKAppInviteDialog.setContent(linkContent);
        FBSDKAppInviteDialog.show((error, result) => {
          if (!error) {
            if (result && result.isCancelled) {

            }
          } else {
            alert('Error sharing.');
          }
        });
      } else {
        alert('Cannot show App Invite Dialog at this time.')
      }
    })
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
                          this.props.navigator.push({title: 'Edit Profile', component: EditProfilePage,
                          passProps: {
                          defaultFacebookProfilePhoto:
                          this.state.user && `https://res.cloudinary.com/dwnyawluh/image/facebook/q_10/${this.state.user.userId}.jpg`,
                          firebaseRef: this.state.firebaseRef,
                          firstSession: this.props.firstSession,
                          ventureId: this.state.ventureId}});
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
        <Image defaultSource={require('../../../img/about.jpg')}
               style={styles.backdrop}>
          <View style={styles.loginContainer}>
            <View>
              { user &&
              <Photo firebaseRef={this.state.firebaseRef}
                     user={user}
                     ventureId={ventureId}/> }
              { user && ventureId &&
              <Info firebaseRef={this.state.firebaseRef} user={user} ventureId={ventureId}/>}
            </View>

            <View style={{flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', top: height/16}}>
              <FBLogin style={this.state.user ? styles.FBLoginButton : {}}
                       permissions={['email', 'user_friends']}
                       loginBehavior={FBLoginManager.LoginBehaviors.Native}
                       onLogout={function(){
                                    if(user && ventureId) _this._updateUserLoginStatus(false);
                                    _this.setState({user : null, ventureId: null});
                                    _this.props.navigator.resetTo({title: 'Login', component: LoginPage});

                                    _this.state.firebaseRef && _this.state.firebaseRef.unauth();
                                    Firebase.goOffline();

                                     // @hmm: clean up async storage cache, except isValidUser bool marker
                                     AsyncStorage.multiRemove(['@AsyncStorage:Venture:account', '@AsyncStorage:Venture:authToken',
                                     '@AsyncStorage:Venture:currentUser:friendsAPICallURL',
                                     '@AsyncStorage:Venture:currentUserFriends', '@AsyncStorage:Venture:isOnline'
                                     ])
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
              <InviteUserIcon
                color="#fff"
                onPress={this._openAppInviteDialog}
                />
            </View>
          </View>
        </Image>
      </VentureAppPage>
    )
  },
});

var Photo = React.createClass({
  propTypes: {
    firebaseRef: React.PropTypes.object.isRequired,
    onPress: React.PropTypes.func,
    user: React.PropTypes.object.isRequired,
    ventureId: React.PropTypes.string
  },

  getInitialState() {
    return {
      currentPic: null,
    }
  },

  mixins: [TimerMixin],

  _handle: null,

  componentWillMount() {
    this.props.firebaseRef.child(`users/${this.props.ventureId}/picture`).on('value', snapshot => {
      this.setState({
        currentPic: snapshot.val(),
        currentUserPictureRef: this.props.firebaseRef.child(`users/${this.props.ventureId}/picture`)
      })
    });
  },

  componentWillUnmount() {
    this.state.currentUserPictureRef && this.state.currentUserPictureRef.off();
  },

  render() {
      return (
        <Animatable.View ref="currentUserPhoto" style={styles.photoContent}>
          <TouchableOpacity onPress={() => {
                        this.refs.currentUserPhoto.pulse(800);
                        this.props.onPress && this.props.onPress();
                    }}>
            <Image
              style={
                    {
                      height: width/1.8,
                      width: width/1.8,
                      borderRadius: width/3.6,
                      bottom: 20
                    }
                  }
              source={{uri: this.state.currentPic
                            || `https://res.cloudinary.com/dwnyawluh/image/facebook/q_10/${this.props.user && this.props.user.userId}.jpg`}}
              />
          </TouchableOpacity>
        </Animatable.View>
      );
  }
});

var Info = React.createClass({
  propTypes: {
    firebaseRef: React.PropTypes.object.isRequired,
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
      currentUserDataRef = this.state.firebaseRef.child(`users/${this.props.ventureId}`);

    currentUserDataRef.on('value', snapshot =>
        _this.setState({
          currentUserDataRef,
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

  componentWillUnmount() {
    this.state.currentUserDataRef && this.state.currentUserDataRef.off();
  },

  componentDidMount() {
    InteractionManager.runAfterInteractions(() => {
      this.setTimeout(() => {
        if (_.isEmpty(this.state.info)) this.setState({showLoadingModal: true});
        this.setTimeout(() => {
          if (this.state.showLoadingModal) this.setState({showLoadingModal: false});
        }, 5000); // @hmm: timeout for loading modal
      }, 2000);
    });
  },

  componentWillUnmount() {
    this.state.currentUserDataRef && this.state.currentUserDataRef.off();
  },

  render() {
    let info = this.state.info;

    return (
      <View>
        <View style={styles.infoContent}>
          <Text
            style={[styles.infoText, styles.infoTextNameAge]}>{ info && (info.firstName + ', ') }
            { info && info.age && info.age.value }</Text>
          <Text
            style={[styles.infoText, styles.infoTextGender]}>{ info && info.gender
          && info.gender.capitalize() }</Text>
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
                {'\n\n'} GHeav makes almost three hundred Bacon, Egg, &amp; Cheeses everyday.</Text>
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
    marginHorizontal: width / 40
  },
  infoContent: {
    width: width/1.8,
    paddingTop: 20,
    paddingLeft: width/18.75
  },
  infoText: {
    color: 'white',
    fontSize: (width < 420 ? 18 : 30),
    fontFamily: 'AvenirNextCondensed-Medium'
  },
  infoTextBio: {
    width: width / 2,
    textAlign: 'left'
  },
  infoTextNameAge: {
    fontSize: (width < 420 ? 24 : 36)
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
  loginContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 20,
    bottom: 40,
    width,
    height
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
  photoContent: {
    paddingTop: 20
  }
});

module.exports = ProfilePage;
