/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule FiltersModalIcon
 * @flow
 */

'use strict';

import React, {
  AlertIOS,
  Component,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import Animatable from 'react-native-animatable';
import {Icon, } from 'react-native-icons'

const SIZE = 30;

type Props = {
  color: React.PropTypes.string,
  firstSession: React.PropTypes.object,
  firstSessionRef: React.PropTypes.string,
  onPress: React.PropTypes.func.isRequired,
  size: React.PropTypes.number,
  style: View.propTypes.style
};

class FiltersModalIcon extends Component {
  constructor(props:Props) {
    super(props);
    this.state = {
      color: undefined
    };
  };

  componentDidMount() {
    if(this.props.firstSession && !this.props.firstSession.hasSeenSearchPreferencesIcon) {
      this.timer = setTimeout(() => {
        this.setState({color: '#7ec0ee'});
        this.refs.filtersModalIcon.tada(2000)
          .then(() => this.refs.filtersModalIcon.tada(3000))
          .then(() => this.setState({color: '#fff'}));
        AlertIOS.alert(
          'Search Preferences',
          'Who can see you? Adjust your privacy settings and search preferences by clicking the gear icon at the top right!'
        );
        this.props.firstSessionRef.child('hasSeenSearchPreferencesIcon').set(true);
      }, 1000);
    }
  };

  componentWillUnmount() {
    clearTimeout(this.timer);
  };

  render() {
    return (
      <Animatable.View ref="filtersModalIcon">
        <TouchableOpacity
          activeOpacity={0.3}
          onPress={this.props.onPress}
          style={[this.props.style,{width: (this.props.size || SIZE) * 1.48,
                  height: (this.props.size || SIZE) * 1.48, alignItems: 'center'}]} // scale size: 1.48
          >
          <Icon
            name={"ion|" + (Platform.OS === 'ios' ? "ios-gear-outline" : "android-settings")}
            size={this.props.size || SIZE}
            color={this.state.color || this.props.color || '#ccc'}
            style={[styles.icon]}
            />
        </TouchableOpacity>
      </Animatable.View>
    );
  };
}

const styles = StyleSheet.create({
  icon: {
    opacity: 1.0,
    width: SIZE,
    height: SIZE
  }
});

module.exports = FiltersModalIcon;