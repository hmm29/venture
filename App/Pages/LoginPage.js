/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule LoginPage
 * @flow
 */

'use strict';

var React = require('react-native');

var {
  AlertIOS,
  AsyncStorage,
  Image,
  InteractionManager,
  LayoutAnimation,
  PixelRatio,
  PushNotificationIOS,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
  } = React;

var _ = require('lodash');
var BrandLogo = require('../Partials/BrandLogo');
var ChevronIcon = require('../Partials/Icons/ChevronIcon');
var Dimensions = require('Dimensions');
var FBLogin = require('react-native-facebook-login');
var FBLoginManager = require('NativeModules').FBLoginManager;
var Firebase = require('firebase');
var {GoogleSignin, GoogleSigninButton} = require('react-native-google-signin');
var sha256 = require('sha256');
var Swiper = require('react-native-swiper');
var TimerMixin = require('react-timer-mixin');
var VentureAppPage = require('./Base/VentureAppPage');

var {height, width} = Dimensions.get('window');
var AUTH_USER_VENTURE_ID = '86287ca4d83f074c0fd020b2211dc039e81a2ef8508818dddaa052fb9ce1a484';
var FACEBOOK_LOGIN_REF = 'facebookLogin';
var GOOGLE_LOGIN_REF = 'googleLogin';
var LOGO_WIDTH = 200;
var LOGO_HEIGHT = 120;

var IS_NOT_VALID_USER_TEXT = "Oops! It appears you are not eligible to use Venture at this time! \n\nBut no worries: the app will be coming to your area very soon!"
var VERIFY_UNIVERSITY_EMAIL_TEXT = "At the moment, Venture is exclusively for Yale University students. \n\nTo use Venture, please verify your Yale email address below!";

String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

var getInitialAgeRangeLimits = (ageVal:number, lim:string) => {
  if (lim === 'upper') {
    if (ageVal <= 18) return 19;
    else return ageVal + (ageVal - 18);
  } else if (lim === 'lower') {
    if (ageVal <= 18) return 18;
    else return ageVal - (ageVal - 18);
  } else {
    return -1;
  }
};

var hash = (msg:string) => sha256(sha256(sha256(msg)));

var LoginPage = React.createClass({
  statics: {
    title: '<LoginPage/>',
    description: 'Log into the Venture App.'
  },

  propTypes: {
    navigator: React.PropTypes.object
  },

  mixins: [TimerMixin],

  getInitialState() {
    return {
      asyncStorageAccountData: null,
      firebaseRef: new Firebase('https://ventureappinitial.firebaseio.com/'),
      loginError: false,
      mustVerify: false,
      notificationModalText: VERIFY_UNIVERSITY_EMAIL_TEXT,
      showEmailAuthScreen: false,
      user: null,
    }
  },

  componentDidMount() {
    // TODO: ensure user is logged out when component mounts, otherwise component may read Log Out
    // if(GoogleSignin.currentUser()) GoogleSignin.signOut();

    InteractionManager.runAfterInteractions(() => {
      this.state.firebaseRef && this.state.firebaseRef.child('users/authPanel/showEmailAuthScreen').once('value', snapshot => {
        if (snapshot.val() === true || snapshot.val() === 'true') {
          AsyncStorage.getItem('@AsyncStorage:Venture:isValidUser')
            .then((isValidUser) => {
              if(!JSON.parse(isValidUser)) {
                this.setTimeout(() => {
                  this.setState({showEmailAuthScreen: true});
                }, 500);
              }
            })
        }
      });
    });

    PushNotificationIOS.setApplicationIconBadgeNumber(0);

    // @hmm: remove account when coming from home page for login redirect
    AsyncStorage.removeItem('@AsyncStorage:Venture:account')
      .catch(error => console.log(error.message))
      .done();

    // @hmm: email verification using Google
    GoogleSignin.configure({
      iosClientId: '52968692525-a6nhs31vnm9itavou919j4jcm2hr9dtc.apps.googleusercontent.com',
      webClientId: '52968692525-k8vd63becih12heieiskrvbf453h1c8r.apps.googleusercontent.com',
      offlineAccess: true
    });
  },

  _createAccount() {
    let user = this.state.user,
      ventureId = this.state.ventureId,
      api = `https://graph.facebook.com/v2.3/${user && user.userId}?fields=name,email,gender,age_range&access_token=${user.token}`;

    fetch(api)
      .then(response => response.json())
      .then(responseData => {
        let ageRange = responseData.age_range;


        if (!ageRange) {
          this.setState({loginError: true});
          return;
        }

        if (ageRange.max && ageRange.min && ageRange.max === 17 && ageRange.min === 13) {
          this.state.firebaseRef.child(`users/${ventureId}/age/value`).set(17);
          this._setAsyncStorageAccountData();
        }

        else if (ageRange.max && ageRange.min && ageRange.max === 20 && ageRange.min === 18) {
          AlertIOS.alert(
            'Venture: Specify Your Age',
            'Venture uses age to give you the best experience with activity partners.',
            [
              {
                text: '18', onPress: () => {
                this.state.firebaseRef.child(`users/${ventureId}/age/value`).set(18);
                this._setAsyncStorageAccountData();
              }
              },
              {
                text: '19', onPress: () => {
                this.state.firebaseRef.child(`users/${ventureId}/age/value`).set(19);
                this._setAsyncStorageAccountData();
              }
              },
              {
                text: '20', onPress: () => {
                this.state.firebaseRef.child(`users/${ventureId}/age/value`).set(20);
                this._setAsyncStorageAccountData();
              }
              }
            ]
          )
        }

        else if (ageRange.min && ageRange.min === 21) {
          AlertIOS.alert(
            'Venture: Specify Your Age',
            'Venture uses age to give you the best experience with activity partners.',
            [
              {
                text: '21', onPress: () => {
                this.state.firebaseRef.child(`users/${ventureId}/age/value`).set(21);
                this._setAsyncStorageAccountData();
              }
              },
              {
                text: '22', onPress: () => {
                this.state.firebaseRef.child(`users/${ventureId}/age/value`).set(22);
                this._setAsyncStorageAccountData();
              }
              },
              {
                text: '23', onPress: () => {
                this.state.firebaseRef.child(`users/${ventureId}/age/value`).set(23);
                this._setAsyncStorageAccountData();
              }
              },
              {
                text: '24', onPress: () => {
                this.state.firebaseRef.child(`users/${ventureId}/age/value`).set(24);
                this._setAsyncStorageAccountData();
              }
              },
              {
                text: '25', onPress: () => {
                this.state.firebaseRef.child(`users/${ventureId}/age/value`).set(25);
                this._setAsyncStorageAccountData();
              }
              },
              {
                text: '25+', onPress: () => {
                this.state.firebaseRef.child(`users/${ventureId}/age/value`).set('25+');
                this._setAsyncStorageAccountData();
              }
              }
            ]
          )
        }

        let newUserData = {
          ventureId,
          name: responseData.name,
          firstName: responseData.name.split(' ')[0],
          lastName: responseData.name.split(' ')[1],
          activityPreference: {
            title: 'EXPLORE?',
            status: 'now',
            start: {
              time: '',
              dateTime: '',
              timeZoneOffsetInHours: ''
            },
            tags: [],
            created: new Date(),
            updated: new Date()
          },
          picture: `https://res.cloudinary.com/dwnyawluh/image/facebook/q_70/${this.state.user.userId}.jpg`,
          gender: responseData.gender,
          bio: 'New to Venture!',
          email: responseData.email,
          location: {
            type: 'Point',
            coordinates: []
          },
          matchingPreferences: {
            maxSearchDistance: 10.0,
            ageRangeLower: getInitialAgeRangeLimits(responseData.age_range.min, 'lower'),
            ageRangeUpper: getInitialAgeRangeLimits(responseData.age_range.min, 'upper'),
            gender: ['male', 'female', 'other'],
            privacy: ['friends', 'friends+', 'all']
          },
          discoveryPreferences: {
            genderInclusions: [responseData.gender]
          },
          status: {
            isOnline: true
          },
          match_requests: {},
          events: [],
          event_invite_match_requests: {},
          createdAt: new Date(),
          firstSession: {
            hasSeenAddInfoButtonTutorial: false,
            hasSentFirstRequest: false,
            hasReceivedFirstRequest: false,
            hasMatched: false,
            hasSeenSearchPreferencesIcon: false,
            hasStartedFirstChat: false,
            hasVisitedChatsListPage: false,
            hasVisitedEventsPage: false,
            hasVisitedHotPage: false,
            hasVisitedEditProfilePage: false
          }
        };

        this.state.firebaseRef.child(`users/${ventureId}`).set(newUserData);
      })
      .done();
  },

  _navigateToHomePage() {
    var HomePage = require('../Pages/HomePage'); // @hmm: MUST MUST MUST include HomePage require here for lazy load
    this.props.navigator.replace({title: 'Home', component: HomePage}); // @hmm: use replace method for best transition
  },

  _setAsyncStorageAccountData() {
    let ventureId = this.state.ventureId,
      currentUserRef = this.state.firebaseRef && this.state.firebaseRef.child(`users/${ventureId}`);

    currentUserRef.once('value', snapshot => {
      let asyncStorageAccountData = _.pick(snapshot.val(), 'ventureId', 'name', 'firstName', 'lastName',
        'activityPreference', 'age', 'picture', 'bio', 'gender', 'matchingPreferences');

      AsyncStorage.setItem('@AsyncStorage:Venture:account', JSON.stringify(asyncStorageAccountData))
        .then(() => this._navigateToHomePage())
        .catch(error => console.log(error.message))
        .done();
    });
  },

  _signInWithGoogleAccount() {
    GoogleSignin.signIn()
      .then((user) => {
        if (user && _.endsWith(user.email, '@yale.edu')) {
          this.setState({showEmailAuthScreen: false});
          AsyncStorage.setItem('@AsyncStorage:Venture:isValidUser', 'true')
            .then(() => {
              if (this.state.showEmailAuthScreen) this.setState({showEmailAuthScreen: false});
              AlertIOS.alert('Verification Successful', 'Welcome to Venture!\n\nSwipe to continue!');
              console.log("Successfully verified as a valid user.")
            })
            .catch((error) => console.log(error.message))
            .done();
        } else {
          this.setState({notificationModalText: IS_NOT_VALID_USER_TEXT});
        }
      })
      .catch((err) => {
        if (err.code === -5) {
          //@hmm: must reconfigure if user cancels out of google signin modal
          GoogleSignin.configure({
            iosClientId: '52968692525-a6nhs31vnm9itavou919j4jcm2hr9dtc.apps.googleusercontent.com',
            webClientId: '52968692525-k8vd63becih12heieiskrvbf453h1c8r.apps.googleusercontent.com',
            offlineAccess: true
          });
        } else {
          console.log('WRONG SIGNIN', err);
        }
      })
      .done();
  },

  _updateUserLoginStatus(isOnline:boolean) {
    let ventureId = this.state.ventureId,
      currentUserRef = this.state.firebaseRef.child(`users/${ventureId}`),
      loginStatusRef = currentUserRef.child(`status/isOnline`),
      _this = this;

    loginStatusRef.once('value', snapshot => {
      if (snapshot.val() === null) _this._createAccount(ventureId);
      else if (isOnline) {
        loginStatusRef.set(isOnline);

        currentUserRef.once('value', snapshot => {
          let asyncStorageAccountData = _.pick(snapshot.val(), 'ventureId', 'name', 'firstName',
            'lastName', 'activityPreference', 'age', 'picture', 'bio', 'gender', 'matchingPreferences');

          // @hmm: for launch, show tutorial every time user logs in
          this.state.firebaseRef.child(`users/${ventureId}/firstSession`).set({
            hasSeenAddInfoButtonTutorial: false,
            hasSentFirstRequest: false,
            hasReceivedFirstRequest: false,
            hasMatched: false,
            hasSeenSearchPreferencesIcon: false,
            hasStartedFirstChat: false,
            hasVisitedChatsListPage: false,
            hasVisitedEventsPage: false,
            hasVisitedHotPage: false,
            hasVisitedEditProfilePage: false
          });

          // @hmm: defer until after snapshot.val() has been called
          this.setTimeout(() => {
            AsyncStorage.setItem('@AsyncStorage:Venture:account', JSON.stringify(asyncStorageAccountData))
              .then(() => {
                this._navigateToHomePage();
              })
              .catch(error => console.log(error.message))
              .done();
          }, 0);
        });
      }
    });
  },

  render() {
    let _this = this;

    return (
      <VentureAppPage>
        {!this.state.showEmailAuthScreen ? <Image>
          <Swiper style={styles.wrapper}
                  dot={<View style={{backgroundColor:'rgba(255,255,255,.3)', width: 13,
                            height: 13,borderRadius: 7, top: height / 30, marginLeft: 7, marginRight: 7}} />}
                  activeDot={<View style={{backgroundColor: '#fff', width: 13, height: 13,
                            borderRadius: 7, top: height / 30, marginLeft: 7, marginRight: 7}} />}
                  paginationStyle={{bottom: height/22}}
                  loop={false}
                  showsButtons={true}
                  prevButton={
                    <ChevronIcon
                      isStatic={true}
                      size={width/11}
                      direction={'left'}
                      style={{}}/>
                  }
                  nextButton={<ChevronIcon
                      isStatic={true}
                      size={width/11}
                      direction={'right'}
                      style={{}}/>}>
            <View style={styles.slide}>
              <Image
                onLoadStart={() => LayoutAnimation.configureNext(LayoutAnimation.Presets.linear)}
                resizeMode={Image.resizeMode.stretch}
                defaultSource={require('../../img/onboarding_1_what_do_you_want_to_do.png')}
                source={require('../../img/onboarding_1_what_do_you_want_to_do.png')}
                style={styles.backdrop}>
              </Image>
            </View>
            <View style={styles.slide}>
              <Image
                resizeMode={Image.resizeMode.stretch}
                source={require('../../img/onboarding_2_find_activity_partners.png')}
                style={styles.backdrop}>
              </Image>
            </View>
            <View style={styles.slide}>
              <Image
                resizeMode={Image.resizeMode.stretch}
                source={require('../../img/onboarding_3_share_your_activities.png')}
                style={styles.backdrop}>
              </Image>
            </View>
            <View style={styles.slide}>
              <Image
                resizeMode={Image.resizeMode.stretch}
                source={require('../../img/onboarding_4_connect_to_campus.png')}
                style={styles.backdrop}>
              </Image>
            </View>
            <View style={styles.slide}>
              <Image
                resizeMode={Image.resizeMode.stretch}
                source={require('../../img/onboarding_5_5_minute_matches.png')}
                style={styles.backdrop}>
              </Image>
            </View>
            <View style={styles.slide}>
              <Image
                resizeMode={Image.resizeMode.stretch}
                source={require('../../img/onboarding_6_no_saved_conversations.png')}
                style={styles.backdrop}>
              </Image>
            </View>
            <View style={styles.slide}>
              <Image
                resizeMode={Image.resizeMode.stretch}
                source={require('../../img/onboarding_7_log_in_with_facebook.png')}
                style={styles.backdrop}>

                <FBLogin ref={FACEBOOK_LOGIN_REF}
                         style={{ top: height/2.4 }}
                         permissions={['email','user_friends']}
                         loginBehavior={FBLoginManager.LoginBehaviors.Native}
                         onLogin={function(data){
                                            Firebase.goOnline();

                                            let friendsAPICallURL = `https://graph.facebook.com/v2.3/${data.credentials
                                            && data.credentials.userId}/friends?access_token=${data.credentials
                                            && data.credentials.token}`,
                                            ref = new Firebase('https://ventureappinitial.firebaseio.com/');

                                            _this.setState({user: data.credentials,
                                            ventureId: hash(data.credentials.userId)});

                                            ref.authWithOAuthToken("facebook", data.credentials.token, function(error, authData) {
                                             if (error) {
                                               alert("Login Failed!", error);
                                             } else {
                                               console.log("Authenticated successfully with payload: "+JSON.stringify(authData));
                                             }
                                           });

                                           AsyncStorage.setItem('@AsyncStorage:Venture:authToken', data.credentials.token)
                                            .then(() => {
                                              console.log('Set auth token.')
                                            })
                                            .catch(error => console.log(error.message))
                                            .done();

                                           AsyncStorage.setItem('@AsyncStorage:Venture:currentUser:friendsAPICallURL',
                                           friendsAPICallURL)
                                            .then(() => {
                                               _this._updateUserLoginStatus(true);

                                               if(_this.state.loginError) return;
                                            })
                                            .catch(error => console.log(error.message))
                                            .done();

                                          AsyncStorage.setItem('@AsyncStorage:Venture:isOnline', 'true')
                                            .then(() => console.log('Logged in!'))
                                            .catch((error) => console.log(error.message))
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
                                    AlertIOS.alert('Login Error', 'The Facebook Login seems to be having trouble at this time. Redownloading the app should fix the issue.');
                                    console.log("Error in fetching facebook data: ", data);
                                }}

                         onCancel={function(){
                                    console.log("User cancelled.");
                                }}

                         onPermissionsMissing={function(data){
                                    console.error("Check permissions!");
                                }}/>
              </Image>
            </View>
          </Swiper>
        </Image>
          :
          <View
            style={styles.showEmailAuthScreen}>
            <View style={styles.modalView}>
              <BrandLogo
                logoContainerStyle={styles.logoContainerStyle}
                logoStyle={styles.logoStyle}/>
              <Text
                style={styles.notificationModalText}>
                {'\n\n'} {this.state.notificationModalText}</Text>
              {this.state.notificationModalText !== IS_NOT_VALID_USER_TEXT ?
                <GoogleSigninButton
                  ref={GOOGLE_LOGIN_REF}
                  style={{width: 185, height: 48, bottom: height / 16}}
                  size={GoogleSigninButton.Size.Wide}
                  color={GoogleSigninButton.Color.Dark}
                  onPress={this._signInWithGoogleAccount}/> : <View />}
            </View>
          </View> }
      </VentureAppPage>
    )
  }
});

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'column',
    alignItems: 'center',
    width: null,
    height: null
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
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: height / 12
  },
  notificationModalStyle: {
    backgroundColor: '#010634'
  },
  notificationModalText: {
    color: '#fff',
    fontFamily: 'AvenirNextCondensed-Medium',
    textAlign: 'center',
    fontSize: 18,
    alignSelf: 'center',
    width: width / 1.2,
    bottom: height / 5,
    backgroundColor: 'transparent',
    padding: width / 15,
    borderRadius: width / 10
  },
  notificationModalTextTitle: {
    fontSize: height / 30
  },
  showEmailAuthScreen: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#010634'
  },
  slide: {
    flex: 1,
    backgroundColor: 'transparent'
  },
  wrapper: {
    backgroundColor: '#000'
  }
});

module.exports = LoginPage;