/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule TabBarLayout
 * @flow
 */

import React, {
  AlertIOS,
  AsyncStorage,
  Component,
  Dimensions,
  LayoutAnimation,
  PushNotificationIOS,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import ChatsListPage from '../Pages/NavigationLayoutItems/ChatsListPage';
import EventsListPage from '../Pages/NavigationLayoutItems/EventsListPage';
import Firebase from 'firebase';
import HotPage from '../Pages/NavigationLayoutItems/HotPage';
import LoginPage from '../Pages/LoginPage.js'
import ProfilePage from '../Pages/NavigationLayoutItems/ProfilePage';
import UsersListPage from '../Pages/NavigationLayoutItems/UsersListPage';
import { TabBarIOS, } from 'react-native-icons';

const TabBarItemIOS = TabBarIOS.Item;
const {height} = Dimensions.get('window');
const TAB_BAR_ICON_SIZE = height / 24;
const TARGET_USERS = "Near Me";

import type { NavigationContext } from 'NavigationContext';

type Navigator = {
  navigationContext: NavigationContext,
  push: (route:{title: string, component: ReactClass<any,any,any>}) => void
};

type Props = {
  passProps: {
    currentUserFriends: React.PropTypes.array,
    currentUserLocationCoords: React.PropTypes.array,
    firebaseRef: React.PropTypes.string,
    navigator: Navigator,
    ventureId: React.PropTypes.string
  }
};

class TabBarLayout extends Component {
  constructor(props:Props) {
    super(props);
    this.state = {
      chatCount: 0,
      eventInviteRequestsCount: 0,
      matchRequestsCount: 0,
      firebaseRef: new Firebase('https://ventureappinitial.firebaseio.com/'),
      firstSession: this.props.firstSession, // @hmm: NOTE: get as prop first time, then subsequent times get updated version from firebase
      selectedTab: props.selectedTab
    }
  };

  componentWillMount() {
    let firebaseRef = this.props.firebaseRef,
      ventureId = this.props.ventureId,
      currentUserChatCount = firebaseRef.child(`users/${ventureId}/chatCount`);

    if (!this.props.firebaseRef) firebaseRef = new Firebase('https://ventureappinitial.firebaseio.com/');
    let firstSessionRef = firebaseRef.child(`users/${this.props.ventureId}/firstSession`);

    // @hmm: fetch first session object if it exists
    firstSessionRef.on('value', snapshot => {
      // @hmm: if all 10 tutorial achievements have been completed, then delete first session object
      if((_.values(snapshot.val())).length === 10 && _.every(_.values(snapshot.val()), v => v)) {
        firstSessionRef.set(null);
      }
      this.setState({firstSession: snapshot.val(), firstSessionRef});
    });

    currentUserChatCount.once('value', snapshot => {
      snapshot.val() && this.setState({chatCount: snapshot.val()});
    })

  }

  componentDidMount() {
    let firebaseRef = this.props.firebaseRef,
        ventureId = this.props.ventureId,
        currentUserRef = firebaseRef.child(`users/${ventureId}`),
        currentUserEventInviteMatchRequestsRef = currentUserRef.child('event_invite_match_requests'),
        currentUserMatchRequestsRef = currentUserRef.child('match_requests');

    if (!this.props.firebaseRef) firebaseRef = new Firebase('https://ventureappinitial.firebaseio.com/');

    currentUserMatchRequestsRef.on('value', snapshot => {
      let len;

      if(!snapshot.val()) len = 0;
      else len = _.size(snapshot.val());

      this.setState({chatCount: len + this.state.eventInviteRequestsCount, matchRequestsCount: len, currentUserMatchRequestsRef});
      currentUserRef.child('chatCount').set(this.state.chatCount);
      PushNotificationIOS.setApplicationIconBadgeNumber(this.state.chatCount)
    });

    // @hmm: literally count chats with current user's id in it to ensure accuracy
    currentUserEventInviteMatchRequestsRef.on('value', snapshot => {
      let len;

      if(!snapshot.val()) len = 0;
      else len = _.size(snapshot.val());

      this.setState({chatCount: len + this.state.matchRequestsCount, eventInviteRequestsCount: len, currentUserEventInviteMatchRequestsRef});
      currentUserRef.child('chatCount').set(this.state.chatCount);
      PushNotificationIOS.setApplicationIconBadgeNumber(this.state.chatCount)
    });

    // @hmm: ensure login markers synced
    let isOnlineRef = firebaseRef.child(`users/${ventureId}/status/isOnline`);
    isOnlineRef.once('value', (snapshot) => {
      if(!snapshot.val()) {
        isOnlineRef.set(true);
      }
    });

    // @hmm: backup - local login check
    AsyncStorage.getItem('@AsyncStorage:Venture:account')
      .then((account:string) => {
        if (!JSON.parse(account)) {
          this.navigateToLoginPage();
          AlertIOS.alert('Oops!', 'It looks like you\'re not logged in. Please sign out and then sign back in to continue.');
          return;
        }
      })
      .catch(error => console.log(error))
      .done();
  };

  componentWillUnmount() {
    // @hmm: this.state.firstSessionRef && this.state.firstSessionRef.off(); // @hmm: don't dismount this so that first Session obj persists and isnt overriden by home page firstSession prop
    this.state.currentUserMatchRequestsRef && this.state.currentUserMatchRequestsRef.off();
    this.state.currentUserEventInviteMatchRequestsRef && this.state.currentUserEventInviteMatchRequestsRef.off();

    AsyncStorage.setItem('@AsyncStorage:Venture:currentUserFriends', 'null')
      .catch(error => console.log(error.message))
      .done();
  };

  navigateToLoginPage() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.linear);
    this.props.navigator.replace({title: 'Login', component: LoginPage});
  };

  _renderContent(title:string) {
    if (title === 'hot') {
      return <HotPage currentUserFriends={this.props.currentUserFriends}
                      currentUserLocationCoords={this.props.currentUserLocationCoords}
                      firebaseRef={this.props.firebaseRef || this.state.firebaseRef}
                      firstSession={this.state.firstSession}
                      handleSelectedTabChange={(selectedTab) => {this.setState({selectedTab})}}
                      navigator={this.props.navigator}
                      ventureId={this.props.ventureId}/>;
    }

    else if (title === 'events') {
      return <EventsListPage currentUserFriends={this.props.currentUserFriends}
                             currentUserLocationCoords={this.props.currentUserLocationCoords}
                             firebaseRef={this.props.firebaseRef}
                             firstSession={this.state.firstSession}
                             navigator={this.props.navigator}
                             ventureId={this.props.ventureId}/>;
    }

    else if (title === 'users') {
      return <UsersListPage currentUserFriends={this.props.currentUserFriends}
                            currentUserLocationCoords={this.props.currentUserLocationCoords}
                            firebaseRef={this.props.firebaseRef}
                            firstSession={this.state.firstSession}
                            navigator={this.props.navigator}
                            ventureId={this.props.ventureId}/>;
    }

    else if (title === 'chats') {
      return <ChatsListPage currentUserFriends={this.props.currentUserFriends}
                            currentUserLocationCoords={this.props.currentUserLocationCoords}
                            firebaseRef={this.props.firebaseRef}
                            firstSession={this.state.firstSession}
                            navigator={this.props.navigator}
                            ventureId={this.props.ventureId}/>;
    }

    else if (title === 'profile') {
      return <ProfilePage currentUserFriends={this.props.currentUserFriends}
                          currentUserLocationCoords={this.props.currentUserLocationCoords}
                          firebaseRef={this.props.firebaseRef}
                          firstSession={this.state.firstSession}
                          navigator={this.props.navigator}/>;
    }

    else {
      return <View />;
    }
  };

  render() {
    return (
      <TabBarIOS
        tintColor="white"
        barTintColor="#02030f">
        <TabBarItemIOS
          title="Hot"
          iconName="ion|ios-flame-outline"
          selectedIconName="ion|ios-flame"
          iconSize={TAB_BAR_ICON_SIZE}
          selected={this.state.selectedTab === 'hot'}
          onPress={() => {
                    this.setState({
                      selectedTab: 'hot',
                    });
                  }}>
          {this._renderContent('hot')}
        </TabBarItemIOS>
        <TabBarItemIOS
          title="Events"
          iconName="ion|ios-calendar-outline"
          selectedIconName="ion|ios-calendar"
          iconSize={TAB_BAR_ICON_SIZE}
          selected={this.state.selectedTab === 'events'}
          onPress={() => {
                    this.setState({
                      selectedTab: 'events',
                    });
                  }}>
          {this._renderContent('events')}
        </TabBarItemIOS>
        <TabBarItemIOS
          title={TARGET_USERS || "Users"}
          iconName="ion|ios-people-outline"
          selectedIconName="ion|ios-people"
          iconSize={TAB_BAR_ICON_SIZE * 1.2}
          selected={this.state.selectedTab === 'users'}
          onPress={() => {
                    this.setState({
                      selectedTab: 'users',
                    });
                  }}>
          {this._renderContent('users')}
        </TabBarItemIOS>
        <TabBarItemIOS
          title="Chats"
          badgeValue={this.state.chatCount > 0 ? JSON.stringify(this.state.chatCount) : undefined}
          iconName="ion|ios-chatboxes-outline"
          selectedIconName="ion|ios-chatboxes"
          iconSize={TAB_BAR_ICON_SIZE}
          selected={this.state.selectedTab === 'chats'}
          onPress={() => {
                    this.setState({
                      selectedTab: 'chats'
                    });
                }}>
          {this._renderContent('chats')}
        </TabBarItemIOS>
        <TabBarItemIOS
          title="Profile"
          iconName="ion|ios-person-outline"
          selectedIconName="ion|ios-person"
          iconSize={TAB_BAR_ICON_SIZE * 1.2}
          selected={this.state.selectedTab === 'profile'}
          onPress={() => {
                    this.setState({
                        selectedTab: 'profile',
                    });
                 }}>
          {this._renderContent('profile')}
        </TabBarItemIOS>
      </TabBarIOS>
    )
  };
}

const styles = StyleSheet.create({});
module.exports = TabBarLayout;