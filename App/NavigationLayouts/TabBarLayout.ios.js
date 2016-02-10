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
    Component,
    StyleSheet,
    TabBarIOS,
    Text,
    View,
} from 'react-native';

import ChatsListPage from '../Pages/NavigationLayoutItems/ChatsListPage';
import EventsListPage from '../Pages/NavigationLayoutItems/EventsListPage';
import HotPage from '../Pages/NavigationLayoutItems/HotPage';
import ProfilePage from '../Pages/NavigationLayoutItems/ProfilePage';
import UsersListPage from '../Pages/NavigationLayoutItems/UsersListPage';

import Icon from 'react-native-vector-icons/Ionicons';

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
            selectedTab: props.selectedTab
        }
    };

    _renderContent(title:string) {
        if(title === 'hot') {
            return <HotPage currentUserFriends={this.props.currentUserFriends}
                            currentUserLocationCoords={this.props.currentUserLocationCoords}
                            firebaseRef={this.props.firebaseRef}
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
                <Icon.TabBarItem
                    title="Hot"
                    iconName="ios-flame-outline"
                    selectedIconName="ios-flame"
                    selected={this.state.selectedTab === 'hot'}
                    onPress={() => {
                    this.setState({
                      selectedTab: 'hot',
                    });
                  }}>
                    {this._renderContent('hot')}
                </Icon.TabBarItem>
                <Icon.TabBarItem
                    title="Events"
                    iconName="ios-calendar-outline"
                    selectedIconName="ios-calendar"
                    selected={this.state.selectedTab === 'events'}
                    onPress={() => {
                    this.setState({
                      selectedTab: 'events',
                    });
                  }}>
                    {this._renderContent('events')}
                </Icon.TabBarItem>
                <Icon.TabBarItem
                    title={CATEGORY_OF_USERS || "Users"}
                    iconName="ios-people-outline"
                    selectedIconName="ios-people"
                    selected={this.state.selectedTab === 'users'}
                    onPress={() => {
                    this.setState({
                      selectedTab: 'users',
                    });
                  }}>
                    {this._renderContent('users')}
                </Icon.TabBarItem>
                {this.state.chatCount > 0 ?
                    <Icon.TabBarItem
                        title="Chats"
                        badgeValue={JSON.stringify(this.state.chatCount)}
                        iconName="ios-chatboxes-outline"
                        selectedIconName="ios-chatboxes"
                        selected={this.state.selectedTab === 'chats'}
                        onPress={() => {
                    this.setState({
                      selectedTab: 'chats'
                    });
                  }}>
                        {this._renderContent('chats')}
                    </Icon.TabBarItem>
                    :
                    <Icon.TabBarItem
                        title="Chats"
                        iconName="ios-chatboxes-outline"
                        selectedIconName="ios-chatboxes"
                        selected={this.state.selectedTab === 'chats'}
                        onPress={() => {
                    this.setState({
                      selectedTab: 'chats'
                    });
                  }}>
                        {this._renderContent('chats')}
                    </Icon.TabBarItem>
                }
                <Icon.TabBarItem
                    title="Profile"
                    iconName="ios-person-outline"
                    selectedIconName="ios-person"
                    selected={this.state.selectedTab === 'profile'}
                    onPress={() => {
                    this.setState({
                        selectedTab: 'profile',
                    });
                 }}>
                    {this._renderContent('profile')}
                </Icon.TabBarItem>
            </TabBarIOS>
        )
    };
}

const styles = StyleSheet.create({
});

module.exports = TabBarLayout;