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
    AsyncStorage,
    Component,
    Dimensions,
    PushNotificationIOS,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import ChatsListPage from '../Pages/NavigationLayoutItems/ChatsListPage';
import EventsListPage from '../Pages/NavigationLayoutItems/EventsListPage';
import HotPage from '../Pages/NavigationLayoutItems/HotPage';
import ProfilePage from '../Pages/NavigationLayoutItems/ProfilePage';
import UsersListPage from '../Pages/NavigationLayoutItems/UsersListPage';
import Firebase from 'firebase'


import { TabBarIOS, } from 'react-native-icons';
let TabBarItemIOS = TabBarIOS.Item;

var {height} = Dimensions.get('window');

const TAB_BAR_ICON_SIZE = height/24;

import type { NavigationContext } from 'NavigationContext';

const CATEGORY_OF_USERS = "Yalies";

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
            firebaseRef: new Firebase('https://ventureappinitial.firebaseio.com/'),
            selectedTab: props.selectedTab
        }
    };

    componentDidMount() {
        let firebaseRef = this.props.firebaseRef;

        if(!this.props.firebaseRef) firebaseRef = new Firebase('https://ventureappinitial.firebaseio.com/')
        let chatCountRef = firebaseRef.child(`users/${this.props.ventureId}/chatCount`);

        chatCountRef.on('value', snapshot => {
            this.setState({chatCount: snapshot.val(), chatCountRef});
            PushNotificationIOS.setApplicationIconBadgeNumber(snapshot.val());
        });
    };

    componentWillUnmount() {
        this.state.chatCountRef && this.state.chatCountRef.off();

        AsyncStorage.setItem('@AsyncStorage:Venture:currentUserFriends', 'null')
            .catch(error => console.log(error.message))
            .done();
    };

    _renderContent(title:string) {
        if(title === 'hot') {
            return <HotPage currentUserFriends={this.props.currentUserFriends}
                            currentUserLocationCoords={this.props.currentUserLocationCoords}
                            firebaseRef={this.props.firebaseRef || this.state.firebaseRef}
                            handleSelectedTabChange={(selectedTab) => {this.setState({selectedTab})}} // change tab to events when event on hot page is pressed
                            navigator={this.props.navigator}
                            ventureId={this.props.ventureId}/>;
        }

        else if (title === 'events') return <EventsListPage currentUserFriends={this.props.currentUserFriends}
                                                            currentUserLocationCoords={this.props.currentUserLocationCoords}
                                                            firebaseRef={this.props.firebaseRef}
                                                            navigator={this.props.navigator}
                                                            ventureId={this.props.ventureId}/>;
        else if (title === 'users')
            return <UsersListPage currentUserFriends={this.props.currentUserFriends}
                                  currentUserLocationCoords={this.props.currentUserLocationCoords}
                                  firebaseRef={this.props.firebaseRef}
                                  navigator={this.props.navigator}
                                  ventureId={this.props.ventureId}/>;
        else if (title === 'chats')
            return <ChatsListPage currentUserFriends={this.props.currentUserFriends}
                                  currentUserLocationCoords={this.props.currentUserLocationCoords}
                                  firebaseRef={this.props.firebaseRef}
                                  navigator={this.props.navigator}
                                  ventureId={this.props.ventureId}/>;
        else if (title === 'profile')
            return <ProfilePage currentUserFriends={this.props.currentUserFriends}
                                currentUserLocationCoords={this.props.currentUserLocationCoords}
                                firebaseRef={this.props.firebaseRef}
                                navigator={this.props.navigator}/>;
        else return <View />;
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
                    title={CATEGORY_OF_USERS || "Users"}
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

const styles = StyleSheet.create({
});

module.exports = TabBarLayout;